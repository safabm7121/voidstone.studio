import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getDesigners,
  getAvailability,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  confirmAppointment,
  setAvailability
} from '../controllers/appointmentController';

const router = Router();

// Public routes
router.get('/designers', getDesigners);
router.get('/availability/:designerId', getAvailability);

// Protected routes (any authenticated user)
router.post('/book', authenticateToken, bookAppointment);
router.get('/my', authenticateToken, getMyAppointments);
router.put('/:id/cancel', authenticateToken, cancelAppointment);

// Designer/Admin routes
router.put('/:id/confirm', authenticateToken, confirmAppointment);
router.post('/availability', authenticateToken, setAvailability);

export default router;