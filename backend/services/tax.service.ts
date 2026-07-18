// GST Tax Calculation Service for India
// Calculates GST based on location, product type, and interstate vs intrastate transactions

interface TaxAddress {
  state: string;
  pinCode?: string;
}

interface TaxCalculationResult {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  taxRate: number;
  isInterstate: boolean;
}

interface ProductTaxInfo {
  hsnCode?: string;
  category: string;
  isExempt: boolean;
}

// GST Rates for different product categories in India
const GST_RATES: { [key: string]: number } = {
  // 0% - Essential commodities
  'essential': 0,
  'books': 0,
  'grains': 0,
  
  // 5% - Basic necessities
  'textiles': 5,
  'footwear_under_1000': 5,
  'medicines': 5,
  'coal': 5,
  
  // 12% - Standard goods
  'footwear_over_1000': 12,
  'mobile_phones': 12,
  'processed_food': 12,
  'butter': 12,
  'cheese': 12,
  'soaps': 12,
  
  // 18% - Most goods and services
  'electronics': 18,
  'computers': 18,
  'appliances': 18,
  'furniture': 18,
  'clothing': 18,
  'footwear': 18,
  'cosmetics': 18,
  'restaurant_service': 18,
  'telecom': 18,
  'it_services': 18,
  'general': 18,
  
  // 28% - Luxury goods and sin goods
  'luxury_cars': 28,
  'tobacco': 28,
  'aerated_drinks': 28,
  'ac_hotels': 28,
  'luxury_watches': 28
};

// Indian States and Union Territories with their codes
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

// Union Territories (UTs) - these are treated differently for GST
const UNION_TERRITORIES = [
  'Delhi',
  'Puducherry',
  'Chandigarh',
  'Andaman and Nicobar',
  'Lakshadweep',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Jammu and Kashmir',
  'Ladakh'
];

// Default business location (can be configured via environment variables)
const BUSINESS_STATE = process.env.BUSINESS_STATE || 'Maharashtra';
const BUSINESS_STATE_CODE = INDIAN_STATES[BUSINESS_STATE as keyof typeof INDIAN_STATES] || 'MH';

// Determine if transaction is interstate
function isInterstateTransaction(customerState: string): boolean {
  const normalizedCustomerState = normalizeStateName(customerState);
  const normalizedBusinessState = normalizeStateName(BUSINESS_STATE);
  
  return normalizedCustomerState !== normalizedBusinessState;
}

// Normalize state name for comparison
function normalizeStateName(state: string): string {
  return state.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Get GST rate for a product category
function getGSTRate(category: string): number {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
  return GST_RATES[normalizedCategory] || GST_RATES['general'];
}

// Calculate GST for a transaction
export function calculateGST(
  amount: number,
  customerAddress: TaxAddress,
  productCategory: string = 'general',
  isExempt: boolean = false
): TaxCalculationResult {
  if (isExempt) {
    return {
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      taxRate: 0,
      isInterstate: isInterstateTransaction(customerAddress.state)
    };
  }

  const taxRate = getGSTRate(productCategory);
  const interstate = isInterstateTransaction(customerAddress.state);
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let totalTax = 0;

  if (interstate) {
    // Interstate: IGST only
    igst = (amount * taxRate) / 100;
    totalTax = igst;
  } else {
    // Intrastate: CGST + SGST (each is half of total GST rate)
    cgst = (amount * taxRate) / 200;
    sgst = (amount * taxRate) / 200;
    totalTax = cgst + sgst;
  }

  return {
    cgst,
    sgst,
    igst,
    totalTax,
    taxRate,
    isInterstate: interstate
  };
}

// Calculate GST for multiple items in a cart
export function calculateGSTForCart(
  items: Array<{ price: number; quantity: number; category?: string; isExempt?: boolean }>,
  customerAddress: TaxAddress
): {
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalTax: number;
  itemBreakdown: Array<{
    price: number;
    quantity: number;
    subtotal: number;
    taxRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    taxAmount: number;
    category: string;
  }>;
} {
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalTax = 0;

  const itemBreakdown = items.map(item => {
    const subtotal = item.price * item.quantity;
    const category = item.category || 'general';
    const taxCalc = calculateGST(subtotal, customerAddress, category, item.isExempt);

    totalCGST += taxCalc.cgst;
    totalSGST += taxCalc.sgst;
    totalIGST += taxCalc.igst;
    totalTax += taxCalc.totalTax;

    return {
      price: item.price,
      quantity: item.quantity,
      subtotal,
      taxRate: taxCalc.taxRate,
      cgst: taxCalc.cgst,
      sgst: taxCalc.sgst,
      igst: taxCalc.igst,
      taxAmount: taxCalc.totalTax,
      category
    };
  });

  return {
    totalCGST,
    totalSGST,
    totalIGST,
    totalTax,
    itemBreakdown
  };
}

// Validate state name
export function validateStateName(state: string): boolean {
  const normalizedState = normalizeStateName(state);
  const allStates = Object.keys(INDIAN_STATES).map(s => normalizeStateName(s));
  return allStates.includes(normalizedState);
}

// Get state code from state name
export function getStateCode(stateName: string): string | null {
  const normalizedState = normalizeStateName(stateName);
  
  for (const [state, code] of Object.entries(INDIAN_STATES)) {
    if (normalizeStateName(state) === normalizedState) {
      return code;
    }
  }
  
  return null;
}

// Check if location is a Union Territory
export function isUnionTerritory(state: string): boolean {
  const normalizedState = normalizeStateName(state);
  return UNION_TERRITORIES.some(ut => normalizeStateName(ut) === normalizedState);
}

// Get tax invoice details for display
export function getTaxInvoiceDetails(
  amount: number,
  customerAddress: TaxAddress,
  productCategory: string = 'general'
): {
  businessState: string;
  businessStateCode: string;
  customerState: string;
  customerStateCode: string | null;
  transactionType: 'Interstate' | 'Intrastate';
  taxDetails: TaxCalculationResult;
  gstinFormat: string;
} {
  const taxDetails = calculateGST(amount, customerAddress, productCategory);
  const customerStateCode = getStateCode(customerAddress.state);

  return {
    businessState: BUSINESS_STATE,
    businessStateCode: BUSINESS_STATE_CODE,
    customerState: customerAddress.state,
    customerStateCode,
    transactionType: taxDetails.isInterstate ? 'Interstate' : 'Intrastate',
    taxDetails,
    gstinFormat: generateGSTINFormat(BUSINESS_STATE_CODE)
  };
}

// Generate GSTIN format (placeholder - actual GSTIN would come from business registration)
function generateGSTINFormat(stateCode: string): string {
  // GSTIN format: 22ABCDE1234F1Z5
  // 22 = state code, ABCDE = PAN, 1234 = entity type, F = check digit, 1Z5 = suffix
  return `${stateCode}AAAAA0000A0Z0`;
}

// Get product category from HSN code (simplified mapping)
export function getCategoryFromHSN(hsnCode: string): string {
  const hsn = hsnCode.substring(0, 4);
  
  const hsnMapping: { [key: string]: string } = {
    '6110': 'textiles',
    '6403': 'footwear_under_1000',
    '6404': 'footwear_over_1000',
    '3004': 'medicines',
    '8517': 'mobile_phones',
    '8471': 'computers',
    '8504': 'electronics',
    '9401': 'furniture',
    '3303': 'cosmetics',
    '4701': 'books',
    '1901': 'processed_food',
    '0406': 'cheese',
    '3401': 'soaps',
    '8703': 'luxury_cars',
    '2402': 'tobacco',
    '2202': 'aerated_drinks'
  };

  return hsnMapping[hsn] || 'general';
}

// Check if product is exempt from GST
export function isProductExempt(category: string): boolean {
  const exemptCategories = ['essential', 'books', 'grains'];
  return exemptCategories.includes(category.toLowerCase());
}
