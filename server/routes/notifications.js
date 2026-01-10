const express = require('express');
const Notification = require('../models/Notification');
const { authMiddleware, validateUserAccess } = require('../middleware/auth');
const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// Get all notifications for a user
router.get('/:userId', validateUserAccess, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId })
            .populate('relatedUserId', 'name')
            .sort('-createdAt')
            .limit(50);

        res.json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get unread notification count
router.get('/:userId/unread-count', validateUserAccess, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.params.userId,
            isRead: false
        });

        res.json({ count });
    } catch (err) {
        console.error('Error counting notifications:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark a notification as read
router.post('/mark-read/:notificationId', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Verify the notification belongs to the authenticated user
        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true });
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark all notifications as read for a user
router.post('/mark-all-read/:userId', validateUserAccess, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.params.userId, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to create notification (used by other routes)
const createNotification = async (data, io) => {
    try {
        const notification = new Notification(data);
        await notification.save();

        // Emit real-time notification via Socket.IO if io is available
        if (io) {
            io.emit('new_notification', {
                userId: data.userId.toString(),
                notification: {
                    _id: notification._id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt
                }
            });
        }

        return notification;
    } catch (err) {
        console.error('Error creating notification:', err);
        throw err;
    }
};

module.exports = router;
module.exports.createNotification = createNotification;
