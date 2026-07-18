/**
 * Currency formatting utility for Indian Rupees (INR)
 */

export const formatPrice = (price: number): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return '₹0.00';
  }
  return `₹${price.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatPriceCompact = (price: number): string => {
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(1)}L`;
  } else if (price >= 1000) {
    return `₹${(price / 1000).toFixed(1)}K`;
  }
  return formatPrice(price);
};

export const calculateGST = (price: number, gstRate: number = 18): number => {
  return (price * gstRate) / 100;
};

export const calculatePriceWithGST = (price: number, gstRate: number = 18): number => {
  return price + calculateGST(price, gstRate);
};
