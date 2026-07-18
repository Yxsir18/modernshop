import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Sparkles, ArrowRight, Lock, Mail, ChevronRight, X, Eye, EyeOff, Phone } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, triggerNotification, user, token, forgotPassword, resetPassword } = useShop();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && token) {
      console.log('User already logged in, redirecting to dashboard');
      const targetPath = user.role === 'admin' || user.role === 'super-admin' 
        ? '/admin' 
        : '/dashboard';
      window.location.replace(targetPath);
    }
  }, [user, token, navigate]);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('ms_remember_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    if ((!email && !phone) || !password) {
      console.log('Missing email/phone or password');
      return;
    }
    console.log('Setting loading to true');
    setLoading(true);

    console.log('Attempting login with:', email || phone, 'rememberMe:', rememberMe);
    const res = await login(email || phone, password, rememberMe);
    console.log('Login response:', res);
    setLoading(false);

    if (res.success) {
      console.log('Login successful, redirecting to dashboard. User:', res.user);
      // Silent auth: smooth redirect (avoid toast spam)
      // Redirect based on role
      const targetPath = res.user.role === 'admin' || res.user.role === 'super-admin'
        ? '/admin'
        : '/dashboard';

      console.log('Navigating to:', targetPath);
      console.log('Redirecting in 2 seconds...');

      // Add delay to allow reading console logs
      setTimeout(() => {
        console.log('Executing redirect now');
        window.location.replace(targetPath);
      }, 2000);
    } else {
      console.log('Login failed:', res.error);
      triggerNotification('Authentication Denied', res.error || 'Check email structure or credentials.', 'warning');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail && !forgotPhone) {
      triggerNotification('Email or Phone Required', 'Please enter your email address or phone number.', 'warning');
      return;
    }
    setForgotLoading(true);
    const res = await forgotPassword(forgotEmail || forgotPhone);
    setForgotLoading(false);

    if (res.success) {
      triggerNotification('OTP Sent', res.message || 'OTP has been sent to your registered contact.', 'success');
      setShowOtpInput(true);
      // In development, show the OTP
      if (res.otp) {
        console.log('DEV MODE - OTP:', res.otp);
        triggerNotification('Dev Mode OTP', `Your OTP: ${res.otp}`, 'info');
      }
    } else {
      triggerNotification('Request Failed', res.error || 'Failed to send OTP.', 'warning');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!forgotEmail && !forgotPhone) || !otp || !newPassword) {
      triggerNotification('All Fields Required', 'Please enter email or phone, OTP, and new password.', 'warning');
      return;
    }
    setResetPasswordLoading(true);
    const res = await resetPassword(forgotEmail || forgotPhone, otp, newPassword);
    setResetPasswordLoading(false);

    if (res.success) {
      triggerNotification('Password Reset', res.message || 'Password reset successfully.', 'success');
      setShowForgotModal(false);
      setShowOtpInput(false);
      setForgotEmail('');
      setForgotPhone('');
      setOtp('');
      setNewPassword('');
    } else {
      triggerNotification('Reset Failed', res.error || 'Failed to reset password.', 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-6 sm:p-10 shadow-xl shadow-gray-200/50 space-y-6">
        
        {/* Title */}
        <div className="space-y-1.5 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-black to-gray-800 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-display font-extrabold shadow-lg shadow-gray-900/20">
            M
          </div>
          <h2 className="font-display font-extrabold text-3xl text-gray-900 tracking-tight mt-4">Welcome back</h2>
          <p className="text-sm text-gray-600 font-medium font-sans">Enter your credentials to access your account</p>
        </div>

        {/* Form elements */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-semibold text-gray-700">
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${loginMethod === 'email' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${loginMethod === 'phone' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Phone
            </button>
          </div>

          {loginMethod === 'email' ? (
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Mail className="w-4.5 h-4.5" /></span>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all"
                  required={loginMethod === 'email'}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400"><Phone className="w-4.5 h-4.5" /></span>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all"
                  required={loginMethod === 'phone'}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400"><Lock className="w-4.5 h-4.5" /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all"
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
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-black focus:ring-black/20"
                />
                <span className="text-[10px] text-gray-600 font-semibold">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[10px] text-gray-600 hover:text-black font-semibold transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <hr className="border-gray-200/60" />

        <p className="text-xs text-gray-600 text-center font-medium">
          New to ModernShop?{' '}
          <Link to="/register" className="text-black font-bold hover:text-emerald-600 transition-colors inline-flex items-center gap-0.5">
            Create account <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </p>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-xl text-gray-900">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setShowOtpInput(false);
                  setForgotEmail('');
                  setOtp('');
                  setNewPassword('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!showOtpInput ? (
              <>
                <p className="text-sm text-gray-600">
                  Enter your email address or phone number and we'll send you an OTP to reset your password.
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400"><Mail className="w-4.5 h-4.5" /></span>
                      <input
                        type="email"
                        placeholder="customer@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all"
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
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Enter the OTP sent to your registered contact and your new password.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">OTP</label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold text-center text-lg tracking-widest transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">New Password</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400"><Lock className="w-4.5 h-4.5" /></span>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetPasswordLoading}
                    className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetPasswordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
