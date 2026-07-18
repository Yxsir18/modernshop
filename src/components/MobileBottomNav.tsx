import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Home, Grid, Heart, ShoppingBag, User as UserIcon } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { cart, wishlist, user, darkMode } = useShop();
  
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/catalog', icon: Grid, label: 'Catalog' },
    { path: '/wishlist', icon: Heart, label: 'Wishlist', badge: wishlistCount > 0 ? wishlistCount : undefined },
    { path: '/cart', icon: ShoppingBag, label: 'Cart', badge: cartCount > 0 ? cartCount : undefined },
    { path: user ? '/dashboard' : '/login', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <nav className={`lg:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-50 safe-area-inset-bottom shadow-2xl ${
      darkMode 
        ? 'bg-gray-900/95 border-gray-700/60' 
        : 'bg-white/95 border-gray-200/60'
    }`}>
      <div className="flex items-center justify-around h-20 px-2 pb-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 min-w-[52px] min-h-[64px] transition-all duration-300 relative group ${
                isActive 
                  ? darkMode 
                    ? 'text-white' 
                    : 'text-black'
                  : darkMode 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? darkMode 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg shadow-gray-900/50 scale-110' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg shadow-gray-500/20 scale-110'
                  : 'group-hover:scale-105'
              }`}>
                <Icon className="w-6 h-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-semibold mt-1.5 transition-all duration-300 ${
                isActive 
                  ? 'opacity-100 transform translate-y-0' 
                  : 'opacity-70'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className={`absolute bottom-0 w-8 h-0.5 rounded-full transition-all duration-300 ${
                  darkMode ? 'bg-white' : 'bg-black'
                }`} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
