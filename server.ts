import './server/loadEnv';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { aiService } from './server/aiService';
import { Car } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large JSON payloads (for base64 images)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Serve data directory for local image assets
  app.use('/data', express.static(path.join(process.cwd(), 'data')));

  // --- API ROUTES ---

  // Get list of cars with filtering
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
      
      // Ranges
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

      // Keyword search
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

  // Get car by ID
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

  // Add a car
  app.post('/api/cars', (req, res) => {
    try {
      const carData = req.body;
      // Basic validation
      if (!carData.make || !carData.model || !carData.price) {
        return res.status(400).json({ error: 'Make, model, and price are required' });
      }
      const newCar = db.createCar(carData);
      res.status(201).json(newCar);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update a car
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

  // Delete a car
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

  // --- AI LAYER ENDPOINTS ---

  // Intelligent conversational search
  app.post('/api/ai/search', async (req, res) => {
    try {
      let { prompt, image } = req.body;
      if (image) {
        // First analyze image to get specifications
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

  // AI Car Posting generator
  app.post('/api/ai/post-generator', async (req, res) => {
    try {
      const { image, images } = req.body; // single base64 or array of base64 images
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

  // AI Inspection helper
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

  // AI Pricing helper
  app.post('/api/ai/pricing', async (req, res) => {
    try {
      const { car } = req.body;
      if (!car) {
        return res.status(400).json({ error: 'Car details are required' });
      }
      // Simple automated pricing based on year, mileage, brand
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

  // AI Seller Assistant recommendations
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

  // AI Recommendations
  app.post('/api/ai/recommend', async (req, res) => {
    try {
      const { carId } = req.body;
      const allCars = db.getCars();
      const car = allCars.find(c => c.id === parseInt(carId));
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      // Filter similar cars (same body type or brand, within similar price range)
      const similar = allCars
        .filter(c => c.id !== car.id && (c.body_type === car.body_type || c.make === car.make))
        .sort((a, b) => Math.abs(a.price - car.price) - Math.abs(b.price - car.price))
        .slice(0, 4);

      // Alternatives (better value - lower price but same or newer year)
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

  // --- ANALYTICS DASHBOARD ENDPOINTS ---

  // Seller Dashboard Statistics
  app.get('/api/analytics/seller', (req, res) => {
    try {
      const cars = db.getCars();
      // Assume the seller owns ~4 cars from the seeded database for demonstration purposes
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

  // Admin Analytics Dashboard Statistics
  app.get('/api/analytics/admin', (req, res) => {
    try {
      const cars = db.getCars();
      const total_cars = cars.length;
      
      // Calculate average price
      const average_price = Math.round(cars.reduce((sum, c) => sum + c.price, 0) / total_cars);
      
      // Brand frequencies
      const brandCounts: Record<string, number> = {};
      cars.forEach(c => {
        brandCounts[c.make] = (brandCounts[c.make] || 0) + 1;
      });
      const brand_distribution = Object.entries(brandCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
      const most_popular_brand = brand_distribution[0]?.name || 'Toyota';

      // City frequencies
      const cityCounts: Record<string, number> = {};
      cars.forEach(c => {
        cityCounts[c.city] = (cityCounts[c.city] || 0) + 1;
      });
      const city_distribution = Object.entries(cityCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
      const most_popular_city = city_distribution[0]?.name || 'Lahore';

      // Year distribution
      const yearCounts: Record<string, number> = {};
      cars.forEach(c => {
        const bracket = c.year >= 2020 ? '2020-2024' : c.year >= 2015 ? '2015-2019' : '2010-2014';
        yearCounts[bracket] = (yearCounts[bracket] || 0) + 1;
      });
      const year_distribution = Object.entries(yearCounts).map(([name, value]) => ({ name, value }));

      // Price distribution (Lakh brackets)
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
        brand_distribution: brand_distribution.slice(0, 6),
        year_distribution,
        city_distribution: city_distribution.slice(0, 5),
        price_distribution
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE FRONTEND SERVICE BRIDGE ---

  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite in development middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Static assets in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Car Marketplace Server booted on http://0.0.0.0:${PORT}`);
  });
}

startServer();
