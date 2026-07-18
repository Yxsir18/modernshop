import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Heart, Trash2, ShoppingCart, ArrowRight, Share2, Facebook, Twitter, Mail, Link as LinkIcon, X } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist, addToCart, triggerNotification } = useShop();
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = (platform: string) => {
    const shareUrl = window.location.href;
    const shareText = `Check out my wishlist on ModernShop! ${wishlist.length} amazing items saved.`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=My Wishlist on ModernShop&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        triggerNotification('Link Copied', 'Wishlist link copied to clipboard!', 'success');
        break;
    }
    setShowShareModal(false);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Heart className="w-10 h-10 text-neutral-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-3xl text-gray-900 tracking-tight">Wishlist empty</h2>
            <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed font-medium">
              You haven't bookmarked any accessories or gear styles yet. Discover items from catalogs!
            </p>
          </div>
          <Link
            to="/catalog"
            className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold text-xs px-6 py-3.5 rounded-full inline-block transition-all shadow-lg shadow-gray-900/20"
          >
            Explore Catalog Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display font-extrabold text-4xl tracking-tight text-left text-gray-900">Your Bookmarked Styles</h1>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 px-4 py-2.5 rounded-xl font-semibold text-sm hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm hover:shadow-md"
          >
            <Share2 className="w-4 h-4" /> Share Wishlist
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          {wishlist.map((prod) => (
            <div
              key={prod.id}
              className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-4 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative shadow-sm"
            >
            
            <button
              onClick={() => removeFromWishlist(prod.id)}
              className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shadow border border-gray-100"
              title="Remove watermark bookmark"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <Link to={`/product/${prod.slug}`} className="block">
              <div className="aspect-square bg-gray-55 rounded-2xl overflow-hidden relative">
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest">{prod.brand}</span>
                <h3 className="font-semibold text-gray-800 text-sm mt-1 line-clamp-1 group-hover:text-blue-500 transition-colors">
                  {prod.name}
                </h3>
                <span className="font-bold text-gray-900 text-sm block mt-1">
                  {formatPrice(prod.discountPrice || prod.price)}
                </span>
              </div>
            </Link>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
              <button
                onClick={() => addToCart(prod, 1)}
                className="flex-1 bg-black text-white hover:bg-neutral-800 px-3 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Quick Add
              </button>
              
              <Link
                to={`/product/${prod.slug}`}
                className="bg-gray-50 hover:bg-gray-100 p-2.5 rounded-xl text-gray-700 font-bold transition-colors"
                title="View specs & variants"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        ))}
      </div>
    </div>

    {/* Share Modal */}
    {showShareModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-xl text-gray-900">Share Your Wishlist</h3>
            <button
              onClick={() => setShowShareModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600">
            Share your wishlist with friends and family via social media or email.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleShare('facebook')}
              className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              <Facebook className="w-5 h-5" /> Facebook
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="flex items-center justify-center gap-2 p-4 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors font-semibold"
            >
              <Twitter className="w-5 h-5" /> Twitter
            </button>
            <button
              onClick={() => handleShare('email')}
              className="flex items-center justify-center gap-2 p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
            >
              <Mail className="w-5 h-5" /> Email
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="flex items-center justify-center gap-2 p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
            >
              <LinkIcon className="w-5 h-5" /> Copy Link
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};
