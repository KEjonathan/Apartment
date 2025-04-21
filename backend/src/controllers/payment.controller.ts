import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Payment, { IPayment, PaymentStatus, PaymentType } from '../models/Payment';
import User, { UserRole } from '../models/User';
import Apartment from '../models/Apartment';
import { notifySuperAdmins } from '../services/notificationService';
import { NotificationType } from '../models/Notification';

// Custom interface to extend Express Request
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: UserRole;
  };
}

// @desc    Create a new payment record (Manager only)
// @route   POST /api/payments
// @access  Private (Manager only)
export const createPayment = async (req: AuthRequest, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    amount,
    tenantId,
    apartmentId,
    dueDate,
    paymentType,
    description
  } = req.body;

  try {
    // Verify tenant exists
    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== UserRole.TENANT) {
      return res.status(400).json({ msg: 'Invalid tenant ID' });
    }

    // Verify apartment exists and is managed by current user
    const apartment = await Apartment.findOne({
      _id: apartmentId,
      manager: req.user?.id
    });

    if (!apartment) {
      return res.status(400).json({ 
        msg: 'Apartment not found or you do not have permission to manage this apartment' 
      });
    }

    // Create new payment record
    const payment = new Payment({
      amount,
      tenant: tenantId,
      apartment: apartmentId,
      dueDate: new Date(dueDate),
      paymentType,
      description,
      status: PaymentStatus.PENDING,
      createdBy: req.user?.id
    });

    await payment.save();

    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.PAYMENT_CREATED,
      `New payment of $${amount} has been created for tenant ID: ${tenantId}`,
      {
        relatedUser: tenantId,
        relatedApartment: apartmentId,
        relatedPayment: payment._id.toString()
      }
    );

    res.json(payment);
  } catch (err) {
    console.error('Error creating payment record:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Mark payment as paid (Manager only)
// @route   PUT /api/payments/:id/pay
// @access  Private (Manager only)
export const markPaymentAsPaid = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ msg: 'Payment record not found' });
    }

    // Verify the payment is for an apartment managed by the current user
    const apartment = await Apartment.findOne({
      _id: payment.apartment,
      manager: req.user?.id
    });

    if (!apartment) {
      return res.status(403).json({ 
        msg: 'You do not have permission to update this payment' 
      });
    }

    // Update payment status
    payment.status = PaymentStatus.PAID;
    payment.paymentDate = new Date();
    payment.updatedBy = req.user?.id;
    
    await payment.save();

    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.PAYMENT_PAID,
      `Payment of $${payment.amount} for tenant ID: ${payment.tenant} has been marked as paid`,
      {
        relatedUser: payment.tenant.toString(),
        relatedApartment: payment.apartment.toString(),
        relatedPayment: payment._id.toString()
      }
    );

    res.json(payment);
  } catch (err) {
    console.error('Error updating payment status:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Update payment record (Manager only)
// @route   PUT /api/payments/:id
// @access  Private (Manager only)
export const updatePayment = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    amount,
    dueDate,
    paymentType,
    description,
    status
  } = req.body;

  try {
    let payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ msg: 'Payment record not found' });
    }

    // Verify the payment is for an apartment managed by the current user
    const apartment = await Apartment.findOne({
      _id: payment.apartment,
      manager: req.user?.id
    });

    if (!apartment) {
      return res.status(403).json({ 
        msg: 'You do not have permission to update this payment' 
      });
    }

    // Build update object
    const updateFields: { [key: string]: any } = {
      updatedBy: req.user?.id
    };

    if (amount !== undefined) updateFields.amount = amount;
    if (dueDate !== undefined) updateFields.dueDate = new Date(dueDate);
    if (paymentType !== undefined) updateFields.paymentType = paymentType;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) {
      updateFields.status = status;
      if (status === PaymentStatus.PAID && !payment.paymentDate) {
        updateFields.paymentDate = new Date();
      }
    }

    // Update payment record
    payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    // Notify superadmins
    await notifySuperAdmins(
      NotificationType.PAYMENT_UPDATED,
      `Payment record for tenant ID: ${payment!.tenant} has been updated`,
      {
        relatedUser: payment!.tenant.toString(),
        relatedApartment: payment!.apartment.toString(),
        relatedPayment: payment!._id.toString()
      }
    );

    res.json(payment);
  } catch (err) {
    console.error('Error updating payment record:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get all payments for an apartment (Manager only)
// @route   GET /api/payments/apartment/:apartmentId
// @access  Private (Manager only)
export const getApartmentPayments = async (req: AuthRequest, res: Response) => {
  try {
    // Verify the apartment is managed by the current user
    const apartment = await Apartment.findOne({
      _id: req.params.apartmentId,
      manager: req.user?.id
    });

    if (!apartment) {
      return res.status(403).json({ 
        msg: 'Apartment not found or you do not have permission to view its payments' 
      });
    }

    const payments = await Payment.find({ apartment: req.params.apartmentId })
      .sort({ dueDate: -1 })
      .populate('tenant', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json(payments);
  } catch (err) {
    console.error('Error fetching apartment payments:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get all payments for a tenant (Manager only)
// @route   GET /api/payments/tenant/:tenantId
// @access  Private (Manager only)
export const getTenantPayments = async (req: AuthRequest, res: Response) => {
  try {
    // Verify the tenant is managed by the current user
    const tenant = await User.findOne({
      _id: req.params.tenantId,
      assignedManager: req.user?.id
    });

    if (!tenant) {
      return res.status(403).json({ 
        msg: 'Tenant not found or you do not have permission to view their payments' 
      });
    }

    const payments = await Payment.find({ tenant: req.params.tenantId })
      .sort({ dueDate: -1 })
      .populate('apartment', 'name address')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json(payments);
  } catch (err) {
    console.error('Error fetching tenant payments:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get all payments (SuperAdmin only)
// @route   GET /api/payments
// @access  Private (SuperAdmin only)
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate('tenant', 'name email')
      .populate('apartment', 'name address')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json(payments);
  } catch (err) {
    console.error('Error fetching all payments:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Get payment statistics (SuperAdmin only)
// @route   GET /api/payments/stats
// @access  Private (SuperAdmin only)
export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const [totalPaid, totalPending, totalOverdue, recentPayments] = await Promise.all([
      Payment.aggregate([
        { $match: { status: PaymentStatus.PAID } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      
      Payment.aggregate([
        { $match: { status: PaymentStatus.PENDING } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      
      Payment.aggregate([
        { $match: { status: PaymentStatus.OVERDUE } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      
      Payment.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('tenant', 'name email')
        .populate('apartment', 'name address')
    ]);

    const stats = {
      totalPaid: totalPaid.length > 0 ? totalPaid[0].total : 0,
      totalPending: totalPending.length > 0 ? totalPending[0].total : 0,
      totalOverdue: totalOverdue.length > 0 ? totalOverdue[0].total : 0,
      recentPayments
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching payment statistics:', err);
    res.status(500).send('Server error');
  }
}; 