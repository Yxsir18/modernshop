// Shipping Service for Indian Carriers
// Integrates with Delhivery, Blue Dart, FedEx India, and other major Indian carriers

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PackageDimensions {
  weight: number; // in kg
  length?: number; // in cm
  width?: number; // in cm
  height?: number; // in cm
}

interface ShippingRate {
  carrier: string;
  service: string;
  rate: number;
  estimatedDays: string;
  trackingAvailable: boolean;
}

interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery: string;
  timeline: Array<{
    status: string;
    description: string;
    timestamp: string;
    location?: string;
  }>;
}

// Indian States with their codes for GST and shipping calculations
const INDIAN_STATES = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  'Assam': 'AS',
  'Bihar': 'BR',
  'Chhattisgarh': 'CT',
  'Goa': 'GA',
  'Gujarat': 'GJ',
  'Haryana': 'HR',
  'Himachal Pradesh': 'HP',
  'Jharkhand': 'JH',
  'Karnataka': 'KA',
  'Kerala': 'KL',
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Manipur': 'MN',
  'Meghalaya': 'ML',
  'Mizoram': 'MZ',
  'Nagaland': 'NL',
  'Odisha': 'OD',
  'Punjab': 'PB',
  'Rajasthan': 'RJ',
  'Sikkim': 'SK',
  'Tamil Nadu': 'TN',
  'Telangana': 'TG',
  'Tripura': 'TR',
  'Uttar Pradesh': 'UP',
  'Uttarakhand': 'UK',
  'West Bengal': 'WB',
  'Delhi': 'DL',
  'Jammu and Kashmir': 'JK',
  'Puducherry': 'PY',
  'Chandigarh': 'CH',
  'Andaman and Nicobar': 'AN',
  'Lakshadweep': 'LD',
  'Dadra and Nagar Haveli and Daman and Diu': 'DN'
};

// Base rates for different zones (simplified calculation)
// Zone A: Metro cities (Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad)
// Zone B: State capitals and major cities
// Zone C: Other areas
const ZONE_A_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'New Delhi'];
const ZONE_B_CITIES = ['Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Surat', 'Nagpur', 'Indore', 'Patna', 'Bhopal', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad', 'Bareilly', 'Moradabad', 'Mysore', 'Gurgaon', 'Aligarh', 'Jalandhar', 'Tiruchirappalli', 'Bhubaneswar', 'Salem', 'Warangal', 'Mira-Bhayandar', 'Thiruvananthapuram', 'Bhiwandi', 'Saharanpur', 'Guntur', 'Amravati', 'Bikaner', 'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli-Miraj & Kupwad', 'Mangalore', 'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala', 'Tirupur', 'Davanagere', 'Kozhikode', 'Akbarpur', 'Rajpur Sonarpur', 'Bokaro', 'South Dumdum', 'Bellary', 'Patiala', 'Gopalpur', 'Agartala', 'Bhagalpur', 'Muzaffarnagar', 'Bhatpara', 'Panihati', 'Latur', 'Dhule', 'Rohtak', 'Korba', 'Bhilwara', 'Berhampur', 'Muzaffarpur', 'Ahmednagar', 'Mathura', 'Kollam', 'Avadi', 'Kadapa', 'Kamarhati', 'Sambalpur', 'Bilaspur', 'Shahjahanpur', 'Satara', 'Bijapur', 'Rampur', 'Shivamogga', 'Chandrapur', 'Junagadh', 'Thrissur', 'Alwar', 'Bardhaman', 'Kulti', 'Nizamabad', 'Parbhani', 'Tumkur', 'Khammam', 'Ozhukarai', 'Bihar Sharif', 'Panipat', 'Darbhanga', 'Bally', 'Aizawl', 'Dewas', 'Ichalkaranji', 'Karnal', 'Bathinda', 'Jalna', 'Eluru', 'Barasat', 'Kirari Suleman Nagar', 'Purnia', 'Satna', 'Mau', 'Sonipat', 'Farrukhabad', 'Sagar', 'Rourkela', 'Durg', 'Imphal', 'Ratlam', 'Hapur', 'Arrah', 'Anantapur', 'Karimnagar', 'Etawah', 'Ambarnath', 'North Dumdum', 'Barrackpore', 'Hospet', 'Nagaon', 'Santipur', 'Raurkela', 'Bidhan Nagar', 'Puducherry', 'Sikar', 'Thoothukudi', 'Rewa', 'Mirzapur', 'Raichur', 'Pali', 'Ramagundam', 'Silchar', 'Haridwar', 'Vijayanagaram', 'Tenali', 'Nagercoil', 'Sri Ganganagar', 'Karawal Nagar', 'Mango', 'Thanjavur', 'Bulandshahr', 'Uluberia', 'Murwara', 'Sambhal', 'Singrauli', 'Nadiad', 'Secunderabad', 'Naihati', 'Yamunanagar', 'Bidhan Nagar', 'Pallavaram', 'Bidar', 'Panchkula', 'Burhanpur', 'Raurkela', 'Raurkela', 'Kharagpur', 'Dindigul', 'Gandhinagar', 'Hospet', 'Karaikudi', 'Bongaigaon', 'Deoghar', 'Chinsurah', 'Kishanganj', 'Berhampur', 'Anand', 'Bhuj', 'Dibrugarh', 'Jorhat', 'Muzaffarpur', 'Mathura', 'Shillong', 'Tezpur', 'Aizawl', 'Kohima', 'Imphal', 'Agartala', 'Gangtok', 'Itanagar', 'Leh', 'Kargil', 'Port Blair'];

function getZone(city: string): 'A' | 'B' | 'C' {
  const normalizedCity = city.toLowerCase().trim();
  if (ZONE_A_CITIES.some(c => c.toLowerCase() === normalizedCity)) return 'A';
  if (ZONE_B_CITIES.some(c => c.toLowerCase() === normalizedCity)) return 'B';
  return 'C';
}

// Calculate shipping rate based on weight, distance zone, and carrier
function calculateBaseRate(weight: number, zone: 'A' | 'B' | 'C'): number {
  const baseRates = {
    A: { base: 50, perKg: 10 },
    B: { base: 70, perKg: 15 },
    C: { base: 90, perKg: 20 }
  };
  
  const rate = baseRates[zone];
  return rate.base + (rate.perKg * weight);
}

// Simulated carrier rate calculation (in production, integrate with actual carrier APIs)
export async function getShippingRates(
  originAddress: ShippingAddress,
  destinationAddress: ShippingAddress,
  dimensions: PackageDimensions
): Promise<ShippingRate[]> {
  const zone = getZone(destinationAddress.city);
  const weight = dimensions.weight;
  const baseRate = calculateBaseRate(weight, zone);

  // Simulate different carrier rates
  const rates: ShippingRate[] = [
    {
      carrier: 'Delhivery',
      service: 'Standard Surface',
      rate: baseRate * 1.0,
      estimatedDays: zone === 'A' ? '2-3' : zone === 'B' ? '4-5' : '5-7',
      trackingAvailable: true
    },
    {
      carrier: 'Delhivery',
      service: 'Express Air',
      rate: baseRate * 2.5,
      estimatedDays: zone === 'A' ? '1-2' : zone === 'B' ? '2-3' : '3-4',
      trackingAvailable: true
    },
    {
      carrier: 'Blue Dart',
      service: 'Standard Surface',
      rate: baseRate * 1.2,
      estimatedDays: zone === 'A' ? '2-3' : zone === 'B' ? '3-4' : '4-6',
      trackingAvailable: true
    },
    {
      carrier: 'Blue Dart',
      service: 'Express Air',
      rate: baseRate * 2.8,
      estimatedDays: zone === 'A' ? '1' : zone === 'B' ? '1-2' : '2-3',
      trackingAvailable: true
    },
    {
      carrier: 'FedEx India',
      service: 'Standard Ground',
      rate: baseRate * 1.3,
      estimatedDays: zone === 'A' ? '2-3' : zone === 'B' ? '3-4' : '4-5',
      trackingAvailable: true
    },
    {
      carrier: 'FedEx India',
      service: 'Priority Express',
      rate: baseRate * 3.0,
      estimatedDays: zone === 'A' ? '1' : zone === 'B' ? '1-2' : '2-3',
      trackingAvailable: true
    },
    {
      carrier: 'DTDC',
      service: 'Standard Surface',
      rate: baseRate * 0.9,
      estimatedDays: zone === 'A' ? '3-4' : zone === 'B' ? '4-5' : '5-7',
      trackingAvailable: true
    },
    {
      carrier: 'Ecom Express',
      service: 'Standard Surface',
      rate: baseRate * 1.1,
      estimatedDays: zone === 'A' ? '2-3' : zone === 'B' ? '3-4' : '4-6',
      trackingAvailable: true
    }
  ];

  return rates;
}

// Generate tracking number (in production, get from carrier API)
export function generateTrackingNumber(carrier: string, orderId: string): string {
  const carrierCodes = {
    'Delhivery': 'DLV',
    'Blue Dart': 'BDT',
    'FedEx India': 'FDX',
    'DTDC': 'DTD',
    'Ecom Express': 'ECM'
  };
  
  const code = carrierCodes[carrier as keyof typeof carrierCodes] || 'GEN';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${code}${orderId.slice(-4)}${timestamp}${random}`;
}

// Simulate tracking information (in production, fetch from carrier API)
export async function getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
  // Simulate different carriers based on tracking number prefix
  let carrier = 'Generic';
  if (trackingNumber.startsWith('DLV')) carrier = 'Delhivery';
  else if (trackingNumber.startsWith('BDT')) carrier = 'Blue Dart';
  else if (trackingNumber.startsWith('FDX')) carrier = 'FedEx India';
  else if (trackingNumber.startsWith('DTD')) carrier = 'DTDC';
  else if (trackingNumber.startsWith('ECM')) carrier = 'Ecom Express';

  // Simulate tracking timeline
  const now = new Date();
  const timeline = [
    {
      status: 'Order Placed',
      description: 'Order received and confirmed',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      location: 'Origin Warehouse'
    },
    {
      status: 'Picked Up',
      description: 'Package picked up by courier',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      location: 'Origin City'
    },
    {
      status: 'In Transit',
      description: 'Package is in transit to destination',
      timestamp: now.toISOString(),
      location: 'Regional Hub'
    }
  ];

  return {
    carrier,
    trackingNumber,
    status: 'In Transit',
    estimatedDelivery: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    timeline
  };
}

// Validate PIN code for Indian addresses
export function validatePinCode(pinCode: string): boolean {
  const pin = pinCode.trim();
  return /^[1-9][0-9]{5}$/.test(pin);
}

// Get state from PIN code (simplified - in production use proper PIN code database)
export function getStateFromPinCode(pinCode: string): string | null {
  // First digit indicates region
  const firstDigit = parseInt(pinCode[0]);
  const regions: { [key: number]: string[] } = {
    1: ['Delhi', 'Haryana', 'Punjab', 'Himachal Pradesh', 'Jammu and Kashmir'],
    2: ['Uttar Pradesh', 'Uttarakhand'],
    3: ['Rajasthan', 'Gujarat'],
    4: ['Maharashtra', 'Madhya Pradesh', 'Chhattisgarh'],
    5: ['Karnataka', 'Andhra Pradesh', 'Telangana'],
    6: ['Kerala', 'Tamil Nadu', 'Puducherry'],
    7: ['West Bengal', 'Odisha', 'Assam', 'Sikkim', 'Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Meghalaya'],
    8: ['Bihar', 'Jharkhand', 'West Bengal'],
    9: ['Madhya Pradesh', 'Uttar Pradesh']
  };
  
  const states = regions[firstDigit];
  return states ? states[0] : null;
}
