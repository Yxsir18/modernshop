import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PageTransition } from './components/PageTransition';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { CartPage } from './pages/CartPage';
import { Checkout } from './pages/Checkout';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { WishlistPage } from './pages/WishlistPage';
import { ResetPassword } from './pages/ResetPassword';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { OrderTracking } from './pages/OrderTracking';

// Comparison Deck Utility Component
import { CompareUtility } from './components/CompareUtility';

// Icon import for micro absolute toast
import { CheckCircle, AlertTriangle, AlertCircle, Sparkles, X } from 'lucide-react';

// ScrollToTop component to reset viewport on route jumps
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

// Custom interactive Alert toast banner synced to global trigger notification matrices
const SovereignAlertBar: React.FC = () => {
  const { alertBar, setAlertBar } = useShop();

  if (!alertBar || !alertBar.message || !alertBar.type) return null;

  const getGradientBg = () => {
    switch (alertBar.type) {
      case 'success':
        return 'bg-gradient-to-br from-emerald-900/95 via-emerald-800/90 to-black/95 border-emerald-500/40 shadow-emerald-500/20';
      case 'warning':
        return 'bg-gradient-to-br from-amber-900/95 via-amber-800/90 to-black/95 border-amber-500/40 shadow-amber-500/20';
      case 'info':
        return 'bg-gradient-to-br from-blue-900/95 via-blue-800/90 to-black/95 border-blue-500/40 shadow-blue-500/20';
      default:
        return 'bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-black/95 border-gray-500/40';
    }
  };

  const getIconBg = () => {
    switch (alertBar.type) {
      case 'success':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'warning':
        return 'bg-amber-500/20 text-amber-400';
      case 'info':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getProgressColor = () => {
    switch (alertBar.type) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
      case 'warning':
        return 'bg-gradient-to-r from-amber-400 to-amber-500';
      case 'info':
        return 'bg-gradient-to-r from-blue-400 to-blue-500';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-right-8 fade-in duration-300">
      <div
        onMouseEnter={() => setAlertBar(prev => ({ ...prev, paused: true }))}
        onMouseLeave={() => setAlertBar(prev => ({ ...prev, paused: false }))}
        className={`relative overflow-hidden backdrop-blur-xl rounded-2xl border-2 text-white shadow-2xl w-96 ${getGradientBg()} transition-all duration-300 hover:scale-105 hover:shadow-3xl`}
      >
        {/* Animated background glow effect */}
        <div className={`absolute inset-0 opacity-30 animate-pulse ${alertBar.type === 'success' ? 'bg-emerald-500/10' : alertBar.type === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`} />
        
        {/* Decorative corner accent */}
        <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-50 ${alertBar.type === 'success' ? 'bg-emerald-400/20' : alertBar.type === 'warning' ? 'bg-amber-400/20' : 'bg-blue-400/20'}`} />

        <div className="relative flex items-start gap-4 p-5">
          {/* Icon with animated background */}
          <div className={`flex-shrink-0 p-3 rounded-xl ${getIconBg()} animate-in zoom-in duration-300`}>
            {alertBar.type === 'success' && <CheckCircle className="w-6 h-6" />}
            {alertBar.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
            {alertBar.type === 'info' && <Sparkles className="w-6 h-6" />}
          </div>
          
          <div className="flex-1 text-left min-w-0">
            {alertBar.title && (
              <p className="text-sm font-bold font-display tracking-tight text-white mb-1 animate-in slide-in-from-left-2 duration-300">
                {alertBar.title}
              </p>
            )}
            <p className="text-xs text-gray-200 leading-relaxed font-medium animate-in slide-in-from-left-2 duration-300 delay-75">
              {alertBar.message}
            </p>
          </div>

          <button
            onClick={() => setAlertBar(prev => ({ ...prev, message: '', type: null, progress: 0, paused: false }))}
            className="flex-shrink-0 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enhanced progress bar with glow effect */}
        <div className="relative h-1.5 w-full bg-black/30">
          <div
            className={`absolute top-0 left-0 h-full ${getProgressColor()} transition-all duration-100 ease-out shadow-lg`}
            style={{ width: `${alertBar.progress ?? 0}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ShopProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 overflow-x-hidden selection:bg-neutral-800 selection:text-white">
            <Header />
            <main className="flex-grow pb-16 lg:pb-0">
              <PageTransition>
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PageTransition>
          </main>
          <Footer />
          <MobileBottomNav />
          <SovereignAlertBar />
          <CompareUtility />
        </div>
      </BrowserRouter>
    </ShopProvider>
    </ErrorBoundary>
  );
}
