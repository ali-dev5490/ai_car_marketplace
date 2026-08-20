import express, { Express } from 'express';
import path from 'path';
import { db } from './db.js';
import { aiService } from './aiService.js';

const NOMINATIM_USER_AGENT = 'PakCarMarketplace/1.0 (ai-car-marketplace geo proxy)';
let lastNominatimAt = 0;

interface NominatimAddress {
  country?: string;
  state?: string;
  province?: string;
  region?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  road?: string;
  house_number?: string;
  [key: string]: string | undefined;
}

interface NominatimPlace {
  error?: string;
  display_name?: string;
  address?: NominatimAddress;
}

export interface GeoPlace {
  country: string;
  state: string;
  city: string;
  address: string;
  label: string;
}

function parseNominatimPlace(place: NominatimPlace): GeoPlace {
  const a = place.address || {};
  const country = a.country || '';
  const state = a.state || a.province || a.region || '';
  const city = a.city || a.town || a.village || a.municipality || '';
  const skip = new Set(
    [country, state, city, a.county, a.postcode, a.country_code]
      .filter(Boolean)
      .map(s => s.toLowerCase())
  );
  const fromDisplay = (place.display_name || '')
    .split(',')
    .map(p => p.trim())
    .filter(p => p && !skip.has(p.toLowerCase()));
  const address = fromDisplay.length > 0
    ? fromDisplay.join(', ')
    : [a.house_number, a.road, a.suburb, a.neighbourhood, a.city_district].filter(Boolean).join(', ');
  const label = place.display_name || [city, state, country].filter(Boolean).join(', ');
  return { country, state, city, address, label };
}

async function nominatimFetch(url: string): Promise<any> {
  const wait = 1100 - (Date.now() - lastNominatimAt);
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  lastNominatimAt = Date.now();
  const res = await fetch(url, {
    headers: {
      'User-Agent': NOMINATIM_USER_AGENT,
      'Accept': 'application/json',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) {
    throw new Error(`Nominatim returned ${res.status}`);
  }
  return res.json();
}

/** Shared Express app (API + optional local /data static). Used by local server and Vercel. */
export function createApp(options: { serveLocalData?: boolean } = {}): Express {
  const app = express();
  const { serveLocalData = true } = options;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  if (serveLocalData) {
    app.use('/data', express.static(path.join(process.cwd(), 'data')));
  }

  // --- API ROUTES ---

  app.get('/api/cars', (req, res) => {
    try {
      let cars = db.getCars();
      const {
        make, model, city, transmission, fuel, body_type, condition,
        minPrice, maxPrice, minYear, maxYear, minMileage, maxMileage,
        search
      } = req.query;

      if (make) {
        cars = cars.filter(c => c.make.toLowerCase() === (make as string).toLowerCase());
      }
      if (model) {
        cars = cars.filter(c => c.model.toLowerCase().includes((model as string).toLowerCase()));
      }
      if (city) {
        cars = cars.filter(c => c.city.toLowerCase() === (city as string).toLowerCase());
      }
      if (transmission) {
        cars = cars.filter(c => c.transmission === transmission);
      }
      if (fuel) {
        cars = cars.filter(c => c.fuel === fuel);
      }
      if (body_type) {
        cars = cars.filter(c => c.body_type.toLowerCase() === (body_type as string).toLowerCase());
      }
      if (condition) {
        cars = cars.filter(c => c.condition === condition);
      }

      if (minPrice) {
        cars = cars.filter(c => c.price >= parseInt(minPrice as string));
      }
      if (maxPrice) {
        cars = cars.filter(c => c.price <= parseInt(maxPrice as string));
      }
      if (minYear) {
        cars = cars.filter(c => c.year >= parseInt(minYear as string));
      }
      if (maxYear) {
        cars = cars.filter(c => c.year <= parseInt(maxYear as string));
      }
      if (minMileage) {
        cars = cars.filter(c => c.mileage >= parseInt(minMileage as string));
      }
      if (maxMileage) {
        cars = cars.filter(c => c.mileage <= parseInt(maxMileage as string));
      }

      if (search) {
        const query = (search as string).toLowerCase();
        cars = cars.filter(c =>
          c.make.toLowerCase().includes(query) ||
          c.model.toLowerCase().includes(query) ||
          c.variant.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.city.toLowerCase().includes(query)
        );
      }

      res.json(cars);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/cars/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const car = db.getCarById(id);
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }
      res.json(car);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cars', (req, res) => {
    try {
      const carData = req.body;
      if (!carData.make || !carData.model || !carData.price) {
        return res.status(400).json({ error: 'Make, model, and price are required' });
      }
      const newCar = db.createCar(carData);
      res.status(201).json(newCar);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/cars/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = db.updateCar(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Car not found or failed to update' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/cars/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = db.deleteCar(id);
      if (!success) {
        return res.status(404).json({ error: 'Car not found' });
      }
      res.json({ message: 'Car deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- GEO (Nominatim proxy; OSM usage policy requires a User-Agent) ---

  app.get('/api/geo/reverse', async (req, res) => {
    try {
      const lat = parseFloat(String(req.query.lat ?? ''));
      const lon = parseFloat(String(req.query.lon ?? ''));
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({ error: 'Valid lat and lon are required' });
      }
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`;
      const data = await nominatimFetch(url);
      if (!data || data.error) {
        return res.status(502).json({ error: data?.error || 'Reverse geocode failed' });
      }
      res.json(parseNominatimPlace(data));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Reverse geocode failed' });
    }
  });

  app.get('/api/geo/search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      if (q.length < 2) {
        return res.json([]);
      }
      const country = String(req.query.country || '').trim().toLowerCase();
      const params = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        limit: '8',
        q,
      });
      if (country && /^[a-z]{2}$/.test(country)) {
        params.set('countrycodes', country);
      }
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const data = await nominatimFetch(url);
      const places = Array.isArray(data) ? data : [];
      const seen = new Set<string>();
      const results = [];
      for (const place of places) {
        const parsed = parseNominatimPlace(place);
        const key = `${parsed.city}|${parsed.state}|${parsed.country}`.toLowerCase();
        if (!parsed.city || seen.has(key)) continue;
        seen.add(key);
        results.push(parsed);
      }
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'City search failed' });
    }
  });

  // --- AI LAYER ENDPOINTS ---

  app.post('/api/ai/search', async (req, res) => {
    try {
      let { prompt, image } = req.body;
      if (image) {
        const analysis = await aiService.analyzeCarImage(image);
        prompt = `${analysis.color || ''} ${analysis.make || ''} ${analysis.model || ''} ${analysis.body_type || ''} ${analysis.fuel || ''}`;
        prompt = prompt.trim() || 'Toyota or Honda';
      }
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt or image is required' });
      }
      const allCars = db.getCars();
      const aiResponse = await aiService.aiSearch(prompt, allCars);
      res.json(aiResponse);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { prompt, history } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      const allCars = db.getCars();
      const turns = Array.isArray(history) ? history : [];
      const aiResponse = await aiService.chatConcierge(prompt, turns, allCars);
      res.json(aiResponse);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/post-generator', async (req, res) => {
    try {
      const { image, images } = req.body;
      const payload = images || image;
      if (!payload || (Array.isArray(payload) && payload.length === 0)) {
        return res.status(400).json({ error: 'Image data (base64 or array of base64 images) is required' });
      }
      const analysis = await aiService.analyzeCarImage(payload);
      res.json(analysis);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/inspection', async (req, res) => {
    try {
      const { car } = req.body;
      if (!car) {
        return res.status(400).json({ error: 'Car details are required' });
      }
      const inspection = await aiService.getInspection(car);
      res.json(inspection);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/pricing', async (req, res) => {
    try {
      const { car } = req.body;
      if (!car) {
        return res.status(400).json({ error: 'Car details are required' });
      }
      let basePrice = 2000000;
      if (car.make === 'Suzuki') basePrice = 1200000;
      if (car.make === 'Mercedes' || car.make === 'BMW') basePrice = 12000000;

      const age = Math.max(0, 2026 - parseInt(car.year || 2020));
      const depreciation = Math.pow(0.9, age);
      const estimatedPrice = Math.round((basePrice * depreciation) / 50000) * 50000;

      res.json({
        estimatedPrice,
        marketRangeMin: Math.round((estimatedPrice * 0.95) / 50000) * 50000,
        marketRangeMax: Math.round((estimatedPrice * 1.05) / 50000) * 50000,
        confidence: 88
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/seller-assistant', async (req, res) => {
    try {
      const { car } = req.body;
      if (!car) {
        return res.status(400).json({ error: 'Car details are required' });
      }
      const tips = await aiService.getSellerAssistant(car);
      res.json(tips);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/recommend', async (req, res) => {
    try {
      const { carId } = req.body;
      const allCars = db.getCars();
      const car = allCars.find(c => c.id === parseInt(carId));
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      const similar = allCars
        .filter(c => c.id !== car.id && (c.body_type === car.body_type || c.make === car.make))
        .sort((a, b) => Math.abs(a.price - car.price) - Math.abs(b.price - car.price))
        .slice(0, 4);

      const betterValue = allCars
        .filter(c => c.id !== car.id && c.body_type === car.body_type && c.price < car.price && c.year >= car.year)
        .slice(0, 3);

      res.json({
        similar,
        betterValue: betterValue.length > 0 ? betterValue : allCars.filter(c => c.id !== car.id && c.price < car.price).slice(0, 3)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ANALYTICS ---

  app.get('/api/analytics/seller', (req, res) => {
    try {
      const cars = db.getCars();
      const sellerCars = cars.filter(c => c.seller_name.includes('Usman') || c.id % 75 === 0);

      const stats = {
        posted_cars_count: sellerCars.length || 3,
        views_count: 1420,
        favorites_count: 89,
        messages_count: 34,
        lead_count: 12,
        recent_leads: [
          { id: 1, car_id: sellerCars[0]?.id || 1, car_title: `${sellerCars[0]?.year || 2020} ${sellerCars[0]?.make || 'Toyota'} ${sellerCars[0]?.model || 'Corolla'}`, buyer_name: 'Asim Raza', buyer_phone: '0300-4592031', message: 'Assalam o alaikum, is the price slightly negotiable? I am planning to inspect the car this Sunday.', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 2, car_id: sellerCars[1]?.id || 2, car_title: `${sellerCars[1]?.year || 2018} ${sellerCars[1]?.make || 'Honda'} ${sellerCars[1]?.model || 'Civic'}`, buyer_name: 'Farhan Jamil', buyer_phone: '0321-8729110', message: 'I want to know if all tax documents are cleared and original plates are available.', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 3, car_id: sellerCars[0]?.id || 1, car_title: `${sellerCars[0]?.year || 2020} ${sellerCars[0]?.make || 'Toyota'} ${sellerCars[0]?.model || 'Corolla'}`, buyer_name: 'Sadia Malik', buyer_phone: '0333-5192801', message: 'Is this vehicle still available? Please call me at your earliest convenience.', created_at: new Date(Date.now() - 172800000).toISOString() }
        ]
      };
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/analytics/admin', (req, res) => {
    try {
      const cars = db.getCars();
      const total_cars = cars.length;

      const average_price = Math.round(cars.reduce((sum, c) => sum + c.price, 0) / total_cars);

      const brandCounts: Record<string, number> = {};
      cars.forEach(c => {
        brandCounts[c.make] = (brandCounts[c.make] || 0) + 1;
      });
      const brand_distribution = Object.entries(brandCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      const most_popular_brand = brand_distribution[0]?.name || 'Toyota';

      const bodyCounts: Record<string, number> = {};
      cars.forEach(c => {
        const raw = (c.body_type || 'Other').trim();
        const key = raw.toLowerCase() === 'suv' ? 'SUV' : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        bodyCounts[key] = (bodyCounts[key] || 0) + 1;
      });
      const body_type_distribution = Object.entries(bodyCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      const cityCounts: Record<string, number> = {};
      cars.forEach(c => {
        cityCounts[c.city] = (cityCounts[c.city] || 0) + 1;
      });
      const city_distribution = Object.entries(cityCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      const most_popular_city = city_distribution[0]?.name || 'Lahore';

      const yearCounts: Record<string, number> = {};
      cars.forEach(c => {
        const bracket = c.year >= 2020 ? '2020-2024' : c.year >= 2015 ? '2015-2019' : '2010-2014';
        yearCounts[bracket] = (yearCounts[bracket] || 0) + 1;
      });
      const year_distribution = Object.entries(yearCounts).map(([name, value]) => ({ name, value }));

      const priceBrackets = [
        { name: '< 20 Lakh', min: 0, max: 2000000, value: 0 },
        { name: '20-40 Lakh', min: 2000000, max: 4000000, value: 0 },
        { name: '40-60 Lakh', min: 4000000, max: 6000000, value: 0 },
        { name: '60-80 Lakh', min: 6000000, max: 8000000, value: 0 },
        { name: '80 Lakh+', min: 8000000, max: Infinity, value: 0 },
      ];
      cars.forEach(c => {
        const bracket = priceBrackets.find(b => c.price >= b.min && c.price < b.max);
        if (bracket) bracket.value++;
      });
      const price_distribution = priceBrackets.map(b => ({ name: b.name, value: b.value }));

      res.json({
        total_cars,
        average_price,
        active_listings: total_cars,
        most_popular_brand,
        most_popular_city,
        brand_distribution,
        body_type_distribution,
        year_distribution,
        city_distribution: city_distribution.slice(0, 8),
        price_distribution,
        all_cars: cars.map(c => ({
          id: c.id,
          year: c.year,
          make: c.make,
          model: c.model,
          variant: c.variant,
          price: c.price,
          city: c.city
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}
