import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, RefreshCw, ShieldCheck, Award, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Send, Heart, ArrowUp, Download, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Footer: React.FC = () => {
  const { categories } = useShop();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Detect user's platform
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isAndroid) {
      // Download APK for Android
      const apkUrl = '/downloads/modernshop-android.apk';
      const link = document.createElement('a');
      link.href = apkUrl;
      link.download = 'modernshop-android.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (isIOS) {
      // For iOS, redirect to App Store or provide IPA download instructions
      // Since IPA requires TestFlight or enterprise distribution, we'll show instructions
      alert('To install ModernShop on iOS:\n\n1. Download the IPA file from our secure link\n2. Open it on your iPhone/iPad\n3. Go to Settings > General > VPN & Device Management\n4. Trust the developer certificate\n5. The app will be installed\n\nOr download from TestFlight (link coming soon)');
    } else {
      // For desktop, show options
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowInstallBanner(false);
        }
        setDeferredPrompt(null);
      } else {
        // Show download options
        const downloadChoice = confirm('Download ModernShop Mobile App:\n\nClick OK for Android (APK)\nClick Cancel for iOS (IPA)');
        if (downloadChoice) {
          const apkUrl = '/downloads/modernshop-android.apk';
          const link = document.createElement('a');
          link.href = apkUrl;
          link.download = 'modernshop-android.apk';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          alert('iOS Download:\n\n1. Download the IPA file\n2. Open on your iOS device\n3. Install via Settings > General > VPN & Device Management\n4. Trust the certificate');
        }
      }
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setShowInstallBanner(false);
    }
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-2xl shadow-2xl shadow-emerald-500/30 z-50 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">Install ModernShop App</h4>
              <p className="text-xs text-emerald-100 mt-1">Get the full experience with offline access and faster loading.</p>
              <button
                onClick={handleInstallClick}
                className="mt-3 px-4 py-2 bg-white text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
              >
                Get Mobile App
              </button>
            </div>
            <button
              onClick={dismissBanner}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <footer className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-400 font-sans mt-auto border-t border-gray-800">
      {/* Enhanced Value Bar with hover effects */}
      <div className="border-b border-gray-800 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: Truck, title: 'Free Expedited Delivery', desc: 'Complementary on orders above $100' },
          { icon: RefreshCw, title: '30-Day Free Return', desc: 'Easy returns inside modern lockers' },
          { icon: ShieldCheck, title: 'Verified 100% Security', desc: 'SSL checkout powered by Stripe' },
          { icon: Award, title: 'Artisanal Quality Core', desc: 'Handpicked premium suppliers' }
        ].map((feature, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-start group cursor-default">
            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl group-hover:from-emerald-500/30 group-hover:to-emerald-600/30 transition-all duration-300">
              <feature.icon className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{feature.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Links Area with enhanced layout */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Brand & Pitch with newsletter */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-display font-extrabold text-xl shadow-lg shadow-emerald-500/30">
              M
            </div>
            <span className="font-display font-extrabold text-white text-xl tracking-tight">
              ModernShop
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Curating hyper-functional accessories, footwear, performance apparel, and modern smart home gadgets built to outlive fast trends.
          </p>
          
          {/* Newsletter Signup */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Stay Updated</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <button className="p-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all hover:scale-105 shadow-lg shadow-emerald-500/30">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-6 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></span>
            Store Collections
          </h4>
          <ul className="space-y-3 text-sm">
            {categories.slice(0, 6).map(cat => (
              <li key={cat.id}>
                <Link to={`/catalog?category=${cat.slug}`} className="hover:text-emerald-400 hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-emerald-400 transition-colors"></span>
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/catalog" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors inline-flex items-center gap-2 group">
                Browse Full Catalog
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Help & Support */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-6 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></span>
            Customer Support
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/login" className="hover:text-emerald-400 hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-emerald-400 transition-colors"></span>
                Personal Account Access
              </Link>
            </li>
            <li>
              <Link to="/dashboard?tab=orders" className="hover:text-emerald-400 hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-emerald-400 transition-colors"></span>
                Track Order Status
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-emerald-400 hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-emerald-400 transition-colors"></span>
                Manage Wishlist
              </Link>
            </li>
            <li>
              <Link to="/catalog" className="hover:text-emerald-400 hover:translate-x-1 transition-all duration-300 inline-flex items-center gap-2 group">
                <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-emerald-400 transition-colors"></span>
                Shipping & Returns
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span className="w-6 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></span>
            Contact Us
          </h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <Mail className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Email</p>
                <p className="text-gray-500">support@modernshop.com</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <Phone className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Phone</p>
                <p className="text-gray-500">+1 (555) 123-4567</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Address</p>
                <p className="text-gray-500">123 Commerce St, NY 10001</p>
              </div>
            </li>
          </ul>

          {/* Social Media Links */}
          <div className="flex gap-3 pt-4">
            {[Facebook, Twitter, Instagram, Linkedin].map((SocialIcon, idx) => (
              <a
                key={idx}
                href="#"
                className="p-2.5 bg-gray-800 hover:bg-emerald-500 rounded-xl transition-all duration-300 hover:scale-110 group"
              >
                <SocialIcon className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bottom bar with enhanced design */}
      <div className="bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500">
                © 2026 ModernShop Corp. All sovereign rights reserved. Constructed client-server layout.
              </p>
              <p className="text-xs text-gray-600 mt-1 flex items-center justify-center md:justify-start gap-1">
                Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for modern shoppers
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link to="#" className="text-gray-500 hover:text-emerald-400 transition-colors">Privacy Policy</Link>
              <Link to="#" className="text-gray-500 hover:text-emerald-400 transition-colors">Service Terms</Link>
              <Link to="#" className="text-gray-500 hover:text-emerald-400 transition-colors">Sitemap</Link>
              <Link to="#" className="text-gray-500 hover:text-emerald-400 transition-colors">Cookie Policy</Link>
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all hover:scale-105 shadow-lg shadow-emerald-500/30"
              >
                <Download className="w-4 h-4" />
                <span>Get App</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-110 transition-all duration-300 z-40"
        title="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
    </>
  );
};
