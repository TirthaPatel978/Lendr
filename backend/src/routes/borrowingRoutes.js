const express = require('express');
const validateBorrowableItem =
    require('../middleware/borrowItemMiddleware');
const {
    getRentalPricePreview,
    createBorrowingRequest,
    getMyBorrowRequests,
    getLenderRequests,
    approveBorrowing,
    rejectBorrowing,
    makePayment,
    returnItem,
    completeBorrowing
} = require('../controllers/borrowingController');

const protect = require('../middleware/authMiddleware');

const {
    validateObjectId,
    validateBorrowingDates
} = require('../middleware/validationMiddleware');

const router = express.Router();


// Rental price preview
router.get(
    '/price-preview',
    protect,
    getRentalPricePreview
);


// Create borrowing request
router.post(
    '/',
    protect,
    validateBorrowingDates,
    validateBorrowableItem,
    createBorrowingRequest
);


// My borrowing requests
router.get(
    '/my-requests',
    protect,
    getMyBorrowRequests
);


// Requests for lender's items
router.get(
    '/lender-requests',
    protect,
    getLenderRequests
);


// Approve request
router.put(
    '/:id/approve',
    protect,
    validateObjectId('id'),
    approveBorrowing
);


// Reject request
router.put(
    '/:id/reject',
    protect,
    validateObjectId('id'),
    rejectBorrowing
);


// Simulated payment
router.put(
    '/:id/pay',
    protect,
    validateObjectId('id'),
    makePayment
);


// Return item
router.put(
    '/:id/return',
    protect,
    validateObjectId('id'),
    returnItem
);


// Complete borrowing
router.put(
    '/:id/complete',
    protect,
    validateObjectId('id'),
    completeBorrowing
);

module.exports = router;