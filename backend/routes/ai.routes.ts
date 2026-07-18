import { Router } from 'express';
import {
  getSmartAIRecommendations,
  getCustomersAlsoBought,
  getFrequentlyBoughtTogether
} from '../controllers/ai.controller';

const router = Router();

router.post('/recommendations', getSmartAIRecommendations);
router.post('/customers-also-bought', getCustomersAlsoBought);
router.get('/frequently-bought-together', getFrequentlyBoughtTogether);

export default router;
