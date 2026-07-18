import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { sendResponse, sendError } from '../utils/response';
import { Product, Review } from '../../src/types';
import { validateProductSchema } from '../models/product.model';

export const getProducts = async (req: Request, res: Response) => {
  const {
    category,
    brand,
    search,
    minPrice,
    maxPrice,
    rating,
    sort,
    discount,
    isFeatured,
    isBestSeller,
    isNewArrival,
    tag
  } = req.query;

  // Pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  let products = [...dbConnection.getCollection('products')];
  console.log(`[GET PRODUCTS] Total products in database: ${products.length}`);
  console.log(`[GET PRODUCTS] Product IDs:`, products.map(p => p.id));

  // Process filters
  if (search) {
    const q = (search as string).toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'all') {
    products = products.filter(p => p.category === category);
  }

  if (brand && brand !== 'all') {
    products = products.filter(p => p.brand.toLowerCase() === (brand as string).toLowerCase());
  }

  if (minPrice) {
    products = products.filter(p => (p.discountPrice || p.price) >= parseFloat(minPrice as string));
  }
  if (maxPrice) {
    products = products.filter(p => (p.discountPrice || p.price) <= parseFloat(maxPrice as string));
  }

  if (rating) {
    products = products.filter(p => p.rating >= parseFloat(rating as string));
  }

  if (discount === 'true') {
    products = products.filter(p => p.discountPrice && p.discountPrice < p.price);
  }

  if (isFeatured === 'true') {
    products = products.filter(p => p.isFeatured);
  }

  if (isBestSeller === 'true') {
    products = products.filter(p => p.isBestSeller);
  }

  if (isNewArrival === 'true') {
    products = products.filter(p => p.isNewArrival);
  }

  if (tag) {
    // tags array fuzzy or exact
    products = products.filter(p => {
      const pTags = (p as any).tags || [];
      return pTags.some((t: string) => t.toLowerCase() === (tag as string).toLowerCase());
    });
  }

  // Multi-attribute Sort
  if (sort) {
    if (sort === 'price-asc') {
      products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sort === 'price-desc') {
      products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sort === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'newest') {
      products.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    }
  }

  // Pagination analytics slice
  const totalCount = products.length;
  const totalPages = Math.ceil(totalCount / limit);
  const paginatedList = products.slice(skip, skip + limit);

  return sendResponse(res, 200, true, 'Products directory loaded.', paginatedList, {
    pageSize: limit,
    pageIndex: page,
    totalCount,
    totalPages
  });
};

export const getProductByIdOrSlug = async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  const products = dbConnection.getCollection('products');
  const product = products.find(p => p.id === idOrSlug || p.slug === idOrSlug);

  if (!product) {
    return sendError(res, 404, 'Product was not discovered in our active directory.');
  }

  // Populate nested reviews
  const reviews = dbConnection.getCollection('reviews').filter(r => r.productId === product.id && r.approved);

  // Recommendations: Related items belonging to same category (limit 4)
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return sendResponse(res, 200, true, 'Product specification loaded.', {
    product,
    reviews,
    related
  });
};

export const createProductReview = async (req: any, res: Response) => {
  const { productId, rating, comment, images } = req.body;

  if (!productId || !rating || !comment) {
    return sendError(res, 400, 'Product id reference, numeric rating, and comment are required.');
  }

  const products = dbConnection.getCollection('products');
  const product = products.find(p => p.id === productId);

  if (!product) {
    return sendError(res, 404, 'A corresponding product was not discovered.');
  }

  const users = dbConnection.getCollection('users');
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return sendError(res, 401, 'User review profile is absent.');
  }

  const reviews = dbConnection.getCollection('reviews');
  const newReview: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    productId,
    userName: user.name,
    userAvatar: user.avatar,
    rating: parseInt(rating),
    comment,
    date: new Date().toISOString(),
    images: images || [],
    approved: true // Auto approve for instant interaction
  };

  reviews.push(newReview);
  dbConnection.updateCollection('reviews', reviews);

  // Recount ratings average
  const productReviews = reviews.filter(r => r.productId === productId && r.approved);
  const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
  product.rating = parseFloat(avg.toFixed(1));
  product.reviewsCount = productReviews.length;
  dbConnection.updateCollection('products', products);

  return sendResponse(res, 201, true, 'Review cataloged and approved.', newReview);
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const products = dbConnection.getCollection('products');
  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return sendError(res, 404, 'Product was not discovered in our active directory.');
  }

  // Update product with provided fields
  const updatedProduct = { ...products[productIndex], ...updates };
  products[productIndex] = updatedProduct;
  dbConnection.updateCollection('products', products);

  return sendResponse(res, 200, true, 'Product specifications updated successfully.', updatedProduct);
};
