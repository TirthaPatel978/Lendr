const Notification = require('../models/Notification');


// ============================================
// CREATE NOTIFICATION
// ============================================

const createNotification = async ({
    recipient,
    type,
    title = null,
    message,
    borrowing = null,
    relatedBorrowing = null,
    relatedItem = null
}) => {

    try {

        // Use relatedBorrowing if supplied.
        // Otherwise support the older "borrowing" argument
        // so existing borrowing code continues to work.
        const borrowingId =
            relatedBorrowing || borrowing || null;


        // Default titles based on notification type.
        const notificationTitles = {
            BORROW_REQUEST: 'New borrow request',
            REQUEST_APPROVED: 'Borrow request approved',
            REQUEST_REJECTED: 'Borrow request rejected',
            PAYMENT_COMPLETED: 'Payment completed',
            ITEM_RETURNED: 'Item returned',
            BORROWING_COMPLETED: 'Borrowing completed',
            DUE_TOMORROW: 'Item due tomorrow',
            DUE_TODAY: 'Item due today',
            OVERDUE: 'Item is overdue',
            ITEM_REMOVED: 'Your listing was removed'
        };


        const notificationTitle =
            title ||
            notificationTitles[type] ||
            'New notification';


        const notificationData = {
            recipient,
            type,
            title: notificationTitle,
            message,
            relatedBorrowing: borrowingId,
            relatedItem,
            isRead: false
        };


        await Notification.create(notificationData);

    } catch (error) {

        console.error(
            'Failed to create notification:',
            error.message
        );

    }
};


module.exports = createNotification;