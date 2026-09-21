const Notification = require('../models/Notification');
const createNotification = require('../utils/createNotification');
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user
        })
            .populate('sender', 'name')
            .populate('borrowing')
            .sort({ createdAt: -1 });

        res.json({
            count: notifications.length,
            notifications
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};


const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(
            req.params.id
        );

        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found'
            });
        }

        if (notification.recipient.toString() !== req.user) {
            return res.status(403).json({
                message: 'You are not allowed to modify this notification'
            });
        }

        notification.isRead = true;

        await notification.save();

        res.json({
            message: 'Notification marked as read',
            notification
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update notification',
            error: error.message
        });
    }
};


const markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user,
                isRead: false
            },
            {
                isRead: true
            }
        );

        res.json({
            message: 'All notifications marked as read'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update notifications',
            error: error.message
        });
    }
};


module.exports = {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};