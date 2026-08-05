"""Shared Playwright browser helpers."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from playwright.async_api import Browser, BrowserContext, Page, async_playwright

from config import HEADLESS, USER_AGENT

STEALTH_INIT = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
window.chrome = { runtime: {} };
"""


@asynccontextmanager
async def browser_session() -> AsyncIterator[tuple[Browser, BrowserContext]]:
    async with async_playwright() as p:
        # Prefer installed Google Chrome — handles Incapsula better than headless shell.
        try:
            browser = await p.chromium.launch(
                headless=HEADLESS,
                channel="chrome",
                args=["--disable-blink-features=AutomationControlled", "--disable-dev-shm-usage"],
            )
        except Exception:
            browser = await p.chromium.launch(
                headless=HEADLESS,
                args=["--disable-blink-features=AutomationControlled", "--disable-dev-shm-usage"],
            )
        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1440, "height": 900},
            locale="en-US",
            timezone_id="Asia/Dubai",
        )
        await context.add_init_script(STEALTH_INIT)
        try:
            yield browser, context
        finally:
            await context.close()
            await browser.close()


async def goto(page: Page, url: str, *, wait_until: str = "domcontentloaded", timeout: int = 60_000) -> None:
    await page.goto(url, wait_until=wait_until, timeout=timeout)
    await page.wait_for_timeout(800)


async def safe_content(page: Page) -> str:
    for _ in range(25):
        try:
            return await page.content()
        except Exception:
            await page.wait_for_timeout(800)
    return ""


async def wait_until_ready(page: Page, *, marker: str = "__NEXT_DATA__", timeout_ms: int = 45_000) -> bool:
    """Wait out bot challenges (e.g. Incapsula) until page content looks real."""
    elapsed = 0
    step = 1500
    while elapsed < timeout_ms:
        html = await safe_content(page)
        if marker in html and len(html) > 50_000:
            return True
        if len(html) > 80_000 and "Incapsula" not in html:
            return True
        await page.wait_for_timeout(step)
        elapsed += step
    return False
