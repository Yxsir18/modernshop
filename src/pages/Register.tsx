import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ArrowRight, UserPlus, Lock, Mail, ChevronRight, Gift, Eye, EyeOff, CheckCircle2, Phone, Shield, Truck, Star, Zap, Heart, Award } from 'lucide-react';

export const Register: React.FC = () => {
  const { register, triggerNotification } = useShop();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      triggerNotification('Passwords Do Not Match', 'Please ensure both password fields are identical.', 'warning');
      return;
    }

    if (!acceptTerms) {
      triggerNotification('Terms Required', 'Please accept the terms and conditions to continue.', 'warning');
      return;
    }

    setLoading(true);

    const res = await register({ name, email, phone, password, confirmPassword, referrerCode: referral, subscribeNewsletter });
    setLoading(false);

    if (res.success) {
      triggerNotification('Welcome Aboard!', 'Your account was created successfully.', 'success');
      navigate('/dashboard');
    } else {
      triggerNotification('Registration Failed', res.error || 'Check email structure.', 'warning');
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-orange-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-emerald-500';
    return 'bg-green-600';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    if (strength <= 4) return 'Strong';
    return 'Excellent';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Benefits */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <h1 className="font-display font-extrabold text-5xl text-gray-900 tracking-tight">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">ModernShop?</span>
            </h1>
            <p className="text-lg text-gray-600 font-medium leading-relaxed">
              Join thousands of satisfied customers who enjoy premium shopping experience with exclusive benefits.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 space-y-3 card-micro hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Loyalty Rewards</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Earn points on every purchase and redeem for discounts</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 space-y-3 card-micro hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Fast Delivery</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Quick shipping with real-time tracking updates</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 space-y-3 card-micro hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Secure Payments</h3>
              <p className="text-xs text-gray-600 leading-relaxed">100% secure transactions with buyer protection</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 space-y-3 card-micro hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Premium Quality</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Curated products from trusted brands worldwide</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">
                  {i}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">10,000+ Happy Customers</p>
              <p className="text-xs text-gray-500">Join our growing community</p>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-6 sm:p-10 shadow-xl shadow-gray-200/50 space-y-6">
        
          {/* Header Title */}
          <div className="space-y-1.5 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-black to-gray-800 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-display font-extrabold shadow-lg shadow-gray-900/20">
              M
            </div>
            <h2 className="font-display font-extrabold text-3xl text-gray-900 tracking-tight mt-4">Create account</h2>
            <p className="text-sm text-gray-600 font-medium font-sans">Join ModernShop and start earning rewards</p>
          </div>

          {/* Promo notice */}
          <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 text-[11px] text-yellow-800 rounded-2xl border border-yellow-200 flex gap-3 items-start leading-relaxed shadow-sm">
            <Gift className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p>Registering fresh accounts instantly accrues <strong>5 Sovereign Loyalty Points</strong>. Specifying a valid referral code adds <strong>10 bonus points</strong> automatically!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-semibold text-gray-700">
            
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Your Name</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><UserPlus className="w-4.5 h-4.5" /></span>
                <input
                  type="text"
                  placeholder="e.g., Jennifer Lawrence"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all input-focus"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Mail className="w-4.5 h-4.5" /></span>
                <input
                  type="email"
                  placeholder="jennifer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all input-focus"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Phone className="w-4.5 h-4.5" /></span>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all input-focus"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Lock className="w-4.5 h-4.5" /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all input-focus"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor(getPasswordStrength(password))}`}
                        style={{ width: `${(getPasswordStrength(password) / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-gray-600">{getStrengthLabel(getPasswordStrength(password))}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8px] text-gray-500">
                    <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-emerald-600' : ''}`}>
                      <CheckCircle2 className={`w-3 h-3 ${password.length >= 8 ? 'text-emerald-600' : 'text-gray-300'}`} />
                      8+ characters
                    </div>
                    <div className={`flex items-center gap-1 ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-emerald-600' : ''}`}>
                      <CheckCircle2 className={`w-3 h-3 ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-emerald-600' : 'text-gray-300'}`} />
                      Upper & lower
                    </div>
                    <div className={`flex items-center gap-1 ${/\d/.test(password) ? 'text-emerald-600' : ''}`}>
                      <CheckCircle2 className={`w-3 h-3 ${/\d/.test(password) ? 'text-emerald-600' : 'text-gray-300'}`} />
                      Number
                    </div>
                    <div className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-emerald-600' : ''}`}>
                      <CheckCircle2 className={`w-3 h-3 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-emerald-600' : 'text-gray-300'}`} />
                      Special char
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Lock className="w-4.5 h-4.5" /></span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all input-focus"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-[9px] ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                  {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            <div className="space-y-2 font-medium">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Referral Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g., REF-XXXXXX"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 uppercase font-mono transition-all input-focus"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 text-black focus:ring-black/20"
                  required
                />
                <span className="text-[10px] text-gray-600 font-semibold leading-relaxed">
                  I agree to the <Link to="/terms" className="text-black font-bold hover:text-emerald-600 transition-colors">Terms of Service</Link> and <Link to="/privacy" className="text-black font-bold hover:text-emerald-600 transition-colors">Privacy Policy</Link>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-black focus:ring-black/20"
                />
                <span className="text-[10px] text-gray-600 font-semibold">
                  Subscribe to newsletter for exclusive deals and updates
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed button-ripple"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <hr className="border-gray-200/60" />

          <p className="text-xs text-gray-600 text-center font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-black font-bold hover:text-emerald-600 transition-colors inline-flex items-center gap-0.5">
              Sign in <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};
