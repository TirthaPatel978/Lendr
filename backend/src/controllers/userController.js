const bcrypt = require('bcryptjs');
const User = require('../models/User');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


// ============================================
// GET CURRENT USER PROFILE
// ============================================

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
        console.error(
            'Failed to fetch profile:',
            error.message
        );

        res.status(500).json({
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};


// ============================================
// UPDATE PROFILE
// ============================================

const updateProfile = async (req, res) => {
    try {
        const { name, location } = req.body;

        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }


        // ----------------------------------------
        // Update name
        // ----------------------------------------

        if (name !== undefined) {

            const trimmedName = name.trim();

            if (!trimmedName) {
                return res.status(400).json({
                    message: 'Name cannot be empty'
                });
            }

            user.name = trimmedName;
        }


        // ----------------------------------------
        // Update location
        // ----------------------------------------

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
        console.error(
            'Failed to update profile:',
            error.message
        );

        res.status(500).json({
            message: 'Failed to update profile',
            error: error.message
        });
    }
};


// ============================================
// UPLOAD / UPDATE AVATAR
// ============================================

const updateAvatar = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: 'Please select an image to upload'
            });
        }


        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }


        // Upload image to Cloudinary
        const result = await uploadToCloudinary(
            req.file.buffer,
            'lendr/avatars'
        );


        // Save Cloudinary URL
        user.avatar = result.secure_url;

        await user.save();


        res.json({
            message: 'Profile photo updated successfully',
            avatar: user.avatar,
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
        console.error(
            'Failed to upload avatar:',
            error.message
        );

        res.status(500).json({
            message: 'Failed to upload avatar',
            error: error.message
        });
    }
};


// ============================================
// CHANGE PASSWORD
// ============================================

const changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;


        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message:
                    'Current password and new password are required'
            });
        }


        if (newPassword.length < 6) {
            return res.status(400).json({
                message:
                    'New password must be at least 6 characters'
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


        user.password = await bcrypt.hash(
            newPassword,
            10
        );

        await user.save();


        res.json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error(
            'Failed to change password:',
            error.message
        );

        res.status(500).json({
            message: 'Failed to change password',
            error: error.message
        });
    }
};


module.exports = {
    getProfile,
    updateProfile,
    updateAvatar,
    changePassword
};