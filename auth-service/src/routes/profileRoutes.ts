import { Router } from 'express';
import { ProfileController } from '../controllers/profileController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const profileController = new ProfileController();

// Profile routes
router.get('/profile', authenticateToken, profileController.getProfile.bind(profileController));
router.put('/profile', authenticateToken, profileController.updateProfile.bind(profileController));

// File routes
router.post('/profile/files', authenticateToken, profileController.uploadFile.bind(profileController));
router.get('/profile/files/:fileId', authenticateToken, profileController.getFile.bind(profileController));
router.delete('/profile/files/:fileId', authenticateToken, profileController.deleteFile.bind(profileController));

export default router;