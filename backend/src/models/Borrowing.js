const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },

        borrower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        lender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        rentalPricePerDay: {
            type: Number,
            required: true,
            min: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentStatus: {
            type: String,
            enum: ['NOT_REQUIRED', 'PENDING', 'PAID'],
            default: 'NOT_REQUIRED'
        },

        status: {
            type: String,
            enum: [
                'REQUESTED',
                'APPROVED',
                'REJECTED',
                'ACTIVE',
                'RETURNED',
                'COMPLETED'
            ],
            default: 'REQUESTED'
        },

        returnedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Borrowing', borrowingSchema);