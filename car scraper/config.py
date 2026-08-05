"""Shared scraper configuration."""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
IMAGES_DIR = DATA_DIR / "images"

ADS_PER_BRAND = 10
MAX_IMAGES_PER_AD = int(os.getenv("MAX_IMAGES", "12"))
REQUEST_DELAY_SEC = float(os.getenv("REQUEST_DELAY", "1.5"))
MAX_RETRIES = 2
HEADLESS = os.getenv("HEADLESS", "0") != "0"

BRANDS = [
    {"name": "Audi", "dubicars": "audi", "dubizzle": "audi"},
    {"name": "Honda", "dubicars": "honda", "dubizzle": "honda"},
    {"name": "Toyota", "dubicars": "toyota", "dubizzle": "toyota"},
    {"name": "Suzuki", "dubicars": "suzuki", "dubizzle": "suzuki"},
    {"name": "Volkswagen", "dubicars": "volkswagen", "dubizzle": "volkswagen"},
    {"name": "Mercedes-Benz", "dubicars": "mercedes-benz", "dubizzle": "mercedes-benz"},
]

# Brand listing path + export filters from the user search URL.
# (Appending ma= to /search causes redirect loops in headless Chromium.)
DUBICARS_BRAND_PATH = "https://www.dubicars.com/uae/used/{make}"
DUBICARS_QUERY = (
    "c=new-and-used"
    "&cr=USD"
    "&eo%5B%5D=can-be-exported"
    "&eo%5B%5D=export-only"
    "&noi=30"
    "&set=bu"
    "&ul=PK"
)

DUBIZZLE_USED_CARS_BASE = "https://dubai.dubizzle.com/motors/used-cars"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

DUBICARS_JSON = DATA_DIR / "dubicars.json"
DUBIZZLE_JSON = DATA_DIR / "dubizzle.json"
OLX_JSON = DATA_DIR / "olx_sahiwal.json"

# Default: Sahiwal. Override with OLX_URL for more inventory, e.g. https://www.olx.com.pk/cars_c84
OLX_SAHIWAL_CARS_URL = os.getenv(
    "OLX_URL",
    "https://www.olx.com.pk/sahiwal_g4060683/cars_c84",
)
OLX_ADS_LIMIT = int(os.getenv("OLX_ADS_LIMIT", "100"))
