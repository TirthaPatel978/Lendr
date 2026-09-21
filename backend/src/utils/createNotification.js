const Notification = require('../models/Notification');

const createNotification = async ({
    recipient,
    sender = null,
    type,
    message,
    borrowing = null
}) => {
    try {
        await Notification.create({
            recipient,
            sender,
            type,
            message,
            borrowing
        });
    } catch (error) {
        console.error(
            'Failed to create notification:',
            error.message
        );
    }
};

module.exports = createNotification;