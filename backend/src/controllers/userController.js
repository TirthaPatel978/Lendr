const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Get current user's profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json({
            user
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};


// Update current user's profile
const updateProfile = async (req, res) => {
    try {
        const { name, avatar, location } = req.body;

        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Only allow these fields to be updated
        if (name !== undefined) {
            user.name = name;
        }

        if (avatar !== undefined) {
            user.avatar = avatar;
        }

        if (location !== undefined) {
            user.location = location;
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                location: user.location,
                rating: user.rating,
                reliabilityScore: user.reliabilityScore
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update profile',
            error: error.message
        });
    }
};


// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters'
            });
        }

        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Current password is incorrect'
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);

        await user.save();

        res.json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to change password',
            error: error.message
        });
    }
};


module.exports = {
    getProfile,
    updateProfile,
    changePassword
};