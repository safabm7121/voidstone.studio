// routes/heroRoutes.ts (updated)
import { Router } from 'express';
import { HeroController } from '../controllers/heroController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const heroController = new HeroController();

// Public routes
router.get('/hero/active', (req, res) => heroController.getActiveHero(req, res));

// Admin only routes - No multer middleware needed
router.post(
  '/hero/upload', 
  authenticateToken, 
  (req, res) => heroController.uploadHeroImage(req, res)
);

router.delete(
  '/hero/image', 
  authenticateToken, 
  (req, res) => heroController.deleteHeroImage(req, res)
);

router.put(
  '/hero/text', 
  authenticateToken, 
  (req, res) => heroController.updateHeroText(req, res)
);

export default router;