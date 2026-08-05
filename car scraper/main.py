"""CLI entry: scrape Dubicars, Dubizzle, and OLX Pakistan."""

from __future__ import annotations

import argparse
import asyncio
import sys

from config import (
    ADS_PER_BRAND,
    BRANDS,
    DUBICARS_JSON,
    DUBIZZLE_JSON,
    OLX_ADS_LIMIT,
    OLX_JSON,
)
from scrapers import dubicars, dubizzle, olx
from utils.browser import browser_session
from utils.json_io import existing_ids, load_records, save_records


async def run_dubicars(brands: list[dict]) -> None:
    records = load_records(DUBICARS_JSON)
    known = existing_ids(records)
    async with browser_session() as (_browser, context):
        for brand in brands:
            already = sum(1 for r in records if r.get("brand") == brand["name"])
            need = max(0, ADS_PER_BRAND - already)
            print(f"\n=== Dubicars / {brand['name']} (have {already}, need {need}) ===")
            if need == 0:
                continue
            new_recs = await dubicars.scrape_brand(context, brand, known)
            new_recs = new_recs[:need]
            records.extend(new_recs)
            known |= {str(r["ad_id"]) for r in new_recs}
            save_records(DUBICARS_JSON, records)
    print(f"\nDubicars total records: {len(records)} -> {DUBICARS_JSON}")


async def run_dubizzle(brands: list[dict]) -> None:
    records = load_records(DUBIZZLE_JSON)
    known = existing_ids(records)
    async with browser_session() as (_browser, context):
        for brand in brands:
            already = sum(1 for r in records if r.get("brand") == brand["name"])
            need = max(0, ADS_PER_BRAND - already)
            print(f"\n=== Dubizzle / {brand['name']} (have {already}, need {need}) ===")
            if need == 0:
                continue
            new_recs = await dubizzle.scrape_brand(context, brand, known)
            new_recs = new_recs[:need]
            records.extend(new_recs)
            known |= {str(r["ad_id"]) for r in new_recs}
            save_records(DUBIZZLE_JSON, records)
    print(f"\nDubizzle total records: {len(records)} -> {DUBIZZLE_JSON}")


async def run_olx(*, target_total: int | None = None, more: int | None = None) -> None:
    records = load_records(OLX_JSON)
    known = existing_ids(records)

    if more is not None:
        need = max(0, more)
    else:
        limit = target_total if target_total is not None else OLX_ADS_LIMIT
        need = max(0, limit - len(records))

    print(f"\n=== OLX cars (have {len(records)}, need {need} new) ===")
    if need == 0:
        print(f"Already have {len(records)} ads -> {OLX_JSON}")
        return
    new_recs: list = []
    async with browser_session() as (_browser, context):
        new_recs = await olx.scrape(context, known, limit=need)
        records.extend(new_recs)
        save_records(OLX_JSON, records)
    print(f"\nOLX total records: {len(records)} (+{len(new_recs)} new) -> {OLX_JSON}")


async def main_async(
    sites: list[str],
    brand_filter: str | None,
    *,
    olx_limit: int | None = None,
    olx_more: int | None = None,
) -> None:
    brands = BRANDS
    if brand_filter:
        key = brand_filter.lower()
        brands = [b for b in BRANDS if key in b["name"].lower() or key == b["dubicars"]]
        if not brands and "olx" not in sites:
            print(f"No brand matched: {brand_filter}", file=sys.stderr)
            sys.exit(1)

    if "dubicars" in sites:
        await run_dubicars(brands)
    if "dubizzle" in sites:
        await run_dubizzle(brands)
    if "olx" in sites:
        await run_olx(target_total=olx_limit, more=olx_more)


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape car ads from Dubicars, Dubizzle, and OLX")
    parser.add_argument(
        "--site",
        choices=["all", "dubicars", "dubizzle", "olx"],
        default="all",
        help="Which site(s) to scrape (default: all)",
    )
    parser.add_argument(
        "--brand",
        default=None,
        help="Optional single brand filter for Dubicars/Dubizzle (e.g. audi, toyota)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="OLX: scrape until total stored ads reaches this number",
    )
    parser.add_argument(
        "--more",
        type=int,
        default=None,
        help="OLX: scrape this many additional ads beyond what is already stored",
    )
    args = parser.parse_args()
    if args.site == "all":
        sites = ["dubicars", "dubizzle", "olx"]
    else:
        sites = [args.site]
    asyncio.run(
        main_async(
            sites,
            args.brand,
            olx_limit=args.limit,
            olx_more=args.more,
        )
    )


if __name__ == "__main__":
    main()
