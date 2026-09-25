const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        reviewedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        borrowing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Borrowing',
            required: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        comment: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

reviewSchema.index(
    {
        reviewer: 1,
        borrowing: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model('Review', reviewSchema);