import React from 'react';
import { useShop } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export const RecentlyViewed: React.FC = () => {
  const { recentlyViewed, clearRecentlyViewed } = useShop();

  if (recentlyViewed.length === 0) return null;

  return (
    <div className="mt-16 space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="font-display font-bold text-lg text-gray-900">Recently Viewed</h3>
        </div>
        <button
          onClick={clearRecentlyViewed}
          className="text-xs text-gray-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Clear History
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recentlyViewed.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.slug}`}
            className="group p-3 border border-gray-50 rounded-2xl block hover:shadow-md transition-all bg-white hover:border-gray-200"
          >
            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 mt-3 group-hover:text-blue-500 transition-colors">{p.name}</h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400 font-medium font-mono uppercase">{p.brand}</span>
              <span className="text-xs font-bold text-gray-900">{formatPrice(p.discountPrice || p.price)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
