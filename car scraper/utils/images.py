"""Download listing images to local disk."""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlparse

import httpx
from playwright.async_api import Page

from config import IMAGES_DIR, MAX_IMAGES_PER_AD, USER_AGENT


def _ext_from_url(url: str) -> str:
    path = urlparse(url).path.lower()
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        if path.endswith(ext):
            return ext if ext != ".jpeg" else ".jpg"
    return ".jpg"


def _safe_id(ad_id: str) -> str:
    return re.sub(r"[^\w\-]+", "_", ad_id)[:120] or "unknown"


async def download_images(
    image_urls: list[str],
    *,
    site: str,
    ad_id: str,
    page: Page | None = None,
) -> list[str]:
    """Download unique image URLs into data/images/<site>/<ad_id>/ and return relative paths."""
    if not image_urls:
        return []

    dest_dir = IMAGES_DIR / site / _safe_id(ad_id)
    dest_dir.mkdir(parents=True, exist_ok=True)

    seen: set[str] = set()
    paths: list[str] = []
    headers = {
        "User-Agent": USER_AGENT,
        "Referer": (
            "https://www.olx.com.pk/"
            if site == "olx"
            else "https://dubai.dubizzle.com/"
            if site == "dubizzle"
            else "https://www.dubicars.com/"
        ),
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0, headers=headers) as client:
        index = 0
        for url in image_urls[:MAX_IMAGES_PER_AD]:
            if not url or url in seen:
                continue
            seen.add(url)
            index += 1
            ext = _ext_from_url(url)
            filename = f"{index}{ext}"
            dest = dest_dir / filename
            relative = str(dest.relative_to(Path(__file__).resolve().parent.parent))

            if dest.exists() and dest.stat().st_size > 0:
                paths.append(relative)
                continue

            try:
                resp = await client.get(url)
                if resp.status_code == 200 and resp.content:
                    dest.write_bytes(resp.content)
                    paths.append(relative)
                    continue
            except Exception:
                pass

            # Fallback: fetch via Playwright page context (cookies / anti-hotlink).
            if page is not None:
                try:
                    result = await page.evaluate(
                        """async (src) => {
                            const r = await fetch(src);
                            if (!r.ok) return null;
                            const buf = await r.arrayBuffer();
                            return Array.from(new Uint8Array(buf));
                        }""",
                        url,
                    )
                    if result:
                        dest.write_bytes(bytes(result))
                        paths.append(relative)
                except Exception:
                    continue

    return paths
