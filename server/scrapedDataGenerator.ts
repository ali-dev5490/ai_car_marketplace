import fs from 'fs';
import path from 'path';

const PAKISTAN_CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar',
  'Faisalabad', 'Multan', 'Sahiwal', 'Sialkot', 'Gujranwala',
  'Quetta', 'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha'
];

const SELLER_NAMES = [
  'Chaudhry Motors', 'Usman Ali', 'Al-Rehman Motors', 'Royal Motors Lahore',
  'Mian Trading Co', 'Zahid Hussain', 'Karakoram Autos', 'Capital Motors Islamabad',
  'Tariq Sharif', 'Sahiwal Car Bazaar', 'Indus Valley Motors', 'Noman Arshad',
  'Khyber Motors Peshawar', 'Sindh Auto Trader', 'Farhan Motors'
];

const DATA_DIR = path.join(process.cwd(), 'data');
const SCRAPER_JSON_FILES = [
  'dubicars.json',
  'dubizzle.json',
  'olx_sahiwal.json',
];

function loadScrapedListings(): any[] {
  const listings: any[] = [];

  for (const file of SCRAPER_JSON_FILES) {
    const fullPath = path.join(DATA_DIR, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Scraped data file missing: ${fullPath}`);
      continue;
    }
    const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    if (Array.isArray(raw)) {
      listings.push(...raw);
    }
  }

  return listings;
}

function getPriceInPKR(rawPriceStr: string, currency: string, defaultPricePKR: number): number {
  const num = parseInt(String(rawPriceStr).replace(/[^0-9]/g, ''), 10);
  if (!num || isNaN(num) || num === 0) return defaultPricePKR;

  if (currency === 'USD') {
    return Math.round((num * 280) / 50000) * 50000;
  }
  if (currency === 'AED') {
    return Math.round((num * 76) / 50000) * 50000;
  }
  return num;
}

function normalizeFuel(fuel: string): 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric' {
  const f = (fuel || '').toLowerCase();
  if (f.includes('electric') || f === 'ev') return 'Electric';
  if (f.includes('diesel')) return 'Diesel';
  if (f.includes('hybrid') || f.includes('phev') || f.includes('mild')) return 'Hybrid';
  return 'Petrol';
}

function normalizeBodyType(bodyType: string): string {
  const b = (bodyType || '').toLowerCase();
  if (['sedan', 'hatchback', 'suv', 'crossover', 'compact', 'van', 'luxury'].includes(b)) {
    return bodyType.charAt(0).toUpperCase() + bodyType.slice(1).toLowerCase();
  }
  if (b.includes('suv') || b.includes('crossover') || b.includes('jeep')) return 'SUV';
  if (b.includes('hatch')) return 'Hatchback';
  if (b.includes('van') || b.includes('mpv')) return 'Van';
  if (b.includes('coupe') || b.includes('sportback') || b.includes('convertible')) return 'Luxury';
  if (b.includes('pickup') || b.includes('truck')) return 'SUV';
  return 'Sedan';
}

function normalizeTransmission(transmission: string): 'Automatic' | 'Manual' {
  const t = (transmission || '').toLowerCase();
  return t.includes('manual') ? 'Manual' : 'Automatic';
}

function estimateEngineCc(item: any): number {
  const title = `${item.title || ''} ${item.description || ''}`;
  if (item.fuel === 'Electric' || normalizeFuel(item.fuel) === 'Electric') return 0;
  if (/2\.9|2\.9L/i.test(title)) return 2900;
  if (/3\.5|3\.5L/i.test(title)) return 3500;
  if (/3\.0|3\.0L/i.test(title)) return 3000;
  if (/4\.0|4\.0L/i.test(title)) return 4000;
  if (/2\.5|2\.5L/i.test(title)) return 2500;
  if (/2\.0|2\.0L/i.test(title)) return 2000;
  if (/1\.8|1\.8L/i.test(title)) return 1800;
  if (/1\.6|1\.6L/i.test(title)) return 1600;
  if (/1\.5|1\.5L|1500cc/i.test(title)) return 1500;
  if (/1\.3|1\.3L/i.test(title)) return 1300;
  if (/1\.2|1\.2L/i.test(title)) return 1200;
  if (/1\.0|1\.0L/i.test(title)) return 1000;
  if (item.brand === 'Suzuki' && /alto|mehran/i.test(title)) return 660;
  return 1500;
}

function resolveLocalImagePaths(imagePaths: string[] | undefined): string[] {
  if (!Array.isArray(imagePaths)) return [];

  const resolved: string[] = [];
  for (const p of imagePaths) {
    if (!p) continue;
    const clean = p.startsWith('/') ? p : `/${p}`;
    // Paths in JSON are like data/images/... — verify file exists under cwd
    const abs = path.join(process.cwd(), clean.replace(/^\//, ''));
    if (fs.existsSync(abs)) {
      resolved.push(clean);
    }
  }
  return resolved;
}

/** Prefer remote CDN URLs so deploys (Vercel) work without shipping ~385MB of local images. */
function resolveImages(item: any): string[] {
  const images: string[] = [];
  const maxImages = 12;

  if (Array.isArray(item.image_urls)) {
    for (const u of item.image_urls) {
      if (typeof u === 'string' && u.startsWith('http') && !images.includes(u)) {
        images.push(u);
      }
      if (images.length >= maxImages) break;
    }
  }

  if (images.length === 0) {
    images.push(...resolveLocalImagePaths(item.image_paths).slice(0, maxImages));
  }

  if (images.length === 0) {
    images.push(
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1555219507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'
    );
  }

  return images;
}

function pickCity(item: any, idx: number): string {
  const location = (item.location || '').trim();
  if (location) {
    const match = PAKISTAN_CITIES.find(c => location.toLowerCase().includes(c.toLowerCase()));
    if (match) return match;
    // Use first segment of location if it looks like a city name
    const first = location.split(',')[0].trim();
    if (first && first.length < 30 && !/dubai|uae|ras al/i.test(first)) {
      return first;
    }
  }
  return PAKISTAN_CITIES[idx % PAKISTAN_CITIES.length];
}

/** Convert scraped listings into marketplace Car objects (remote image URLs preferred). */
export function buildScrapedCarDatabase(): any[] {
  const rawList = loadScrapedListings();
  const allFormattedCars: any[] = [];
  let currentId = 1;
  let missingImages = 0;

  for (let idx = 0; idx < rawList.length; idx++) {
    const item: any = rawList[idx];
    const city = pickCity(item, idx);
    const registered_city = PAKISTAN_CITIES[(idx + 3) % PAKISTAN_CITIES.length];

    const year = parseInt(item.year || '2022', 10) || 2022;
    const mileageNum = parseInt(String(item.mileage || '45000').replace(/[^0-9]/g, ''), 10) || 45000;

    let pricePKR = getPriceInPKR(String(item.price || 0), item.currency || 'PKR', 3500000);
    if (pricePKR < 500000) {
      pricePKR = 3200000;
    }

    const fuel = normalizeFuel(item.fuel);
    const cc = estimateEngineCc(item);

    const images = resolveImages(item);
    if (
      images.length > 0 &&
      images.every((u) => u.includes('unsplash.com'))
    ) {
      missingImages++;
    }

    const make = item.brand || 'Toyota';
    const titleParts = String(item.title || `${make} Car`).split(/\s+/);
    let model = item.model || titleParts[1] || 'Standard';
    let variant = titleParts.slice(2).join(' ') || 'Variant';
    if (!variant || variant.length < 2) variant = `${make} ${model} Executive`;

    const phoneSeed = parseInt(String(item.ad_id || idx).replace(/\D/g, '').slice(-7), 10) || (1000000 + idx);
    const phone = `0300-${String(phoneSeed).padStart(7, '0').slice(0, 7)}`;

    allFormattedCars.push({
      id: currentId++,
      make,
      model,
      variant,
      year,
      city,
      price: pricePKR,
      engine_cc: fuel === 'Electric' ? 0 : cc,
      transmission: normalizeTransmission(item.transmission),
      fuel,
      mileage: mileageNum,
      color: item.color || 'White',
      body_type: normalizeBodyType(item.body_type),
      registered_city,
      condition: 'Excellent',
      seller_name: (item.seller && String(item.seller).trim()) || SELLER_NAMES[idx % SELLER_NAMES.length],
      phone,
      description:
        item.description ||
        `${make} ${model} in excellent condition for sale in ${city}. Single owner, family driven. All original documents available.`,
      features:
        Array.isArray(item.features) && item.features.length > 0
          ? item.features
          : ['ABS', 'Airbags', 'Alloy Wheels', 'Power Steering', 'Touchscreen Display'],
      images,
      created_at: new Date(Date.now() - idx * 12 * 3600 * 1000).toISOString(),
    });
  }

  console.log(
    `Imported ${allFormattedCars.length} scraped cars` +
      (missingImages ? ` (${missingImages} using placeholder images)` : '')
  );

  return allFormattedCars;
}
