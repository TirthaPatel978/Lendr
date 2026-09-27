const User = require('../models/User');

const adminOnly = async (req, res, next) => {
    try {
        const user = await User.findById(req.user);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if (user.isSuspended) {
            return res.status(403).json({
                message: 'Account is suspended'
            });
        }

        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                message: 'Admin access required'
            });
        }

        next();

    } catch (error) {
        res.status(500).json({
            message: 'Failed to verify admin access',
            error: error.message
        });
    }
};

module.exports = adminOnly;