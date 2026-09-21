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
                'ITEM_RETURNED',
                'BORROWING_COMPLETED',
                'OVERDUE'
            ],
            required: true
        },

        message: {
            type: String,
            required: true
        },

        borrowing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Borrowing',
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

module.exports = mongoose.model('Notification', notificationSchema);