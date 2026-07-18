import { Product } from '../../src/types';

export interface ProductSchema extends Product {
  sku: string;
  tags: string[];
  reservedStock: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export const validateProductSchema = (product: Partial<ProductSchema>) => {
  if (!product.name || product.name.trim().length === 0) {
    throw new Error('Product name is required.');
  }
  if (product.price === undefined || product.price < 0) {
    throw new Error('Price must be a non-negative decimal value.');
  }
  if (product.stock === undefined || product.stock < 0) {
    throw new Error('Inventory quantity cannot drop below ground level zero.');
  }
  if (!product.category) {
    throw new Error('Product must map to a target category ID.');
  }
};
