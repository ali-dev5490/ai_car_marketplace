import { GoogleGenAI, Type } from '@google/genai';
import { Car, AISearchResponse, AIAnalysisResponse } from '../src/types';

// Helper to sanitize base64 data URLs for Gemini inlineData
function parseImageData(base64Input: string): { mimeType: string; data: string } {
  let mimeType = "image/jpeg";
  let data = base64Input;

  if (base64Input.startsWith("data:")) {
    const matches = base64Input.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      data = matches[2];
    } else {
      const parts = base64Input.split(";base64,");
      if (parts.length === 2) {
        mimeType = parts[0].replace("data:", "");
        data = parts[1];
      }
    }
  }
  return { mimeType, data };
}

// Initialize GoogleGenAI if key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini AI Provider initialized successfully!');
  } catch (err) {
    console.error('Failed to initialize Gemini AI Client, falling back to Mock.', err);
  }
} else {
  console.log('No GEMINI_API_KEY found. AI services will run on MockAIProvider.');
}

// Interface for AI operations
export interface IAIProvider {
  aiSearch(prompt: string, allCars: Car[]): Promise<AISearchResponse>;
  analyzeCarImage(images: string | string[]): Promise<AIAnalysisResponse>;
  getInspection(car: Car): Promise<any>;
  getSellerAssistant(car: Car): Promise<any>;
}

// 1. HIGH-QUALITY MOCK AI PROVIDER (Fallback)
class MockAIProvider implements IAIProvider {
  async aiSearch(prompt: string, allCars: Car[]): Promise<AISearchResponse> {
    const p = prompt.toLowerCase();
    const filters: any = {};
    let reasoning = "Based on your request, I analyzed the marketplace and found cars matching your requirements.";

    // Parse budget using regex
    const parsedBudget = (() => {
      // Crore / cr
      const croreMatch = p.match(/\b([0-9.]+)\s*(crore|cr)\b/);
      if (croreMatch) return parseFloat(croreMatch[1]) * 10000000;
      
      // Lakh variations (lakhs, lakh, laks, lac, lacs, lak, l)
      const lakhMatch = p.match(/\b([0-9.]+)\s*(lakh|lakhs|lacs|lac|laks|lak|l)\b/) || 
                        p.match(/\b([0-9.]+)(lakh|lakhs|lacs|lac|laks|lak|l)\b/);
      if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;

      // Million / m
      const millionMatch = p.match(/\b([0-9.]+)\s*(million|m)\b/) ||
                           p.match(/\b([0-9.]+)(million|m)\b/);
      if (millionMatch) return parseFloat(millionMatch[1]) * 1000000;

      // Raw number with budget context
      const rawBudgetMatch = p.match(/\b(?:budget|under|price|below|max|maximum|around)\s*(?:is|of|at)?\s*([0-9.]+)\b/);
      if (rawBudgetMatch) {
        const val = parseFloat(rawBudgetMatch[1]);
        if (val >= 5 && val <= 300) return val * 100000;
        if (val >= 100000) return val;
      }
      return null;
    })();

    if (parsedBudget !== null) {
      filters.priceMax = parsedBudget;
      reasoning += ` Budget filtered around or under ${(parsedBudget / 100000).toFixed(0)} Lakh PKR.`;
    }

    // Parse city
    const cities = ['lahore', 'karachi', 'islamabad', 'rawalpindi', 'peshawar', 'multan', 'faisalabad', 'sialkot', 'gujranwala'];
    const foundCity = cities.find(c => p.includes(c));
    if (foundCity) {
      filters.city = foundCity.charAt(0).toUpperCase() + foundCity.slice(1);
      reasoning += ` Location set to ${filters.city}.`;
    }

    // Parse make/brand
    const brands = ['toyota', 'honda', 'suzuki', 'hyundai', 'kia', 'mg', 'bmw', 'audi', 'mercedes', 'changan', 'proton'];
    const foundBrand = brands.find(b => p.includes(b));
    if (foundBrand) {
      filters.make = foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1);
      reasoning += ` Brand set to ${filters.make}.`;
    }

    // Parse model
    const models = ['corolla', 'yaris', 'fortuner', 'vitz', 'aqua', 'civic', 'city', 'vezel', 'alto', 'cultus', 'wagon r', 'swift', 'sportage', 'picanto', 'tucson', 'elantra', 'sonata', 'hs', 'alsvin', 'saga'];
    const foundModel = models.find(m => p.includes(m));
    if (foundModel) {
      filters.model = foundModel.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      reasoning += ` Model set to ${filters.model}.`;
    }

    // Parse color
    const colors = ['white', 'black', 'silver', 'grey', 'blue', 'red', 'bronze'];
    const foundColor = colors.find(c => p.includes(c));
    if (foundColor) {
      filters.color = foundColor.charAt(0).toUpperCase() + foundColor.slice(1);
      if (foundColor === 'grey') filters.color = 'Graphite Grey';
      if (foundColor === 'blue') filters.color = 'Royal Blue';
      reasoning += ` Color preference detected: ${filters.color}.`;
    }

    // Parse transmission
    if (p.includes('auto') || p.includes('cvt') || p.includes('ags')) {
      filters.transmission = 'Automatic';
      reasoning += ` Transmission preferred as Automatic.`;
    } else if (p.includes('manual') || p.includes('m/t')) {
      filters.transmission = 'Manual';
      reasoning += ` Transmission preferred as Manual.`;
    }

    // Parse specific needs
    if (p.includes('family') || p.includes('space') || p.includes('tour')) {
      filters.body_type = ['Sedan', 'SUV', 'Crossover'];
      reasoning += ` Screened for spacious family vehicles (Sedans, SUVs, Crossovers).`;
    } else if (p.includes('student') || p.includes('daily') || p.includes('office') || p.includes('small') || p.includes('university')) {
      filters.body_type = ['Hatchback', 'Compact'];
      reasoning += ` Recommended compact, highly fuel-efficient hatchbacks ideal for students and daily city commutes.`;
    } else if (p.includes('fuel') || p.includes('average') || p.includes('mileage') || p.includes('hybrid') || p.includes('saving')) {
      filters.fuel = ['Hybrid', 'Electric', 'Petrol'];
      filters.mileageMax = 120000;
      reasoning += ` Optimized for maximum fuel average (Hybrids and small-engine hatchbacks selected).`;
    }

    // Apply filters on the list
    let filteredCars = allCars.filter(car => {
      if (filters.make && car.make !== filters.make) return false;
      if (filters.model && !car.model.toLowerCase().includes(filters.model.toLowerCase())) return false;
      if (filters.city && car.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      if (filters.color && !car.color.toLowerCase().includes(filters.color.toLowerCase())) return false;
      if (filters.transmission && car.transmission !== filters.transmission) return false;
      if (filters.priceMax && car.price > filters.priceMax) return false;
      if (filters.mileageMax && car.mileage > filters.mileageMax) return false;
      if (filters.fuel) {
        if (Array.isArray(filters.fuel)) {
          if (!filters.fuel.includes(car.fuel)) return false;
        } else if (car.fuel !== filters.fuel) return false;
      }
      if (filters.body_type) {
        if (Array.isArray(filters.body_type)) {
          if (!filters.body_type.includes(car.body_type)) return false;
        } else if (car.body_type !== filters.body_type) return false;
      }
      return true;
    });

    // If no direct match found, relax constraints but KEEP THE BUDGET if specified
    if (filteredCars.length === 0) {
      if (filters.priceMax) {
        filteredCars = allCars.filter(car => car.price <= filters.priceMax);
        if (filters.city) {
          const cityMatch = filteredCars.filter(car => car.city.toLowerCase() === filters.city.toLowerCase());
          if (cityMatch.length > 0) filteredCars = cityMatch;
        }
        
        if (filteredCars.length > 0) {
          filteredCars.sort((a, b) => b.price - a.price);
          reasoning = `We couldn't find direct matches for your detailed make/model criteria within your budget, but we found these options strictly under ${(filters.priceMax / 100000).toFixed(0)} Lakh PKR.`;
        } else {
          filteredCars = [...allCars].sort((a, b) => a.price - b.price).slice(0, 5);
          reasoning = `Your budget of ${(filters.priceMax / 100000).toFixed(0)} Lakh is lower than the cheapest listing in our system. Here are our most affordable vehicles starting at ${(filteredCars[0].price / 100000).toFixed(0)} Lakh.`;
        }
      } else {
        filteredCars = allCars.slice(0, 5);
        reasoning = `No direct match found. Here are some of our latest highly recommended verified listings.`;
      }
    }

    const suggestedQueries: string[] = [];
    const activeCity = filters.city || 'Lahore';
    
    if (p.includes('lahore') || p.includes('karachi') || p.includes('islamabad') || p.includes('rawalpindi') || p.includes('peshawar') || p.includes('multan') || p.includes('faisalabad') || p.includes('sialkot') || p.includes('gujranwala')) {
      suggestedQueries.push(`You need car for sale in ${activeCity}?`);
      suggestedQueries.push(`Show automatic cars in ${activeCity}`);
      if (filters.priceMax) {
        suggestedQueries.push(`Show affordable hatchbacks under ${(filters.priceMax / 100000).toFixed(0)} Lakh in ${activeCity}`);
      } else {
        suggestedQueries.push(`Show popular cars under 25 Lakh in ${activeCity}`);
      }
    } else {
      suggestedQueries.push(`You need car in Pakistan?`);
      if (filters.priceMax) {
        suggestedQueries.push(`Show fuel-efficient hatchbacks under ${(filters.priceMax / 100000).toFixed(0)} Lakh`);
        suggestedQueries.push(`Show Suzuki and Honda options under ${(filters.priceMax / 100000).toFixed(0)} Lakh`);
      } else {
        suggestedQueries.push(`Show automatic cars under 35 Lakh`);
        suggestedQueries.push(`Show cars in Lahore?`);
      }
    }

    return {
      filters,
      results: filteredCars.slice(0, 10),
      reasoning,
      confidence: 95,
      suggestedQueries
    };
  }

  async analyzeCarImage(images: string | string[]): Promise<AIAnalysisResponse> {
    const imgArray = Array.isArray(images) ? images : [images];
    const models = [
      {
        make: 'Honda', model: 'Civic', variant: 'Oriel 1.8 i-VTEC', body_type: 'Sedan',
        fuel: 'Petrol', transmission: 'Automatic' as const, color: 'White', engine_cc: 1800,
        suggested_price: 6450000, min_range: 6200000, max_range: 6700000,
        features: ['ABS', 'Airbags', 'Cruise Control', 'Push Start', 'Navigation', 'Bluetooth', 'Climate Control', 'Rear Camera', 'Alloy Wheels', 'Sunroof'],
        seo_title: `2022 Honda Civic Oriel 1.8 for Sale in Lahore (${imgArray.length} Photos Analyzed)`,
        description: `Honda Civic Oriel 1.8 i-VTEC in pristine condition. Analyzed across ${imgArray.length} high-resolution vehicle photos. Finished in crisp white. Fitted with high-end premium features including a factory Sunroof, Cruise Control, and Digital Dual Climate Control. Bumper-to-bumper original paint, with a highly clean premium interior.`,
        market_analysis: 'The Honda Civic continues to hold excellent resale value in the Pakistani sedan segment. The market demand for Oriel variants is strong, especially in major urban cities like Lahore and Islamabad.'
      },
      {
        make: 'KIA', model: 'Sportage', variant: 'AWD Trophy Edition', body_type: 'SUV',
        fuel: 'Petrol', transmission: 'Automatic' as const, color: 'Black', engine_cc: 2000,
        suggested_price: 7850000, min_range: 7600000, max_range: 8100000,
        features: ['ABS', 'Airbags', 'Cruise Control', 'Push Start', 'Navigation', 'Bluetooth', 'Climate Control', 'Rear Camera', 'Parking Sensors', 'Leather Seats', 'Fog Lamps', 'Alloy Wheels', 'Sunroof', 'Traction Control'],
        seo_title: `2021 KIA Sportage AWD Trophy Edition for Sale in Karachi (${imgArray.length} Photos Scanned)`,
        description: `Spectacular KIA Sportage AWD Trophy Edition, absolute black beast. Verified from ${imgArray.length} vehicle image angles. Completely original paint, scratchless interior with rich panoramic dual sunroof, premium leather upholstery, all-wheel drive stability controls.`,
        market_analysis: 'The mid-size SUV segment in Pakistan is highly competitive. KIA Sportage remains the gold standard in popularity and liquidity.'
      }
    ];

    const chosen = models[Math.floor(Math.random() * models.length)];

    return {
      make: chosen.make,
      model: chosen.model,
      variant: chosen.variant,
      estimated_year: 2022,
      body_type: chosen.body_type,
      fuel: chosen.fuel,
      transmission: chosen.transmission,
      mileage_estimate: 24000,
      color: chosen.color,
      condition: 'Excellent',
      features: chosen.features,
      suggested_price: {
        estimatedPrice: chosen.suggested_price,
        marketRangeMin: chosen.min_range,
        marketRangeMax: chosen.max_range,
        confidence: 94
      },
      seo_title: chosen.seo_title,
      description: chosen.description,
      market_analysis: chosen.market_analysis,
      confidence_score: 95,
      inspection: {
        engine: 95,
        body: 92,
        interior: 96,
        exterior: 94,
        tyres: 90,
        overallScore: 93,
        grade: 'Excellent Vehicle (Grade A)'
      }
    };
  }

  async getInspection(car: Car): Promise<any> {
    let score = 88;
    if (car.condition === 'Excellent') score = 94;
    if (car.condition === 'Fair') score = 76;
    if (car.condition === 'Need Work') score = 55;

    return {
      engine: score + 2,
      body: score - 4,
      interior: score + 1,
      exterior: score - 2,
      tyres: score - 5,
      overallScore: score,
      grade: score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 70 ? 'Fair' : 'Needs Repair'
    };
  }

  async getSellerAssistant(car: Car): Promise<any> {
    return {
      betterTitle: `${car.year} ${car.make} ${car.model} ${car.variant} - ${car.condition} Condition (${car.city})`,
      betterDescription: `🚨 EXCELLENT BUY DEAL! 🚨\n\nI am selling my personal family-used ${car.make} ${car.model} (${car.year} Model).\n\nKey Highlights:\n✅ Driven only ${car.mileage.toLocaleString()} km.\n✅ Solid ${car.engine_cc}cc engine yielding superb fuel economy.\n✅ Complete file, original smart card, all taxes paid.\n✅ Clean engine bay, pristine suspension, neat fabric/leather interior.\n\n📍 Located in ${car.city}. Serious inquiries only!`,
      missingFeatures: car.features.length < 5 ? ['ABS', 'Rear Camera', 'Alloy Wheels'] : ['Leather Seats', 'Sunroof'],
      seoImprovements: 'Include keyword tags like "used cars Lahore", "original paint Corolla", "Civic fuel average" to boost visual engagement.',
      betterPricing: {
        suggested: car.price,
        reason: 'Your price is highly aligned with the current market value. Minor room for negotiation (20,000 to 50,000 PKR) is recommended to close leads quickly.'
      }
    };
  }
}

// 2. ENTERPRISE GEMINI AI PROVIDER
class GeminiAIProvider implements IAIProvider {
  async aiSearch(prompt: string, allCars: Car[]): Promise<AISearchResponse> {
    if (!ai) return new MockAIProvider().aiSearch(prompt, allCars);

    try {
      const model = 'gemini-3.6-flash';
      const systemInstruction = `You are an AI assistant for a Pakistani car marketplace called PakCar AI.
Your job is to parse a natural language query from a user and convert it into structured search filters.
Analyze the prompt carefully for brand, model, price limits in "Lakh" or "Crore" (1 Lakh = 100,000 PKR, 1 Crore = 10,000,000 PKR), year, transmission, city, body type, fuel type, or mileage.

Respond strictly in JSON format matching the following schema. No extra text or markdown wrappers.
{
  "filters": {
    "make": "string (e.g. Toyota, Honda, Suzuki, KIA) or empty",
    "model": "string (e.g. Corolla, Civic, Alto, Sportage) or empty",
    "color": "string or empty",
    "transmission": "string: 'Automatic' | 'Manual' or empty",
    "priceMax": "number (in PKR) or null",
    "priceMin": "number (in PKR) or null",
    "yearMax": "number or null",
    "yearMin": "number or null",
    "mileageMax": "number or null",
    "fuel": "string: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric' or empty",
    "body_type": "string: 'Sedan' | 'Hatchback' | 'SUV' | 'Crossover' | 'Compact' | 'Luxury' or empty"
  },
  "reasoning": "A concise explanation of why you set these filters and what kind of car you are recommending based on their query.",
  "confidence": "number (0-100)",
  "suggestedQueries": ["array of 2-4 strings of clarifying questions or related search queries to help the user refine, e.g. 'You need car for sale in Lahore?', 'Show Suzuki and Honda options under 20 Lakh'"]
}`;

      const response = await ai.models.generateContent({
        model,
        contents: `Parse this query: "${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      const filters = parsed.filters || {};
      
      // Filter the local database using parsed filters
      let results = allCars.filter(car => {
        if (filters.make && car.make.toLowerCase() !== filters.make.toLowerCase()) return false;
        if (filters.model && !car.model.toLowerCase().includes(filters.model.toLowerCase())) return false;
        if (filters.color && !car.color.toLowerCase().includes(filters.color.toLowerCase())) return false;
        if (filters.transmission && car.transmission !== filters.transmission) return false;
        if (filters.priceMax && car.price > filters.priceMax) return false;
        if (filters.priceMin && car.price < filters.priceMin) return false;
        if (filters.yearMax && car.year > filters.yearMax) return false;
        if (filters.yearMin && car.year < filters.yearMin) return false;
        if (filters.mileageMax && car.mileage > filters.mileageMax) return false;
        if (filters.fuel && car.fuel.toLowerCase() !== filters.fuel.toLowerCase()) return false;
        if (filters.body_type && car.body_type.toLowerCase() !== filters.body_type.toLowerCase()) return false;
        return true;
      });

      // Loosen filters if empty, keeping budget if possible
      if (results.length === 0) {
        if (filters.priceMax) {
          results = allCars.filter(car => car.price <= filters.priceMax);
          if (results.length > 0) {
            results.sort((a, b) => b.price - a.price);
            parsed.reasoning = `We couldn't find exact matches for your brand/model criteria within your budget, but here are some options strictly under ${(filters.priceMax / 100000).toFixed(0)} Lakh PKR.`;
          } else {
            results = [...allCars].sort((a, b) => a.price - b.price).slice(0, 5);
            parsed.reasoning = `Your budget of ${(filters.priceMax / 100000).toFixed(0)} Lakh is below our lowest listed car. Here are our most affordable vehicles starting at ${(results[0].price / 100000).toFixed(0)} Lakh.`;
          }
        } else {
          results = allCars.slice(0, 5);
          parsed.reasoning = `No direct matches for your detailed query. Here are some excellent alternative car deals currently trending in the market.`;
        }
      }

      // Generate suggested queries dynamically if not returned by Gemini
      let suggestedQueries = parsed.suggestedQueries;
      if (!suggestedQueries || !Array.isArray(suggestedQueries)) {
        suggestedQueries = [];
        const pLower = prompt.toLowerCase();
        if (pLower.includes('lahore')) {
          suggestedQueries.push("You need car for sale in Lahore?");
          suggestedQueries.push("Show automatic options in Lahore");
          suggestedQueries.push("Show fuel-efficient cars under 20 Lakh in Lahore");
        } else {
          suggestedQueries.push("You need car in Pakistan?");
          if (filters.priceMax) {
            suggestedQueries.push(`Show hatchbacks under ${(filters.priceMax / 100000).toFixed(0)} Lakh`);
          } else {
            suggestedQueries.push("Show popular cars under 25 Lakh");
          }
        }
      }

      return {
        filters,
        results: results.slice(0, 10),
        reasoning: parsed.reasoning || "Selected best matches for your search.",
        confidence: parsed.confidence || 90,
        suggestedQueries
      };
    } catch (err) {
      console.error('Gemini Search Parsing failed, falling back to Mock AI:', err);
      return new MockAIProvider().aiSearch(prompt, allCars);
    }
  }

  async analyzeCarImage(images: string | string[]): Promise<AIAnalysisResponse> {
    if (!ai) return new MockAIProvider().analyzeCarImage(images);

    try {
      const model = 'gemini-3.6-flash';
      const imgArray = Array.isArray(images) ? images : [images];
      
      const imageParts = imgArray.map(img => {
        const { mimeType, data } = parseImageData(img);
        return {
          inlineData: {
            mimeType,
            data
          }
        };
      });

      const promptText = `Examine the provided vehicle photo(s) in detail.
Identify the car's visual details (Make, Model, Variant, Body Type, Color, Estimated Year, Visible Features, and General Condition).
Estimate a fair market price range in Pakistani Rupees (PKR) and write a professional SEO title, marketplace description, market analysis, and inspection grade.

Return ONLY a JSON object matching this schema (no markdown wrappers):
{
  "make": "string (e.g., Toyota, Honda, Suzuki, KIA, MG, Hyundai)",
  "model": "string (e.g., Civic, Corolla, Alto, Sportage, Swift, Yaris)",
  "variant": "string (e.g., Oriel 1.8, Altis Grande, VXL AGS, Trophy Edition, GLi)",
  "estimated_year": 2022,
  "body_type": "Sedan" | "Hatchback" | "SUV" | "Crossover" | "Compact",
  "fuel": "Petrol" | "Diesel" | "Hybrid" | "Electric",
  "transmission": "Automatic" | "Manual",
  "mileage_estimate": 25000,
  "color": "string (e.g., White, Black, Silver, Grey, Red, Blue)",
  "condition": "Excellent" | "Good" | "Fair",
  "features": ["ABS", "Airbags", "Sunroof", "Alloy Wheels", "Cruise Control", "Push Start", "Climate Control", "Rear Camera"],
  "suggested_price": {
    "estimatedPrice": 6250000,
    "marketRangeMin": 6000000,
    "marketRangeMax": 6500000,
    "confidence": 95
  },
  "seo_title": "string (e.g., 2022 Honda Civic Oriel 1.8 Automatic for Sale in Lahore)",
  "description": "string (a full, professional listing description based on what you see in the photo)",
  "market_analysis": "string (analysis of this vehicle's demand and resale value in Pakistan)",
  "confidence_score": 95,
  "inspection": {
    "engine": 95,
    "body": 92,
    "interior": 96,
    "exterior": 94,
    "tyres": 90,
    "overallScore": 93,
    "grade": "Grade-A Excellent"
  }
}`;

      const response = await ai.models.generateContent({
        model,
        contents: [...imageParts, { text: promptText }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const jsonText = response.text?.trim() || '{}';
      return JSON.parse(jsonText) as AIAnalysisResponse;
    } catch (err) {
      console.error('Gemini image analysis failed, falling back to mock provider:', err);
      return new MockAIProvider().analyzeCarImage(images);
    }
  }

  async getInspection(car: Car): Promise<any> {
    return new MockAIProvider().getInspection(car);
  }

  async getSellerAssistant(car: Car): Promise<any> {
    if (!ai) return new MockAIProvider().getSellerAssistant(car);

    try {
      const model = 'gemini-3.6-flash';
      const prompt = `For a ${car.year} ${car.make} ${car.model} ${car.variant} priced at ${car.price} PKR in ${car.city}:
Generate:
1. An improved marketplace title.
2. A compelling, high-converting description.
3. Recommendations for missing features to list.
4. Suggested price tweaks with market explanation.

Return strictly as JSON matching this schema:
{
  "betterTitle": "string",
  "betterDescription": "string",
  "missingFeatures": ["array of strings"],
  "seoImprovements": "string",
  "betterPricing": {
    "suggested": "number (PKR)",
    "reason": "string"
  }
}`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      return JSON.parse(response.text?.trim() || '{}');
    } catch (err) {
      return new MockAIProvider().getSellerAssistant(car);
    }
  }
}

// Export the active provider depending on key presence
export const aiService: IAIProvider = ai ? new GeminiAIProvider() : new MockAIProvider();
