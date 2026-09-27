const express = require('express');

const {
    getDashboardStats,
    getAllUsers,
    suspendUser,
    unsuspendUser,
    getAllItems,
    removeItem,
    getAllBorrowings,
    getAllDisputes,
    updateDispute
} = require('../controllers/adminController');

const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

const router = express.Router();


// All admin routes require:
// 1. Valid JWT
// 2. ADMIN role

router.use(protect, adminOnly);


// Dashboard
router.get('/dashboard', getDashboardStats);


// Users
router.get('/users', getAllUsers);

router.put(
    '/users/:id/suspend',
    suspendUser
);

router.put(
    '/users/:id/unsuspend',
    unsuspendUser
);


// Items
router.get('/items', getAllItems);

router.delete(
    '/items/:id',
    removeItem
);


// Borrowings
router.get('/borrowings', getAllBorrowings);


// Disputes
router.get('/disputes', getAllDisputes);

router.put(
    '/disputes/:id',
    updateDispute
);


module.exports = router;