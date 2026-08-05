"""Dubicars search + detail scraper."""

from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from playwright.async_api import BrowserContext, Page

from config import ADS_PER_BRAND, DUBICARS_BRAND_PATH, DUBICARS_QUERY, MAX_RETRIES, REQUEST_DELAY_SEC
from utils.browser import goto
from utils.images import download_images


def build_search_url(make_slug: str, page: int = 1) -> str:
    base = DUBICARS_BRAND_PATH.format(make=make_slug)
    query = DUBICARS_QUERY
    if page > 1:
        query = f"{query}&page={page}"
    return f"{base}?{query}"

def _ad_id_from_url(url: str) -> str:
    m = re.search(r"-(\d+)\.html(?:\?|$)", url)
    if m:
        return m.group(1)
    m = re.search(r"/(\d+)(?:\.html)?(?:\?|$)", url)
    return m.group(1) if m else re.sub(r"[^\w]+", "_", urlparse(url).path)[-40:]


def _text(el) -> str | None:
    if el is None:
        return None
    t = el.get_text(" ", strip=True)
    return t or None


def _parse_json_ld(soup: BeautifulSoup) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for script in soup.select('script[type="application/ld+json"]'):
        raw = script.string or script.get_text(strip=True)
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        items = data if isinstance(data, list) else [data]
        if isinstance(data, dict) and "@graph" in data:
            items = data["@graph"]
        for item in items:
            if not isinstance(item, dict):
                continue
            types = item.get("@type", [])
            if isinstance(types, str):
                types = [types]
            if any(t in ("Car", "Vehicle", "Product") for t in types):
                out.update(item)
            if "offers" in item and "offers" not in out:
                out["offers"] = item["offers"]
    return out


def _specs_from_table(soup: BeautifulSoup) -> dict[str, str]:
    specs: dict[str, str] = {}
    for row in soup.select("table tr, .dc-key-details li, .key-details li, dl > div"):
        cells = row.find_all(["th", "td", "span", "dt", "dd"])
        texts = [c.get_text(" ", strip=True) for c in cells if c.get_text(strip=True)]
        if len(texts) >= 2:
            key, val = texts[0].rstrip(":"), texts[1]
            if key and val and key.lower() != val.lower():
                specs[key] = val
    # Label/value pairs common on Dubicars detail pages
    for item in soup.select("[class*='detail'], [class*='spec'], [class*='feature']"):
        label = item.select_one(".label, .title, dt, strong")
        value = item.select_one(".value, .content, dd, span:not(.label)")
        if label and value:
            k, v = _text(label), _text(value)
            if k and v and k != v:
                specs[k.rstrip(":")] = v
    return specs


def _features(soup: BeautifulSoup) -> list[str]:
    features: list[str] = []
    for sel in (
        ".features li",
        ".car-features li",
        "[class*='feature'] li",
        "ul.list-unstyled li",
    ):
        for li in soup.select(sel):
            t = _text(li)
            if t and len(t) < 120:
                features.append(t)
    # de-dupe preserve order
    seen: set[str] = set()
    uniq: list[str] = []
    for f in features:
        if f not in seen:
            seen.add(f)
            uniq.append(f)
    return uniq


def _gallery_urls(soup: BeautifulSoup, page_url: str) -> list[str]:
    urls: list[str] = []
    for img in soup.select("img"):
        src = img.get("data-src") or img.get("data-lazy") or img.get("src") or ""
        srcset = img.get("srcset") or img.get("data-srcset") or ""
        candidates = [src]
        if srcset:
            candidates.extend(part.strip().split(" ")[0] for part in srcset.split(","))
        for c in candidates:
            if not c or c.startswith("data:"):
                continue
            full = urljoin(page_url, c)
            low = full.lower()
            if any(x in low for x in ("logo", "icon", "avatar", "sprite", "placeholder", "svg")):
                continue
            if any(x in low for x in ("dubicars", "cloudinary", "cdn", "img", "photo", "vehicle", "car")):
                urls.append(full.split("?")[0] if "w_" in full or "h_" in full else full)
    # Prefer larger gallery images from og / meta
    for meta in soup.select('meta[property="og:image"], meta[name="twitter:image"]'):
        content = meta.get("content")
        if content:
            urls.insert(0, urljoin(page_url, content))
    seen: set[str] = set()
    out: list[str] = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def _offer_price(ld: dict[str, Any]) -> tuple[str | None, str | None]:
    offers = ld.get("offers")
    if isinstance(offers, list) and offers:
        offers = offers[0]
    if isinstance(offers, dict):
        price = offers.get("price") or offers.get("lowPrice")
        currency = offers.get("priceCurrency")
        return (str(price) if price is not None else None, currency)
    return None, None


def parse_detail_html(html: str, url: str, brand: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "lxml")
    ld = _parse_json_ld(soup)
    specs = _specs_from_table(soup)
    price, currency = _offer_price(ld)
    if not price:
        price_el = soup.select_one(".price, .car-price, [class*='Price'], [itemprop='price']")
        price = _text(price_el)
    brand_name = None
    if isinstance(ld.get("brand"), dict):
        brand_name = ld["brand"].get("name")
    elif isinstance(ld.get("brand"), str):
        brand_name = ld["brand"]

    mileage = None
    if isinstance(ld.get("mileageFromOdometer"), dict):
        mileage = str(ld["mileageFromOdometer"].get("value") or "")
        unit = ld["mileageFromOdometer"].get("unitCode") or ld["mileageFromOdometer"].get("unitText")
        if mileage and unit:
            mileage = f"{mileage} {unit}"
    elif ld.get("mileageFromOdometer"):
        mileage = str(ld["mileageFromOdometer"])

    def pick(*keys: str) -> str | None:
        for k in keys:
            for sk, sv in specs.items():
                if sk.lower().replace(" ", "") == k.lower().replace(" ", ""):
                    return sv
            if k in specs:
                return specs[k]
        return None

    title = (
        ld.get("name")
        or _text(soup.select_one("h1"))
        or _text(soup.select_one("title"))
    )
    description = ld.get("description") or _text(soup.select_one(".description, #description, [class*='description']"))
    seller = None
    if isinstance(ld.get("seller"), dict):
        seller = ld["seller"].get("name")
    if not seller:
        seller = _text(soup.select_one(".dealer-name, .seller-name, [class*='dealer'] a, [class*='seller'] a"))

    ad_id = _ad_id_from_url(url)
    image_urls = []
    if isinstance(ld.get("image"), list):
        image_urls.extend(str(i) for i in ld["image"])
    elif isinstance(ld.get("image"), str):
        image_urls.append(ld["image"])
    image_urls.extend(_gallery_urls(soup, url))

    return {
        "source": "dubicars",
        "brand": brand,
        "ad_id": ad_id,
        "url": url,
        "title": title,
        "price": price,
        "currency": currency or "USD",
        "year": str(ld.get("vehicleModelDate") or pick("Year", "Model year") or ""),
        "mileage": mileage or pick("Kilometers", "Mileage", "Km") or "",
        "location": pick("Location", "City", "Emirate") or "",
        "body_type": ld.get("bodyType") or pick("Body type", "Body Type") or "",
        "fuel": ld.get("fuelType") or pick("Fuel type", "Fuel") or "",
        "transmission": ld.get("vehicleTransmission") or pick("Transmission") or "",
        "color": ld.get("color") or pick("Exterior color", "Colour", "Color") or "",
        "regional_specs": pick("Regional specs", "Regional Specs", "Specs") or "",
        "seller": seller or "",
        "description": description or "",
        "features": _features(soup),
        "specs": specs,
        "image_urls": list(dict.fromkeys(image_urls)),
        "image_paths": [],
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "ld_brand": brand_name,
    }


async def collect_listing_urls(page: Page, make_slug: str, limit: int = ADS_PER_BRAND) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    page_num = 1
    while len(urls) < limit and page_num <= 5:
        search_url = build_search_url(make_slug, page_num)
        await goto(page, search_url)
        await page.wait_for_timeout(1200)
        found_this_page = 0
        anchors = await page.eval_on_selector_all(
            "a[href*='dubicars.com/'][href*='.html']",
            """els => [...new Set(
                els.map(e => e.href.split('?')[0])
                  .filter(h => /^https:\\/\\/www\\.dubicars\\.com\\/.+-\\d+\\.html$/.test(h))
            )]""",
        )
        for clean in anchors:
            path = urlparse(clean).path
            if any(x in path for x in ("/news/", "/reviews/", "/dealers/", "/compare")):
                continue
            if clean in seen:
                continue
            seen.add(clean)
            urls.append(clean)
            found_this_page += 1
            if len(urls) >= limit:
                break
        if found_this_page == 0:
            break
        page_num += 1
        await asyncio.sleep(REQUEST_DELAY_SEC)
    return urls[:limit]


async def scrape_detail(page: Page, url: str, brand: str) -> dict[str, Any] | None:
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 2):
        try:
            await goto(page, url)
            await page.wait_for_timeout(1000)
            html = await page.content()
            record = parse_detail_html(html, url, brand)
            record["image_paths"] = await download_images(
                record.get("image_urls") or [],
                site="dubicars",
                ad_id=record["ad_id"],
                page=page,
            )
            return record
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            await asyncio.sleep(REQUEST_DELAY_SEC * attempt)
    print(f"[dubicars] failed {url}: {last_err}")
    return None


async def scrape_brand(context: BrowserContext, brand: dict[str, str], existing: set[str]) -> list[dict[str, Any]]:
    page = await context.new_page()
    records: list[dict[str, Any]] = []
    try:
        # existing may include other brands; callers pass known ids only.
        urls = await collect_listing_urls(page, brand["dubicars"], ADS_PER_BRAND)
        print(f"[dubicars] {brand['name']}: found {len(urls)} listing URLs")
        for url in urls:
            if len(records) >= ADS_PER_BRAND:
                break
            ad_id = _ad_id_from_url(url)
            if ad_id in existing:
                print(f"[dubicars] skip existing {ad_id}")
                continue
            record = await scrape_detail(page, url, brand["name"])
            if record:
                records.append(record)
                existing.add(record["ad_id"])
                print(f"[dubicars] saved {record['ad_id']} ({record.get('title')})")
            await asyncio.sleep(REQUEST_DELAY_SEC)
    finally:
        await page.close()
    return records
