#!/usr/bin/env bash
# Scrape additional OLX cars, sync into ./data, rebuild marketplace DB.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRAPER_DIR="$ROOT/car scraper"
VENV_PY="$SCRAPER_DIR/.venv/bin/python"
MORE="${OLX_MORE:-100}"
# Nationwide OLX cars listing (Sahiwal alone often has <200 ads).
OLX_URL="${OLX_URL:-https://www.olx.com.pk/cars_c84}"
HEADLESS="${HEADLESS:-1}"
MAX_IMAGES="${MAX_IMAGES:-6}"

cd "$ROOT"

if [[ ! -x "$VENV_PY" ]]; then
  echo "Scraper venv missing. Setting up..."
  cd "$SCRAPER_DIR"
  python3 -m venv .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install -r requirements.txt
  playwright install chromium
  cd "$ROOT"
fi

# Ensure marketplace can resolve data/images/... paths from scraper output
mkdir -p "$ROOT/data"
if [[ ! -L "$ROOT/data/images" ]]; then
  rm -rf "$ROOT/data/images"
  ln -sfn "../car scraper/data/images" "$ROOT/data/images"
fi

echo "==> Scraping $MORE more OLX cars from $OLX_URL (headless=$HEADLESS)"
cd "$SCRAPER_DIR"
OLX_URL="$OLX_URL" HEADLESS="$HEADLESS" MAX_IMAGES="$MAX_IMAGES" PYTHONUNBUFFERED=1 \
  "$VENV_PY" main.py --site olx --more "$MORE"
cd "$ROOT"

echo "==> Syncing scraped JSON into marketplace data/"
cp -f "$SCRAPER_DIR/data/dubicars.json" "$ROOT/data/dubicars.json" 2>/dev/null || true
cp -f "$SCRAPER_DIR/data/dubizzle.json" "$ROOT/data/dubizzle.json" 2>/dev/null || true
cp -f "$SCRAPER_DIR/data/olx_sahiwal.json" "$ROOT/data/olx_sahiwal.json"

echo "==> Rebuilding server/db.json from scraped data"
npx tsx scripts/rebuild-db.ts

OLX_COUNT=$(python3 -c "import json; print(len(json.load(open('data/olx_sahiwal.json'))))")
DB_COUNT=$(python3 -c "import json; print(len(json.load(open('server/db.json'))))")
echo "==> Done. OLX ads: $OLX_COUNT | Marketplace cars: $DB_COUNT"
echo "    Restart the app if it is running: npm run dev"
