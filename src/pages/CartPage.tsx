import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Trash2, ShoppingBag, ArrowRight, Sparkles, Tag, ShieldAlert, Truck, MapPin } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export const CartPage: React.FC = () => {
  const { cart, updateCartQuantity, removeFromCart, validateCoupon, triggerNotification, fetchShippingRates, fetchTaxCalculation } = useShop();
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Shipping and Tax state
  const [shippingAddress, setShippingAddress] = useState({
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India'
  });
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [taxDetails, setTaxDetails] = useState<any>(null);
  const [loadingRates, setLoadingRates] = useState(false);

  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity, 0);

  // Calculate total weight for shipping
  const totalWeight = cart.reduce((sum, item) => sum + (item.product.weight || 0.5) * item.quantity, 0);

  // Fetch shipping rates and tax when cart or address changes
  useEffect(() => {
    const fetchRatesAndTax = async () => {
      if (cart.length === 0) return;

      setLoadingRates(true);
      try {
        // Fetch shipping rates with default weight if 0
        const ratesData = await fetchShippingRates(
          shippingAddress,
          { weight: totalWeight || 0.5 }
        );

        if (!ratesData.error && ratesData.rates) {
          setShippingRates(ratesData.rates);
          // Select the cheapest standard shipping by default
          const standardShipping = ratesData.rates.find((r: any) => 
            r.service.toLowerCase().includes('standard') || r.service.toLowerCase().includes('surface')
          );
          setSelectedShipping(standardShipping || ratesData.rates[0]);
        }

        // Fetch tax calculation
        const taxData = await fetchTaxCalculation(
          subtotal - couponDiscount,
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
  }, [cart, shippingAddress, couponDiscount, totalWeight]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);

    const res = await validateCoupon(couponCode.trim());
    setCouponLoading(false);

    if ('coupon' in res && res.coupon) {
      const cp = res.coupon;
      setAppliedCoupon(cp);
      if (cp.type === 'percentage') {
        const disc = subtotal * (cp.value / 100);
        setCouponDiscount(disc);
      } else {
        setCouponDiscount(cp.value);
      }
      triggerNotification('Coupon Verified', `Discount applied: ${cp.code}`, 'success');
    } else {
      triggerNotification('Invalid Coupon Schema', ('error' in res && res.error) ? res.error : 'Check expiration dates.', 'warning');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  // Use real-time shipping rate or fallback to default
  const shippingCost = selectedShipping ? selectedShipping.rate : (subtotal > 999 ? 0 : 99.00);
  // Use real-time tax calculation or fallback to default
  const taxCost = taxDetails ? taxDetails.totalTax : (subtotal - couponDiscount) * 0.18;
  const grandTotal = subtotal - couponDiscount + shippingCost + taxCost;

  const handleCheckoutRedirect = () => {
    if (cart.length === 0) return;
    navigate('/checkout', {
      state: {
        subtotal,
        discountAmount: couponDiscount,
        couponCode: appliedCoupon?.code || '',
        taxAmount: taxCost,
        shippingAmount: shippingCost,
        totalAmount: grandTotal,
        shippingAddress,
        selectedShipping,
        taxDetails
      }
    });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShoppingBag className="w-10 h-10 text-neutral-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-3xl text-gray-900 tracking-tight">Shopping cart empty</h2>
            <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed font-medium">
              Your cart elements aren't populated. Explore our featured collections to add accessories or gear!
            </p>
          </div>
          <Link
            to="/catalog"
            className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold text-xs px-6 py-3.5 rounded-full inline-block transition-all shadow-lg shadow-gray-900/20"
          >
            Explore Catalog Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-24 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display font-extrabold text-4xl tracking-tight text-left mb-8 text-gray-900">Your Basket</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left items-start">
        
          {/* Cart Itemizations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-gray-200/60 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl shadow-sm">
              
              {/* Table layout client */}
              <div className="p-6 divide-y divide-gray-100">
                {cart.map((item, idx) => {
                  const prod = item.product;
                  const finalPrice = prod.discountPrice || prod.price;
                  return (
                    <div key={idx} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex gap-4">
                      <img src={prod.images[0]} alt={prod.name} className="w-20 h-20 object-cover rounded-xl bg-gray-50 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">{prod.name}</h3>
                        <p className="text-xs text-blue-500 font-bold uppercase mt-1 tracking-wider">{prod.brand}</p>
                        
                        {/* Selections metadata list */}
                        {Object.entries(item.selectedVariant).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {Object.entries(item.selectedVariant).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-gray-50 text-gray-500 border px-2 py-0.5 rounded font-medium">
                                {k}: <span className="font-bold text-gray-700">{v}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4 mt-4 sm:mt-0">
                      {/* Sub price */}
                      <div className="text-left sm:text-right">
                        <span className="font-extrabold text-gray-900 text-sm">{formatPrice(finalPrice * item.quantity)}</span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">{formatPrice(finalPrice)} each</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Quantity adjust */}
                        <div className="border border-gray-200 rounded-lg flex items-center bg-gray-50 h-8 text-xs px-1">
                          <button
                            onClick={() => updateCartQuantity(prod.id, item.quantity - 1, item.selectedVariant)}
                            className="px-2 font-bold text-gray-500 hover:text-black"
                          >
                            -
                          </button>
                          <span className="font-bold font-mono px-1.5">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(prod.id, item.quantity + 1, item.selectedVariant)}
                            className="px-2 font-bold text-gray-500 hover:text-black"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(prod.id, item.selectedVariant)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Shipping Address Selection */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" /> Delivery Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">City</label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">State</label>
                <select
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black font-medium"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Odisha">Odisha</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider block">PIN Code</label>
                <input
                  type="text"
                  value={shippingAddress.zipCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black font-medium"
                  placeholder="e.g., 400001"
                />
              </div>
            </div>
          </div>

          {/* Shipping Carrier Selection */}
          {shippingRates.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-400" /> Shipping Options
              </h3>
              {loadingRates ? (
                <div className="text-xs text-gray-500 text-center py-4">Loading shipping rates...</div>
              ) : (
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
                            <span className="text-[9px] text-gray-400 block">📍 Tracking Available</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prompt banner info */}
          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-50 text-xs text-blue-800 flex gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p>Real-time shipping rates from Indian carriers (Delhivery, Blue Dart, FedEx India). GST calculated based on your location.</p>
          </div>
        </div>

        {/* Aggregate Pricing breakdown widgets */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-display font-bold text-base text-gray-900">Summary Statement</h3>

            {/* Coupon Entry */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Apply Checkout Coupon</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., FLASH20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-black uppercase font-bold"
                />
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-4 rounded-xl disabled:bg-gray-300 transition-colors"
                >
                  {couponLoading ? 'Checking...' : 'ApplyCode'}
                </button>
              </div>
              {appliedCoupon && (
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1 mt-1">
                  <Tag className="w-3 h-3" /> Activated '{appliedCoupon.code}' (-{formatPrice(couponDiscount)})
                </span>
              )}
            </form>

            <hr className="border-gray-50" />

            {/* Calc list */}
            <div className="space-y-3 font-medium text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal Price</span>
                <span className="text-gray-900 font-bold">{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Deduction</span>
                  <span className="font-bold">-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>
                  {selectedShipping ? `${selectedShipping.carrier} - ${selectedShipping.service}` : 'Standard Delivery'}
                </span>
                <span className="text-gray-900 font-bold">
                  {shippingCost === 0 ? <span className="text-emerald-600">FREE</span> : formatPrice(shippingCost)}
                </span>
              </div>
              {taxDetails && (
                <div className="flex justify-between">
                  <span>
                    GST ({taxDetails.taxRate}%{taxDetails.isInterstate ? ' IGST' : ' CGST + SGST'})
                  </span>
                  <span className="text-gray-900 font-bold">{formatPrice(taxCost)}</span>
                </div>
              )}
              {!taxDetails && (
                <div className="flex justify-between">
                  <span>Estimated GST (18%)</span>
                  <span className="text-gray-900 font-bold">{formatPrice(taxCost)}</span>
                </div>
              )}

              <hr className="border-gray-50" />

              <div className="flex justify-between text-sm text-gray-800 pt-1 font-bold">
                <span>Gross Payable Total</span>
                <span className="text-black text-lg font-extrabold">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutRedirect}
              className="w-full bg-black hover:bg-neutral-800 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow active:scale-98"
            >
              Secure  Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Secure Payment tag */}
          <div className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1.5 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-gray-400" /> SSL Multi-Channel Encryption active.
          </div>
        </div>

      </div>

      {/* Mobile Sticky Checkout Button */}
      <div className="lg:hidden fixed bottom-20 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 shadow-2xl z-40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 font-medium">Total Amount</p>
            <p className="text-lg font-extrabold text-gray-900">{formatPrice(grandTotal)}</p>
          </div>
          <button
            onClick={handleCheckoutRedirect}
            className="flex-1 bg-black hover:bg-neutral-800 text-white font-semibold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 min-h-[48px]"
          >
            Checkout <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};
