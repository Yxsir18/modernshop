import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { sendResponse, sendError } from '../utils/response';

// Conversation state management
interface ConversationState {
  lastIntent: string;
  context: any;
  timestamp: number;
  followUpQuestion?: string;
  conversationStep: number;
  userPreferences?: {
    preferredCategories: string[];
    preferredBrands: string[];
    priceRange?: { min: number; max: number };
    recentlyViewed: string[];
  };
}

const conversationStates = new Map<string, ConversationState>();

// Intent detection with confidence scoring
interface IntentResult {
  intent: string;
  confidence: number;
  entities: any[];
}

// Enhanced entity extraction with price ranges, quantities, and specifications
const extractEntities = (message: string) => {
  const lowerMessage = message.toLowerCase();
  const entities: any[] = [];
  
  const products = dbConnection.getCollection('products');
  const categories = dbConnection.getCollection('categories');
  
  // Extract products
  const mentionedProducts = products.filter((p: any) => 
    lowerMessage.includes(p.name.toLowerCase()) || 
    lowerMessage.includes(p.brand.toLowerCase())
  );
  if (mentionedProducts.length > 0) {
    entities.push({ type: 'product', values: mentionedProducts });
  }
  
  // Extract categories
  const mentionedCategories = categories.filter((c: any) => 
    lowerMessage.includes(c.name.toLowerCase()) || 
    lowerMessage.includes(c.slug.toLowerCase())
  );
  if (mentionedCategories.length > 0) {
    entities.push({ type: 'category', values: mentionedCategories });
  }
  
  // Extract price ranges (e.g., "under $200", "between 100 and 300", "less than 50")
  const priceRangePattern = /(?:under|below|less than|cheaper than)\s*\$?(\d+)/i;
  const priceRangeMatch = lowerMessage.match(priceRangePattern);
  if (priceRangeMatch) {
    entities.push({ type: 'price_range', max_price: parseFloat(priceRangeMatch[1]) });
  }
  
  const priceBetweenPattern = /(?:between|from)\s*\$?(\d+)\s*(?:and|to|-)\s*\$?(\d+)/i;
  const priceBetweenMatch = lowerMessage.match(priceBetweenPattern);
  if (priceBetweenMatch) {
    entities.push({ 
      type: 'price_range', 
      min_price: parseFloat(priceBetweenMatch[1]), 
      max_price: parseFloat(priceBetweenMatch[2]) 
    });
  }
  
  const priceAbovePattern = /(?:over|above|more than|greater than)\s*\$?(\d+)/i;
  const priceAboveMatch = lowerMessage.match(priceAbovePattern);
  if (priceAboveMatch) {
    entities.push({ type: 'price_range', min_price: parseFloat(priceAboveMatch[1]) });
  }
  
  // Extract quantities (e.g., "2 items", "three products")
  const quantityPattern = /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:items?|products?|pieces?)/i;
  const quantityMatch = lowerMessage.match(quantityPattern);
  if (quantityMatch) {
    const numWords: any = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    const quantity = numWords[quantityMatch[1]] || parseInt(quantityMatch[1]);
    entities.push({ type: 'quantity', value: quantity });
  }
  
  // Extract specifications (e.g., "black color", "size large", "wireless")
  const colorPattern = /(?:color|colour)\s*(?:is\s*)?(\w+)/i;
  const colorMatch = lowerMessage.match(colorPattern);
  if (colorMatch) {
    entities.push({ type: 'specification', key: 'color', value: colorMatch[1] });
  }
  
  const sizePattern = /size\s*(?:is\s*)?(\w+)/i;
  const sizeMatch = lowerMessage.match(sizePattern);
  if (sizeMatch) {
    entities.push({ type: 'specification', key: 'size', value: sizeMatch[1] });
  }
  
  // Extract brand mentions
  const brands = [...new Set(products.map((p: any) => p.brand.toLowerCase()))];
  const mentionedBrands = brands.filter(brand => lowerMessage.includes(brand));
  if (mentionedBrands.length > 0) {
    entities.push({ type: 'brand', values: mentionedBrands });
  }
  
  return entities;
};

// Sentiment analysis
const analyzeSentiment = (message: string): 'positive' | 'negative' | 'neutral' => {
  const lowerMessage = message.toLowerCase();
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'happy', 'perfect', 'best', 'thanks', 'thank'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor', 'disappoint', 'frustrat', 'angry', 'sad', 'issue', 'problem'];
  
  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// Personalized product recommendations based on user history
const getPersonalizedRecommendations = (user: any, products: any[], limit: number = 5) => {
  const orders = dbConnection.getCollection('orders');
  const userOrders = orders.filter((o: any) => o.userId === user.id);
  
  // Extract user preferences from order history
  const purchasedCategories = new Set<string>();
  const purchasedBrands = new Set<string>();
  const purchasedProductIds = new Set<string>();
  
  userOrders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        purchasedCategories.add(product.category);
        purchasedBrands.add(product.brand);
        purchasedProductIds.add(product.id);
      }
    });
  });
  
  // Score products based on user preferences
  const scoredProducts = products.map(product => {
    let score = 0;
    
    // Boost score for products in preferred categories
    if (purchasedCategories.has(product.category)) score += 3;
    
    // Boost score for products from preferred brands
    if (purchasedBrands.has(product.brand)) score += 2;
    
    // Boost score for featured/bestseller products
    if (product.isFeatured) score += 1;
    if (product.isBestSeller) score += 1;
    
    // Boost score for high-rated products
    if (product.rating >= 4.5) score += 1;
    
    // Boost score for products with discounts
    if (product.discountPrice && product.discountPrice < product.price) score += 1;
    
    // Penalize already purchased products
    if (purchasedProductIds.has(product.id)) score -= 2;
    
    // Boost score for in-stock products
    if (product.stock > 0) score += 1;
    
    return { product, score };
  });
  
  // Sort by score and return top recommendations
  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product);
};

// Real-time inventory awareness
const checkInventoryStatus = (product: any): string => {
  if (product.stock === 0) return 'Out of Stock';
  if (product.stock <= 5) return `Only ${product.stock} left in stock`;
  if (product.stock <= 10) return 'Low Stock - Order Soon';
  return 'In Stock';
};

// Social proof integration
const getSocialProof = (product: any, reviews: any[]): string => {
  const productReviews = reviews.filter((r: any) => r.productId === product.id && r.approved);
  if (productReviews.length === 0) return '';
  
  const avgRating = productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / productReviews.length;
  const recentReviews = productReviews.slice(-3);
  
  if (product.isBestSeller && avgRating >= 4.5) {
    return `⭐ Bestseller with ${productReviews.length} reviews (${avgRating.toFixed(1)}⭐)`;
  }
  
  if (recentReviews.length > 0) {
    const latestReview = recentReviews[recentReviews.length - 1];
    return `Recent: "${latestReview.comment.substring(0, 50)}..." - ${latestReview.userName}`;
  }
  
  return `${productReviews.length} verified reviews (${avgRating.toFixed(1)}⭐)`;
};

// Dynamic pricing and deal detection
const detectDeals = (product: any, coupons: any[]): string => {
  const deals: string[] = [];
  
  // Check for product discount
  if (product.discountPrice && product.discountPrice < product.price) {
    const savings = product.price - product.discountPrice;
    const percentage = Math.round((savings / product.price) * 100);
    deals.push(`${percentage}% OFF - Save $${savings.toFixed(2)}`);
  }
  
  // Check for applicable coupons
  const applicableCoupons = coupons.filter((c: any) => 
    c.active !== false && 
    (!c.minPurchase || product.price >= c.minPurchase)
  );
  
  if (applicableCoupons.length > 0) {
    const bestCoupon = applicableCoupons.reduce((best: any, current: any) => 
      (current.value > best.value) ? current : best
    );
    deals.push(`Use code ${bestCoupon.code} for extra ${bestCoupon.type === 'percentage' ? bestCoupon.value + '%' : '$' + bestCoupon.value} off`);
  }
  
  return deals.length > 0 ? deals.join(' | ') : '';
};

// Predictive suggestions based on conversation patterns
const getPredictiveSuggestions = (conversationState: ConversationState, products: any[]): string[] => {
  const suggestions: string[] = [];
  const { lastIntent, context, userPreferences } = conversationState;
  
  // If user was looking at products, suggest similar or complementary items
  if (lastIntent === 'product_search' && context.length > 0) {
    const productEntity = context.find((e: any) => e.type === 'product');
    if (productEntity && productEntity.values.length > 0) {
      const viewedProduct = productEntity.values[0];
      // Find products in same category
      const sameCategory = products.filter((p: any) => 
        p.category === viewedProduct.category && p.id !== viewedProduct.id
      ).slice(0, 3);
      if (sameCategory.length > 0) {
        suggestions.push(`Similar to ${viewedProduct.name}: ${sameCategory.map((p: any) => p.name).join(', ')}`);
      }
    }
    
    const categoryEntity = context.find((e: any) => e.type === 'category');
    if (categoryEntity && categoryEntity.values.length > 0) {
      const category = categoryEntity.values[0];
      // Find bestsellers in that category
      const categoryBestsellers = products.filter((p: any) => 
        p.category === category.slug && p.isBestSeller
      ).slice(0, 3);
      if (categoryBestsellers.length > 0) {
        suggestions.push(`Popular in ${category.name}: ${categoryBestsellers.map((p: any) => p.name).join(', ')}`);
      }
    }
  }
  
  // If user was checking coupons, suggest products that work with coupons
  if (lastIntent === 'coupon_discount') {
    const discountedProducts = products.filter((p: any) => p.discountPrice).slice(0, 3);
    if (discountedProducts.length > 0) {
      suggestions.push(`On sale now: ${discountedProducts.map((p: any) => p.name).join(', ')}`);
    }
  }
  
  // If user was checking orders, suggest reorder of previous items
  if (lastIntent === 'order_status' && userPreferences?.recentlyViewed) {
    const recentlyViewedProducts = products.filter((p: any) => 
      userPreferences.recentlyViewed.includes(p.id)
    ).slice(0, 3);
    if (recentlyViewedProducts.length > 0) {
      suggestions.push(`Items you viewed: ${recentlyViewedProducts.map((p: any) => p.name).join(', ')}`);
    }
  }
  
  return suggestions;
};

const detectIntent = (message: string): IntentResult => {
  const lowerMessage = message.toLowerCase();
  const intents = [
    {
      name: 'greeting',
      keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'greetings'],
      weight: 1.0
    },
    {
      name: 'product_search',
      keywords: ['product', 'item', 'catalog', 'browse', 'looking for', 'find', 'show me', 'recommend', 'search', 'want', 'need'],
      weight: 0.9
    },
    {
      name: 'order_status',
      keywords: ['order', 'delivery', 'shipping', 'track', 'status', 'where is', 'when will'],
      weight: 0.95
    },
    {
      name: 'coupon_discount',
      keywords: ['coupon', 'discount', 'promo', 'code', 'offer', 'deal', 'save', 'sale'],
      weight: 0.9
    },
    {
      name: 'return_refund',
      keywords: ['return', 'refund', 'exchange', 'send back'],
      weight: 0.95
    },
    {
      name: 'payment',
      keywords: ['payment', 'pay', 'card', 'credit', 'debit', 'checkout'],
      weight: 0.85
    },
    {
      name: 'account',
      keywords: ['account', 'login', 'password', 'profile', 'settings', 'sign up', 'register'],
      weight: 0.9
    },
    {
      name: 'support',
      keywords: ['help', 'support', 'contact', 'call', 'assist'],
      weight: 0.8
    },
    {
      name: 'thank',
      keywords: ['thank', 'thanks', 'appreciate'],
      weight: 1.0
    },
    {
      name: 'goodbye',
      keywords: ['bye', 'goodbye', 'see you', 'farewell'],
      weight: 1.0
    },
    {
      name: 'comparison',
      keywords: ['compare', 'difference', 'vs', 'versus', 'better', 'which one'],
      weight: 0.9
    }
  ];

  let bestMatch = { intent: 'general', confidence: 0, entities: [] };

  for (const intent of intents) {
    const matchCount = intent.keywords.filter(keyword => lowerMessage.includes(keyword)).length;
    if (matchCount > 0) {
      const confidence = (matchCount / intent.keywords.length) * intent.weight;
      if (confidence > bestMatch.confidence) {
        bestMatch = { intent: intent.name, confidence, entities: [] };
      }
    }
  }

  // Extract enhanced entities
  bestMatch.entities = extractEntities(message);

  return bestMatch;
};

// Advanced intelligent response system with context awareness
const generateIntelligentResponse = (message: string, user: any, conversationHistory: any[] = []): string => {
  const intentResult = detectIntent(message);
  const sentiment = analyzeSentiment(message);
  const userRole = user.role || 'customer';
  const userId = user.id || 'guest';
  
  // Update conversation state
  const currentState = conversationStates.get(userId) || { lastIntent: '', context: {}, timestamp: 0, conversationStep: 0 };
  conversationStates.set(userId, {
    lastIntent: intentResult.intent,
    context: { ...currentState.context, ...intentResult.entities },
    timestamp: Date.now(),
    followUpQuestion: currentState.followUpQuestion,
    conversationStep: currentState.conversationStep + 1
  });
  
  // Get context data for personalized responses
  const orders = dbConnection.getCollection('orders');
  const userOrders = orders.filter((o: any) => o.userId === user.id);
  const products = dbConnection.getCollection('products');
  const coupons = dbConnection.getCollection('coupons');
  const users = dbConnection.getCollection('users');
  const allUsers = users.filter((u: any) => u.role === 'customer');
  const categories = dbConnection.getCollection('categories');
  const reviews = dbConnection.getCollection('reviews');
  
  // Get personalized recommendations for logged-in users
  const personalizedRecs = user.id ? getPersonalizedRecommendations(user, products, 5) : [];
  
  // Extract entities from intent
  const productEntities = intentResult.entities.find((e: any) => e.type === 'product')?.values || [];
  const categoryEntities = intentResult.entities.find((e: any) => e.type === 'category')?.values || [];
  const priceRangeEntity = intentResult.entities.find((e: any) => e.type === 'price_range');
  const quantityEntity = intentResult.entities.find((e: any) => e.type === 'quantity');
  const brandEntities = intentResult.entities.find((e: any) => e.type === 'brand')?.values || [];
  const specEntities = intentResult.entities.filter((e: any) => e.type === 'specification');
  
  // Smart product filtering based on entities
  const filterProducts = () => {
    let filtered = [...products];
    
    if (categoryEntities.length > 0) {
      const categorySlugs = categoryEntities.map((c: any) => c.slug);
      filtered = filtered.filter(p => categorySlugs.includes(p.category));
    }
    
    if (brandEntities.length > 0) {
      filtered = filtered.filter(p => brandEntities.includes(p.brand.toLowerCase()));
    }
    
    if (priceRangeEntity) {
      if (priceRangeEntity.min_price) {
        filtered = filtered.filter(p => (p.discountPrice || p.price) >= priceRangeEntity.min_price);
      }
      if (priceRangeEntity.max_price) {
        filtered = filtered.filter(p => (p.discountPrice || p.price) <= priceRangeEntity.max_price);
      }
    }
    
    if (specEntities.length > 0) {
      specEntities.forEach((spec: any) => {
        if (spec.key === 'color') {
          filtered = filtered.filter(p => 
            p.variants.some((v: any) => v.options.some((o: string) => o.toLowerCase().includes(spec.value.toLowerCase())))
          );
        }
      });
    }
    
    return filtered;
  };
  
  // ADMIN-SPECIFIC RESPONSES
  if (userRole === 'admin' || userRole === 'super-admin') {
    switch (intentResult.intent) {
      case 'greeting':
        return `Hello ${user.name || 'Admin'}! I'm your AI assistant. You have ${orders.length} total orders, ${allUsers.length} customers, and ${products.length} products. What would you like to manage today?`;
      
      case 'product_search':
        const filteredAdminProducts = filterProducts();
        if (productEntities.length > 0) {
          return `I found ${productEntities.length} product(s) you mentioned: ${productEntities.map((p: any) => p.name).join(', ')}. Would you like to edit inventory, pricing, or details for any of these?`;
        }
        if (categoryEntities.length > 0) {
          return `The ${categoryEntities.map((c: any) => c.name).join('/')} category has ${filteredAdminProducts.length} products. Would you like to view or manage them?`;
        }
        if (priceRangeEntity) {
          const priceDesc = priceRangeEntity.min_price && priceRangeEntity.max_price 
            ? `between $${priceRangeEntity.min_price} and $${priceRangeEntity.max_price}`
            : priceRangeEntity.max_price 
            ? `under $${priceRangeEntity.max_price}`
            : `over $${priceRangeEntity.min_price}`;
          return `I found ${filteredAdminProducts.length} products ${priceDesc}. Would you like to see the full list or apply additional filters?`;
        }
        return `You have ${products.length} products across ${categories.length} categories. I can help you add new products, update inventory, manage pricing, or organize categories. What would you like to do?`;
      
      case 'order_status':
        const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'Pending');
        const processingOrders = orders.filter((o: any) => o.status === 'processing' || o.status === 'Processing');
        return `Order Overview: ${orders.length} total orders. ${pendingOrders.length} pending, ${processingOrders.length} processing. Would you like to view specific orders or update statuses?`;
      
      case 'coupon_discount':
        const activeCoupons = coupons.filter((c: any) => c.active !== false);
        return `You have ${activeCoupons.length} active coupons. I can help you create new promotions, manage existing ones, or track discount usage. What would you like to do?`;
      
      case 'account':
        return `You have ${allUsers.length} registered customers. I can help you manage user accounts, view order history, handle support requests, or analyze customer behavior. What do you need?`;
      
      case 'support':
        return `As an admin, I can help you with: managing products and inventory, processing orders, creating coupons, viewing analytics, managing users, sending newsletters, and handling customer support. What would you like to do?`;
      
      default:
        return `I understand you're asking about "${message}". As an admin, I can assist with products, orders, coupons, users, analytics, and support. Could you provide more details?`;
    }
  }
  
  // CUSTOMER-SPECIFIC RESPONSES
  if (userRole === 'customer') {
    switch (intentResult.intent) {
      case 'greeting':
        const personalizedGreeting = user.name ? `Hello ${user.name}!` : 'Hello there!';
        
        // Get predictive suggestions based on conversation history
        const currentState = conversationStates.get(userId);
        const predictiveSuggestions = currentState ? getPredictiveSuggestions(currentState, products) : [];
        
        if (userOrders.length > 0) {
          const recentOrder = userOrders[userOrders.length - 1];
          let greetingResponse = `${personalizedGreeting} Welcome back! I see you have ${userOrders.length} order(s) with us. Your latest order (${recentOrder.orderNumber}) is ${recentOrder.status}.`;
          
          // Add personalized recommendations
          if (personalizedRecs.length > 0) {
            const topRec = personalizedRecs[0];
            const deals = detectDeals(topRec, coupons);
            greetingResponse += ` Based on your history, you might like ${topRec.name} ($${topRec.discountPrice || topRec.price})${deals ? ' - ' + deals : ''}.`;
          }
          
          // Add predictive suggestions if available
          if (predictiveSuggestions.length > 0) {
            greetingResponse += ` ${predictiveSuggestions[0]}`;
          }
          
          greetingResponse += ' How can I help you today?';
          return greetingResponse;
        }
        
        // For new users or guests, show featured products with deals
        if (personalizedRecs.length > 0) {
          const topRec = personalizedRecs[0];
          const deals = detectDeals(topRec, coupons);
          const socialProof = getSocialProof(topRec, reviews);
          return `${personalizedGreeting} Welcome to ModernShop! Based on what's trending, I'd recommend ${topRec.name} ($${topRec.discountPrice || topRec.price})${deals ? ' - ' + deals : ''}${socialProof ? ' - ' + socialProof : ''}. How can I help you today?`;
        }
        
        const greetingFeaturedProducts = products.filter((p: any) => p.isFeatured || p.isBestSeller).slice(0, 2);
        if (greetingFeaturedProducts.length > 0) {
          const featuredInfo = greetingFeaturedProducts.map((p: any) => {
            const deals = detectDeals(p, coupons);
            return `${p.name} ($${p.discountPrice || p.price})${deals ? ' - ' + deals : ''}`;
          }).join(' and ');
          return `${personalizedGreeting} Welcome to ModernShop! Check out our featured items: ${featuredInfo}. How can I help you today?`;
        }
        
        return `${personalizedGreeting} Welcome to ModernShop! I'm here to help you find products, track orders, or answer any questions. What brings you here today?`;
      
      case 'product_search':
        const filteredProducts = filterProducts();
        if (productEntities.length > 0) {
          const productDetails = productEntities.map((p: any) => {
            const inventory = checkInventoryStatus(p);
            const socialProof = getSocialProof(p, reviews);
            const deals = detectDeals(p, coupons);
            const details = [`${p.name} ($${p.discountPrice || p.price}, ${p.rating}⭐)`, inventory, socialProof, deals].filter(Boolean).join(' - ');
            return details;
          }).join(', ');
          
          // Update user preferences
          const currentState = conversationStates.get(userId);
          if (currentState) {
            conversationStates.set(userId, {
              ...currentState,
              userPreferences: {
                ...currentState.userPreferences,
                recentlyViewed: [...(currentState.userPreferences?.recentlyViewed || []), ...productEntities.map((p: any) => p.id)].slice(-10)
              }
            });
          }
          
          conversationStates.set(userId, {
            ...conversationStates.get(userId)!,
            followUpQuestion: 'Would you like more details, see similar products, or add any to your cart?'
          });
          return `Great choice! ${productDetails}. Would you like more details, see similar products, or add any to your cart?`;
        }
        if (categoryEntities.length > 0) {
          const categoryName = categoryEntities[0].name;
          const categoryProducts = filteredProducts.slice(0, 5);
          if (categoryProducts.length > 0) {
            const productInfo = categoryProducts.map((p: any) => {
              const inventory = checkInventoryStatus(p);
              const deals = detectDeals(p, coupons);
              return `${p.name} ($${p.discountPrice || p.price}) - ${inventory}${deals ? ' - ' + deals : ''}`;
            }).join(', ');
            
            conversationStates.set(userId, {
              ...conversationStates.get(userId)!,
              followUpQuestion: 'Would you like to see more details or filter by price/rating?'
            });
            return `Our ${categoryName} collection features ${categoryProducts.length} items, including ${productInfo}. Would you like to see more details or filter by price/rating?`;
          }
        }
        if (priceRangeEntity) {
          const priceDesc = priceRangeEntity.min_price && priceRangeEntity.max_price 
            ? `between $${priceRangeEntity.min_price} and $${priceRangeEntity.max_price}`
            : priceRangeEntity.max_price 
            ? `under $${priceRangeEntity.max_price}`
            : `over $${priceRangeEntity.min_price}`;
          if (filteredProducts.length > 0) {
            const topProducts = filteredProducts.slice(0, 5);
            const productInfo = topProducts.map((p: any) => {
              const socialProof = getSocialProof(p, reviews);
              const deals = detectDeals(p, coupons);
              return `${p.name} ($${p.discountPrice || p.price})${socialProof ? ' - ' + socialProof : ''}${deals ? ' - ' + deals : ''}`;
            }).join(', ');
            
            conversationStates.set(userId, {
              ...conversationStates.get(userId)!,
              followUpQuestion: 'Would you like more details on any of these?'
            });
            return `I found ${filteredProducts.length} products ${priceDesc}. Top picks: ${productInfo}. Would you like more details on any of these?`;
          }
          conversationStates.set(userId, {
            ...conversationStates.get(userId)!,
            followUpQuestion: 'Would you like to adjust your price range or browse all products?'
          });
          return `I couldn't find any products ${priceDesc}. Would you like to adjust your price range or browse all products?`;
        }
        if (brandEntities.length > 0) {
          const brandProducts = filteredProducts.slice(0, 5);
          if (brandProducts.length > 0) {
            const productInfo = brandProducts.map((p: any) => {
              const inventory = checkInventoryStatus(p);
              const socialProof = getSocialProof(p, reviews);
              return `${p.name} - ${inventory}${socialProof ? ' - ' + socialProof : ''}`;
            }).join(', ');
            
            conversationStates.set(userId, {
              ...conversationStates.get(userId)!,
              followUpQuestion: 'Would you like to see more from these brands?'
            });
            return `We have ${filteredProducts.length} products from ${brandEntities.join('/')} including ${productInfo}. Would you like to see more from these brands?`;
          }
        }
        // Show personalized recommendations for returning users
        if (personalizedRecs.length > 0) {
          const recInfo = personalizedRecs.slice(0, 4).map((p: any) => {
            const deals = detectDeals(p, coupons);
            const socialProof = getSocialProof(p, reviews);
            return `${p.name} ($${p.discountPrice || p.price})${deals ? ' - ' + deals : ''}${socialProof ? ' - ' + socialProof : ''}`;
          }).join(', ');
          
          conversationStates.set(userId, {
            ...conversationStates.get(userId)!,
            followUpQuestion: 'Would you like to see more details on any of these recommendations?'
          });
          return `Based on your purchase history, I think you might like: ${recInfo}. These are curated just for you!`;
        }
        const searchFeaturedProducts = products.filter((p: any) => p.isFeatured || p.isBestSeller).slice(0, 4);
        if (searchFeaturedProducts.length > 0) {
          const featuredInfo = searchFeaturedProducts.map((p: any) => {
            const deals = detectDeals(p, coupons);
            const socialProof = getSocialProof(p, reviews);
            return `${p.name} ($${p.discountPrice || p.price})${deals ? ' - ' + deals : ''}${socialProof ? ' - ' + socialProof : ''}`;
          }).join(', ');
          
          conversationStates.set(userId, {
            ...conversationStates.get(userId)!,
            followUpQuestion: 'What type of product interests you?'
          });
          return `We have ${products.length} products across ${categories.length} categories. Our featured items include ${featuredInfo}. What type of product interests you?`;
        }
        conversationStates.set(userId, {
          ...conversationStates.get(userId)!,
          followUpQuestion: 'What category are you interested in?'
        });
        return `I'd love to help you find the perfect product! We have items in electronics, fashion, home & living, beauty, and sports. What category are you interested in?`;
      
      case 'order_status':
        if (userOrders.length > 0) {
          const recentOrder = userOrders[userOrders.length - 1];
          const orderItems = recentOrder.items.map((i: any) => i.productName).join(', ');
          return `You have ${userOrders.length} order(s). Your most recent order (${recentOrder.orderNumber}) contains ${orderItems} and is currently ${recentOrder.status}. Would you like tracking details or help with this order?`;
        }
        return `I don't see any orders in your account yet. Once you place an order, I can help you track it, check delivery status, or handle any issues. Would you like to browse our products?`;
      
      case 'coupon_discount':
        const activeCoupons = coupons.filter((c: any) => c.active !== false);
        if (activeCoupons.length > 0) {
          const couponDetails = activeCoupons.map((c: any) => 
            `${c.code} (${c.type === 'percentage' ? c.value + '% off' : '$' + c.value + ' off'})`
          ).join(', ');
          return `Great news! We have ${activeCoupons.length} active promotions: ${couponDetails}. Use these at checkout for instant savings. Need help applying a coupon?`;
        }
        return `We have some great deals available! Use code FLASH20 for 20% off your order, or WELCOME10 for 10% off. Check our coupons page for more exclusive offers!`;
      
      case 'return_refund':
        if (userOrders.length > 0) {
          const returnableOrders = userOrders.filter((o: any) => 
            o.status === 'Delivered' || o.status === 'Shipped'
          );
          if (returnableOrders.length > 0) {
            return `Our return policy allows returns within 30 days of delivery. You have ${returnableOrders.length} order(s) eligible for return. Would you like me to guide you through the return process for a specific order?`;
          }
        }
        return `Our return policy allows returns within 30 days of delivery. Items must be unused with original tags. You can initiate returns from your order history. Need help with a specific return?`;
      
      case 'payment':
        return `We accept all major credit cards (Visa, MasterCard, Amex), PayPal, Apple Pay, Google Pay, and UPI. All payments are securely processed with SSL encryption. Having trouble with a payment? I can help troubleshoot.`;
      
      case 'account':
        return `You can manage your account settings from your dashboard, including profile info, addresses, payment methods, and order history. Need help with login, password reset, or updating your information?`;
      
      case 'support':
        return `Our support team is available 24/7! You can reach us at support@modernshop.com or call 1-800-MODERN. I can also help you with products, orders, returns, payments, or account issues right here. What do you need assistance with?`;
      
      case 'thank':
        if (sentiment === 'positive') {
          return `You're very welcome, ${user.name || 'friend'}! I'm so glad I could help! Is there anything else I can assist you with today?`;
        }
        return `You're welcome, ${user.name || 'friend'}! I'm always here to help. Is there anything else I can assist you with today?`;
      
      case 'goodbye':
        return `Goodbye, ${user.name || 'friend'}! Thank you for chatting with ModernShop. Have a wonderful day, and feel free to come back anytime you need help!`;
      
      case 'comparison':
        if (productEntities.length >= 2) {
          const comparisons = productEntities.slice(0, 3).map((p: any) => 
            `${p.name} ($${p.discountPrice || p.price}, ${p.rating}⭐, ${p.brand})`
          ).join(' vs ');
          return `Here's a comparison: ${comparisons}. The ${productEntities[0].name} has a ${productEntities[0].rating}⭐ rating, while ${productEntities[1].name} has ${productEntities[1].rating}⭐. Would you like more detailed specifications?`;
        }
        if (categoryEntities.length > 0) {
          const categoryProducts = filterProducts().slice(0, 3);
          if (categoryProducts.length >= 2) {
            return `In ${categoryEntities[0].name}, I'd recommend comparing ${categoryProducts[0].name} vs ${categoryProducts[1].name}. The ${categoryProducts[0].name} is priced at $${categoryProducts[0].discountPrice || categoryProducts[0].price} with ${categoryProducts[0].rating}⭐ rating. Need more details?`;
          }
        }
        return `I'd be happy to help you compare products! Please mention the specific products you'd like to compare, or tell me the category you're interested in.`;
      
      default:
        // Try to provide contextual help based on conversation history
        if (conversationHistory.length > 0) {
          const lastMessage = conversationHistory[conversationHistory.length - 1];
          if (lastMessage.senderId === 'admin') {
            return `I understand. Building on our previous conversation, I can provide more specific help. What aspect would you like me to elaborate on?`;
          }
        }
        return `I understand you're asking about "${message}". I can help you with finding products, tracking orders, applying coupons, returns, payments, or account management. Could you tell me more about what you need?`;
    }
  }
  
  // GUEST-SPECIFIC RESPONSES
  if (userRole === 'guest' || !user.id) {
    switch (intentResult.intent) {
      case 'greeting':
        return 'Hello and welcome to ModernShop! I\'m your AI shopping assistant. I can help you browse products, learn about our services, or guide you through creating an account. What brings you here today?';
      
      case 'product_search':
        if (productEntities.length > 0) {
          return `Excellent taste! ${productEntities.map((p: any) => p.name).join(', ')} are popular choices. Sign up for an account to add items to your cart and track your orders. Would you like to create an account?`;
        }
        if (categoryEntities.length > 0) {
          return `Our ${categoryEntities.map((c: any) => c.name).join('/')} collection has some amazing items. Create an account to save favorites and get personalized recommendations. Want to browse now?`;
        }
        return `We have a wide selection of products across electronics, fashion, home, beauty, and sports. You can browse as a guest, or sign up for an account to save favorites, track orders, and get exclusive discounts. What interests you?`;
      
      case 'order_status':
        return 'To track your orders, you\'ll need to sign in to your account. If you don\'t have one yet, creating an account is free and takes just a minute. Would you like me to help you sign up?';
      
      case 'coupon_discount':
        return 'We have great promotions available! Sign up for an account to access exclusive member discounts and track coupon usage. As a welcome, use code FLASH20 for 20% off your first order!';
      
      case 'account':
        return 'Creating an account is free and easy! You\'ll get access to order tracking, exclusive discounts, faster checkout, personalized recommendations, and loyalty points. Would you like me to guide you through the sign-up process?';
      
      case 'support':
        return 'As a guest, you can browse products and view promotions. For the full experience including order tracking, exclusive discounts, and personalized support, consider creating an account. How can I help you today?';
      
      case 'goodbye':
        return 'Goodbye! Thanks for visiting ModernShop. Feel free to come back anytime to create an account and unlock the full shopping experience. Have a great day!';
      
      default:
        return `I understand you're asking about "${message}". As a guest, you can browse our catalog and learn about our services. For personalized help with orders, returns, and exclusive discounts, consider creating an account. What would you like to know?`;
    }
  }
  
  // Fallback response
  return `I'm here to help! You can ask me about products, orders, coupons, returns, payments, or account management. What would you like assistance with?`;
};

export const getChatMessages = async (req: any, res: Response) => {
  const messages = dbConnection.getCollection('chatMessages');

  // Filter messages. Admin/Super-admin can read everything. Inside simulation, customers read their own.
  let list = messages;
  if (req.user.role === 'customer') {
    list = messages.filter(m => m.userId === req.user.id || m.sender === 'admin');
  }

  return sendResponse(res, 200, true, 'Chat logs retrieved.', list);
};

export const postChatMessage = async (req: any, res: Response) => {
  const { message } = req.body;
  
  if (!message || message.trim().length === 0) {
    return sendError(res, 400, 'Content string is required.');
  }

  const messages = dbConnection.getCollection('chatMessages');
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: req.user.id,
    userName: req.user.role === 'admin' || req.user.role === 'super-admin' ? 'Support Lead' : req.user.name || 'Anonymous User',
    message,
    sender: (req.user.role === 'admin' || req.user.role === 'super-admin' ? 'admin' : 'customer') as 'customer' | 'admin',
    timestamp: new Date().toISOString(),
    isRead: false
  };

  messages.push(newMessage);

  // If customer or guest posts, generate intelligent automated reply
  if (req.user.role === 'customer' || req.user.role === 'guest') {
    // Get conversation history for context
    const userMessages = messages.filter(m => m.userId === req.user.id || m.sender === 'admin');
    const intelligentResponse = generateIntelligentResponse(message, req.user, userMessages);
    
    // Simulate typing delay based on response length for natural interaction
    const typingDelay = Math.min(Math.max(intelligentResponse.length * 10, 500), 2000);
    
    // Add typing indicator message (optional enhancement)
    const typingIndicator = {
      id: `msg_typing_${Date.now()}`,
      userId: 'admin',
      userName: 'Sovereign Concierge',
      message: '...',
      sender: 'admin' as const,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    messages.push(typingIndicator);
    
    // Add actual response after simulated delay
    setTimeout(() => {
      const currentMessages = dbConnection.getCollection('chatMessages');
      // Remove typing indicator
      const filteredMessages = currentMessages.filter(m => m.id !== typingIndicator.id);
      
      const aiAnswer = {
        id: `msg_ai_${Date.now()}`,
        userId: 'admin',
        userName: 'Sovereign Concierge',
        message: intelligentResponse,
        sender: 'admin' as const,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      filteredMessages.push(aiAnswer);
      dbConnection.updateCollection('chatMessages', filteredMessages);
    }, typingDelay);
  }

  dbConnection.updateCollection('chatMessages', messages);

  return sendResponse(res, 201, true, 'Speech bubble saved.', newMessage);
};

export const adminMarkChatRead = async (req: Request, res: Response) => {
  const messages = dbConnection.getCollection('chatMessages');
  messages.forEach(m => m.isRead = true);
  dbConnection.updateCollection('chatMessages', messages);

  return sendResponse(res, 200, true, 'Chat signals set to read.');
};
