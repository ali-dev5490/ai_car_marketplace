# Car Ads Scraper

Scrapes car ads from:

- **Dubicars** + **Dubizzle** — 10 ads per brand (Audi, Honda, Toyota, Suzuki, Volkswagen, Mercedes-Benz)
- **OLX Pakistan** — 100 cars from [Sahiwal cars](https://www.olx.com.pk/sahiwal_g4060683/cars_c84)

Saves full ad data to JSON and downloads images locally (`image_paths` on each record).

## Setup

```bash
cd "/var/www/html/car scraper"
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
playwright install chromium
```

Google Chrome is preferred for Dubizzle. Browser defaults to **headed** (`HEADLESS=0`) for Incapsula; use `HEADLESS=1` for Dubicars/OLX if you prefer.

## Run

```bash
source .venv/bin/activate
PYTHONUNBUFFERED=1 python main.py
```

```bash
python main.py --site dubicars
python main.py --site dubizzle
python main.py --site olx
python main.py --site olx --more 100          # scrape 100 additional ads
python main.py --site olx --limit 200         # scrape until 200 total ads stored
python main.py --brand audi
HEADLESS=1 python main.py --site olx
OLX_URL="https://www.olx.com.pk/cars_c84" python main.py --site olx --more 100
```

From the marketplace root you can also run:

```bash
npm run import:olx              # scrape +100 OLX cars, sync data, rebuild db.json
OLX_MORE=150 npm run import:olx
npm run rebuild:db              # rebuild db.json from existing ./data JSON only
```

## Output

| File | Description |
|------|-------------|
| `data/dubicars.json` | Dubicars ads |
| `data/dubizzle.json` | Dubizzle ads |
| `data/olx_sahiwal.json` | OLX Sahiwal cars (100) |
| `data/images/<site>/<ad_id>/` | Downloaded photos |

Re-running skips `ad_id`s already in the JSON files.

## Notes

- Dubicars: `/uae/used/{brand}` + export filters (PK / USD).
- Dubizzle: headed Chrome by default for Incapsula.
- OLX: paginates with `?page=N` (~25 ads/page).
- `REQUEST_DELAY` (default 1.5s), `MAX_IMAGES` (default 12), `OLX_ADS_LIMIT` (default 100).
