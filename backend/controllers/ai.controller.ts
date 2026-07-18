import { Request, Response } from 'express';
import { dbConnection } from '../config/db';
import { GoogleGenAI } from '@google/genai';
import { sendResponse, sendError } from '../utils/response';

export const getSmartAIRecommendations = async (req: Request, res: Response) => {
  const { cartItems, currentCategory, searchHistory } = req.body;
  const availableProducts = dbConnection.getCollection('products');

  // Stringify inventory context for Gemini models
  const catalogText = availableProducts.map(p =>
    `ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Brand: ${p.brand}, Price: $${p.price}, Rating: ${p.rating}/5`
  ).join('\n');

  const prompt = `You are the master neural recommended algorithm of "ModernShop".
Analyze the buyer parameters:
1. Category currently open: "${currentCategory || 'None'}"
2. Item IDs inside buying cart: [${cartItems ? cartItems.join(', ') : ''}]
3. Search terms: [${searchHistory ? searchHistory.join(', ') : ''}]

Here is our live catalogue of items:
${catalogText}

TASK:
Examine relations. Select exactly 4 product IDs that best elevate buying desire (e.g. cross-selling, upsells, or related items).
Return ONLY a valid JSON object matching this schema with NO wrapper text, NO headers, NO conversational messages:
{
  "recommendedIds": ["id1", "id2", "id3", "id4"],
  "reasoning": "A short, elegant 1-sentence sales assistant pitch explaining why these elements are matching their style."
}`;

  const defaultIds = availableProducts.slice(0, 4).map(p => p.id);

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    // Smart Fallback Category Cluster Matching
    let matched = [...availableProducts];
    if (currentCategory) {
      const itemsSameCategory = availableProducts.filter(p => p.category === currentCategory);
      if (itemsSameCategory.length >= 2) matched = itemsSameCategory;
    }
    const ids = matched.slice(0, 4).map(p => p.id);
    return sendResponse(res, 200, true, 'Smart cluster fallback recommendations calculated.', {
      recommendedIds: ids,
      reasoning: 'Recommending our handpicked trending accessories belonging to your favored categories.',
      aiPowered: false
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    try {
      const parsed = JSON.parse(text.trim());
      return sendResponse(res, 200, true, 'Gemini recommender pipeline completed.', {
        recommendedIds: parsed.recommendedIds || defaultIds,
        reasoning: parsed.reasoning || 'Personalized curation based on high-integrity telemetry.',
        aiPowered: true
      });
    } catch {
      return sendResponse(res, 200, true, 'Recommender output parsed with fallback.', {
        recommendedIds: defaultIds,
        reasoning: 'Presenting high-utility products matching your interest nodes.',
        aiPowered: true
      });
    }
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('429');
    if (isQuotaError) {
      console.warn('[AI CONTROLLER] Gemini API quota limit active. Deploying elegant clustering fallback algorithm.');
    } else {
      console.warn('[AI CONTROLLER] Alternative recommender pathway triggered:', error?.message || error);
    }
    return sendResponse(res, 200, true, 'Bestselling fallback inventory deployed.', {
      recommendedIds: defaultIds,
      reasoning: 'Enjoy premium curation based on our top trading models.',
      aiPowered: false,
      errorDetails: error.message
    });
  }
};

export const getCustomersAlsoBought = async (req: Request, res: Response) => {
  const { productId } = req.body;
  const products = dbConnection.getCollection('products');
  const target = products.find(p => p.id === productId);

  if (!target) {
    return sendError(res, 404, 'Associated item matching failed.');
  }

  // Cross sell: recommend products from category or brand but distinct ID
  const recommendList = products
    .filter(p => p.id !== productId && (p.category === target.category || p.brand === target.brand))
    .slice(0, 3);

  return sendResponse(res, 200, true, 'Buyers relational cohort loaded.', recommendList);
};

export const getFrequentlyBoughtTogether = async (req: Request, res: Response) => {
  const products = dbConnection.getCollection('products');
  // Combine accessories automatically
  const accessoriesGroup = products.filter(p => p.price < 150).slice(0, 2);
  return sendResponse(res, 200, true, 'High affinity product bundles structured.', accessoriesGroup);
};
