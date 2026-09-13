import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import { db } from './db.js';
import { aiService } from './aiService.js';
import { LISTING_FEE_PKR, platformStore } from './platformStore.js';
import type { Car, PublicUser } from '../src/types.js';

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

type AuthedRequest = Request & { user?: PublicUser };

function parseBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  const alt = req.headers['x-auth-token'];
  if (typeof alt === 'string' && alt.trim()) return alt.trim();
  return null;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = parseBearer(req);
  req.user = platformStore.getUserByToken(token) || undefined;
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Login required' });
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Login required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

function isPublicListing(car: Car): boolean {
  const status = car.status || 'active';
  return status === 'active';
}

function parseNominatimPlace(place: NominatimPlace): GeoPlace {
  const a = place.address || {};
  const country = a.country || '';
  const state = a.state || a.province || a.region || '';
  const city = a.city || a.town || a.village || a.municipality || '';
  const skip = new Set(
    [country, state, city, a.county, a.postcode, a.country_code]
      .filter(Boolean)
      .map(s => s!.toLowerCase())
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
  app.use(attachUser);

  if (serveLocalData) {
    app.use('/data', express.static(path.join(process.cwd(), 'data')));
  }

  // --- AUTH ---

  app.post('/api/auth/signup', (req, res) => {
    try {
      const { name, email, phone, password, city } = req.body || {};
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const result = platformStore.signup({
        name: String(name),
        email: String(email),
        phone: String(phone || ''),
        password: String(password),
        city: String(city || 'Lahore'),
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const result = platformStore.login(String(email), String(password));
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = parseBearer(req);
    if (token) platformStore.logout(token);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ user: req.user, listing_fee_pkr: LISTING_FEE_PKR });
  });

  app.put('/api/auth/profile', requireAuth, (req: AuthedRequest, res) => {
    try {
      const { name, phone, city } = req.body || {};
      const updated = platformStore.updateUser(req.user!.id, {
        name: name != null ? String(name) : undefined,
        phone: phone != null ? String(phone) : undefined,
        city: city != null ? String(city) : undefined,
      });
      res.json({ user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CARS ---

  app.get('/api/cars', (req: AuthedRequest, res) => {
    try {
      let cars = db.getCars();
      const {
        make, model, city, transmission, fuel, body_type, condition,
        minPrice, maxPrice, minYear, maxYear, minMileage, maxMileage,
        search, mine, status, all
      } = req.query;

      if (mine === '1' || mine === 'true') {
        if (!req.user) return res.status(401).json({ error: 'Login required' });
        cars = cars.filter((c) => c.owner_user_id === req.user!.id);
      } else if (all === '1' || all === 'true') {
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
      } else {
        cars = cars.filter(isPublicListing);
      }

      if (status && typeof status === 'string') {
        cars = cars.filter((c) => (c.status || 'active') === status);
      }

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

      if (minPrice) cars = cars.filter(c => c.price >= parseInt(minPrice as string));
      if (maxPrice) cars = cars.filter(c => c.price <= parseInt(maxPrice as string));
      if (minYear) cars = cars.filter(c => c.year >= parseInt(minYear as string));
      if (maxYear) cars = cars.filter(c => c.year <= parseInt(maxYear as string));
      if (minMileage) cars = cars.filter(c => c.mileage >= parseInt(minMileage as string));
      if (maxMileage) cars = cars.filter(c => c.mileage <= parseInt(maxMileage as string));

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

  app.get('/api/cars/:id', (req: AuthedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const car = db.getCarById(id);
      if (!car) return res.status(404).json({ error: 'Car not found' });
      const isOwner = req.user && car.owner_user_id === req.user.id;
      const isAdmin = req.user?.role === 'admin';
      if (!isPublicListing(car) && !isOwner && !isAdmin) {
        return res.status(404).json({ error: 'Car not found' });
      }
      res.json(car);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cars', requireAuth, (req: AuthedRequest, res) => {
    try {
      const carData = req.body || {};
      if (!carData.make || !carData.model || !carData.price) {
        return res.status(400).json({ error: 'Make, model, and price are required' });
      }
      const newCar = db.createCar({
        ...carData,
        seller_name: carData.seller_name || req.user!.name,
        phone: carData.phone || req.user!.phone,
        owner_user_id: req.user!.id,
        status: 'pending_payment',
        payment_status: 'unpaid',
      });
      res.status(201).json(newCar);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/cars/:id', requireAuth, (req: AuthedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = db.getCarById(id);
      if (!existing) return res.status(404).json({ error: 'Car not found or failed to update' });
      const isOwner = existing.owner_user_id === req.user!.id;
      const isAdmin = req.user!.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Not allowed to edit this listing' });
      }

      const body = { ...req.body };
      delete body.id;
      delete body.owner_user_id;
      if (!isAdmin) {
        delete body.moderation_reason;
        if (body.status && !['draft', 'paused', 'sold', 'pending_payment'].includes(body.status)) {
          delete body.status;
        }
      }

      const updated = db.updateCar(id, body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/cars/:id', requireAuth, (req: AuthedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = db.getCarById(id);
      if (!existing) return res.status(404).json({ error: 'Car not found' });
      const isOwner = existing.owner_user_id === req.user!.id;
      const isAdmin = req.user!.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Not allowed to delete this listing' });
      }
      db.deleteCar(id);
      res.json({ message: 'Car deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- PAYMENTS ---

  app.get('/api/payments/fee', (_req, res) => {
    res.json({
      listing_fee_pkr: LISTING_FEE_PKR,
      instructions: {
        bank_name: 'HBL Demo Branch',
        account_title: 'AI Car Marketplace',
        account_number: '1234-5678901234',
        jazzcash: '0300-1112233',
        easypaisa: '0300-4455667',
        note: 'Transfer the listing fee, then submit your receipt note/reference. Admin will confirm manually.',
      },
    });
  });

  app.get('/api/payments', requireAuth, (req: AuthedRequest, res) => {
    try {
      const payments =
        req.user!.role === 'admin'
          ? platformStore.getPayments()
          : platformStore.getPayments({ user_id: req.user!.id });
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments', requireAuth, (req: AuthedRequest, res) => {
    try {
      const { listing_id, method, receipt_note, receipt_url } = req.body || {};
      const listingId = parseInt(listing_id);
      const car = db.getCarById(listingId);
      if (!car) return res.status(404).json({ error: 'Listing not found' });
      if (car.owner_user_id !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Not your listing' });
      }
      const payment = platformStore.createPayment({
        user_id: req.user!.id,
        listing_id: listingId,
        method: String(method || 'Bank Transfer'),
        receipt_note: String(receipt_note || ''),
        receipt_url: String(receipt_url || ''),
      });
      db.updateCar(listingId, {
        payment_status: 'pending',
        status: car.status === 'active' ? car.status : 'pending_payment',
      });
      res.status(201).json(payment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/:id/review', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, note } = req.body || {};
      if (status !== 'paid' && status !== 'rejected') {
        return res.status(400).json({ error: 'status must be paid or rejected' });
      }
      const payment = platformStore.reviewPayment(id, req.user!.id, status, note);
      if (!payment) return res.status(404).json({ error: 'Payment not found' });

      if (status === 'paid') {
        db.updateCar(payment.listing_id, { payment_status: 'paid', status: 'active' });
      } else {
        db.updateCar(payment.listing_id, { payment_status: 'rejected', status: 'pending_payment' });
      }

      platformStore.addModeration({
        admin_id: req.user!.id,
        target_type: 'payment',
        target_id: id,
        action: status === 'paid' ? 'confirm_payment' : 'reject_payment',
        reason: String(note || status),
      });

      res.json(payment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ENQUIRIES ---

  app.get('/api/enquiries', requireAuth, (req: AuthedRequest, res) => {
    try {
      if (req.user!.role === 'admin') {
        return res.json(platformStore.getEnquiries());
      }
      const mineAsBuyer = platformStore.getEnquiries({ buyer_id: req.user!.id });
      const myListingIds = db.getCarsByOwner(req.user!.id).map((c) => c.id);
      const mineAsSeller = platformStore.getEnquiries({ listing_ids: myListingIds });
      const merged = [...mineAsBuyer, ...mineAsSeller].filter(
        (e, i, arr) => arr.findIndex((x) => x.id === e.id) === i
      );
      res.json(merged);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/enquiries', requireAuth, (req: AuthedRequest, res) => {
    try {
      const { listing_id, message } = req.body || {};
      const listingId = parseInt(listing_id);
      const car = db.getCarById(listingId);
      if (!car || !isPublicListing(car)) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      if (!message || !String(message).trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      const enquiry = platformStore.createEnquiry({
        buyer_id: req.user!.id,
        listing_id: listingId,
        message: String(message),
        buyer_name: req.user!.name,
        buyer_phone: req.user!.phone,
      });
      res.status(201).json(enquiry);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ADMIN ---

  app.get('/api/admin/overview', requireAuth, requireAdmin, (_req, res) => {
    try {
      const users = platformStore.getUsers().map(({ password_hash: _, ...u }) => u);
      const cars = db.getCars();
      const payments = platformStore.getPayments();
      const sellers = users.filter((u) => cars.some((c) => c.owner_user_id === u.id));
      const buyers = users.filter((u) => u.role === 'user');
      res.json({
        total_users: users.filter((u) => u.role === 'user').length,
        total_admins: users.filter((u) => u.role === 'admin').length,
        sellers_count: sellers.length,
        buyers_count: buyers.length,
        total_listings: cars.length,
        active_listings: cars.filter((c) => (c.status || 'active') === 'active').length,
        pending_payment_listings: cars.filter((c) => c.status === 'pending_payment').length,
        pending_payments: payments.filter((p) => p.status === 'pending').length,
        listing_fee_pkr: LISTING_FEE_PKR,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
    try {
      const filter = String(req.query.filter || 'all');
      const cars = db.getCars();
      let users = platformStore.getUsers().map(({ password_hash: _, ...u }) => {
        const listings = cars.filter((c) => c.owner_user_id === u.id);
        return { ...u, listings_count: listings.length, is_seller: listings.length > 0 };
      });
      if (filter === 'sellers') users = users.filter((u) => u.is_seller);
      if (filter === 'buyers') users = users.filter((u) => u.role === 'user');
      if (filter === 'admins') users = users.filter((u) => u.role === 'admin');
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/users/:id/status', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reason } = req.body || {};
      if (!['active', 'suspended', 'blocked'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'Reason is required' });
      }
      const updated = platformStore.updateUser(id, { status });
      if (!updated) return res.status(404).json({ error: 'User not found' });
      platformStore.addModeration({
        admin_id: req.user!.id,
        target_type: 'user',
        target_id: id,
        action: `set_status_${status}`,
        reason: String(reason),
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/listings/:id/moderate', requireAuth, requireAdmin, (req: AuthedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { action, reason } = req.body || {};
      const car = db.getCarById(id);
      if (!car) return res.status(404).json({ error: 'Listing not found' });
      if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'Reason is required' });
      }

      let patch: Partial<Car> = { moderation_reason: String(reason) };
      if (action === 'approve' || action === 'activate') patch = { ...patch, status: 'active' };
      else if (action === 'hide' || action === 'suspend') patch = { ...patch, status: 'suspended' };
      else if (action === 'sold') patch = { ...patch, status: 'sold' };
      else return res.status(400).json({ error: 'Unknown action' });

      const updated = db.updateCar(id, patch);
      platformStore.addModeration({
        admin_id: req.user!.id,
        target_type: 'listing',
        target_id: id,
        action: String(action),
        reason: String(reason),
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- GEO ---

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
      if (q.length < 2) return res.json([]);
      const country = String(req.query.country || '').trim().toLowerCase();
      const params = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '8', q });
      if (country && /^[a-z]{2}$/.test(country)) params.set('countrycodes', country);
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

  // --- AI ---

  app.post('/api/ai/search', async (req, res) => {
    try {
      let { prompt, image } = req.body;
      if (image) {
        const analysis = await aiService.analyzeCarImage(image);
        prompt = `${analysis.color || ''} ${analysis.make || ''} ${analysis.model || ''} ${analysis.body_type || ''} ${analysis.fuel || ''}`;
        prompt = prompt.trim() || 'Toyota or Honda';
      }
      if (!prompt) return res.status(400).json({ error: 'Prompt or image is required' });
      const allCars = db.getCars().filter(isPublicListing);
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
      const allCars = db.getCars().filter(isPublicListing);
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
      if (!car) return res.status(400).json({ error: 'Car details are required' });
      const inspection = await aiService.getInspection(car);
      res.json(inspection);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/pricing', async (req, res) => {
    try {
      const { car } = req.body;
      if (!car) return res.status(400).json({ error: 'Car details are required' });
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
      if (!car) return res.status(400).json({ error: 'Car details are required' });
      const tips = await aiService.getSellerAssistant(car);
      res.json(tips);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/recommend', async (req, res) => {
    try {
      const { carId } = req.body;
      const allCars = db.getCars().filter(isPublicListing);
      const car = allCars.find(c => c.id === parseInt(carId));
      if (!car) return res.status(404).json({ error: 'Car not found' });
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

  app.get('/api/analytics/seller', requireAuth, (req: AuthedRequest, res) => {
    try {
      const sellerCars = db.getCarsByOwner(req.user!.id);
      const enquiries = platformStore.getEnquiries({ listing_ids: sellerCars.map((c) => c.id) });
      res.json({
        posted_cars_count: sellerCars.length,
        views_count: sellerCars.length * 42,
        favorites_count: sellerCars.length * 3,
        messages_count: enquiries.length,
        lead_count: enquiries.length,
        recent_leads: enquiries.slice(0, 10).map((e) => {
          const car = sellerCars.find((c) => c.id === e.listing_id);
          return {
            id: e.id,
            car_id: e.listing_id,
            car_title: car ? `${car.year} ${car.make} ${car.model}` : `Listing #${e.listing_id}`,
            buyer_name: e.buyer_name,
            buyer_phone: e.buyer_phone,
            message: e.message,
            created_at: e.created_at,
          };
        }),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/analytics/admin', requireAuth, requireAdmin, (_req, res) => {
    try {
      const cars = db.getCars();
      const total_cars = cars.length || 1;
      const average_price = Math.round(cars.reduce((sum, c) => sum + c.price, 0) / total_cars);

      const brandCounts: Record<string, number> = {};
      cars.forEach(c => { brandCounts[c.make] = (brandCounts[c.make] || 0) + 1; });
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
      cars.forEach(c => { cityCounts[c.city] = (cityCounts[c.city] || 0) + 1; });
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
        total_cars: cars.length,
        average_price: cars.length ? average_price : 0,
        active_listings: cars.filter((c) => (c.status || 'active') === 'active').length,
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
          city: c.city,
          status: c.status || 'active',
          payment_status: c.payment_status || 'paid',
          owner_user_id: c.owner_user_id ?? null,
          seller_name: c.seller_name,
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}
