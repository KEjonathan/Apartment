import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { markNotificationAsRead, getUserNotifications } from '../services/notificationService';

// Custom interface to extend Express Request
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Get notifications for the current user
    const result = await getUserNotifications(req.user!.id, limit, page);
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    // Get notification
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    // Verify notification belongs to current user
    if (notification.user.toString() !== req.user!.id) {
      return res.status(403).json({ msg: 'Not authorized to access this notification' });
    }
    
    // Mark as read
    const updatedNotification = await markNotificationAsRead(req.params.id);
    
    res.json(updatedNotification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    // Update all unread notifications for the user
    await Notification.updateMany(
      { user: req.user!.id, read: false },
      { $set: { read: true } }
    );
    
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    // Get notification
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    
    // Verify notification belongs to current user
    if (notification.user.toString() !== req.user!.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this notification' });
    }
    
    // Delete notification
    await notification.deleteOne();
    
    res.json({ msg: 'Notification removed' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).send('Server error');
  }
}; 