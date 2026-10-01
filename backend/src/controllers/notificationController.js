const Notification = require('../models/Notification');


// ============================================
// GET MY NOTIFICATIONS
// ============================================

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user
        })
            .populate('relatedBorrowing')
            .populate('relatedItem')
            .sort({ createdAt: -1 });

        res.json({
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error(
            'Failed to fetch notifications:',
            error.message
        );

        res.status(500).json({
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};


// ============================================
// MARK ONE NOTIFICATION AS READ
// ============================================

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

        if (notification.recipient.toString() !== req.user.toString()) {
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
        console.error(
            'Failed to update notification:',
            error.message
        );

        res.status(500).json({
            message: 'Failed to update notification',
            error: error.message
        });
    }
};


// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================

const markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user,
                isRead: false
            },
            {
                $set: {
                    isRead: true
                }
            }
        );

        res.json({
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error(
            'Failed to update notifications:',
            error.message
        );

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