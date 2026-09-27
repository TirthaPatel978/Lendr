const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Not authorized. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Not authorized. No token provided.'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.userId) {
            return res.status(401).json({
                message: 'Not authorized. Invalid token.'
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: 'Not authorized. User not found.'
            });
        }

        if (user.isSuspended) {
            return res.status(403).json({
                message: 'Your account has been suspended'
            });
        }

        req.user = user._id;

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Not authorized. Invalid or expired token.'
        });
    }
};

module.exports = protect;