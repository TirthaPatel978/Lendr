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

module.exports = mongoose.model('Dispute', disputeSchema);