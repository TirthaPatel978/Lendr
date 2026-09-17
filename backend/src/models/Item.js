const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        condition: {
            type: String,
            enum: [
                'EXCELLENT',
                'GOOD',
                'FAIR',
                'POOR'
            ],
            required: true
        },

        rentalType: {
            type: String,
            enum: ['FREE', 'PAID'],
            default: 'FREE',
            required: true
        },

        originalValue: {
            type: Number,
            min: 0,
            default: 0
        },

        rentalPricePerDay: {
            type: Number,
            min: 0,
            default: 0
        },

        availability: {
            type: Boolean,
            default: true
        },

        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },

            coordinates: {
                type: [Number],
                required: true
            }
        },

        photos: [
            {
                type: String
            }
        ]
    },
    {
        timestamps: true
    }
);

// Geospatial index for nearby item searches
itemSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Item', itemSchema);