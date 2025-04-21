import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum PaymentType {
  RENT = 'rent',
  DEPOSIT = 'deposit',
  MAINTENANCE = 'maintenance',
  OTHER = 'other'
}

export interface IPayment extends Document {
  amount: number;
  tenant: mongoose.Types.ObjectId;
  apartment: mongoose.Types.ObjectId;
  dueDate: Date;
  paymentDate?: Date;
  status: PaymentStatus;
  paymentType: PaymentType;
  description?: string;
  createdBy: mongoose.Types.ObjectId; // Manager who created the payment
  updatedBy?: mongoose.Types.ObjectId; // Last user who updated the payment
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Please specify the amount'],
      min: [0, 'Amount cannot be negative'],
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the tenant'],
    },
    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Apartment',
      required: [true, 'Please specify the apartment'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please specify the due date'],
    },
    paymentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      required: [true, 'Please specify the payment type'],
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify who created this payment record'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Set payment status to overdue if due date has passed
PaymentSchema.pre('save', function(next) {
  if (this.dueDate < new Date() && this.status === PaymentStatus.PENDING) {
    this.status = PaymentStatus.OVERDUE;
  }
  next();
});

export default mongoose.model<IPayment>('Payment', PaymentSchema); 