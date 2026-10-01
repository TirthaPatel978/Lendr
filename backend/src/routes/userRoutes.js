const express = require('express');

const {
    getProfile,
    updateProfile,
    updateAvatar,
    changePassword
} = require('../controllers/userController');

const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();


// ============================================
// PROFILE
// ============================================

router.get(
    '/profile',
    protect,
    getProfile
);


router.put(
    '/profile',
    protect,
    updateProfile
);


// ============================================
// AVATAR
// ============================================

router.put(
    '/profile/avatar',
    protect,
    upload.single('avatar'),
    updateAvatar
);


// ============================================
// PASSWORD
// ============================================

router.put(
    '/change-password',
    protect,
    changePassword
);


module.exports = router;