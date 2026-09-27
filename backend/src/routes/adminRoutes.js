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

const {
    validateObjectId
} = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect, adminOnly);


// Dashboard
router.get('/dashboard', getDashboardStats);


// Users
router.get('/users', getAllUsers);

router.put(
    '/users/:id/suspend',
    validateObjectId('id'),
    suspendUser
);

router.put(
    '/users/:id/unsuspend',
    validateObjectId('id'),
    unsuspendUser
);


// Items
router.get('/items', getAllItems);

router.put(
    '/items/:id/remove',
    validateObjectId('id'),
    removeItem
);


// Borrowings
router.get('/borrowings', getAllBorrowings);


// Disputes
router.get('/disputes', getAllDisputes);

router.put(
    '/disputes/:id',
    validateObjectId('id'),
    updateDispute
);

module.exports = router;