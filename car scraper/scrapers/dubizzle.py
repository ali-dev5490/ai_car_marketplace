"""Dubizzle Dubai used-cars scraper."""

from __future__ import annotations

import asyncio
import json
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from playwright.async_api import BrowserContext, Page

from config import ADS_PER_BRAND, DUBIZZLE_USED_CARS_BASE, MAX_RETRIES, REQUEST_DELAY_SEC
from utils.browser import goto, safe_content, wait_until_ready
from utils.images import download_images


def brand_listing_url(slug: str) -> str:
    return f"{DUBIZZLE_USED_CARS_BASE}/{slug}/"


def _ad_id_from_url(url: str) -> str:
    path = urlparse(url).path.rstrip("/")
    # UUID-style trailing id: ...---c2820f4eb63642fbba14733ae5b49ed6
    m = re.search(r"---([a-f0-9]{16,})/?$", path, re.I)
    if m:
        return m.group(1)
    parts = [p for p in path.split("/") if p]
    if parts and parts[-1].isdigit():
        return parts[-1]
    m = re.search(r"/(\d{6,})/?", url)
    return m.group(1) if m else re.sub(r"[^\w]+", "_", path)[-40:]


def _walk(obj: Any, pred) -> list[Any]:
    found: list[Any] = []
    if isinstance(obj, dict):
        if pred(obj):
            found.append(obj)
        for v in obj.values():
            found.extend(_walk(v, pred))
    elif isinstance(obj, list):
        for item in obj:
            found.extend(_walk(item, pred))
    return found


def _extract_next_data(html: str) -> dict[str, Any] | None:
    soup = BeautifulSoup(html, "lxml")
    script = soup.select_one("script#__NEXT_DATA__")
    if not script or not script.string:
        return None
    try:
        return json.loads(script.string)
    except json.JSONDecodeError:
        return None


def _listing_cards_from_next(data: dict[str, Any]) -> list[dict[str, Any]]:
    return _walk(
        data,
        lambda d: isinstance(d, dict)
        and ("objectID" in d or "uuid" in d)
        and "price" in d
        and ("photos" in d or "photo_thumbnails" in d)
        and ("absolute_url" in d or "permalink" in d),
    )


def _absolute_url(card: dict[str, Any]) -> str | None:
    abs_url = card.get("absolute_url")
    if isinstance(abs_url, dict):
        return abs_url.get("en") or abs_url.get("ar") or next(iter(abs_url.values()), None)
    if isinstance(abs_url, str):
        return abs_url
    permalink = card.get("permalink")
    return str(permalink) if permalink else None


def _localized(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, dict):
        if "en" in value:
            en = value["en"]
            if isinstance(en, dict):
                return str(en.get("value") or en.get("label") or en.get("name") or "")
            return str(en)
        if "value" in value:
            return str(value.get("value") or "")
        if "name" in value:
            return _localized(value["name"])
    return str(value)


def _flatten_details(payload: dict[str, Any]) -> dict[str, str]:
    specs: dict[str, str] = {}

    def ingest_item(item: Any) -> None:
        if not isinstance(item, dict):
            return
        label = item.get("label") or item.get("name") or item.get("key")
        value = item.get("value") or item.get("display_value")
        if label is None or value is None:
            return
        if isinstance(value, list):
            value = ", ".join(str(v) for v in value)
        specs[str(label)] = str(value)

    details = payload.get("details") or payload.get("details_v2") or {}
    if isinstance(details, dict):
        for key, block in details.items():
            if isinstance(block, list):
                for item in block:
                    ingest_item(item)
            elif isinstance(block, dict):
                # Either a localized field block or a nested map of lists
                if "en" in block and isinstance(block["en"], dict):
                    label = block["en"].get("label") or key
                    value = block["en"].get("value")
                    if value is not None:
                        specs[str(label)] = str(value)
                elif any(isinstance(v, list) for v in block.values()):
                    for v in block.values():
                        if isinstance(v, list):
                            for item in v:
                                ingest_item(item)
                else:
                    label = block.get("label") or key
                    value = block.get("value")
                    if value is not None:
                        specs[str(label)] = str(value)
            elif isinstance(block, str) and block not in ("[]",):
                # Skip stringified junk; try json
                try:
                    parsed = json.loads(block.replace("'", '"'))
                    if isinstance(parsed, list):
                        for item in parsed:
                            ingest_item(item)
                except Exception:
                    pass
    elif isinstance(details, list):
        for item in details:
            ingest_item(item)
    return specs


def _dig_listing_payload(data: dict[str, Any]) -> dict[str, Any]:
    # Prefer full DPVs (detail page views) over LPV cards
    detail_like = _walk(
        data,
        lambda d: isinstance(d, dict)
        and ("listing_id" in d or "listing_uuid" in d)
        and ("details" in d or "photos" in d or "photos_combined" in d)
        and ("price" in d or "name" in d),
    )
    if detail_like:
        detail_like.sort(key=lambda d: len(json.dumps(d, default=str)), reverse=True)
        return detail_like[0]

    candidates = _listing_cards_from_next(data)
    candidates.sort(key=lambda d: len(json.dumps(d, default=str)), reverse=True)
    return candidates[0] if candidates else {}


def _image_urls_from_payload(payload: dict[str, Any]) -> list[str]:
    urls: list[str] = []
    photos = (
        payload.get("photos_combined")
        or payload.get("photos")
        or payload.get("photo")
        or payload.get("images")
        or {}
    )
    if isinstance(photos, dict):
        for k in ("main", "thumb_retina", "thumb", "micro", "original"):
            if photos.get(k):
                urls.append(str(photos[k]))
        for v in photos.values():
            if isinstance(v, str) and v.startswith("http"):
                urls.append(v)
            elif isinstance(v, dict):
                for vv in v.values():
                    if isinstance(vv, str) and vv.startswith("http"):
                        urls.append(vv)
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, str) and item.startswith("http"):
                        urls.append(item)
                    elif isinstance(item, dict):
                        for kk in ("url", "main", "original", "photo"):
                            if item.get(kk):
                                urls.append(str(item[kk]))
                                break
    elif isinstance(photos, list):
        for p in photos:
            if isinstance(p, str):
                urls.append(p)
            elif isinstance(p, dict):
                for k in ("url", "main", "original", "photo"):
                    if p.get(k):
                        urls.append(str(p[k]))
                        break
    thumbs = payload.get("photo_thumbnails") or []
    if isinstance(thumbs, list):
        for t in thumbs:
            if isinstance(t, str):
                urls.append(t)
            elif isinstance(t, dict):
                for v in t.values():
                    if isinstance(v, str) and v.startswith("http"):
                        urls.append(v)
    upgraded = []
    for u in urls:
        upgraded.append(u.replace("impolicy=carousel", "impolicy=dpv").replace("impolicy=lpv", "impolicy=dpv"))
    return list(dict.fromkeys(upgraded))


def _pick_spec(specs: dict[str, str], *names: str) -> str:
    lower_map = {k.lower(): v for k, v in specs.items()}
    for n in names:
        if n.lower() in lower_map:
            return lower_map[n.lower()]
        for k, v in lower_map.items():
            if n.lower() in k:
                return v
    return ""


def parse_detail(html: str, url: str, brand: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "lxml")
    next_data = _extract_next_data(html) or {}
    payload = _dig_listing_payload(next_data) if next_data else {}
    specs = _flatten_details(payload)

    title = _localized(payload.get("name")) or _localized(payload.get("title")) or _text_sel(soup, "h1") or ""
    price_val = payload.get("price")
    if isinstance(price_val, dict):
        price = str(
            price_val.get("formatted")
            or price_val.get("raw")
            or price_val.get("value")
            or ""
        )
        currency = price_val.get("currency") or "AED"
    else:
        price = str(price_val) if price_val is not None else (_text_sel(soup, "[data-testid*='price'], .price") or "")
        currency = payload.get("currency") or "AED"

    description = (
        payload.get("long_description")
        or payload.get("description")
        or payload.get("content")
        or ""
    )
    if isinstance(description, dict):
        description = _localized(description)
    if not description:
        description = _text_sel(soup, "[data-testid*='description'], .description") or ""
    description = BeautifulSoup(str(description), "lxml").get_text("\n", strip=True)

    seller = ""
    company = payload.get("company") or {}
    user = payload.get("user") or payload.get("agent") or payload.get("seller") or {}
    if isinstance(company, dict):
        seller = _localized(company.get("name")) or _localized(company.get("agency")) or ""
    if not seller and isinstance(user, dict):
        seller = _localized(user.get("name")) or user.get("agency_name") or ""
    if not seller:
        seller = _pick_spec(specs, "Seller type", "Seller Type") or ""
    if seller.lower() in {"seller type", "seller"}:
        seller = _pick_spec(specs, "Seller type", "Seller Type") or seller
    if not seller:
        seller = _text_sel(soup, "[data-testid*='seller'], [data-testid*='agent']") or ""

    location = ""
    loc = payload.get("location") or payload.get("places") or payload.get("location_list") or []
    if isinstance(loc, list):
        names = []
        for p in loc:
            if isinstance(p, dict):
                names.append(_localized(p.get("name") or p.get("title") or p))
            else:
                names.append(str(p))
        location = ", ".join(n for n in names if n)
    elif isinstance(loc, dict):
        location = _localized(loc.get("name") or loc)

    image_urls = _image_urls_from_payload(payload)
    if not image_urls:
        for img in soup.select("img"):
            src = img.get("src") or img.get("data-src") or ""
            if src.startswith("http") and "dubizzle" in src and "logo" not in src.lower():
                image_urls.append(src)
        for meta in soup.select('meta[property="og:image"]'):
            if meta.get("content"):
                image_urls.insert(0, meta["content"])
        image_urls = list(dict.fromkeys(image_urls))

    ad_id = str(
        payload.get("listing_id")
        or payload.get("listing_uuid")
        or payload.get("uuid")
        or payload.get("id")
        or _ad_id_from_url(url)
    )

    features: list[str] = []
    for key in ("Exterior", "Comfort & Convenience", "Entertainment & Technology"):
        val = specs.get(key)
        if val:
            features.extend(part.strip() for part in val.split(",") if part.strip())

    return {
        "source": "dubizzle",
        "brand": brand,
        "ad_id": ad_id,
        "url": url,
        "title": title,
        "price": price,
        "currency": currency,
        "year": str(payload.get("year") or _pick_spec(specs, "Year", "Model Year") or ""),
        "mileage": str(
            payload.get("kilometers")
            or payload.get("mileage")
            or _pick_spec(specs, "Kilometers", "Mileage", "Km")
            or ""
        ),
        "location": location or _pick_spec(specs, "Location", "City", "Neighborhood"),
        "body_type": str(payload.get("body_type") or _pick_spec(specs, "Body Type", "Body") or ""),
        "fuel": str(payload.get("fuel_type") or _pick_spec(specs, "Fuel Type", "Fuel") or ""),
        "transmission": str(
            payload.get("transmission") or _pick_spec(specs, "Transmission Type", "Transmission") or ""
        ),
        "color": str(payload.get("color") or _pick_spec(specs, "Exterior Color", "Color") or ""),
        "regional_specs": str(
            payload.get("regional_specs")
            or _pick_spec(specs, "Regional Specs", "Specs", "Target Market")
            or ""
        ),
        "seller": seller,
        "description": str(description or ""),
        "features": features,
        "specs": specs,
        "image_urls": image_urls,
        "image_paths": [],
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


def _text_sel(soup: BeautifulSoup, selector: str) -> str | None:
    el = soup.select_one(selector)
    if not el:
        return None
    t = el.get_text(" ", strip=True)
    return t or None


async def collect_listing_cards(page: Page, slug: str, limit: int = ADS_PER_BRAND) -> list[dict[str, Any]]:
    """Return listing card payloads (with absolute URLs) from the brand search page."""
    url = brand_listing_url(slug)
    await goto(page, url, wait_until="domcontentloaded", timeout=90_000)
    ready = await wait_until_ready(page, marker="__NEXT_DATA__", timeout_ms=60_000)
    if not ready:
        print(f"[dubizzle] page not ready / blocked for {slug}")
        return []

    for _ in range(3):
        await page.mouse.wheel(0, 2800)
        await page.wait_for_timeout(600)

    html = await safe_content(page)
    data = _extract_next_data(html) or {}
    cards = _listing_cards_from_next(data)

    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for card in cards:
        abs_url = _absolute_url(card)
        if not abs_url:
            continue
        full = urljoin("https://dubai.dubizzle.com", abs_url).split("?")[0]
        if f"/{slug}/" not in full:
            continue
        if full in seen:
            continue
        seen.add(full)
        card = dict(card)
        card["_resolved_url"] = full
        out.append(card)
        if len(out) >= limit:
            break
    return out


def record_from_card(card: dict[str, Any], brand: str) -> dict[str, Any]:
    """Build a record from LPV card JSON when the detail page is blocked."""
    url = card.get("_resolved_url") or _absolute_url(card) or ""
    specs = _flatten_details(card)
    # LPV cards use localized details differently
    if not specs and isinstance(card.get("details"), dict):
        for key, block in card["details"].items():
            if isinstance(block, dict) and "en" in block:
                en = block["en"]
                if isinstance(en, dict) and en.get("value") is not None:
                    specs[str(en.get("label") or key)] = str(en["value"])

    title = _localized(card.get("name")) or ""
    price_val = card.get("price")
    if isinstance(price_val, dict):
        price = str(price_val.get("formatted") or price_val.get("raw") or price_val.get("value") or "")
        currency = price_val.get("currency") or "AED"
    else:
        price = str(price_val) if price_val is not None else ""
        currency = "AED"

    location = ""
    places = card.get("places") or card.get("location_list") or []
    if isinstance(places, list):
        location = ", ".join(_localized(p.get("name") if isinstance(p, dict) else p) for p in places)

    ad_id = str(card.get("id") or card.get("uuid") or _ad_id_from_url(str(url)))
    return {
        "source": "dubizzle",
        "brand": brand,
        "ad_id": ad_id,
        "url": url,
        "title": title,
        "price": price,
        "currency": currency,
        "year": str(_pick_spec(specs, "Year", "Model Year") or ""),
        "mileage": str(_pick_spec(specs, "Kilometers", "Mileage", "Km") or ""),
        "location": location,
        "body_type": str(_pick_spec(specs, "Body Type", "Body") or ""),
        "fuel": str(_pick_spec(specs, "Fuel Type", "Fuel") or ""),
        "transmission": str(_pick_spec(specs, "Transmission Type", "Transmission") or ""),
        "color": str(_pick_spec(specs, "Exterior Color", "Color") or ""),
        "regional_specs": str(_pick_spec(specs, "Regional Specs", "Target Market") or ""),
        "seller": _pick_spec(specs, "Seller type", "Seller Type") or "",
        "description": "",
        "features": [],
        "specs": specs,
        "image_urls": _image_urls_from_payload(card),
        "image_paths": [],
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "from_listing_card": True,
    }


async def scrape_detail(page: Page, url: str, brand: str) -> dict[str, Any] | None:
    last_err: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            await goto(page, url, wait_until="domcontentloaded", timeout=90_000)
            ready = await wait_until_ready(page, marker="__NEXT_DATA__", timeout_ms=25_000)
            html = await safe_content(page)
            if not ready or ("Incapsula" in html and "__NEXT_DATA__" not in html):
                raise RuntimeError("Blocked by Incapsula bot protection")
            final_url = page.url
            record = parse_detail(html, final_url, brand)
            if len(record.get("image_urls") or []) < 3:
                soup = BeautifulSoup(html, "lxml")
                extra = []
                for img in soup.select("img[src*='dbz-images'], img[src*='dubizzle']"):
                    src = img.get("src") or ""
                    if src.startswith("http") and "logo" not in src.lower():
                        extra.append(src)
                record["image_urls"] = list(dict.fromkeys((record.get("image_urls") or []) + extra))
            record["image_paths"] = await download_images(
                record.get("image_urls") or [],
                site="dubizzle",
                ad_id=record["ad_id"],
                page=page,
            )
            return record
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            await asyncio.sleep(REQUEST_DELAY_SEC * attempt)
    print(f"[dubizzle] detail failed {url}: {last_err}")
    return None


async def scrape_brand(context: BrowserContext, brand: dict[str, str], existing: set[str]) -> list[dict[str, Any]]:
    page = await context.new_page()
    records: list[dict[str, Any]] = []
    try:
        # Collect extras so Incapsula failures can be replaced.
        cards = await collect_listing_cards(page, brand["dubizzle"], ADS_PER_BRAND + 10)
        print(f"[dubizzle] {brand['name']}: found {len(cards)} listing cards")
        for card in cards:
            if len(records) >= ADS_PER_BRAND:
                break
            url = card.get("_resolved_url") or ""
            ad_id = str(card.get("id") or card.get("uuid") or _ad_id_from_url(url))
            if ad_id in existing or str(card.get("uuid") or "") in existing:
                print(f"[dubizzle] skip existing {ad_id}")
                continue
            record = await scrape_detail(page, url, brand["name"])
            if not record:
                record = record_from_card(card, brand["name"])
                record["image_paths"] = await download_images(
                    record.get("image_urls") or [],
                    site="dubizzle",
                    ad_id=record["ad_id"],
                    page=page,
                )
                print(f"[dubizzle] used listing-card fallback for {record['ad_id']}")
            if record:
                records.append(record)
                existing.add(str(record["ad_id"]))
                if card.get("uuid"):
                    existing.add(str(card["uuid"]))
                print(f"[dubizzle] saved {record['ad_id']} ({record.get('title')})")
            await asyncio.sleep(REQUEST_DELAY_SEC)
    finally:
        await page.close()
    return records
