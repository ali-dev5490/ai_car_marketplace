"""OLX Pakistan (Sahiwal cars) scraper."""

from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from playwright.async_api import BrowserContext, Page

from config import MAX_RETRIES, OLX_ADS_LIMIT, OLX_SAHIWAL_CARS_URL, REQUEST_DELAY_SEC
from utils.browser import goto, safe_content
from utils.images import download_images


def _ad_id_from_url(url: str) -> str:
    m = re.search(r"-iid-(\d+)", url)
    return m.group(1) if m else re.sub(r"[^\w]+", "_", url)[-40:]


def _text(el) -> str | None:
    if el is None:
        return None
    t = el.get_text(" ", strip=True)
    return t or None


def _parse_json_ld(soup: BeautifulSoup) -> dict[str, Any]:
    for script in soup.select('script[type="application/ld+json"]'):
        raw = script.string or script.get_text(strip=True)
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        items = data if isinstance(data, list) else [data]
        for item in items:
            if not isinstance(item, dict):
                continue
            t = item.get("@type")
            types = t if isinstance(t, list) else [t]
            if any(x in ("Vehicle", "Car", "Product") for x in types if x):
                return item
    return {}


def _offer_price(ld: dict[str, Any]) -> tuple[str | None, str | None]:
    offers = ld.get("offers")
    if isinstance(offers, list) and offers:
        offers = offers[0]
    if isinstance(offers, dict):
        price = offers.get("price")
        currency = offers.get("priceCurrency")
        return (str(price) if price is not None else None, currency)
    return None, None


def _mileage(ld: dict[str, Any]) -> str:
    m = ld.get("mileageFromOdometer")
    if isinstance(m, dict):
        val = m.get("value")
        unit = m.get("unitText") or m.get("unitCode") or "km"
        return f"{val} {unit}".strip() if val is not None else ""
    return str(m) if m else ""


def _brand_name(ld: dict[str, Any]) -> str:
    brand = ld.get("brand")
    if isinstance(brand, dict):
        return str(brand.get("name") or "")
    return str(brand or "")


def _gallery_urls(soup: BeautifulSoup, ld: dict[str, Any], page_url: str) -> list[str]:
    urls: list[str] = []
    images = ld.get("image")
    if isinstance(images, list):
        urls.extend(str(i) for i in images if i)
    elif isinstance(images, str):
        urls.append(images)
    for img in soup.select("img"):
        src = img.get("src") or img.get("data-src") or ""
        if not src or src.startswith("data:"):
            continue
        full = urljoin(page_url, src)
        low = full.lower()
        if any(x in low for x in ("logo", "icon", "avatar", "sprite", "placeholder")):
            continue
        if any(x in low for x in ("apollo", "olx", "akamai", "cloudfront", "image")):
            urls.append(full)
    for meta in soup.select('meta[property="og:image"]'):
        if meta.get("content"):
            urls.insert(0, meta["content"])
    return list(dict.fromkeys(urls))


def _specs_from_dom(soup: BeautifulSoup) -> dict[str, str]:
    specs: dict[str, str] = {}
    for block in soup.select("[data-aut-id='itemParams'] li, [data-aut-id='itemParams'] div"):
        spans = [s.get_text(" ", strip=True) for s in block.find_all(["span", "div"]) if s.get_text(strip=True)]
        if len(spans) >= 2:
            specs[spans[0].rstrip(":")] = spans[1]
    # generic dt/dd
    for row in soup.select("li"):
        texts = [t.strip() for t in row.stripped_strings]
        if len(texts) == 2 and len(texts[0]) < 40:
            specs.setdefault(texts[0], texts[1])
    return specs


def parse_detail_html(html: str, url: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "lxml")
    ld = _parse_json_ld(soup)
    price, currency = _offer_price(ld)
    if not price:
        price = _text(soup.select_one("[data-aut-id='itemPrice'], h3, .price"))
    title = ld.get("name") or _text(soup.select_one("h1")) or ""
    description = ld.get("description") or _text(soup.select_one("[data-aut-id='itemDescriptionContent'], [data-aut-id='itemDescription']")) or ""
    specs = _specs_from_dom(soup)
    location = _text(soup.select_one("[data-aut-id='itemLocation'], [data-aut-id='location']")) or "Sahiwal"
    seller = _text(soup.select_one("[data-aut-id='profileCard'] h2, [data-aut-id='sellerName'], [data-aut-id='userCard']")) or ""

    ad_id = str(ld.get("sku") or _ad_id_from_url(url))
    image_urls = _gallery_urls(soup, ld, url)

    return {
        "source": "olx",
        "brand": _brand_name(ld) or specs.get("Make") or specs.get("Brand") or "",
        "ad_id": ad_id,
        "url": url,
        "title": title.strip() if isinstance(title, str) else title,
        "price": price or "",
        "currency": currency or "PKR",
        "year": str(ld.get("vehicleModelDate") or specs.get("Year") or specs.get("Model Year") or ""),
        "mileage": _mileage(ld) or specs.get("KM's driven") or specs.get("Kilometers") or "",
        "location": location or "",
        "body_type": str(ld.get("bodyType") or specs.get("Body type") or specs.get("Body Type") or ""),
        "fuel": str(ld.get("fuelType") or specs.get("Fuel") or specs.get("Fuel Type") or ""),
        "transmission": str(ld.get("vehicleTransmission") or specs.get("Transmission") or ""),
        "color": str(ld.get("color") or specs.get("Colour") or specs.get("Color") or ""),
        "regional_specs": specs.get("Assembly") or specs.get("Registered in") or "",
        "seller": seller,
        "description": description,
        "features": [],
        "specs": specs,
        "model": str(ld.get("model") or specs.get("Model") or ""),
        "image_urls": image_urls,
        "image_paths": [],
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


async def collect_listing_urls(page: Page, limit: int = OLX_ADS_LIMIT) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    page_no = 1
    max_pages = max(40, (limit // 20) + 5)
    while len(urls) < limit and page_no <= max_pages:
        list_url = OLX_SAHIWAL_CARS_URL if page_no == 1 else f"{OLX_SAHIWAL_CARS_URL}?page={page_no}"
        await goto(page, list_url, wait_until="domcontentloaded", timeout=90_000)
        await page.wait_for_timeout(1500)
        hrefs = await page.eval_on_selector_all(
            "a[href*='/item/'][href*='-iid-']",
            "els => [...new Set(els.map(e => e.href.split('?')[0]))]",
        )
        new_count = 0
        for href in hrefs:
            if href in seen:
                continue
            seen.add(href)
            urls.append(href)
            new_count += 1
            if len(urls) >= limit:
                break
        print(f"[olx] page {page_no}: +{new_count} (total {len(urls)})")
        if new_count == 0:
            break
        page_no += 1
        await asyncio.sleep(REQUEST_DELAY_SEC)
    return urls[:limit]


async def scrape_detail(page: Page, url: str) -> dict[str, Any] | None:
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 2):
        try:
            await goto(page, url, wait_until="domcontentloaded", timeout=90_000)
            await page.wait_for_timeout(800)
            html = await safe_content(page)
            record = parse_detail_html(html, url)
            record["image_paths"] = await download_images(
                record.get("image_urls") or [],
                site="olx",
                ad_id=record["ad_id"],
                page=page,
            )
            return record
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            await asyncio.sleep(REQUEST_DELAY_SEC * attempt)
    print(f"[olx] failed {url}: {last_err}")
    return None


async def scrape(context: BrowserContext, existing: set[str], limit: int = OLX_ADS_LIMIT) -> list[dict[str, Any]]:
    page = await context.new_page()
    records: list[dict[str, Any]] = []
    try:
        # Over-fetch listing URLs so skipped existing ids can be replaced.
        urls = await collect_listing_urls(page, limit=max(limit * 4, limit + len(existing) + 50))
        print(f"[olx] collected {len(urls)} listing URLs (need {limit} new)")
        for url in urls:
            if len(records) >= limit:
                break
            ad_id = _ad_id_from_url(url)
            if ad_id in existing:
                print(f"[olx] skip existing {ad_id}")
                continue
            record = await scrape_detail(page, url)
            if record:
                records.append(record)
                existing.add(str(record["ad_id"]))
                print(f"[olx] saved {record['ad_id']} ({record.get('title')}) [{len(records)}/{limit}]")
            await asyncio.sleep(REQUEST_DELAY_SEC)
    finally:
        await page.close()
    return records
