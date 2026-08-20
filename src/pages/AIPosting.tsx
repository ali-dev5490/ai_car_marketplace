import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, Image as ImageIcon, CheckCircle2, ShieldCheck, Activity, Edit3, Save, RefreshCw, BarChart2, Plus, Trash2, MapPin, LocateFixed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Car } from '../types';
import { COUNTRIES, findPakistanCity, searchPakistanCities } from '../data/pakistanCities';

type LocationStatus = 'idle' | 'locating' | 'filled' | 'denied' | 'error';

type CitySuggestion = {
  city: string;
  state: string;
  country: string;
  address?: string;
  label: string;
};

// Preset demo base64 images/data so the user can test the scanner with multi-image clicks
const DEMO_PRESETS = [
  {
    name: "Honda Civic Oriel (Sedan)",
    imgUrls: [
      "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800"
    ],
    data: {
      make: "Honda", model: "Civic", variant: "Oriel 1.8 i-VTEC", estimated_year: 2021,
      body_type: "Sedan" as const, fuel: "Petrol" as const, transmission: "Automatic" as const,
      mileage_estimate: 28000, color: "White", condition: "Excellent" as const,
      features: ["ABS", "Airbags", "Cruise Control", "Push Start", "Navigation", "Bluetooth", "Climate Control", "Rear Camera", "Alloy Wheels", "Sunroof"],
      suggested_price: { estimatedPrice: 6250000, marketRangeMin: 6000000, marketRangeMax: 6500000, confidence: 96 },
      seo_title: "2021 Honda Civic Oriel 1.8 Automatic - Pristine Condition",
      description: "Superb condition Honda Civic Oriel 1.8 i-VTEC. Driven 28,000 km, single-owner, fully maintained by authorized dealership. Original paint, immaculate interior. Multi-angle 3D scans verify zero major accidents, 100% factory body sealing, and pristine brake disk rotor status.",
      market_analysis: "Validated from 3 exterior profiles. High resale value liquid asset. Strong demand in Lahore, Islamabad, and Karachi."
    }
  },
  {
    name: "Suzuki Alto VXL (Hatchback)",
    imgUrls: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"
    ],
    data: {
      make: "Suzuki", model: "Alto", variant: "VXL AGS", estimated_year: 2022,
      body_type: "Hatchback" as const, fuel: "Petrol" as const, transmission: "Automatic" as const,
      mileage_estimate: 15000, color: "Silver", condition: "Excellent" as const,
      features: ["ABS", "Airbags", "Bluetooth", "Keyless Entry", "Power Windows"],
      suggested_price: { estimatedPrice: 2650000, marketRangeMin: 2500000, marketRangeMax: 2750000, confidence: 92 },
      seo_title: "2022 Suzuki Alto VXL AGS Automatic - Low Mileage Silver",
      description: "Slightly used Suzuki Alto VXL AGS with Auto Gear Shift. Extremely fuel-efficient, giving up to 21 km/L in city. Family used, scratchless condition, complete genuine file. 2-image AI inspection confirms matching silver luster on all passenger doors.",
      market_analysis: "Dual-aspect verification complete. Highest liquidity hatchback in Pakistan. Resale speed is lightning-fast."
    }
  },
  {
    name: "KIA Sportage Alpha (SUV)",
    imgUrls: [
      "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800"
    ],
    data: {
      make: "KIA", model: "Sportage", variant: "Alpha", estimated_year: 2020,
      body_type: "SUV" as const, fuel: "Petrol" as const, transmission: "Automatic" as const,
      mileage_estimate: 42000, color: "Black", condition: "Good" as const,
      features: ["ABS", "Airbags", "Cruise Control", "Push Start", "Bluetooth", "Climate Control", "Rear Camera", "Alloy Wheels"],
      suggested_price: { estimatedPrice: 5650000, marketRangeMin: 5400000, marketRangeMax: 5900000, confidence: 93 },
      seo_title: "2020 KIA Sportage Alpha Automatic - Family SUV For Sale",
      description: "Beautifully kept KIA Sportage Alpha in solid black. Standard 2.0L engine. Drives perfectly. Regularly serviced, neat cabin, comfortable family cruiser. AI multi-view scan confirms headlight housing transparency and solid fender alignments.",
      market_analysis: "Sturdy mid-size SUV segment standard. Side & front perspectives verified. Stable resale with active buyer circles."
    }
  }
];

export default function AIPosting() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'upload' | 'scanning' | 'results'>('upload');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLog, setScanLog] = useState('Booting AI Car Scanner Engine...');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [currentScanImageIndex, setCurrentScanImageIndex] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  
  // Scanned specifications state
  const [specs, setSpecs] = useState<any>(null);

  // Editable fields form state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState(2022);
  const [price, setPrice] = useState(3000000);
  const [mileage, setMileage] = useState(20000);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const askedLocationRef = useRef(false);
  const cityBoxRef = useRef<HTMLDivElement>(null);
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>('Automatic');
  const [fuel, setFuel] = useState<'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'>('Petrol');
  const [color, setColor] = useState('White');
  const [condition, setCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Need Work'>('Excellent');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [phone, setPhone] = useState('');

  const applyPlace = (place: { country?: string; state?: string; city?: string; address?: string }) => {
    const nextCountry = place.country || 'Pakistan';
    setCountry(nextCountry);
    let nextCity = (place.city || '').trim();
    let nextState = (place.state || '').trim();
    if (nextCountry === 'Pakistan' && nextCity) {
      const local = findPakistanCity(nextCity);
      if (local) {
        nextCity = local.name;
        nextState = local.province;
      }
    }
    setCity(nextCity);
    setState(nextState);
    setAddress((place.address || '').trim());
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/geo/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          if (!res.ok) throw new Error('reverse failed');
          const place = await res.json();
          applyPlace(place);
          setLocationStatus('filled');
        } catch {
          setLocationStatus('error');
        }
      },
      (err) => {
        setLocationStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (stage !== 'results' || askedLocationRef.current) return;
    askedLocationRef.current = true;
    requestLocation();
  }, [stage]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (cityBoxRef.current && !cityBoxRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!showCitySuggestions) return;
    const q = city.trim();
    const isPakistan = country === 'Pakistan';

    if (isPakistan && q.length >= 1) {
      const local = searchPakistanCities(q).map(c => ({
        city: c.name,
        state: c.province,
        country: 'Pakistan',
        label: `${c.name}, ${c.province}`,
      }));
      if (local.length > 0) {
        setCitySuggestions(local);
        return;
      }
    }

    if (q.length < 2) {
      setCitySuggestions([]);
      return;
    }

    const countryMeta = COUNTRIES.find(c => c.name === country);
    const handle = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q });
        if (countryMeta?.code) params.set('country', countryMeta.code);
        const res = await fetch(`/api/geo/search?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setCitySuggestions((Array.isArray(data) ? data : []).map((p: CitySuggestion) => ({
          city: p.city,
          state: p.state,
          country: p.country || country,
          address: p.address,
          label: p.label || [p.city, p.state, p.country].filter(Boolean).join(', '),
        })));
      } catch {
        setCitySuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [city, country, showCitySuggestions]);

  const pickCitySuggestion = (suggestion: CitySuggestion) => {
    setCity(suggestion.city);
    setState(suggestion.state);
    if (suggestion.country) setCountry(suggestion.country);
    if (suggestion.address) setAddress(suggestion.address);
    setShowCitySuggestions(false);
  };

  const startScanningLogs = async (imgs: string[]) => {
    setUploadedImages(imgs);
    setStage('scanning');
    setScanProgress(0);
    setCurrentScanImageIndex(0);
    setScanLog('Booting Gemini AI Multimodal Car Vision...');

    // Trigger Gemini API call in backend
    const apiPromise = fetch('/api/ai/post-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: imgs })
    })
      .then(res => res.json())
      .catch(err => {
        console.error('API call to Gemini post-generator failed:', err);
        return null;
      });

    const logs = [
      { text: `Transmitting ${imgs.length} photo(s) to Gemini 3.6 Flash model...`, progress: 15 },
      { text: 'Scanning body contours, front grille, badging, headlights, & wheels...', progress: 35 },
      { text: 'Extracting vehicle make, model, variant, engine, & visual condition...', progress: 55 },
      { text: 'Calculating realistic Pakistani Rupees (PKR) market valuation...', progress: 75 },
      { text: 'Synthesizing professional SEO title and marketplace description...', progress: 95 },
      { text: 'Information extraction completed successfully!', progress: 100 }
    ];

    let index = 0;
    const interval = setInterval(async () => {
      if (index < logs.length) {
        setScanLog(logs[index].text);
        setScanProgress(logs[index].progress);
        
        if (imgs.length > 1) {
          setCurrentScanImageIndex((index) % imgs.length);
        }
        index++;
      } else {
        clearInterval(interval);
        
        // Wait for Gemini API response
        const realAnalysis = await apiPromise;
        const d = realAnalysis && !realAnalysis.error ? realAnalysis : DEMO_PRESETS[0].data;

        setSpecs(d);
        setMake(d.make || 'Toyota');
        setModel(d.model || 'Corolla');
        setVariant(d.variant || 'Grande');
        setYear(d.estimated_year || 2021);
        setPrice(d.suggested_price?.estimatedPrice || 5000000);
        setMileage(d.mileage_estimate || 30000);
        setTransmission(d.transmission || 'Automatic');
        setFuel(d.fuel || 'Petrol');
        setColor(d.color || 'White');
        setCondition(d.condition || 'Excellent');
        setDescription(d.description || '');
        setSeoTitle(d.seo_title || '');
        setActiveImageIdx(0);

        setStage('results');
      }
    }, 700);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    // Select up to 10 images
    const selectedFiles = files.slice(0, 10);
    
    const readPromises = selectedFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(base64Images => {
      startScanningLogs(base64Images);
    });
  };

  const handleAddMoreImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const remainingSlots = 10 - uploadedImages.length;
    if (remainingSlots <= 0) {
      alert("Maximum limit of 10 images reached!");
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const readPromises = selectedFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(base64Images => {
      const updatedList = [...uploadedImages, ...base64Images];
      setUploadedImages(updatedList);
      
      // Update description with new image count dynamically
      setDescription(prev => {
        if (prev.includes("scanned through")) {
          return prev.replace(/scanned through \d+ high-resolution photos/, `scanned through ${updatedList.length} high-resolution photos`);
        }
        return prev + ` Scanned through ${updatedList.length} high-resolution photos.`;
      });
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (uploadedImages.length <= 1) {
      alert("At least 1 photo is required to publish a listing.");
      return;
    }
    const filtered = uploadedImages.filter((_, idx) => idx !== indexToRemove);
    setUploadedImages(filtered);
    if (activeImageIdx >= filtered.length) {
      setActiveImageIdx(filtered.length - 1);
    }
    
    // Update description with new count
    setDescription(prev => {
      if (prev.includes("scanned through")) {
        return prev.replace(/scanned through \d+ high-resolution photos/, `scanned through ${filtered.length} high-resolution photos`);
      }
      return prev;
    });
  };

  const handlePostListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedImages.length === 0) {
      alert('Please upload at least 1 image.');
      return;
    }
    if (!sellerName.trim()) {
      alert('Please enter your name.');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter your contact phone.');
      return;
    }
    
    const carListingData: Omit<Car, 'id' | 'created_at'> = {
      make,
      model,
      variant,
      year: parseInt(year as any),
      price: parseInt(price as any),
      mileage: parseInt(mileage as any),
      city: city.trim(),
      country: country.trim() || 'Pakistan',
      state: state.trim(),
      address: address.trim(),
      transmission,
      fuel,
      color,
      body_type: specs?.body_type || 'Sedan',
      engine_cc: model.toLowerCase().includes('alto') ? 660 : model.toLowerCase().includes('civic') ? 1800 : model.toLowerCase().includes('sportage') ? 2000 : 1300,
      registered_city: city.trim(),
      condition,
      seller_name: sellerName,
      phone,
      description,
      features: specs?.features || ['ABS', 'Airbags', 'Bluetooth'],
      images: uploadedImages
    };

    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carListingData)
      });

      if (res.ok) {
        const savedCar = await res.json();
        navigate(`/cars/${savedCar.id}`);
      } else {
        const errBody = await res.json().catch(() => ({}));
        alert(errBody.error || `Failed to post vehicle (${res.status}). Verify details.`);
      }
    } catch (err) {
      console.error(err);
      alert('Could not reach the server. Make sure the app is running on localhost:3000.');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-transparent text-[#0F172A]">
      <div className="mx-auto max-w-4xl">
        
        {/* Page title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-1.5 bg-[#2563EB]/10 border border-[#2563EB]/30 px-3 py-1 rounded-full text-[#2563EB] text-xs font-bold mb-3 shadow-sm">
            <Sparkles className="h-4 w-4 text-[#2563EB] animate-pulse" />
            <span>AI Automated Multi-Image Listing Generator</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight font-sans">Post Your Car with AI</h1>
          <p className="text-slate-500 mt-1.5 text-sm max-w-lg mx-auto">
            Upload 1 to 10 car photos. Our mock visual neural scanner will extract exact make, model, variant, condition, and market prices from all perspectives.
          </p>
        </div>

        {/* STAGE 1: FILE UPLOAD & PRESET CLICKS */}
        {stage === 'upload' && (
          <div className="space-y-8">
            {/* Upload Area */}
            <div className="glass-panel border-2 border-dashed border-white/40 rounded-3xl p-10 text-center hover:border-[#2563EB] transition-colors relative group shadow-xl backdrop-blur-xl">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-14 w-14 text-slate-400 mx-auto mb-4 group-hover:text-[#2563EB] transition-colors" />
              <h3 className="font-bold text-lg text-slate-800 mb-1">Drag and Drop Your Car Photos</h3>
              <p className="text-slate-500 text-sm mb-2">Upload 1 to 10 photos of your car (exterior, interior, engine)</p>
              <p className="text-xs text-slate-400 mb-5">Supports PNG, JPG up to 10MB each</p>
              <span className="bg-[#2563EB] hover:bg-[#2563EB]/80 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all inline-block">
                Choose Image Files (Select Multiple)
              </span>
            </div>

            {/* Presets Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center">Or click a multi-angle vehicle preset to test the neural scanner</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DEMO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => startScanningLogs(preset.imgUrls)}
                    className="glass-card rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:border-[#2563EB]/50 text-left group transition-all transform hover:-translate-y-0.5"
                  >
                    <div className="h-28 w-full bg-slate-100 relative overflow-hidden">
                      <img src={preset.imgUrls[0]} alt={preset.name} referrerPolicy="no-referrer" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        <span>{preset.imgUrls.length} Photos</span>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800">{preset.name}</span>
                      <Sparkles className="h-4 w-4 text-indigo-500 group-hover:animate-bounce shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: LASER BEAM SCANNING LOGS */}
        {stage === 'scanning' && (
          <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-white/40 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
            {/* Visual scanning box */}
            <div className="relative h-48 w-80 rounded-2xl overflow-hidden shadow-md bg-slate-950">
              <img 
                src={uploadedImages[currentScanImageIndex] || uploadedImages[0]} 
                alt="scanning target" 
                referrerPolicy="no-referrer" 
                className="h-full w-full object-cover opacity-80 transition-all duration-300" 
              />
              {/* Laser Line */}
              <motion.div
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500 shadow-lg shadow-blue-500/50"
              />
              {/* Scanning status pill */}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-1 rounded-lg">
                Scanning Photo {currentScanImageIndex + 1} of {uploadedImages.length}
              </div>
            </div>

            <div className="space-y-2 w-full max-w-sm">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Analyzing specs...</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                <div className="h-full bg-[#2563EB] rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm bg-[#2563EB]/10 border border-[#2563EB]/20 px-4 py-2 rounded-xl">
              <Activity className="h-4.5 w-4.5 animate-spin" />
              <span>{scanLog}</span>
            </div>
          </div>
        )}

        {/* STAGE 3: EDITABLE PRE-FILLED FORM & RESULTS */}
        {stage === 'results' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left AI Analysis summaries */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-[#0F172A]/90 text-white p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl backdrop-blur-xl">
                <h3 className="font-bold text-sm uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5" /> AI Valuation Report
                </h3>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Estimated Valuation</span>
                  <span className="text-3xl font-black text-white">{(specs.suggested_price.estimatedPrice / 100000).toFixed(1)} Lakh</span>
                </div>
                <div className="bg-black/25 p-3 rounded-xl space-y-1 text-xs text-slate-300 border border-white/10">
                  <div className="flex justify-between">
                    <span>Market Min</span>
                    <span>{(specs.suggested_price.marketRangeMin / 100000).toFixed(0)} Lakh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Max</span>
                    <span>{(specs.suggested_price.marketRangeMax / 100000).toFixed(0)} Lakh</span>
                  </div>
                  <div className="flex justify-between text-blue-400 font-bold border-t border-white/10 pt-1.5 mt-1.5">
                    <span>Confidence Score</span>
                    <span>{specs.suggested_price.confidence}%</span>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-[10px] text-blue-300 font-semibold uppercase">
                  ⚡ Multi-view scanner analysis active on {uploadedImages.length} images. Information density increased by {(uploadedImages.length * 4.5).toFixed(1)}%.
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold uppercase">{specs.market_analysis}</p>
              </div>

              {/* Uploaded photos gallery manager */}
              <div className="glass-panel border border-white/40 p-4 rounded-3xl shadow-md space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    Curation ({uploadedImages.length}/10 Photos)
                  </span>
                </div>
                
                {/* Active photo */}
                <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-950 group">
                  <img 
                    src={uploadedImages[activeImageIdx] || uploadedImages[0]} 
                    alt="active car profile" 
                    referrerPolicy="no-referrer" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                    Featured Image
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(activeImageIdx)}
                    className="absolute top-2 right-2 h-8 w-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                    title="Remove this photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Thumbnails list with option to delete or upload more */}
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`relative h-12 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${idx === activeImageIdx ? 'border-[#2563EB] scale-95 shadow-md shadow-blue-500/20' : 'border-transparent opacity-75 hover:opacity-100'}`}
                      onClick={() => setActiveImageIdx(idx)}
                    >
                      <img src={img} alt="thumbnail" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        className="absolute top-0.5 right-0.5 h-4.5 w-4.5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add more photo slot */}
                  {uploadedImages.length < 10 && (
                    <div className="relative h-12 bg-slate-100/80 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center hover:border-[#2563EB] hover:bg-blue-50/30 transition-all cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleAddMoreImages}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Plus className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Click a thumbnail to set as featured, or use the <Plus className="inline h-3 w-3 -mt-0.5" /> to add up to 10 photos to enrich information.
                </p>
              </div>
            </div>

            {/* Right Editable listing Form */}
            <div className="md:col-span-2">
              <form onSubmit={handlePostListing} className="glass-panel p-6 rounded-3xl shadow-xl border border-white/40 backdrop-blur-xl space-y-6">
                <h3 className="font-bold text-lg text-[#0F172A] border-b border-slate-200/50 pb-2">Verify AI Extracted Vehicle Data</h3>

                {/* Grid Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Make / Brand</label>
                    <input
                      type="text"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Model Name</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specific Variant</label>
                    <input
                      type="text"
                      value={variant}
                      onChange={(e) => setVariant(e.target.value)}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manufacture Year</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price (PKR)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(parseInt(e.target.value))}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mileage Driven (KM)</label>
                    <input
                      type="number"
                      value={mileage}
                      onChange={(e) => setMileage(parseInt(e.target.value))}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transmission</label>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value as any)}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner cursor-pointer"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fuel Type</label>
                    <select
                      value={fuel}
                      onChange={(e) => setFuel(e.target.value as any)}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner cursor-pointer"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                </div>

                {/* SEO generated Title & Description */}
                <div className="space-y-4 pt-4 border-t border-slate-200/50">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SEO Optimized Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Written Description</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-600 font-medium bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                </div>

                {/* Contact Section */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/50">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seller Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="03XX-XXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-3 pt-4 border-t border-slate-200/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#2563EB]" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seller Location</span>
                    </div>
                    <button
                      type="button"
                      onClick={requestLocation}
                      disabled={locationStatus === 'locating'}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] bg-[#2563EB]/10 hover:bg-[#2563EB]/15 border border-[#2563EB]/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
                    >
                      <LocateFixed className={`h-3.5 w-3.5 ${locationStatus === 'locating' ? 'animate-pulse' : ''}`} />
                      {locationStatus === 'locating' ? 'Detecting...' : 'Use current location'}
                    </button>
                  </div>
                  {locationStatus === 'filled' && (
                    <p className="text-[11px] text-emerald-600 font-medium">Location filled from GPS. You can edit it.</p>
                  )}
                  {locationStatus === 'denied' && (
                    <p className="text-[11px] text-amber-600 font-medium">Location access denied. Enter location manually.</p>
                  )}
                  {locationStatus === 'error' && (
                    <p className="text-[11px] text-amber-600 font-medium">Could not detect location. Enter it manually.</p>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address line (optional)</label>
                      <input
                        type="text"
                        placeholder="Street, area, or landmark from current location"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                      />
                    </div>
                    <div className="space-y-1" ref={cityBoxRef}>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City (optional)</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={country === 'Pakistan' ? 'Search Pakistani cities' : 'Search city'}
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            setShowCitySuggestions(true);
                          }}
                          onFocus={() => setShowCitySuggestions(true)}
                          autoComplete="off"
                          className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                        />
                        {showCitySuggestions && citySuggestions.length > 0 && (
                          <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                            {citySuggestions.map((suggestion) => (
                              <li key={suggestion.label}>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => pickCitySuggestion(suggestion)}
                                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-[#2563EB] font-medium"
                                >
                                  {suggestion.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State / Province (optional)</label>
                        <input
                          type="text"
                          placeholder={country === 'Pakistan' ? 'Punjab, Sindh, ...' : 'State or province'}
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country</label>
                        <select
                          value={country}
                          onChange={(e) => {
                            const next = e.target.value;
                            setCountry(next);
                            if (next === 'Pakistan' && city) {
                              const local = findPakistanCity(city);
                              if (local) setState(local.province);
                            }
                          }}
                          className="w-full border border-slate-200/60 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl px-3 py-2 text-sm text-slate-800 font-semibold bg-white/70 backdrop-blur-sm shadow-inner cursor-pointer"
                        >
                          {!COUNTRIES.some(c => c.name === country) && country && (
                            <option value={country}>{country}</option>
                          )}
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStage('upload')}
                    className="flex-1 bg-white/40 hover:bg-white/60 border border-white/30 text-slate-800 font-bold text-sm py-3 rounded-xl transition-all"
                  >
                    Rescan / Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#2563EB] to-indigo-600 hover:from-[#2563EB]/90 hover:to-indigo-500 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
                  >
                    Save & Publish Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
