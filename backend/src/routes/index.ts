import express from 'express';
import apartmentRoutes from './apartment.routes';
import userRoutes from './user.routes';
import paymentRoutes from './payment.routes';
import notificationRoutes from './notification.routes';

const router = express.Router();

// API routes
router.use('/apartments', apartmentRoutes);
router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);

// Base API route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Apartment Management API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      apartments: '/api/apartments',
      payments: '/api/payments',
      notifications: '/api/notifications'
    }
  });
});

export default router; 