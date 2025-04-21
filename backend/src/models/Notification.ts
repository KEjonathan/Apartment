import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  APARTMENT_CREATED = 'apartment_created',
  APARTMENT_UPDATED = 'apartment_updated',
  TENANT_ADDED = 'tenant_added',
  TENANT_REMOVED = 'tenant_removed',
  PAYMENT_CREATED = 'payment_created',
  PAYMENT_UPDATED = 'payment_updated',
  PAYMENT_OVERDUE = 'payment_overdue',
  PAYMENT_PAID = 'payment_paid',
  SYSTEM = 'system'
}

export interface INotification extends Document {
  type: NotificationType;
  message: string;
  user: mongoose.Types.ObjectId; // User who will receive notification
  relatedUser?: mongoose.Types.ObjectId; // User related to the notification (if applicable)
  relatedApartment?: mongoose.Types.ObjectId; // Apartment related to the notification (if applicable)
  relatedPayment?: mongoose.Types.ObjectId; // Payment related to the notification (if applicable)
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, 'Please specify the notification type'],
    },
    message: {
      type: String,
      required: [true, 'Please provide a notification message'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the user who will receive this notification'],
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedApartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Apartment',
    },
    relatedPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<INotification>('Notification', NotificationSchema); 