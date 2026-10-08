const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        type: {
            type: String,
            enum: [
                'BORROW_REQUEST',
                'REQUEST_APPROVED',
                'REQUEST_REJECTED',

                'PAYMENT_COMPLETED',
                'DAMAGE_PAYMENT_COMPLETED',

                'ITEM_RETURNED',
                'BORROWING_COMPLETED',

                'DUE_TOMORROW',
                'DUE_TODAY',
                'OVERDUE',

                'DISPUTE_CREATED',
                'DISPUTE_UPDATED',

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

        relatedDispute: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dispute',
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

notificationSchema.index({
    recipient: 1,
    createdAt: -1
});

notificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1
});

notificationSchema.index({
    relatedBorrowing: 1
});

notificationSchema.index({
    relatedItem: 1
});

notificationSchema.index({
    relatedDispute: 1
});

module.exports = mongoose.model(
    'Notification',
    notificationSchema
);