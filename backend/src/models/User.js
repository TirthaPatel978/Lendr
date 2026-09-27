const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        role: {
            type: String,
            enum: ['USER', 'ADMIN'],
            default: 'USER'
        },

        isSuspended: {
            type: Boolean,
            default: false
        },

        avatar: {
            type: String,
            default: ''
        },

        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },

            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        reliabilityScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    {
        timestamps: true
    }
);

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);