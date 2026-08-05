import fs from 'fs';
import path from 'path';
import { Car } from '../src/types';
import { buildScrapedCarDatabase } from './scrapedDataGenerator';

const DB_FILE = path.join(process.cwd(), 'server', 'db.json');

// Ensure directory exists
const serverDir = path.dirname(DB_FILE);
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

// Lists for deterministic seed data generation
const MAKES_MODELS_VARIANTS = [
  {
    make: 'Toyota',
    body_type: 'Sedan' as const,
    models: [
      { name: 'Corolla', variants: [{ name: 'Altis Grande 1.8', cc: 1800, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'GLi 1.3', cc: 1300, transmission: 'Manual' as const, fuel: 'Petrol' as const }, { name: 'Altis X 1.6', cc: 1600, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Camry', variants: [{ name: '2.5 Hybrid Luxury', cc: 2500, transmission: 'Automatic' as const, fuel: 'Hybrid' as const }, { name: '3.5 V6 Grand', cc: 3500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Yaris', variants: [{ name: 'Ativ X CVT 1.5', cc: 1500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'Ativ MT 1.3', cc: 1300, transmission: 'Manual' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Toyota',
    body_type: 'SUV' as const,
    models: [
      { name: 'Land Cruiser', variants: [{ name: 'LC300 ZX 3.5 V6 Turbo', cc: 3500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'LC200 VX V8 4.6', cc: 4600, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Prado', variants: [{ name: 'VX 4.0 V6', cc: 4000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'TX 2.7', cc: 2700, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Fortuner', variants: [{ name: 'Legender 2.8', cc: 2800, transmission: 'Automatic' as const, fuel: 'Diesel' as const }, { name: 'Sigma4 2.8', cc: 2800, transmission: 'Automatic' as const, fuel: 'Diesel' as const }, { name: 'V 2.7', cc: 2700, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Hilux Revo', variants: [{ name: 'Rocco 2.8 4x4', cc: 2800, transmission: 'Automatic' as const, fuel: 'Diesel' as const }, { name: 'V Automatic 2.8', cc: 2800, transmission: 'Automatic' as const, fuel: 'Diesel' as const }] }
    ]
  },
  {
    make: 'Toyota',
    body_type: 'Crossover' as const,
    models: [
      { name: 'RAV4', variants: [{ name: 'Adventure 2.5 Hybrid', cc: 2500, transmission: 'Automatic' as const, fuel: 'Hybrid' as const }, { name: 'Limited AWD 2.5', cc: 2500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Corolla Cross', variants: [{ name: '1.8 Hybrid Premium', cc: 1800, transmission: 'Automatic' as const, fuel: 'Hybrid' as const }] }
    ]
  },
  {
    make: 'Toyota',
    body_type: 'Hatchback' as const,
    models: [
      { name: 'Vitz', variants: [{ name: 'F 1.0', cc: 1000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'U 1.3', cc: 1300, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Aqua', variants: [{ name: 'S 1.5', cc: 1500, transmission: 'Automatic' as const, fuel: 'Hybrid' as const }, { name: 'G 1.5', cc: 1500, transmission: 'Automatic' as const, fuel: 'Hybrid' as const }] }
    ]
  },
  {
    make: 'Honda',
    body_type: 'Sedan' as const,
    models: [
      { name: 'Civic', variants: [{ name: 'Oriel 1.8 i-VTEC', cc: 1800, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'RS Turbo 1.5', cc: 1500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'VTi Oriel Prosmatec', cc: 1800, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'City', variants: [{ name: 'Aspire 1.5 i-VTEC', cc: 1500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: '1.2L M/T', cc: 1200, transmission: 'Manual' as const, fuel: 'Petrol' as const }, { name: '1.5L CVT', cc: 1500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Honda',
    body_type: 'Crossover' as const,
    models: [
      { name: 'Vezel', variants: [{ name: 'Hybrid Z', cc: 1500, transmission: 'Automatic' as const, fuel: 'Hybrid' as const }] }
    ]
  },
  {
    make: 'Suzuki',
    body_type: 'Hatchback' as const,
    models: [
      { name: 'Alto', variants: [{ name: 'VXL AGS', cc: 660, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'VXR', cc: 660, transmission: 'Manual' as const, fuel: 'Petrol' as const }] },
      { name: 'Cultus', variants: [{ name: 'VXL', cc: 1000, transmission: 'Manual' as const, fuel: 'Petrol' as const }, { name: 'Auto Gear Shift (AGS)', cc: 1000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Wagon R', variants: [{ name: 'VXL', cc: 1000, transmission: 'Manual' as const, fuel: 'Petrol' as const }, { name: 'VXR', cc: 1000, transmission: 'Manual' as const, fuel: 'Petrol' as const }] },
      { name: 'Swift', variants: [{ name: 'GLX CVT', cc: 1200, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'DLX Navigation', cc: 1300, transmission: 'Manual' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'KIA',
    body_type: 'SUV' as const,
    models: [
      { name: 'Sportage', variants: [{ name: 'AWD Trophy', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'FWD', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'Alpha', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'KIA',
    body_type: 'Hatchback' as const,
    models: [
      { name: 'Picanto', variants: [{ name: '1.0 AT', cc: 1000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: '1.0 MT', cc: 1000, transmission: 'Manual' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Hyundai',
    body_type: 'SUV' as const,
    models: [
      { name: 'Tucson', variants: [{ name: 'GLS Sport FWD', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'Ultimate AWD', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Hyundai',
    body_type: 'Sedan' as const,
    models: [
      { name: 'Elantra', variants: [{ name: 'GLS 2.0', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'GL 1.6', cc: 1600, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Sonata', variants: [{ name: '2.5L', cc: 2500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: '2.0L', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'MG',
    body_type: 'SUV' as const,
    models: [
      { name: 'HS', variants: [{ name: '1.5 Turbo Essence', cc: 1500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'Trophy Edition', cc: 1500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Changan',
    body_type: 'Sedan' as const,
    models: [
      { name: 'Alsvin', variants: [{ name: 'Lumiere 1.5 DCT', cc: 1500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'Comfort 1.3 MT', cc: 1300, transmission: 'Manual' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Proton',
    body_type: 'Sedan' as const,
    models: [
      { name: 'Saga', variants: [{ name: 'Ace 1.3 AT', cc: 1300, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'Standard MT', cc: 1300, transmission: 'Manual' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Alfa Romeo',
    body_type: 'Sedan' as const,
    models: [
      { name: 'Giulia', variants: [{ name: 'Veloce 2.0T', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'Quadrifoglio 2.9V6', cc: 2900, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Alfa Romeo',
    body_type: 'SUV' as const,
    models: [
      { name: 'Stelvio', variants: [{ name: 'Ti Q4 2.0T', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Tesla',
    body_type: 'Sedan' as const,
    models: [
      { name: 'Model 3', variants: [{ name: 'Long Range AWD', cc: 0, transmission: 'Automatic' as const, fuel: 'Electric' as const }, { name: 'Standard Range Plus', cc: 0, transmission: 'Automatic' as const, fuel: 'Electric' as const }] }
    ]
  },
  {
    make: 'Tesla',
    body_type: 'SUV' as const,
    models: [
      { name: 'Model Y', variants: [{ name: 'Performance Dual Motor', cc: 0, transmission: 'Automatic' as const, fuel: 'Electric' as const }] }
    ]
  },
  {
    make: 'Porsche',
    body_type: 'Sedan' as const,
    models: [
      { name: 'Taycan', variants: [{ name: '4S Battery Plus', cc: 0, transmission: 'Automatic' as const, fuel: 'Electric' as const }, { name: 'Turbo S', cc: 0, transmission: 'Automatic' as const, fuel: 'Electric' as const }] },
      { name: '911', variants: [{ name: 'Carrera S 3.0T', cc: 3000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Nissan',
    body_type: 'SUV' as const,
    models: [
      { name: 'Patrol', variants: [{ name: 'Titanium V8 5.6L', cc: 5600, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'SE V6 4.0L', cc: 4000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Land Rover',
    body_type: 'SUV' as const,
    models: [
      { name: 'Defender', variants: [{ name: '110 P400 SE', cc: 3000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Range Rover Sport', variants: [{ name: 'HSE Dynamic 3.0', cc: 3000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Ford',
    body_type: 'SUV' as const,
    models: [
      { name: 'Explorer', variants: [{ name: 'Limited 2.3 EcoBoost', cc: 2300, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'ST 3.0 V6', cc: 3000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'Mustang', variants: [{ name: '5.0 V8 GT', cc: 5000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: '2.3 EcoBoost Fastback', cc: 2300, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Lexus',
    body_type: 'Luxury' as const,
    models: [
      { name: 'LX570', variants: [{ name: '5.7 V8 Executive', cc: 5700, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'ES350', variants: [{ name: '3.5 V6 Ultra Luxury', cc: 3500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: '300h Hybrid', cc: 2500, transmission: 'Automatic' as const, fuel: 'Hybrid' as const }] }
    ]
  },
  {
    make: 'Mercedes',
    body_type: 'Luxury' as const,
    models: [
      { name: 'C-Class', variants: [{ name: 'C180 Avantgarde', cc: 1600, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: 'C200 AMG Line', cc: 1500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'G-Wagon', variants: [{ name: 'G63 AMG V8', cc: 4000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'E-Class', variants: [{ name: 'E200 Exclusive', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'BMW',
    body_type: 'Luxury' as const,
    models: [
      { name: '3 Series', variants: [{ name: '318i Exclusive', cc: 1500, transmission: 'Automatic' as const, fuel: 'Petrol' as const }, { name: '320i M Sport', cc: 2000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'M4', variants: [{ name: 'Competition Coupe', cc: 3000, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] }
    ]
  },
  {
    make: 'Audi',
    body_type: 'Luxury' as const,
    models: [
      { name: 'A4', variants: [{ name: '1.4 TFSI S-Line', cc: 1400, transmission: 'Automatic' as const, fuel: 'Petrol' as const }] },
      { name: 'e-tron', variants: [{ name: '55 quattro Electric', cc: 0, transmission: 'Automatic' as const, fuel: 'Electric' as const }] }
    ]
  }
];

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Gujranwala', 'Sialkot'];
const COLORS = ['White', 'Black', 'Silver', 'Graphite Grey', 'Royal Blue', 'Bronze', 'Red', 'Beige', 'Maroon'];
const CONDITIONS = ['Excellent' as const, 'Good' as const, 'Fair' as const, 'Need Work' as const];

const SELLER_NAMES = [
  'Muhammad Usman', 'Ahmad Ali', 'Zainab Bibi', 'Bilal Khan', 'Hamza Sheikh', 
  'Ayesha Siddiqui', 'Umer Farooq', 'Faisal Iqbal', 'Sana Malik', 'Kamran Shah', 
  'Noman Jamil', 'Sadaf Riaz', 'Haris Butt', 'Waqas Ahmed', 'Tayyaba Tariq'
];

const ALL_FEATURES = [
  'ABS', 'Airbags', 'Cruise Control', 'Push Start', 'Navigation', 'Bluetooth', 
  'Climate Control', 'Rear Camera', 'Parking Sensors', 'Leather Seats', 'Fog Lamps', 
  'Alloy Wheels', 'Sunroof', 'Traction Control', 'Keyless Entry', 'Power Windows'
];

// Helper to generate a random Pakistani mobile number
function generatePhone() {
  const codes = ['0300', '0321', '0333', '0345', '0312', '0322'];
  const code = codes[Math.floor(Math.random() * codes.length)];
  const num = Math.floor(1000000 + Math.random() * 9000000);
  return `${code}-${num}`;
}

// Generate realistic stock image URLs for cars based on exact brand and model
function getCarImages(make: string, model: string, bodyType: string): string[] {
  const m = make.toLowerCase();
  const mod = model.toLowerCase();

  if (m.includes('alfa') || m.includes('romeo')) {
    if (mod.includes('stelvio')) {
      return [
        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // Giulia
    return [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'tesla') {
    if (mod.includes('model y')) {
      return [
        'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // Model 3
    return [
      'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'porsche') {
    if (mod.includes('taycan')) {
      return [
        'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // 911
    return [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'nissan') {
    if (mod.includes('patrol')) {
      return [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'
      ];
    }
    return [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m.includes('land') || m.includes('rover')) {
    return [
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'suzuki') {
    if (mod.includes('alto')) {
      return [
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800'
      ];
    }
    if (mod.includes('swift')) {
      return [
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // Cultus or Wagon R
    return [
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'toyota') {
    if (mod.includes('land cruiser') || mod.includes('prado')) {
      return [
        'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
      ];
    }
    if (mod.includes('fortuner')) {
      return [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'
      ];
    }
    if (mod.includes('hilux') || mod.includes('revo')) {
      return [
        'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
      ];
    }
    if (mod.includes('rav4') || mod.includes('cross')) {
      return [
        'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
      ];
    }
    if (mod.includes('camry')) {
      return [
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800'
      ];
    }
    if (mod.includes('corolla')) {
      return [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800'
      ];
    }
    if (mod.includes('yaris')) {
      return [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // Vitz / Aqua
    return [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'honda') {
    if (mod.includes('civic')) {
      return [
        'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800'
      ];
    }
    if (mod.includes('vezel')) {
      return [
        'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // City
    return [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'kia') {
    if (mod.includes('picanto')) {
      return [
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // Sportage
    return [
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'hyundai') {
    if (mod.includes('tucson')) {
      return [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // Elantra / Sonata
    return [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'mg') {
    return [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'changan' || m === 'proton') {
    return [
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'mercedes') {
    if (mod.includes('g-wagon')) {
      return [
        'https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'
      ];
    }
    return [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'bmw') {
    if (mod.includes('m4')) {
      return [
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1555219507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'
      ];
    }
    return [
      'https://images.unsplash.com/photo-1555219507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'ford') {
    if (mod.includes('mustang')) {
      return [
        'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // Explorer / SUV
    return [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'lexus') {
    if (mod.includes('lx570')) {
      return [
        'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
      ];
    }
    // ES350
    return [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800'
    ];
  }

  if (m === 'audi') {
    if (mod.includes('e-tron')) {
      return [
        'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1555219507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'
      ];
    }
    return [
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1555219507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'
    ];
  }

  return [
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=800'
  ];
}

// Deterministic random generator for reproducible seeding
class SeedRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/** Seed DB from local scraped listings only (clears synthetic/old inventory). */
function seedFromScrapedData(): Car[] {
  return buildScrapedCarDatabase() as Car[];
}

// Memory database storage with file backup
class Database {
  private cars: Car[] = [];
  
  constructor() {
    this.load();
  }
  
  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        this.cars = JSON.parse(data);
        console.log(`Database loaded with ${this.cars.length} cars from file.`);
      } else {
        console.log('Database file not found, seeding from scraped data...');
        this.cars = seedFromScrapedData();
        this.save();
        console.log(`Database seeded with ${this.cars.length} cars.`);
      }
    } catch (err) {
      console.error('Error loading database, generating in-memory seed...', err);
      this.cars = seedFromScrapedData();
    }
  }

  /** Wipe inventory and re-import scraped cars + local images. */
  public reimportScrapedCars(): Car[] {
    this.cars = seedFromScrapedData();
    this.save();
    console.log(`Database reimported with ${this.cars.length} scraped cars.`);
    return this.cars;
  }
  
  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cars, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file', err);
    }
  }
  
  public getCars(): Car[] {
    return this.cars;
  }
  
  public getCarById(id: number): Car | undefined {
    return this.cars.find(c => c.id === id);
  }
  
  public createCar(carData: Omit<Car, 'id' | 'created_at'>): Car {
    const nextId = this.cars.length > 0 ? Math.max(...this.cars.map(c => c.id)) + 1 : 1;
    const newCar: Car = {
      ...carData,
      id: nextId,
      created_at: new Date().toISOString()
    };
    this.cars.unshift(newCar); // Add new listings at the top
    this.save();
    return newCar;
  }
  
  public updateCar(id: number, carData: Partial<Car>): Car | undefined {
    const carIndex = this.cars.findIndex(c => c.id === id);
    if (carIndex === -1) return undefined;
    
    this.cars[carIndex] = {
      ...this.cars[carIndex],
      ...carData,
      id // Ensure ID cannot be changed
    };
    this.save();
    return this.cars[carIndex];
  }
  
  public deleteCar(id: number): boolean {
    const initialLength = this.cars.length;
    this.cars = this.cars.filter(c => c.id !== id);
    if (this.cars.length < initialLength) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new Database();
