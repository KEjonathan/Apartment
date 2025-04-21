import Notification, { NotificationType, INotification } from '../models/Notification';
import User, { UserRole } from '../models/User';
import mongoose from 'mongoose';

/**
 * Creates a notification for a specific user
 */
export const createNotification = async (
  type: NotificationType,
  message: string,
  userId: string,
  relatedData?: {
    relatedUser?: string;
    relatedApartment?: string;
    relatedPayment?: string;
  }
): Promise<INotification> => {
  const notificationData = {
    type,
    message,
    user: userId,
    ...(relatedData?.relatedUser && { relatedUser: relatedData.relatedUser }),
    ...(relatedData?.relatedApartment && { relatedApartment: relatedData.relatedApartment }),
    ...(relatedData?.relatedPayment && { relatedPayment: relatedData.relatedPayment }),
    read: false
  };

  const notification = new Notification(notificationData);
  await notification.save();
  return notification;
};

/**
 * Notify all superadmins about a system event
 */
export const notifySuperAdmins = async (
  type: NotificationType,
  message: string,
  relatedData?: {
    relatedUser?: string;
    relatedApartment?: string;
    relatedPayment?: string;
  }
): Promise<INotification[]> => {
  // Find all superadmins
  const superadmins = await User.find({ role: UserRole.SUPERADMIN });
  
  // Create notifications for each superadmin
  const notificationPromises = superadmins.map(admin => 
    createNotification(type, message, admin._id.toString(), relatedData)
  );
  
  return Promise.all(notificationPromises);
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<INotification | null> => {
  return Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId: string, limit = 20, page = 1): Promise<{
  notifications: INotification[],
  total: number,
  unread: number
}> => {
  const skip = (page - 1) * limit;
  
  const [notifications, total, unread] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedUser', 'name email')
      .populate('relatedApartment', 'name address')
      .populate('relatedPayment', 'amount status'),
      
    Notification.countDocuments({ user: userId }),
    
    Notification.countDocuments({ user: userId, read: false })
  ]);
  
  return {
    notifications,
    total,
    unread
  };
}; 