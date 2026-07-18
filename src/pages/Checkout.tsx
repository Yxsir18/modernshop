import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { CreditCard, CheckCircle, Truck, ShoppingCart, User, ArrowLeft, ArrowUpRight, Sparkles, MapPin, Package } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, cart, createOrder, triggerNotification, fetchShippingRates, fetchTaxCalculation, fetchAvailableCarriers, createCarrierShipment } = useShop();

  const checkoutState = location.state || {
    subtotal: 0,
    discountAmount: 0,
    couponCode: '',
    taxAmount: 0,
    shippingAmount: 0,
    totalAmount: 0,
    shippingAddress: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    selectedShipping: null,
    taxDetails: null
  };

  // Stage Tracking (0: Info, 1: Success)
  const [stage, setStage] = useState(0);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Address Form Inputs
  const [street, setStreet] = useState(user?.addresses[0]?.street || '');
  const [city, setCity] = useState(checkoutState.shippingAddress?.city || user?.addresses[0]?.city || '');
  const [state, setState] = useState(checkoutState.shippingAddress?.state || user?.addresses[0]?.state || '');
  const [zipCode, setZipCode] = useState(checkoutState.shippingAddress?.zipCode || user?.addresses[0]?.zipCode || '');
  const [country, setCountry] = useState(user?.addresses[0]?.country || 'India');

  // Shipping and Tax state
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(checkoutState.selectedShipping || null);
  const [taxDetails, setTaxDetails] = useState<any>(checkoutState.taxDetails || null);
  const [loadingRates, setLoadingRates] = useState(false);
  
  // Carrier selection state
  const [availableCarriers, setAvailableCarriers] = useState<any[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('delhivery');
  const [loadingCarriers, setLoadingCarriers] = useState(false);

  // Custom Options
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [gpayNumber, setGpayNumber] = useState('');
  const [phonepeNumber, setPhonepeNumber] = useState('');
  const [paytmNumber, setPaytmNumber] = useState('');
  const [netBankingBank, setNetBankingBank] = useState('');
  const [netBankingAccount, setNetBankingAccount] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  // Calculate total weight for shipping
  const totalWeight = cart.reduce((sum, item) => sum + (item.product.weight || 0.5) * item.quantity, 0);

  // Fetch available carriers on mount
  useEffect(() => {
    const loadCarriers = async () => {
      setLoadingCarriers(true);
      try {
        const carriersData = await fetchAvailableCarriers();
        if (!carriersData.error && carriersData) {
          setAvailableCarriers(carriersData);
        }
      } catch (error) {
        console.error('Error fetching carriers:', error);
      } finally {
        setLoadingCarriers(false);
      }
    };
    loadCarriers();
  }, []);

  // Fetch shipping rates and tax when address changes
  useEffect(() => {
    const fetchRatesAndTax = async () => {
      if (cart.length === 0) return;

      // Ensure address has required fields
      const shippingAddress = { 
        street: street || '', 
        city: city || 'Mumbai', 
        state: state || 'Maharashtra', 
        zipCode: zipCode || '400001', 
        country: country || 'India' 
      };
      
      setLoadingRates(true);
      try {
        // Fetch shipping rates with default weight if 0
        const ratesData = await fetchShippingRates(
          shippingAddress,
          { weight: totalWeight || 0.5 }
        );

        if (!ratesData.error && ratesData.rates) {
          setShippingRates(ratesData.rates);
          // Use previously selected shipping or select cheapest standard
          if (selectedShipping) {
            const existing = ratesData.rates.find((r: any) => 
              r.carrier === selectedShipping.carrier && r.service === selectedShipping.service
            );
            if (existing) setSelectedShipping(existing);
            else {
              const standardShipping = ratesData.rates.find((r: any) => 
                r.service.toLowerCase().includes('standard') || r.service.toLowerCase().includes('surface')
              );
              setSelectedShipping(standardShipping || ratesData.rates[0]);
            }
          } else {
            const standardShipping = ratesData.rates.find((r: any) => 
              r.service.toLowerCase().includes('standard') || r.service.toLowerCase().includes('surface')
            );
            setSelectedShipping(standardShipping || ratesData.rates[0]);
          }
        }

        // Fetch tax calculation
        const taxData = await fetchTaxCalculation(
          checkoutState.subtotal - checkoutState.discountAmount,
          shippingAddress,
          'general'
        );

        if (!taxData.error && taxData.taxCalculation) {
          setTaxDetails(taxData.taxCalculation);
        }
      } catch (error) {
        console.error('Error fetching rates and tax:', error);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRatesAndTax();
  }, [street, city, state, zipCode, totalWeight]);

  // Recalculate totals when shipping or tax changes
  const currentShippingCost = selectedShipping ? selectedShipping.rate : checkoutState.shippingAmount;
  const currentTaxCost = taxDetails ? taxDetails.totalTax : checkoutState.taxAmount;
  const currentTotal = checkoutState.subtotal - checkoutState.discountAmount + currentShippingCost + currentTaxCost;

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !state || !zipCode) {
      triggerNotification('Address Error', 'Please specify complete shipping details.', 'warning');
      return;
    }

    // Payment method validation
    if (!paymentMethod) {
      triggerNotification('Payment Error', 'Please select a payment method.', 'warning');
      return;
    }

    if (paymentMethod === 'UPI') {
      if (!upiId) {
        triggerNotification('Payment Error', 'Please enter your UPI ID.', 'warning');
        return;
      }
      if (!upiId.includes('@')) {
        triggerNotification('Payment Error', 'Please enter a valid UPI ID (e.g., name@upi).', 'warning');
        return;
      }
    }

    if (paymentMethod === 'Google Pay') {
      if (!gpayNumber) {
        triggerNotification('Payment Error', 'Please enter your Google Pay linked phone number.', 'warning');
        return;
      }
      if (gpayNumber.length !== 10) {
        triggerNotification('Payment Error', 'Please enter a valid 10-digit phone number.', 'warning');
        return;
      }
    }

    if (paymentMethod === 'PhonePe') {
      if (!phonepeNumber) {
        triggerNotification('Payment Error', 'Please enter your PhonePe linked phone number.', 'warning');
        return;
      }
      if (phonepeNumber.length !== 10) {
        triggerNotification('Payment Error', 'Please enter a valid 10-digit phone number.', 'warning');
        return;
      }
    }

    if (paymentMethod === 'Paytm') {
      if (!paytmNumber) {
        triggerNotification('Payment Error', 'Please enter your Paytm wallet number.', 'warning');
        return;
      }
      if (paytmNumber.length !== 10) {
        triggerNotification('Payment Error', 'Please enter a valid 10-digit phone number.', 'warning');
        return;
      }
    }

    if (paymentMethod === 'Cash on Delivery') {
      const codConfirmed = window.confirm('You have selected Cash on Delivery. A convenience fee of ₹50 will be added. Confirm to proceed?');
      if (!codConfirmed) {
        return;
      }
    }

    setPlacingOrder(true);

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.images[0],
      price: item.product.discountPrice || item.product.price,
      quantity: item.quantity,
      variant: item.selectedVariant
    }));

    // Calculate loyalty points discount (1 point = ₹1)
    const loyaltyDiscount = useLoyaltyPoints ? pointsToUse : 0;
    const adjustedTotal = Math.max(0, checkoutState.totalAmount - loyaltyDiscount);

    // Build payment details object based on selected method
    const paymentDetails: any = {};
    if (paymentMethod === 'UPI') paymentDetails.upiId = 'khanyasirraza1-1@okhdfcbank';
    if (paymentMethod === 'Google Pay') paymentDetails.phoneNumber = gpayNumber;
    if (paymentMethod === 'PhonePe') paymentDetails.phoneNumber = phonepeNumber;
    if (paymentMethod === 'Paytm') paymentDetails.walletNumber = paytmNumber;

    const details = {
      items: orderItems,
      shippingAddress: { street, city, state, zipCode, country },
      billingAddress: { street, city, state, zipCode, country },
      shippingMethod: selectedShipping ? `${selectedShipping.carrier} - ${selectedShipping.service}` : 'Standard Ground',
      paymentMethod,
      paymentDetails,
      couponCode: checkoutState.couponCode,
      subtotal: checkoutState.subtotal,
      discountAmount: checkoutState.discountAmount + loyaltyDiscount,
      taxAmount: currentTaxCost,
      shippingAmount: currentShippingCost,
      totalAmount: Math.max(0, adjustedTotal + (currentShippingCost - checkoutState.shippingAmount) + (currentTaxCost - checkoutState.taxAmount)),
      pointsUsed: useLoyaltyPoints ? pointsToUse : 0,
      selectedShipping,
      taxDetails,
      selectedCarrier
    };

    const orderResult = await createOrder(details);
    setPlacingOrder(false);

    if (orderResult && !(orderResult as any).error) {
      setCreatedOrder(orderResult);
      setStage(1); // Set to Success view page
    } else {
      triggerNotification('Placement Error', (orderResult as any).error || 'An error arose.', 'warning');
    }
  };

  if (cart.length === 0 && stage === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-bold text-2xl text-gray-900">Accessing stale Checkout instance</h2>
          <p className="text-sm text-gray-600 mt-2 font-medium">Cannot checkout with Empty cart items.</p>
          <Link to="/catalog" className="bg-gradient-to-r from-black to-gray-800 text-white px-5 py-2 mt-4 rounded-full inline-block text-xs font-semibold shadow-lg shadow-gray-900/20">Explore Catalog</Link>
        </div>
      </div>
    );
  }

  if (stage === 1 && createdOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-10 text-left">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl shadow-gray-200/50">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-emerald-600 tracking-wider bg-emerald-50/80 backdrop-blur-sm px-3 py-1 rounded-full uppercase border border-emerald-200">Order Locked</span>
              <h2 className="font-display font-extrabold text-3xl text-gray-900 tracking-tight mt-2">Thank you, purchase completed!</h2>
              <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed font-medium">
                We have generated your electronic invoice successfully. Your dispatch code is <strong className="text-black font-semibold font-mono">{createdOrder.orderNumber}</strong>.
              </p>
            </div>

            <hr className="border-gray-200/60" />

            {/* Invoice overview details */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 text-xs text-left grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">Shipping Destination:</span>
              <p className="font-semibold text-gray-800">{user?.name || 'Customer'}</p>
              <p className="text-gray-600 font-medium">{createdOrder.shippingAddress.street}, {createdOrder.shippingAddress.city}</p>
              <p className="text-gray-600 font-medium">{createdOrder.shippingAddress.state}, {createdOrder.shippingAddress.zipCode}</p>
            </div>
            
            <div className="space-y-1.5 sm:text-right text-left">
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Payment Method:</span>
                <span className="font-semibold text-gray-800">{createdOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Shipping Method:</span>
                <span className="font-semibold text-gray-800">{createdOrder.shippingMethod}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-4 border-t border-gray-200/50 pt-2 text-sm">
                <span className="text-gray-900 font-bold">Total Paid:</span>
                <span className="font-extrabold text-black">${createdOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/dashboard?tab=orders"
              className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-3.5 rounded-full transition-colors inline-block"
            >
              Access Order Tracking Dashboard
            </Link>
            <Link
              to="/"
              className="bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 text-xs font-semibold px-6 py-3.5 rounded-full transition-colors inline-block shadow-sm"
            >
              Continue Browsing Hot Items
            </Link>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Header details */}
      <div className="mb-8 flex items-center gap-2 text-left">
        <Link to="/cart" className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Go Back to Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left items-start">
        
        {/* Stages list checkout Details */}
        <form onSubmit={handlePlaceOrderSubmit} className="lg:col-span-2 space-y-6">
          
          {/* Shipping Address Forms */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3">
              <User className="w-5 h-5 text-gray-400" /> 1. Shipping Destination & Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g., 1600 Amphitheatre Parkway"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">City</label>
                <input
                  type="text"
                  placeholder="e.g., Mountain View"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">State / Region</label>
                <input
                  type="text"
                  placeholder="e.g., CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">ZIP / Postal Code</label>
                <input
                  type="text"
                  placeholder="e.g., 94043"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black font-medium"
                  disabled
                >
                  <option value="India">India (Delivery Limited to India Only)</option>
                </select>
                <p className="text-[9px] text-amber-600 font-medium">🚚 We currently deliver within India only</p>
              </div>
            </div>
          </div>

          {/* Carrier Selection */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Package className="w-5 h-5 text-gray-400" /> 2. Select Shipping Carrier
            </h3>
            {loadingCarriers ? (
              <div className="text-xs text-gray-500 text-center py-4">Loading available carriers...</div>
            ) : availableCarriers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableCarriers.map((carrier) => (
                  <button
                    key={carrier.id}
                    type="button"
                    onClick={() => setSelectedCarrier(carrier.id)}
                    className={`border p-4 rounded-xl text-left transition-all ${
                      selectedCarrier === carrier.id
                        ? 'border-black bg-neutral-50/50 shadow'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <span className="block font-bold text-gray-800 text-xs">{carrier.name}</span>
                        <span className="text-[10px] text-gray-400 block">Real-time tracking available</span>
                      </div>
                      {selectedCarrier === carrier.id && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-4">
                Standard shipping will be used
              </div>
            )}
          </div>

          {/* Shipping Methods selection */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Truck className="w-5 h-5 text-gray-400" /> 3. Shipping Method Selection
            </h3>
            {loadingRates ? (
              <div className="text-xs text-gray-500 text-center py-4">Loading real-time shipping rates...</div>
            ) : shippingRates.length > 0 ? (
              <div className="space-y-3">
                {shippingRates.map((rate, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedShipping(rate)}
                    className={`w-full border p-4 rounded-xl text-left transition-all ${
                      selectedShipping?.carrier === rate.carrier && selectedShipping?.service === rate.service
                        ? 'border-black bg-neutral-50/50 shadow'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="block font-bold text-gray-800 text-xs">{rate.carrier}</span>
                        <span className="text-[10px] text-gray-400 block">{rate.service}</span>
                        <span className="text-[10px] text-gray-500 block mt-1">
                          📦 {rate.estimatedDays} business days
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block font-extrabold text-sm">
                          {rate.rate === 0 ? (
                            <span className="text-emerald-600">FREE</span>
                          ) : (
                            formatPrice(rate.rate)
                          )}
                        </span>
                        {rate.trackingAvailable && (
                          <span className="text-[9px] text-gray-400 block">📍 Live Tracking</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  className="border p-4 rounded-xl text-left border-gray-100 hover:bg-gray-50"
                >
                  <span className="block font-bold text-gray-800">Standard Ground Shipping</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">3-5 Commercial Business Days</span>
                  <span className="block text-emerald-600 font-extrabold mt-2">FREE</span>
                </button>
                <button
                  type="button"
                  className="border p-4 rounded-xl text-left border-gray-100 hover:bg-gray-50"
                >
                  <span className="block font-bold text-gray-800">Premium Express Overnight</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Overnight lock box delivery</span>
                  <span className="block text-gray-900 font-extrabold mt-2">{formatPrice(199)}</span>
                </button>
              </div>
            )}
          </div>

          {/* Credit Card info payment simulators */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3">
              <CreditCard className="w-5 h-5 text-gray-400" /> 4. Secure Bill Payment
            </h3>

            <div className="flex flex-wrap gap-3">
              {['UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Cash on Delivery'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`text-xs px-3 py-2.5 rounded-full font-bold border transition-all ${paymentMethod === m ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* UPI Input */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 space-y-3 mt-4">
                <div className="space-y-2">
                  <label className="text-[9px] text-emerald-600 uppercase tracking-wider block font-bold">Merchant UPI ID</label>
                  <div className="bg-white border-2 border-emerald-300 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800 font-mono">khanyasirraza1-1@okhdfcbank</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('khanyasirraza1-1@okhdfcbank');
                        triggerNotification('UPI ID Copied', 'UPI ID copied to clipboard', 'success');
                      }}
                      className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-emerald-200">
                  <p className="text-[10px] text-gray-700 font-medium">💳 Pay to this UPI ID using any UPI app (Google Pay, PhonePe, Paytm, etc.)</p>
                  <p className="text-[10px] text-gray-600 mt-1">Amount: <span className="font-bold text-emerald-700">{formatPrice(Math.max(0, checkoutState.totalAmount - (useLoyaltyPoints ? pointsToUse : 0) + (currentShippingCost - checkoutState.shippingAmount) + (currentTaxCost - checkoutState.taxAmount)))}</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const amount = Math.max(0, checkoutState.totalAmount - (useLoyaltyPoints ? pointsToUse : 0) + (currentShippingCost - checkoutState.shippingAmount) + (currentTaxCost - checkoutState.taxAmount));
                    const upiLink = `upi://pay?pa=khanyasirraza1-1@okhdfcbank&pn=ModernShop&am=${amount.toFixed(2)}&cu=INR&tn=Order_${Date.now()}`;
                    
                    // Try to open UPI app, fallback to manual instructions
                    try {
                      window.location.href = upiLink;
                      setTimeout(() => {
                        triggerNotification('Payment Instructions', 'If UPI app didn\'t open, please manually pay to khanyasirraza1-1@okhdfcbank', 'info');
                      }, 1000);
                    } catch (e) {
                      triggerNotification('Manual Payment Required', 'Please manually pay to khanyasirraza1-1@okhdfcbank', 'info');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold py-3 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <span>📱</span> Open UPI App to Pay
                </button>
                <p className="text-[9px] text-gray-500 text-center italic">
                  If the app doesn't open, manually pay to the UPI ID above
                </p>
              </div>
            )}

            {/* Google Pay Input */}
            {paymentMethod === 'Google Pay' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 mt-4">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-400 uppercase tracking-wider block">Linked Phone Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={gpayNumber}
                    onChange={(e) => setGpayNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-black font-semibold"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-500">Payment request will be sent to your Google Pay</p>
              </div>
            )}

            {/* PhonePe Input */}
            {paymentMethod === 'PhonePe' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 mt-4">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-400 uppercase tracking-wider block">Linked Phone Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phonepeNumber}
                    onChange={(e) => setPhonepeNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-black font-semibold"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-500">Payment request will be sent to your PhonePe</p>
              </div>
            )}

            {/* Paytm Input */}
            {paymentMethod === 'Paytm' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 mt-4">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-400 uppercase tracking-wider block">Paytm Wallet Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={paytmNumber}
                    onChange={(e) => setPaytmNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-black font-semibold"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-500">Payment will be deducted from your Paytm wallet</p>
              </div>
            )}

          </div>

          <button
            type="submit"
            disabled={placingOrder}
            className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow disabled:bg-gray-200"
          >
            {placingOrder ? 'Evaluating payments & compiling invoice...' : 'Complete secure placement'}
          </button>

        </form>

        {/* Right Sidebar, Order items review lists */}
        <div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-gray-900 border-b border-gray-50 pb-2 flex items-center gap-1.5">
              <ShoppingCart className="w-5 h-5 text-gray-400" /> Order Review ({cart.length})
            </h3>

            {/* List items */}
            <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
              {cart.map((item, id) => (
                <div key={id} className="py-3 flex justify-between gap-2 text-xs">
                  <div className="flex gap-2">
                    <img src={item.product.images[0]} className="w-10 h-10 object-cover rounded-lg bg-gray-50" alt="" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 line-clamp-1">{item.product.name}</p>
                      <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">{formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <hr className="border-gray-50" />

            {/* Loyalty Points Section */}
            {user && user.loyaltyPoints > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-bold text-yellow-800">Loyalty Points Available</span>
                  </div>
                  <span className="text-sm font-extrabold text-yellow-900">{user.loyaltyPoints} pts</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useLoyaltyPoints"
                    checked={useLoyaltyPoints}
                    onChange={(e) => {
                      setUseLoyaltyPoints(e.target.checked);
                      if (e.target.checked) {
                        setPointsToUse(Math.min(user.loyaltyPoints, Math.floor(checkoutState.totalAmount)));
                      } else {
                        setPointsToUse(0);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <label htmlFor="useLoyaltyPoints" className="text-xs text-gray-700 font-medium">
                    Use points for discount (1 point = ₹1)
                  </label>
                </div>

                {useLoyaltyPoints && (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={Math.min(user.loyaltyPoints, Math.floor(checkoutState.totalAmount))}
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(parseInt(e.target.value))}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Points to use: <strong className="text-yellow-900">{pointsToUse}</strong></span>
                      <span className="text-emerald-600 font-semibold">Save: ₹{pointsToUse}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <hr className="border-gray-50" />

            {/* Summary elements */}
            <div className="space-y-3 text-xs font-semibold text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal Price</span>
                <span className="text-black font-bold">{formatPrice(checkoutState.subtotal)}</span>
              </div>
              {checkoutState.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount Applied</span>
                  <span className="font-bold">-{formatPrice(checkoutState.discountAmount)}</span>
                </div>
              )}
              {useLoyaltyPoints && pointsToUse > 0 && (
                <div className="flex justify-between text-yellow-600">
                  <span>Loyalty Points Discount</span>
                  <span className="font-bold">-{formatPrice(pointsToUse)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>
                  {taxDetails ? `GST (${taxDetails.taxRate}%${taxDetails.isInterstate ? ' IGST' : ' CGST + SGST'})` : 'Expected GST (18%)'}
                </span>
                <span className="text-black font-bold">{formatPrice(currentTaxCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  {selectedShipping ? `${selectedShipping.carrier} - ${selectedShipping.service}` : 'Shipping Billing'}
                </span>
                <span className="text-black font-bold">{formatPrice(currentShippingCost)}</span>
              </div>

              <hr className="border-gray-50" />

              <div className="flex justify-between pt-1 text-sm font-bold text-gray-950">
                <span>Total Charge</span>
                <span className="text-black text-lg font-extrabold">
                  {formatPrice(Math.max(0, currentTotal - (useLoyaltyPoints ? pointsToUse : 0)))}
                </span>
              </div>
            </div>

            {/* Guest/Account badge */}
            <div className="p-3 bg-neutral-50 rounded-xl text-[10px] text-neutral-500 font-medium leading-relaxed mt-2 text-left">
              Account Sync: <strong className="text-black">{user ? user.email : 'Guest Session'}</strong>. Earned loyalty points will allocate immediately after placement.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
