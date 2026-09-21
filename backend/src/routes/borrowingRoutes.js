const express = require('express');

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

const router = express.Router();

router.get('/price-preview', protect, getRentalPricePreview);

router.post('/', protect, createBorrowingRequest);

router.get('/my-requests', protect, getMyBorrowRequests);

router.get('/lender-requests', protect, getLenderRequests);

router.put('/:id/approve', protect, approveBorrowing);

router.put('/:id/reject', protect, rejectBorrowing);

router.put('/:id/pay', protect, makePayment);

router.put('/:id/return', protect, returnItem);

router.put('/:id/complete', protect, completeBorrowing);

module.exports = router;