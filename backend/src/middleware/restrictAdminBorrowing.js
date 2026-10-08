const User = require('../models/User');

const restrictAdminBorrowing = async (req, res, next) => {
    try {
        const user = await User.findById(req.user)
            .select('role');

        if (!user) {
            return res.status(401).json({
                message: 'User account not found'
            });
        }

        if (user.role === 'ADMIN') {
            return res.status(403).json({
                message: 'Administrator accounts cannot borrow equipment'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = restrictAdminBorrowing;