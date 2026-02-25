import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const controller = new AppointmentController();

// Public routes
router.get('/availability', controller.getAvailability.bind(controller));

// Protected routes
router.post('/book', authenticateToken, controller.bookAppointment.bind(controller));
router.get('/my-appointments', authenticateToken, controller.getMyAppointments.bind(controller));
router.put('/cancel/:id', authenticateToken, controller.cancelAppointment.bind(controller));

// Admin routes
router.get('/all-appointments', 
  authenticateToken, 
  authorizeRoles('admin'),
  controller.getAllAppointments.bind(controller)
);

router.put('/confirm/:id', 
  authenticateToken, 
  authorizeRoles('admin'),
  controller.confirmAppointment.bind(controller)
);

export default router;