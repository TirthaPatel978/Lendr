const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        type: {
            type: String,
            enum: [
                'BORROW_REQUEST',
                'REQUEST_APPROVED',
                'REQUEST_REJECTED',
                'PAYMENT_COMPLETED',
                'ITEM_RETURNED',
                'BORROWING_COMPLETED',
                'DUE_TOMORROW',
                'DUE_TODAY',
                'OVERDUE',
                'ITEM_REMOVED'
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        relatedBorrowing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Borrowing',
            default: null
        },

        relatedItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);


/*
 * Fetch a user's notifications newest first.
 */
notificationSchema.index({
    recipient: 1,
    createdAt: -1
});


/*
 * Efficient unread notification lookup.
 */
notificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1
});


module.exports = mongoose.model(
    'Notification',
    notificationSchema
);