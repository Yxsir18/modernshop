import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Sparkles, ArrowRight, Lock, Mail, ChevronLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { resetPassword, triggerNotification } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Get email and token from URL params if present
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    if (emailParam) setEmail(emailParam);
    if (tokenParam) setResetToken(tokenParam);
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !resetToken || !password || !confirmPassword) {
      triggerNotification('All Fields Required', 'Please fill in all fields.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      triggerNotification('Passwords Do Not Match', 'Please make sure your passwords match.', 'warning');
      return;
    }

    if (password.length < 6) {
      triggerNotification('Password Too Short', 'Password must be at least 6 characters long.', 'warning');
      return;
    }

    setLoading(true);
    const res = await resetPassword(email, resetToken, password);
    setLoading(false);

    if (res.success) {
      triggerNotification('Password Reset Successful', res.message || 'Your password has been reset successfully.', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      triggerNotification('Reset Failed', res.error || 'Failed to reset password. Please try again.', 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-6 sm:p-10 shadow-xl shadow-gray-200/50 space-y-6">
        
        {/* Title */}
        <div className="space-y-1.5 text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-black to-gray-800 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-display font-extrabold shadow-lg shadow-gray-900/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display font-extrabold text-3xl text-gray-900 tracking-tight mt-4">Reset Password</h2>
          <p className="text-sm text-gray-600 font-medium font-sans">Enter your new password below</p>
        </div>

        {/* Form elements */}
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs font-semibold text-gray-700">
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
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Reset Token</label>
            <input
              type="text"
              placeholder="Enter the reset token from email"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all"
              required
            />
            <p className="text-[10px] text-gray-500">In development mode, the token is shown in the notification after requesting a reset.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">New Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400"><Lock className="w-4.5 h-4.5" /></span>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Confirm New Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400"><Lock className="w-4.5 h-4.5" /></span>
              <input
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 font-semibold transition-all"
                required
                minLength={6}
              />
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
                Resetting...
              </>
            ) : (
              <>
                Reset Password <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <hr className="border-gray-200/60" />

        <p className="text-xs text-gray-600 text-center font-medium">
          Remember your password?{' '}
          <Link to="/login" className="text-black font-bold hover:text-emerald-600 transition-colors inline-flex items-center gap-0.5">
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </p>

      </div>
    </div>
  );
};
