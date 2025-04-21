import express from 'express';
import { body } from 'express-validator';
import * as paymentController from '../controllers/payment.controller';
import auth from '../middleware/auth';
import authorize from '../middleware/authorize';
import { UserRole } from '../models/User';
import { PaymentType, PaymentStatus } from '../models/Payment';

const router = express.Router();

// @route   GET api/payments
// @desc    Get all payments (SuperAdmin only)
// @access  Private
router.get(
  '/',
  [auth, authorize([UserRole.SUPERADMIN])],
  paymentController.getAllPayments
);

// @route   GET api/payments/stats
// @desc    Get payment statistics (SuperAdmin only)
// @access  Private
router.get(
  '/stats',
  [auth, authorize([UserRole.SUPERADMIN])],
  paymentController.getPaymentStats
);

// @route   GET api/payments/apartment/:apartmentId
// @desc    Get all payments for an apartment (Manager only)
// @access  Private
router.get(
  '/apartment/:apartmentId',
  [auth, authorize([UserRole.MANAGER, UserRole.SUPERADMIN])],
  paymentController.getApartmentPayments
);

// @route   GET api/payments/tenant/:tenantId
// @desc    Get all payments for a tenant (Manager only)
// @access  Private
router.get(
  '/tenant/:tenantId',
  [auth, authorize([UserRole.MANAGER, UserRole.SUPERADMIN])],
  paymentController.getTenantPayments
);

// @route   POST api/payments
// @desc    Create a new payment (Manager only)
// @access  Private
router.post(
  '/',
  [
    auth,
    authorize([UserRole.MANAGER]),
    body('amount', 'Amount is required and must be a number').isNumeric(),
    body('tenantId', 'Tenant ID is required').not().isEmpty(),
    body('apartmentId', 'Apartment ID is required').not().isEmpty(),
    body('dueDate', 'Due date is required').isISO8601().toDate(),
    body('paymentType', 'Payment type is required').isIn(Object.values(PaymentType)),
  ],
  paymentController.createPayment
);

// @route   PUT api/payments/:id/pay
// @desc    Mark payment as paid (Manager only)
// @access  Private
router.put(
  '/:id/pay',
  [auth, authorize([UserRole.MANAGER])],
  paymentController.markPaymentAsPaid
);

// @route   PUT api/payments/:id
// @desc    Update payment (Manager only)
// @access  Private
router.put(
  '/:id',
  [
    auth,
    authorize([UserRole.MANAGER]),
    body('amount', 'Amount must be a number').optional().isNumeric(),
    body('dueDate', 'Due date must be a valid date').optional().isISO8601().toDate(),
    body('paymentType', 'Invalid payment type').optional().isIn(Object.values(PaymentType)),
    body('status', 'Invalid payment status').optional().isIn(Object.values(PaymentStatus)),
  ],
  paymentController.updatePayment
);

export default router; 