import express from 'express';
import * as notificationController from '../controllers/notification.controller';
import auth from '../middleware/auth';

const router = express.Router();

// @route   GET api/notifications
// @desc    Get notifications for current user
// @access  Private
router.get(
  '/',
  auth,
  notificationController.getNotifications
);

// @route   PUT api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put(
  '/:id/read',
  auth,
  notificationController.markAsRead
);

// @route   PUT api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put(
  '/read-all',
  auth,
  notificationController.markAllAsRead
);

// @route   DELETE api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete(
  '/:id',
  auth,
  notificationController.deleteNotification
);

export default router; 