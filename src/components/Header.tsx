import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useNotification } from '../hooks/useNotification';
import { formatPrice } from '../utils/currency';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Bell,
  LogOut,
  Sliders,
  Sparkles,
  History,
  X,
  ChevronDown,
  Lock,
  Wifi,
  WifiOff,
  Moon,
  Sun,
  Info,
  CheckCircle,
  AlertTriangle,
  Gift,
  Filter,
  Trash2,
  Volume2,
  VolumeX,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, cart, wishlist, notifications, recentSearches, trendingSearches, addRecentSearch, clearRecentSearches, products, headerConfig, markNotificationAsRead, markAllNotificationsAsRead, dismissNotification, clearNotifications, darkMode, setDarkMode, categories } = useShop();
  const { connected, pingLatency, sendPing } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'promotion'>('all');
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const navigate = useNavigate();
  const suggestRef = useRef<HTMLDivElement>(null);

  // Handle scroll for transparent-to-solid header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close suggests on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    addRecentSearch(searchQuery.trim());
    setShowSuggestions(false);
    setShowMobileSearch(false);
    navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSuggestionClick = (query: string) => {
    setSearchQuery(query);
    addRecentSearch(query);
    setShowSuggestions(false);
    navigate(`/catalog?search=${encodeURIComponent(query)}`);
  };

  // Find matches for Suggestions (limit 5)
  const matchingProducts = searchQuery.trim()
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unreadNotifs = notifications.filter(n => !n.read).length;

  // Filter notifications based on selected type
  const filteredNotifications = notificationFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === notificationFilter);

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notif) => {
    const date = new Date(notif.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notif);
    return groups;
  }, {} as Record<string, typeof notifications>);

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'promotion':
        return <Gift className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  // Get color classes for notification type
  const getNotificationColorClasses = (type: string, isDark: boolean) => {
    switch (type) {
      case 'success':
        return isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600';
      case 'warning':
        return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600';
      case 'promotion':
        return isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600';
      default:
        return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600';
    }
  };

  const logoText = headerConfig?.logoText || 'ModernShop';
  const logoIcon = headerConfig?.logoIcon || 'M';
  const searchPlaceholder = headerConfig?.searchPlaceholder || 'Search products, brands, categories...';
  const announcementBanner = headerConfig?.announcementBanner;

  return (
    <>
      {/* Announcement Banner */}
      {announcementBanner?.enabled && announcementBanner.text && (
        <div
          className="w-full text-center py-2.5 text-xs font-semibold animate-pulse"
          style={{ backgroundColor: announcementBanner.backgroundColor, color: announcementBanner.textColor }}
        >
          {announcementBanner.text}
        </div>
      )}
      
      {/* Mobile Header */}
      <header className={`lg:hidden sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-all duration-300 ${isScrolled ? (darkMode ? 'bg-gray-900/95 border-gray-700/60 shadow-lg' : 'bg-white/95 border-gray-200/60 shadow-lg') : (darkMode ? 'bg-gray-900/0 border-transparent' : 'bg-white/0 border-transparent')}`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-black to-gray-800 rounded-lg flex items-center justify-center text-white font-display font-extrabold text-sm">
              {logoIcon}
            </div>
            <span className={`font-display font-bold text-sm tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {logoText}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobileSearch(true)}
              className={`p-2 rounded-lg ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Search className="w-5 h-5" />
            </button>
            <Link to="/cart" className="relative p-2 rounded-lg">
              <ShoppingBag className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`absolute top-0 left-0 right-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl animate-in slide-in-from-top duration-300`}>
            <div className="px-4 py-4 flex items-center gap-3">
              <button
                onClick={() => setShowMobileSearch(false)}
                className={`p-2 rounded-lg ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className={`w-full border rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-500 focus:ring-gray-500/20' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-black focus:ring-black/5'}`}
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-xl hover:bg-gray-800 transition-all duration-300">
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Mobile Search Suggestions */}
            {showSuggestions && (
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className={`flex items-center justify-between text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      <span className="font-medium uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" /> Recent Searches
                      </span>
                      <button onClick={clearRecentSearches} className={`hover:text-red-500 px-2 py-1 rounded-lg transition-all ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}>
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recentSearches.map((sq, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            handleSuggestionClick(sq);
                            setShowMobileSearch(false);
                          }}
                          className={`border text-xs px-3 py-1.5 rounded-full transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600 hover:text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-black hover:bg-black hover:text-white'}`}
                        >
                          {sq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div className={`p-4 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    <span className="font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Trending Searches
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trendingSearches.map((sq, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleSuggestionClick(sq);
                          setShowMobileSearch(false);
                        }}
                        className={`border text-xs px-3 py-1.5 rounded-full transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600 hover:text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-black hover:bg-black hover:text-white'}`}
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggestions List */}
                {searchQuery.trim() && (
                  <div className="p-2">
                    <span className={`block text-[10px] font-bold uppercase tracking-wider px-3 pt-2 pb-1 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      Matching Products
                    </span>
                    {matchingProducts.length > 0 ? (
                      matchingProducts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            addRecentSearch(p.name);
                            setShowSuggestions(false);
                            setShowMobileSearch(false);
                            navigate(`/product/${p.slug}`);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                        >
                          <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-xl" />
                          <div className="text-left flex-1">
                            <p className={`text-sm font-semibold line-clamp-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{p.name}</p>
                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>${(p.discountPrice || p.price).toFixed(2)}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className={`p-4 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        No matching products found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <header className={`sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-all duration-300 hidden lg:block ${isScrolled ? (darkMode ? 'bg-gray-900/95 border-gray-700/60 shadow-lg' : 'bg-white/95 border-gray-200/60 shadow-lg') : (darkMode ? 'bg-gray-900/0 border-transparent' : 'bg-white/0 border-transparent')}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-10 h-10 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center text-white font-display font-extrabold text-xl tracking-tight shadow-lg shadow-black/20 group-hover:shadow-xl group-hover:shadow-black/30 transition-all duration-300 group-hover:scale-105">
                {logoIcon}
              </div>
              <span className={`font-display font-bold text-xl tracking-tight hidden sm:block transition-colors ${darkMode ? 'text-white group-hover:text-gray-200' : 'text-gray-900 group-hover:text-black'}`}>
                {logoText}
              </span>
            </Link>

            {/* Category Mega Menu Trigger */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowMegaMenu(true)}
                onMouseLeave={() => setShowMegaMenu(false)}
                className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}
              >
                <Sliders className="w-4 h-4" />
                <span className="text-sm font-medium">Categories</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Mega Menu Dropdown */}
              {showMegaMenu && (
                <div
                  onMouseEnter={() => setShowMegaMenu(true)}
                  onMouseLeave={() => setShowMegaMenu(false)}
                  className={`absolute left-0 top-full mt-2 w-[600px] backdrop-blur-xl rounded-2xl shadow-2xl border p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200/60'}`}
                >
                  <div className="grid grid-cols-3 gap-6">
                    {categories.slice(0, 6).map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/catalog?category=${cat.slug}`}
                        className="group"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-gray-100">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <h4 className={`text-sm font-semibold group-hover:text-emerald-500 transition-colors ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {cat.name}
                        </h4>
                        <p className={`text-xs mt-1 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {cat.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-center">
                    <Link
                      to="/catalog"
                      className={`text-sm font-semibold flex items-center gap-2 hover:text-emerald-500 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                      onClick={() => setShowMegaMenu(false)}
                    >
                      View All Categories
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

          {/* Search Box */}
          <div ref={suggestRef} className="flex-1 max-w-xl mx-4 relative hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative w-full group">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className={`w-full border rounded-2xl py-3 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm group-hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-500 focus:ring-gray-500/20 focus:bg-gray-750' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 text-gray-900 focus:border-black focus:ring-black/5 focus:bg-white'}`}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-xl hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg">
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Suggestions Overlay */}
            {showSuggestions && (
              <div className={`absolute top-full left-0 right-0 mt-2 backdrop-blur-xl rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200/60'}`}>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className={`p-4 border-b bg-gradient-to-br ${darkMode ? 'border-gray-700 from-gray-750/50 to-gray-800' : 'border-gray-100 from-gray-50/50 to-white'}`}>
                    <div className={`flex items-center justify-between text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      <span className="font-medium uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" /> Recent Searches
                      </span>
                      <button onClick={clearRecentSearches} className={`hover:text-red-500 px-2 py-1 rounded-lg transition-all ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}>
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recentSearches.map((sq, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(sq)}
                          className={`border text-xs px-3 py-1.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600 hover:text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-black hover:bg-black hover:text-white'}`}
                        >
                          {sq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div className={`p-4 border-b bg-gradient-to-br ${darkMode ? 'border-gray-700 from-gray-750/50 to-gray-800' : 'border-gray-100 from-gray-50/50 to-white'}`}>
                  <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    <span className="font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Trending Searches
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trendingSearches.map((sq, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(sq)}
                        className={`border text-xs px-3 py-1.5 rounded-full transition-all duration-300 shadow-sm hover:shadow-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600 hover:text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-black hover:bg-black hover:text-white'}`}
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggestions List */}
                <div className="p-2">
                  <span className={`block text-[10px] font-bold uppercase tracking-wider px-3 pt-2 pb-1 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    Matching Catalog Items
                  </span>
                  {matchingProducts.length > 0 ? (
                    matchingProducts.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.slug}`}
                        onClick={() => {
                          addRecentSearch(p.name);
                          setShowSuggestions(false);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${darkMode ? 'hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-800' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-white'}`}
                      >
                        <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow" />
                        <div className="text-left flex-1">
                          <p className={`text-sm font-semibold line-clamp-1 transition-colors ${darkMode ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black'}`}>{p.name}</p>
                          <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>${(p.discountPrice || p.price).toFixed(2)}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 group-hover:rotate-[-90deg] transition-all duration-300 ${darkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-400 group-hover:text-black'}`} />
                      </Link>
                    ))
                  ) : searchQuery.trim() ? (
                    <div className={`p-4 text-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No matching products discovered for "{searchQuery}"
                    </div>
                  ) : (
                    <div className={`p-4 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Start typing to discover automated recommendation matches...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center ${darkMode ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5.5 h-5.5" /> : <Moon className="w-5.5 h-5.5" />}
            </button>

            {/* Mobile search navigation trigger */}
            <Link to="/catalog" className={`p-3 rounded-xl transition-all duration-300 md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}>
              <Search className="w-5.5 h-5.5" />
            </Link>

            {/* Wishlist */}
            <Link to="/wishlist" className={`p-3 hover:scale-110 rounded-xl transition-all duration-300 relative group min-w-[44px] min-h-[44px] flex items-center justify-center ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}>
              <Heart className={`w-5.5 h-5.5 group-hover:fill-red-500 group-hover:text-red-500 transition-all duration-300 ${darkMode ? 'text-gray-300' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Icon with Mini Preview */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCartDropdown(!showCartDropdown);
                  setShowNotificationDropdown(false);
                  setShowUserDropdown(false);
                }}
                className={`p-3 hover:scale-110 rounded-xl transition-all duration-300 relative group min-w-[44px] min-h-[44px] flex items-center justify-center ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}
              >
                <ShoppingBag className={`w-5.5 h-5.5 group-hover:fill-black transition-all duration-300 ${darkMode ? 'text-gray-300 group-hover:fill-white' : ''}`} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-black to-gray-800 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg shadow-black/30">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mini Cart Preview Dropdown */}
              {showCartDropdown && (
                <div className={`absolute right-0 mt-3 w-80 backdrop-blur-xl rounded-2xl shadow-2xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200/60'}`}>
                  <div className={`px-4 py-3 border-b bg-gradient-to-br ${darkMode ? 'border-gray-700 from-gray-750 to-gray-800' : 'border-gray-100 from-gray-50 to-white'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Shopping Cart ({cartCount})
                      </span>
                      <Link
                        to="/cart"
                        onClick={() => setShowCartDropdown(false)}
                        className="text-[10px] font-semibold text-emerald-500 hover:text-emerald-600 transition-colors"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                  
                  {cart.length > 0 ? (
                    <>
                      <div className="max-h-64 overflow-y-auto p-2">
                        {cart.slice(0, 3).map((item) => (
                          <div
                            key={`${item.product.id}-${Object.values(item.selectedVariant).join('-')}`}
                            className={`flex gap-3 p-3 rounded-xl transition-all duration-200 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                          >
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-xl"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold line-clamp-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {item.product.name}
                              </p>
                              {item.selectedVariant.size && (
                                <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Size: {item.selectedVariant.size}
                                </p>
                              )}
                              {item.selectedVariant.color && (
                                <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Color: {item.selectedVariant.color}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <span className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {formatPrice(item.product.discountPrice || item.product.price)} × {item.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={`px-4 py-3 border-t bg-gradient-to-br flex items-center justify-between ${darkMode ? 'border-gray-700 from-gray-750 to-gray-800' : 'border-gray-100 from-gray-50 to-white'}`}>
                        <div>
                          <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subtotal</span>
                          <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(cart.reduce((sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity, 0))}
                          </p>
                        </div>
                        <Link
                          to="/cart"
                          onClick={() => setShowCartDropdown(false)}
                          className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105"
                        >
                          Checkout
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className={`p-8 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Your cart is empty
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* App Alerts (In-App notification list) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowUserDropdown(false);
                }}
                className={`p-3 hover:scale-110 rounded-xl transition-all duration-300 relative min-w-[44px] min-h-[44px] flex items-center justify-center ${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-black hover:bg-gray-100'}`}
              >
                <Bell className="w-5.5 h-5.5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-full animate-pulse shadow-lg shadow-red-500/30" />
                )}
              </button>

              {showNotificationDropdown && (
                <div className={`absolute right-0 mt-3 w-96 backdrop-blur-xl rounded-2xl shadow-2xl border py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200/60'}`}>
                  <div className={`px-4 py-3 border-b bg-gradient-to-br ${darkMode ? 'border-gray-700 from-gray-750 to-gray-800' : 'border-gray-100 from-gray-50 to-white'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notifications</span>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className={`text-[10px] font-mono flex items-center gap-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {connected ? `${pingLatency !== null ? `${pingLatency}ms` : 'Sync'}` : 'Offline'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadNotifs > 0 && <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold shadow-sm ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-600'}`}>{unreadNotifs} New</span>}
                        <button
                          onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
                          className={`p-1.5 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                          title={notificationSoundEnabled ? 'Disable Sound' : 'Enable Sound'}
                        >
                          {notificationSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    {/* Filter Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setNotificationFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all ${notificationFilter === 'all' ? (darkMode ? 'bg-blue-600 text-white' : 'bg-black text-white') : (darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setNotificationFilter('info')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all ${notificationFilter === 'info' ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') : (darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}
                      >
                        Info
                      </button>
                      <button
                        onClick={() => setNotificationFilter('success')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all ${notificationFilter === 'success' ? (darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white') : (darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}
                      >
                        Success
                      </button>
                      <button
                        onClick={() => setNotificationFilter('warning')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all ${notificationFilter === 'warning' ? (darkMode ? 'bg-amber-600 text-white' : 'bg-amber-600 text-white') : (darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}
                      >
                        Warning
                      </button>
                      <button
                        onClick={() => setNotificationFilter('promotion')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all ${notificationFilter === 'promotion' ? (darkMode ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white') : (darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}
                      >
                        Promo
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {filteredNotifications.length > 0 ? (
                      Object.entries(groupedNotifications).map(([date, notifs]) => (
                        <div key={date}>
                          <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider sticky top-0 backdrop-blur-sm ${darkMode ? 'bg-gray-800/95 text-gray-400' : 'bg-white/95 text-gray-500'}`}>
                            {date === new Date().toDateString() ? 'Today' : date}
                          </div>
                          {notifs.map((n) => (
                            <div
                              key={n.id}
                              className={`p-4 border-b hover:bg-gradient-to-r transition-all duration-200 ${darkMode ? 'border-gray-700 hover:from-gray-700 hover:to-gray-800' : 'border-gray-50 hover:from-gray-50 hover:to-white'} ${!n.read ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50/30') : ''}`}
                            >
                              <div className="flex gap-3 items-start">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationColorClasses(n.type, darkMode)}`}>
                                  {getNotificationIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{n.title}</p>
                                      <p className={`text-[11px] mt-0.5 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{n.message}</p>
                                      <span className={`text-[9px] mt-1 block ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(n.date).toLocaleString()}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        dismissNotification(n.id);
                                      }}
                                      className={`p-1 rounded-lg transition-all ${darkMode ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                                      title="Dismiss"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className={`p-8 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {notificationFilter === 'all' ? 'No notifications discovered.' : `No ${notificationFilter} notifications found.`}
                      </div>
                    )}
                  </div>
                  <div className={`px-4 py-2.5 border-t bg-gradient-to-br flex items-center justify-between text-[10px] font-mono ${darkMode ? 'border-gray-700 from-gray-750 to-gray-800' : 'border-gray-100 from-gray-50 to-white'}`}>
                    <span className={`flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {connected ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-rose-500" />}
                      Channel: {user ? 'RoomActive' : 'GuestMode'}
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadNotifs > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAllNotificationsAsRead();
                          }}
                          className={`font-semibold uppercase tracking-wider text-[9px] hover:underline transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                        >
                          Mark All Read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotifications();
                          }}
                          className="text-red-600 hover:text-red-700 font-semibold uppercase tracking-wider text-[9px] hover:underline transition-colors"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendPing();
                        }}
                        className={`font-semibold uppercase tracking-wider text-[9px] hover:underline transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                      >
                        Ping
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowNotificationDropdown(false);
                  }}
                  className="flex items-center gap-2 focus:outline-none group"
                >
                  <div className="relative">
                    <img
                      src={user.profilePhoto || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={user.name}
                      className={`w-9 h-9 rounded-xl object-cover ring-2 transition-all duration-300 shadow-sm ${darkMode ? 'ring-gray-600 group-hover:ring-gray-400' : 'ring-gray-200 group-hover:ring-black'}`}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-colors hidden sm:block ${darkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'}`} />
                </button>

                {showUserDropdown && (
                  <div className={`absolute right-0 mt-3 w-64 backdrop-blur-xl rounded-2xl shadow-2xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200/60'}`}>
                    <div className={`px-4 py-3 border-b bg-gradient-to-br ${darkMode ? 'border-gray-700 from-gray-750 to-gray-800' : 'border-gray-100 from-gray-50 to-white'}`}>
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profilePhoto || user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={user.name}
                          className={`w-10 h-10 rounded-xl object-cover ring-2 ${darkMode ? 'ring-gray-600' : 'ring-gray-200'}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold line-clamp-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user.name}</p>
                          <p className={`text-xs line-clamp-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                        </div>
                      </div>
                      <div className={`mt-2 flex items-center gap-1.5 text-[10px] w-fit px-2.5 py-1 rounded-lg font-semibold shadow-sm ${darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700'}`}>
                        🏆 {user.loyaltyPoints} Points
                      </div>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserDropdown(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 w-full text-left group ${darkMode ? 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-800' : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white'}`}
                      >
                        <UserIcon className={`w-4 h-4 transition-colors ${darkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'}`} /> Personal Dashboard
                      </Link>

                      <Link
                        to="/dashboard?tab=orders"
                        onClick={() => setShowUserDropdown(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 w-full text-left group ${darkMode ? 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-800' : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white'}`}
                      >
                        <ShoppingBag className={`w-4 h-4 transition-colors ${darkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'}`} /> Track Order
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserDropdown(false)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 w-full text-left font-medium group ${darkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`}
                        >
                          <Lock className={`w-4 h-4 transition-colors ${darkMode ? 'group-hover:text-blue-300' : 'group-hover:text-blue-700'}`} /> Administration Panel
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                          navigate('/login');
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 w-full text-left group ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
                      >
                        <LogOut className={`w-4 h-4 transition-colors ${darkMode ? 'group-hover:text-red-300' : 'group-hover:text-red-700'}`} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 hover:scale-105"
              >
                <UserIcon className="w-4 h-4" /> Sign In
              </Link>
            )}

          </div>

        </div>
      </div>
    </header>
    </>
  );
};
