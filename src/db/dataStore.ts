import * as fs from 'fs';
import * as path from 'path';
import { User, Product, Category, Review, Coupon, Order, AppNotification, Newsletter } from '../types';
import { saveCollectionToMongo } from '../../backend/config/mongodb';


// Seed Categories
const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat_1',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    description: 'High-end smart components, gadgets, and computers.'
  },
  {
    id: 'cat_2',
    name: 'Fashion & Apparel',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
    description: 'Elevated everyday wear, outerwear, and modern accessories.'
  },
  {
    id: 'cat_3',
    name: 'Home & Living',
    slug: 'home-living',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    description: 'Curated home goods, kitchenware, and modern accessories.'
  },
  {
    id: 'cat_4',
    name: 'Beauty & Health',
    slug: 'beauty',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    description: 'Organic skincare, self-care routines, and fragrances.'
  },
  {
    id: 'cat_5',
    name: 'Sports & Outdoors',
    slug: 'sports',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
    description: 'Performance gear, outdoor accessories, and tracking equipment.'
  }
];

// Seed Products
const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'AcousticMax Noise Cancelling Headphones',
    slug: 'acousticmax-headphones',
    description: 'Industry-leading adaptive active noise cancelling with premium sound staging.',
    richDescription: 'Experience audio like never before. The AcousticMax features active noise cancelling (ANC) that adapts in real-time to your surroundings. With dual custom 40mm elements, it offers rich lows and extended crystal treble. Enjoy up to 40 hours of continuous wireless playback on a single charge.',
    price: 349.99,
    discountPrice: 299.99,
    rating: 4.8,
    reviewsCount: 3,
    category: 'electronics',
    brand: 'AcousticLabs',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 24,
    weight: 0.35,
    lowStockThreshold: 5,
    variants: [
      { 
        name: 'Color', 
        options: ['Obsidian Black', 'Titanium Silver', 'Midnight Navy'],
        images: {
          'Obsidian Black': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
          'Titanium Silver': ['https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'],
          'Midnight Navy': ['https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80']
        }
      }
    ],
    inventory: {
      'Color:Obsidian Black': 8,
      'Color:Titanium Silver': 10,
      'Color:Midnight Navy': 6
    },
    specifications: [
      { label: 'Battery Life', value: 'Up to 40 Hours' },
      { label: 'Bluetooth Version', value: '5.2' },
      { label: 'Driver Size', value: '40 mm' },
      { label: 'Charging Type', value: 'USB-C Fast Charge' }
    ],
    isFeatured: true,
    isBestSeller: true
  },
  {
    id: 'prod_2',
    name: 'ApexBook 14" Developer Ultrabook',
    slug: 'apexbook-14-ultrabook',
    description: 'Powerhouse machine designed for compiler speed, heavy containers, and bright outdoor coding.',
    richDescription: 'The ApexBook sets a new benchmark for premium development on-the-go. Packed with a high-performance chipset, 32GB of high-speed unified RAM, and a bright 14-inch HDR display operating at 120Hz. Designed silently with a magnesium alloy body and responsive tactile keys.',
    price: 1899.99,
    rating: 4.9,
    reviewsCount: 1,
    category: 'electronics',
    brand: 'ApexSys',
    images: [
      'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 12,
    weight: 1.24,
    lowStockThreshold: 3,
    variants: [
      { name: 'RAM', options: ['16GB Unified', '32GB Unified'] },
      { name: 'Storage', options: ['512GB NVMe', '1TB NVMe'] }
    ],
    inventory: {
      'RAM:16GB Unified|Storage:512GB NVMe': 4,
      'RAM:16GB Unified|Storage:1TB NVMe': 2,
      'RAM:32GB Unified|Storage:512GB NVMe': 3,
      'RAM:32GB Unified|Storage:1TB NVMe': 3
    },
    specifications: [
      { label: 'Processor', value: 'ApexCore v3 (8 Cores)' },
      { label: 'Screen Resolution', value: '3024 x 1964' },
      { label: 'Weight', value: '1.24 kg' },
      { label: 'Battery Capacity', value: '72 Wh' }
    ],
    isFeatured: true,
    isNewArrival: true
  },
  {
    id: 'prod_3',
    name: 'Metropulse Sport Smart Watch',
    slug: 'metropulse-smart-watch',
    description: 'Real-time physiological tracking, offline maps, and deep hydration diagnostics.',
    richDescription: 'Strap on the future of absolute training metrics. METROPULSE logs active biometric streams including SpO2, continuous cardiovascular drift, body heat variation, and smart running tracks with dual-band precise GNSS routing.',
    price: 249.90,
    discountPrice: 199.00,
    rating: 4.5,
    reviewsCount: 2,
    category: 'electronics',
    brand: 'Metropulse',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 45,
    weight: 0.05,
    lowStockThreshold: 10,
    variants: [
      { 
        name: 'Band Style', 
        options: ['Sport Breathable Silicone', 'Woven Cordura Strap'],
        images: {
          'Sport Breathable Silicone': ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
          'Woven Cordura Strap': ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=80']
        }
      }
    ],
    inventory: {
      'Band Style:Sport Breathable Silicone': 25,
      'Band Style:Woven Cordura Strap': 20
    },
    specifications: [
      { label: 'Water Proofing', value: '5 ATM (50m)' },
      { label: 'Display Type', value: 'AO-LED Touch' },
      { label: 'NFC Features', value: 'ModernPay Supported' }
    ],
    isBestSeller: true
  },
  {
    id: 'prod_4',
    name: 'Structured Trench Overcoat',
    slug: 'structured-trench-overcoat',
    description: 'Water-resistant tailoring, deep split-hem rear, and dual organic horn buttons.',
    richDescription: 'Stay sharp. Our classic trench delivers structured drape with wind-blocking technical twill. Features storm flap overlays, broad lapels, deep dual exterior welt pockets, and internally bound clean seams.',
    price: 189.00,
    rating: 4.6,
    reviewsCount: 1,
    category: 'fashion',
    brand: 'NordenTailors',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 18,
    weight: 1.2,
    lowStockThreshold: 5,
    variants: [
      { name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] },
      { 
        name: 'Color', 
        options: ['Camel', 'Midnight Sage', 'Charcoal'],
        images: {
          'Camel': ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80'],
          'Midnight Sage': ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80'],
          'Charcoal': ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80']
        }
      }
    ],
    inventory: {
      'Size:XS|Color:Camel': 2,
      'Size:XS|Color:Midnight Sage': 1,
      'Size:XS|Color:Charcoal': 1,
      'Size:S|Color:Camel': 3,
      'Size:S|Color:Midnight Sage': 2,
      'Size:S|Color:Charcoal': 2,
      'Size:M|Color:Camel': 4,
      'Size:M|Color:Midnight Sage': 3,
      'Size:M|Color:Charcoal': 3,
      'Size:L|Color:Camel': 3,
      'Size:L|Color:Midnight Sage': 2,
      'Size:L|Color:Charcoal': 2,
      'Size:XL|Color:Camel': 2,
      'Size:XL|Color:Midnight Sage': 1,
      'Size:XL|Color:Charcoal': 1
    },
    specifications: [
      { label: 'Fabric Composition', value: '70% Cotton Twill, 30% Polyamide' },
      { label: 'Washing Instructions', value: 'Dry Clean Recommended' },
      { label: 'Fit Profile', value: 'Classic Relaxed Drape' }
    ],
    isNewArrival: true
  },
  {
    id: 'prod_5',
    name: 'Minimalist Artisan Suede Chelsea Boots',
    slug: 'artisan-suede-chelsea-boots',
    description: 'Handcrafted premium calf suede with crepe outer rings and custom fit web elastic.',
    richDescription: 'An indispensable style icon, standard for any transitional wardrobe. Handcrafted in a Tuscan family facility. Each pair features supple calf interior linings, stitched welts, and premium spring-back pull tabs.',
    price: 210.00,
    rating: 4.7,
    reviewsCount: 1,
    category: 'fashion',
    brand: 'NordenTailors',
    images: [
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 15,
    weight: 0.8,
    lowStockThreshold: 3,
    variants: [
      { name: 'US Men Size', options: ['8', '9', '10', '11', '12'] }
    ],
    inventory: {
      'US Men Size:8': 2,
      'US Men Size:9': 3,
      'US Men Size:10': 4,
      'US Men Size:11': 3,
      'US Men Size:12': 3
    },
    specifications: [
      { label: 'Upper Layer', value: 'Premium Italian Calf Suede' },
      { label: 'Sole Core', value: 'Flexible Natural Crepe Rubber' },
      { label: 'Production Origin', value: 'Montelupo, Italy' }
    ],
    isFeatured: true
  },
  {
    id: 'prod_6',
    name: 'Double-Weave Organic Everyday Hoodie',
    slug: 'organic-everyday-hoodie',
    description: 'Heavyweight organic French terry designed for a boxy vintage drape.',
    richDescription: 'Crafted with premium high-density 460 GSM organic long-staple cotton French terry. Features a double-lined hood, seamless double needle cuffs, and direct garment dye for a beautifully softened wash texture.',
    price: 85.00,
    discountPrice: 65.00,
    rating: 4.4,
    reviewsCount: 2,
    category: 'fashion',
    brand: 'BasicsLab',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 35,
    weight: 0.5,
    lowStockThreshold: 8,
    variants: [
      { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
      { 
        name: 'Wash Color', 
        options: ['Vintage Ash', 'Mineral Sage', 'Oatmeal Milk'],
        images: {
          'Vintage Ash': ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80'],
          'Mineral Sage': ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80'],
          'Oatmeal Milk': ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80']
        }
      }
    ],
    inventory: {
      'Size:S|Wash Color:Vintage Ash': 3,
      'Size:S|Wash Color:Mineral Sage': 2,
      'Size:S|Wash Color:Oatmeal Milk': 2,
      'Size:M|Wash Color:Vintage Ash': 4,
      'Size:M|Wash Color:Mineral Sage': 3,
      'Size:M|Wash Color:Oatmeal Milk': 3,
      'Size:L|Wash Color:Vintage Ash': 3,
      'Size:L|Wash Color:Mineral Sage': 3,
      'Size:L|Wash Color:Oatmeal Milk': 2,
      'Size:XL|Wash Color:Vintage Ash': 2,
      'Size:XL|Wash Color:Mineral Sage': 2,
      'Size:XL|Wash Color:Oatmeal Milk': 2
    },
    specifications: [
      { label: 'Fabric Density', value: '460 GSM Heavy Knit' },
      { label: 'Material', value: '100% GOTS Certified Organic Cotton' },
      { label: 'Fit Profile', value: 'Drop Shoulder Vintage Box' }
    ],
    isBestSeller: true
  },
  {
    id: 'prod_7',
    name: 'Foliage Hydro-Grow Smart Planter',
    slug: 'foliage-hydro-grow-planter',
    description: 'App-enabled aeroponic smart planter with dynamic full-spectrum LED loops.',
    richDescription: 'Cultivate rare organic herbs, edible florals, and microgreens fully indoors. Our smart sensor loops continuously optimize watering rates, liquid mineral schedules, and active photo-cycles.',
    price: 159.00,
    rating: 4.3,
    reviewsCount: 1,
    category: 'home-living',
    brand: 'FoliageSmart',
    images: [
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 19,
    weight: 2.5,
    lowStockThreshold: 5,
    variants: [
      { 
        name: 'Base Cover', 
        options: ['Classic Matte Chalk', 'Natural Terracotta Face'],
        images: {
          'Classic Matte Chalk': ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80'],
          'Natural Terracotta Face': ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80']
        }
      }
    ],
    inventory: {
      'Base Cover:Classic Matte Chalk': 10,
      'Base Cover:Natural Terracotta Face': 9
    },
    specifications: [
      { label: 'Water Reservoir', value: '2.4 Liters' },
      { label: 'LED Light Grid', value: '24W Low-Draw Full-Spectrum' },
      { label: 'Smart Connection', value: 'Wi-Fi BLE Hybrid' }
    ],
    isNewArrival: true
  },
  {
    id: 'prod_8',
    name: 'Aura Solid Stone Mortar & Pestle',
    slug: 'aura-solid-stone-mortar',
    description: 'Chiseled robust black granite with unpolished textured interiors for ideal grip friction.',
    richDescription: 'Hand-carved out of a singular dense volume of volcanic basalt black granite. The heavy 3.4kg mass easily fractures tough spices, garlic bulbs, dry chilies, or raw herbs with very little hand strain.',
    price: 49.00,
    rating: 4.9,
    reviewsCount: 1,
    category: 'home-living',
    brand: 'AuraSolid',
    images: [
      'https://images.unsplash.com/photo-1616644101199-c994d4faf6aa?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 40,
    weight: 3.4,
    lowStockThreshold: 8,
    variants: [],
    inventory: {},
    specifications: [
      { label: 'Weight', value: '3.4 kg' },
      { label: 'Diameter', value: '16 cm' },
      { label: 'Material Integrity', value: '100% Volcanic Dark Granite' }
    ],
    isFeatured: true
  },
  {
    id: 'prod_9',
    name: 'Purifying Botanical Hydration Serum',
    slug: 'purifying-botanical-serum',
    description: 'Multi-weight Hyaluronic complex with pure Bakuchiol and calming organic Tea Tree.',
    richDescription: 'Reset your skin structure overnight. This ultra-light balancing serum combines natural Bakuchiol—a stable retinol alternative—with barrier-restoring niacinamide, calming sea botanicals, and deep plant-based hydration layers.',
    price: 54.00,
    discountPrice: 45.00,
    rating: 4.8,
    reviewsCount: 1,
    category: 'beauty',
    brand: 'PurBotanics',
    images: [
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608248597481-496100c8c836?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 50,
    weight: 0.1,
    lowStockThreshold: 12,
    variants: [
      { name: 'Bottle Size', options: ['30 ml Standard', '50 ml Travel Pack'] }
    ],
    inventory: {
      'Bottle Size:30 ml Standard': 30,
      'Bottle Size:50 ml Travel Pack': 20
    },
    specifications: [
      { label: 'pH Rating', value: '5.5 Balanced Skin Care' },
      { label: 'Free Of', value: 'Parabens, Synthetic Scent, Phthalates' },
      { label: 'Ethical Core', value: 'Cruelty-Free, Vegan, Carbon Neutral' }
    ],
    isBestSeller: true
  },
  {
    id: 'prod_10',
    name: 'Superionic Salon Hair Dryer',
    slug: 'superionic-hair-dryer',
    description: 'Brushless smart digital motor emitting 50M negative ions for glossy styling.',
    richDescription: 'Tame frizz and dry long volume in absolute safety. The Superionic measures air-outflow temperature 40 times per second to prevent high thermic cuticle stress, while maintaining rapid 110k RPM high-volume drying.',
    price: 199.00,
    rating: 4.7,
    reviewsCount: 1,
    category: 'beauty',
    brand: 'AcousticLabs',
    images: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 22,
    weight: 0.6,
    lowStockThreshold: 5,
    variants: [
      { 
        name: 'Color Accent', 
        options: ['Iron Burgundy', 'White Copper Quartz'],
        images: {
          'Iron Burgundy': ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'],
          'White Copper Quartz': ['https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=800&q=80']
        }
      }
    ],
    inventory: {
      'Color Accent:Iron Burgundy': 12,
      'Color Accent:White Copper Quartz': 10
    },
    specifications: [
      { label: 'Motor Speed', value: '110,000 RPM' },
      { label: 'Ionic Output', value: '50 Million Negative Ions/cm³' },
      { label: 'Rated Power', value: '1600 Watts' }
    ],
    isFeatured: true
  },
  {
    id: 'prod_11',
    name: 'IronCore Smart Cast Dumbbells',
    slug: 'ironcore-cast-dumbbells',
    description: 'Stitched tactile anti-roll hexagonal cast dumbbells with smart training tag sync.',
    richDescription: 'Perfect hexagonal weights for stable ground balances and overhead movements. Coated in continuous vulcanized premium rubber to absorb active drop noise and shield home flooring from impact cracking.',
    price: 120.00,
    discountPrice: 99.00,
    rating: 4.6,
    reviewsCount: 1,
    category: 'sports',
    brand: 'IronCore',
    images: [
      'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 15,
    weight: 10,
    lowStockThreshold: 3,
    variants: [
      { name: 'Weight Pair', options: ['10 lbs Pair', '20 lbs Pair', '30 lbs Pair'] }
    ],
    inventory: {
      'Weight Pair:10 lbs Pair': 5,
      'Weight Pair:20 lbs Pair': 5,
      'Weight Pair:30 lbs Pair': 5
    },
    specifications: [
      { label: 'Core Material', value: 'Solid Grey Cast Iron' },
      { label: 'Outlayer Wrap', value: 'High-Density Virgin Rubber' },
      { label: 'Grip Profile', value: 'Knurled Non-Slip Textured Stainless' }
    ],
    isBestSeller: true
  },
  {
    id: 'prod_12',
    name: 'Ascent Dry-Shield Pro Backpack',
    slug: 'ascent-dry-shield-backpack',
    description: 'Fully seam-welded waterproof dry backpack with integrated utility webbing rails.',
    richDescription: 'Designed for deep back-country climbs, rainy commutes, and wild river crossings. The Ascent features dual air-flow contoured cushions, multi-layer roll-top clips, responsive magnetic sternum sliders, and secret passport shells.',
    price: 145.00,
    rating: 4.8,
    reviewsCount: 1,
    category: 'sports',
    brand: 'IronCore',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 25,
    weight: 0.92,
    lowStockThreshold: 6,
    variants: [
      { 
        name: 'Volume Capacity', 
        options: ['28 Liters (Standard)', '38 Liters (Extended Travel)'],
        images: {
          '28 Liters (Standard)': ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'],
          '38 Liters (Extended Travel)': ['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80']
        }
      }
    ],
    inventory: {
      'Volume Capacity:28 Liters (Standard)': 15,
      'Volume Capacity:38 Liters (Extended Travel)': 10
    },
    specifications: [
      { label: 'Rating Waterproof', value: 'IPX-6 Submersible Splash' },
      { label: 'Casing Material', value: '420D TPU Double-Coated Nylon Ripstop' },
      { label: 'Weight Empty', value: '920 grams' }
    ],
    isNewArrival: true
  }
];

// Seed Reviews
const SEED_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    productId: 'prod_1',
    userName: 'David Miller',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    comment: 'The noise cancellation is absolutely magical. I wear these at the coffee shop and everything disappears. Highly recommended for remote developers!',
    date: '2026-05-15T08:30:00Z',
    approved: true
  },
  {
    id: 'rev_2',
    productId: 'prod_1',
    userName: 'Samantha Lin',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    rating: 4,
    comment: 'Very comfortable for long wears, the build feel is premium. Sound staging is rich, though the bass is slightly heavier than flat response headphones.',
    date: '2026-05-20T14:15:00Z',
    approved: true
  },
  {
    id: 'rev_3',
    productId: 'prod_1',
    userName: 'Marcus Aurelius',
    rating: 5,
    comment: 'Stunning. The battery feels near infinite. Easily went through three full flights and workdays without needing a single charge.',
    date: '2026-05-28T10:00:00Z',
    approved: true
  },
  {
    id: 'rev_4',
    productId: 'prod_2',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    comment: 'Compiles huge codebases so fast without throttling. The keyboard is incredibly comfortable for code authoring.',
    date: '2026-05-10T12:00:00Z',
    approved: true
  },
  {
    id: 'rev_5',
    productId: 'prod_3',
    userName: 'Liam Fletcher',
    rating: 4,
    comment: 'GPS connects super quickly. Body battery diagnostics are very helpful during strenuous interval trail sessions.',
    date: '2026-05-22T11:45:00Z',
    approved: true
  },
  {
    id: 'rev_6',
    productId: 'prod_3',
    userName: 'Jessica Green',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    comment: 'Sleek, lightweight, and tracks everything. The display remains easily visible during direct mid-day overhead sun.',
    date: '2026-05-29T09:20:00Z',
    approved: true
  },
  {
    id: 'rev_7',
    productId: 'prod_4',
    userName: 'Thomas Vance',
    rating: 5,
    comment: 'Fits completely true to size. High-quality stitching that protects perfectly from wet elements.',
    date: '2026-05-18T16:40:00Z',
    approved: true
  },
  {
    id: 'rev_8',
    productId: 'prod_5',
    userName: 'Nolan Taylor',
    rating: 5,
    comment: 'Gorgeous suede finish. They breaking in within 2 days and are comfortably soft to stand in. Outstanding boot build.',
    date: '2026-05-25T15:00:00Z',
    approved: true
  },
  {
    id: 'rev_9',
    productId: 'prod_6',
    userName: 'Zoe Kravitz',
    rating: 4,
    comment: 'Very thick. Boxy profile matches nicely with standard slim fatigue pants. Definitely fits vintage aesthetic.',
    date: '2026-05-01T21:00:00Z',
    approved: true
  },
  {
    id: 'rev_10',
    productId: 'prod_6',
    userName: 'Ethan Hunt',
    rating: 5,
    comment: 'Luxurious heavy feel. Washes extremely well without losing sleeve shape. Will be picking up another tone.',
    date: '2026-05-12T07:10:00Z',
    approved: true
  },
  {
    id: 'rev_11',
    productId: 'prod_7',
    userName: 'Sophia Martinez',
    rating: 4,
    comment: 'Hydroponics work perfectly. Basil sprouted in just four days! Knocked one star down because water sensor beeped loudly at 3am.',
    date: '2026-05-27T03:45:00Z',
    approved: true
  },
  {
    id: 'rev_12',
    productId: 'prod_8',
    userName: 'Marco Pierre',
    rating: 5,
    comment: 'Industrial quality. The weight holds securely in place on the kitchen counter while grinding coriander and whole peppercorns.',
    date: '2026-05-19T23:50:00Z',
    approved: true
  },
  {
    id: 'rev_13',
    productId: 'prod_9',
    userName: 'Elena Rostova',
    rating: 5,
    comment: 'Niacinamide keeps irritation completely down while bakuchiol works its fine line magic. My skin looks glassy!',
    date: '2026-05-24T18:12:00Z',
    approved: true
  },
  {
    id: 'rev_14',
    productId: 'prod_10',
    userName: 'Clara Oswald',
    rating: 5,
    comment: 'Super fast drying action. Brushless digital motor is surprisingly quiet and weighs next to nothing.',
    date: '2026-05-14T10:45:00Z',
    approved: true
  },
  {
    id: 'rev_15',
    productId: 'prod_11',
    userName: 'Arnold S.',
    rating: 5,
    comment: 'Robust weights. Hand-knurling grip is solid. Rubber hex means I can drop them safely between fatigue reps.',
    date: '2026-05-08T06:05:00Z',
    approved: true
  },
  {
    id: 'rev_16',
    productId: 'prod_12',
    userName: 'Danielle Croft',
    rating: 5,
    comment: 'Submerged it accidentally in a creek crossing during a heavy storm. Not a single microscopic droplet entered. Truly dry.',
    date: '2026-05-11T13:22:00Z',
    approved: true
  }
];

// Seed Coupons
const SEED_COUPONS: Coupon[] = [
  { code: 'FLASH20', type: 'percentage', value: 20, expiryDate: '2027-12-31T23:59:59Z', usedCount: 0 },
  { code: 'WELCOME10', type: 'percentage', value: 10, expiryDate: '2027-12-31T23:59:59Z', usedCount: 0 },
  { code: 'SAVE50', type: 'fixed', value: 50, expiryDate: '2027-12-31T23:59:59Z', minPurchase: 200, usedCount: 0 }
];

// Seed Users
const SEED_USERS: User[] = [
  {
    id: 'user_admin',
    name: 'System Admin',
    email: 'admin@modernshop.com',
    phone: '+12223334444',
    passwordHash: '$2b$10$xyzADMINhashed_this_is_mock_pw_hashed_admin123', // simulated hash for "admin123"
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    addresses: [
      { id: 'addr_1', street: '1 Infinite Loop', city: 'Cupertino', state: 'CA', zipCode: '95014', country: 'United States', isDefault: true }
    ],
    loyaltyPoints: 500,
    referralCode: 'MSADMIN'
  },
  {
    id: 'user_cust',
    name: 'John Doe',
    email: 'customer@modernshop.com',
    phone: '+15556667777',
    passwordHash: '$2b$10$xyzCUSThashed_this_is_mock_pw_hashed_customer123', // simulated hash for "customer123"
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    addresses: [
      { id: 'addr_2', street: '1600 Amphitheatre Parkway', city: 'Mountain View', state: 'CA', zipCode: '94043', country: 'United States', isDefault: true }
    ],
    loyaltyPoints: 120,
    referralCode: 'MSCUSTOMER'
  }
];

// Seed Notifications
const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'not_1',
    userId: 'all',
    title: 'Welcome to ModernShop!',
    message: 'Deploying our premium, responsive e-commerce storefront! Use coupon WELCOME10 for 10% off your initial purchase.',
    type: 'promotion',
    date: '2026-06-05T12:00:00Z',
    read: false
  },
  {
    id: 'not_2',
    userId: 'all',
    title: 'Summer Flash Sale Active',
    message: 'Grab up to 20% off selected smart wearables and tech using item coupon FLASH20!',
    type: 'promotion',
    date: '2026-06-05T13:00:00Z',
    read: false
  }
];

// Seed Orders
const SEED_ORDERS: Order[] = [
  {
    id: 'ord_1',
    orderNumber: 'MS-582910-2026',
    userId: 'user_cust',
    items: [
      {
        productId: 'prod_1',
        productName: 'AcousticMax Noise Cancelling Headphones',
        productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        price: 299.99,
        quantity: 1,
        variant: { 'Color': 'Obsidian Black' }
      }
    ],
    shippingAddress: { id: 'addr_2', street: '1600 Amphitheatre Parkway', city: 'Mountain View', state: 'CA', zipCode: '94043', country: 'United States', isDefault: true },
    billingAddress: { id: 'addr_2', street: '1600 Amphitheatre Parkway', city: 'Mountain View', state: 'CA', zipCode: '94043', country: 'United States', isDefault: true },
    shippingMethod: 'Express Shipping',
    paymentMethod: 'Stripe Credit Card',
    status: 'Delivered',
    subtotal: 299.99,
    discountAmount: 30.00,
    taxAmount: 21.60,
    shippingAmount: 15.00,
    totalAmount: 306.59,
    loyaltyPointsEarned: 30,
    loyaltyPointsUsed: 0,
    date: '2026-05-28T14:30:00Z'
  }
];

// Seed Newsletters
const SEED_NEWSLETTERS: Newsletter[] = [];

class DataStore {
  private filePath: string;
  private state: {
    users: User[];
    categories: Category[];
    products: Product[];
    reviews: Review[];
    coupons: Coupon[];
    orders: Order[];
    notifications: AppNotification[];
    newsletters: Newsletter[];
  };

  constructor() {
    this.filePath = path.join(process.cwd(), 'db.json');
    this.state = {
      users: SEED_USERS,
      categories: SEED_CATEGORIES,
      products: SEED_PRODUCTS,
      reviews: SEED_REVIEWS,
      coupons: SEED_COUPONS,
      orders: SEED_ORDERS,
      notifications: SEED_NOTIFICATIONS,
      newsletters: SEED_NEWSLETTERS
    };
    this.reload();
  }

  public reload() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        this.state = {
          users: data.users || SEED_USERS,
          categories: data.categories || SEED_CATEGORIES,
          products: data.products || SEED_PRODUCTS,
          reviews: data.reviews || SEED_REVIEWS,
          coupons: data.coupons || SEED_COUPONS,
          orders: data.orders || SEED_ORDERS,
          notifications: data.notifications || SEED_NOTIFICATIONS,
          newsletters: data.newsletters || SEED_NEWSLETTERS
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading database, using static seed fallback:', err);
    }
  }

  public save(colName?: string, items?: any[]) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
      if (colName && items) {
        saveCollectionToMongo(colName, items).catch(err => {
          console.error(`[DataStore] Background save failed for collection "${colName}":`, err);
        });
      }
    } catch (err) {
      console.error('Failed saving database:', err);
    }
  }

  // Getters
  getUsers() { return this.state.users; }
  getCategories() { return this.state.categories; }
  getProducts() { return this.state.products; }
  getReviews() { return this.state.reviews; }
  getCoupons() { return this.state.coupons; }
  getOrders() { return this.state.orders; }
  getNotifications() { return this.state.notifications; }
  getNewsletters() { return this.state.newsletters; }

  // Setters/Updaters
  setUsers(users: User[]) { this.state.users = users; this.save('users', users); }
  setCategories(categories: Category[]) { this.state.categories = categories; this.save('categories', categories); }
  setProducts(products: Product[]) { this.state.products = products; this.save('products', products); }
  setReviews(reviews: Review[]) { this.state.reviews = reviews; this.save('reviews', reviews); }
  setCoupons(coupons: Coupon[]) { this.state.coupons = coupons; this.save('coupons', coupons); }
  setOrders(orders: Order[]) { this.state.orders = orders; this.save('orders', orders); }
  setNotifications(notifications: AppNotification[]) { this.state.notifications = notifications; this.save('notifications', notifications); }
  setNewsletters(newsletters: Newsletter[]) { this.state.newsletters = newsletters; this.save('newsletters', newsletters); }
}

export const db = new DataStore();
export { SEED_PRODUCTS, SEED_CATEGORIES, SEED_REVIEWS, SEED_COUPONS, SEED_USERS };
