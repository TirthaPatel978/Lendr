const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
    {
        borrowing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Borrowing',
            required: true
        },

        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        againstUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        reason: {
            type: String,
            enum: [
                'DAMAGE',
                'MISSING_PARTS',
                'LOST_ITEM',
                'LATE_RETURN',
                'OTHER'
            ],
            required: true
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        damageAmount: {
            type: Number,
            min: 0,
            default: 0
        },

        /*
         * Simulated damage-payment system.
         *
         * NOT_REQUIRED = no damage fee
         * PENDING      = accused user needs to pay
         * PAID         = simulated payment completed
         */
        damagePaymentStatus: {
            type: String,
            enum: [
                'NOT_REQUIRED',
                'PENDING',
                'PAID'
            ],
            default: 'NOT_REQUIRED'
        },

        damagePaidAt: {
            type: Date,
            default: null
        },

        damagePaidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        evidencePhotos: [
            {
                type: String
            }
        ],

        status: {
            type: String,
            enum: [
                'OPEN',
                'UNDER_REVIEW',
                'RESOLVED',
                'REJECTED'
            ],
            default: 'OPEN'
        },

        resolution: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ''
        },

        resolvedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

disputeSchema.index({
    reportedBy: 1,
    createdAt: -1
});

disputeSchema.index({
    againstUser: 1,
    createdAt: -1
});

disputeSchema.index({
    status: 1,
    createdAt: -1
});

disputeSchema.index({
    borrowing: 1,
    status: 1
});

module.exports = mongoose.model(
    'Dispute',
    disputeSchema
);