import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { getMongoDb, isMongoConnected } from '../config/mongodb';
import { sendResponse, sendError } from '../utils/response';

// Keep a map of searched terms to generate trending metrics!
const searchAnalyticsMap = new Map<string, number>();

export const enterpriseSearch = async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim().toLowerCase();
  const startTime = performance.now();

  if (!q) {
    // Return standard search dashboard recommendations
    return sendResponse(res, 200, true, 'Search parameters empty. Loading defaults.', {
      results: [],
      suggestions: ['Accessories', 'Laptop', 'Apparel', 'Smart Home'],
      trending: Array.from(searchAnalyticsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0])
        .concat(['Premium Laptop', 'Noiseless Keyboard', 'Ergonomic Chair']),
      analytics: { Took: '0.00ms', matchedCount: 0 }
    });
  }

  // Record query search metrics
  searchAnalyticsMap.set(q, (searchAnalyticsMap.get(q) || 0) + 1);

  // Initializing collections
  const localProducts = [...dbConnection.getCollection('products')];
  let matchedProducts: any[] = [];
  let executionSource = 'Offline Fuzzy Index';

  try {
    if (isMongoConnected()) {
      const mongoDb = await getMongoDb();
      if (mongoDb) {
        executionSource = 'MongoDB text/regex search';
        const collection = mongoDb.collection('products');
        
        // Atlas text search fallback matching name/desc
        const mongoResults = await collection.find({
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } },
            { brand: { $regex: q, $options: 'i' } }
          ]
        }).toArray();

        matchedProducts = mongoResults.map((item: any) => {
          const { _id, ...rest } = item;
          return { id: item.id || _id?.toString(), ...rest };
        });
      }
    }
  } catch (error) {
    console.warn('[SEARCH ENGINE] Atlas search error. Seamlessly falling back to local fuzzy matcher.', error);
  }

  // Fallback to local high-fidelity scoring fuzzy index if Mongo didn't return or isn't connected
  if (matchedProducts.length === 0) {
    matchedProducts = localProducts.map(p => {
      // Calculate relevance search score
      let score = 0;
      const name = p.name.toLowerCase();
      const desc = p.description.toLowerCase();
      const brand = p.brand.toLowerCase();
      const cat = p.category.toLowerCase();

      if (name.includes(q)) score += 10;
      if (brand.includes(q)) score += 5;
      if (cat.includes(q)) score += 5;
      if (desc.includes(q)) score += 2;

      // Simple keyword distance / word split matching
      const queryWords = q.split(/\s+/);
      queryWords.forEach(word => {
        if (word && name.includes(word)) score += 3;
      });

      return { ...p, searchScore: score };
    })
    .filter(p => p.searchScore > 0)
    .sort((a, b) => b.searchScore - a.searchScore);
  }

  // Generate real-time autocompleting suggestions
  const suggestions = matchedProducts.slice(0, 5).map(p => p.name);

  const tookMs = (performance.now() - startTime).toFixed(2);

  return sendResponse(res, 200, true, 'Enterprise search query resolved.', {
    results: matchedProducts.slice(0, 15), // Top 15 scoring matches
    suggestions,
    trending: ['Premium Laptop', 'Wireless Earbuds', 'Leather Wallet', 'Mechanical Keyboard'],
    analytics: {
      took: `${tookMs}ms`,
      matchedCount: matchedProducts.length,
      indexingSource: executionSource
    }
  });
};
