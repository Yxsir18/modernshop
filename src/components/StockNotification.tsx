import React, { useState } from 'react';
import { Bell, Check, X, Mail } from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface StockNotificationProps {
  productId: string;
  productName: string;
  isInStock: boolean;
}

export const StockNotification: React.FC<StockNotificationProps> = ({
  productId,
  productName,
  isInStock
}) => {
  const { user, triggerNotification } = useShop();
  const [email, setEmail] = useState(user?.email || '');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      triggerNotification('Email Required', 'Please enter your email address', 'warning');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/stock/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email })
      });

      const data = await res.json();
      
      if (data.success) {
        setIsSubscribed(true);
        triggerNotification(
          'Notification Set',
          `We'll notify you when ${productName} is back in stock!`,
          'success'
        );
      } else {
        triggerNotification('Subscription Failed', data.error || 'Please try again', 'warning');
      }
    } catch (error) {
      triggerNotification('Error', 'Failed to subscribe. Please try again.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInStock) return null;

  if (isSubscribed) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-full">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900">You're on the list!</p>
            <p className="text-xs text-emerald-700">We'll email you when this item is back in stock.</p>
          </div>
          <button
            onClick={() => setIsSubscribed(false)}
            className="p-2 hover:bg-emerald-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-fade-in">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-amber-100 rounded-full animate-pulse">
          <Bell className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">Out of Stock</p>
          <p className="text-xs text-amber-700">Get notified when this item becomes available.</p>
        </div>
      </div>

      <form onSubmit={handleSubscribe} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent input-focus"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-amber-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed button-ripple flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              <span>Notify Me</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
