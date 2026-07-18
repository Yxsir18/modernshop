import React from 'react';
import { ShoppingBag, Package, Heart, ShoppingCart, Search, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'cart' | 'wishlist' | 'orders' | 'products' | 'search' | 'default';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  cart: ShoppingCart,
  wishlist: Heart,
  orders: Package,
  products: ShoppingBag,
  search: Search,
  default: Inbox,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'default',
  title,
  description,
  action,
}) => {
  const Icon = iconMap[icon];

  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state-icon">
        <Icon className="w-full h-full" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-850 transition-colors button-press"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
