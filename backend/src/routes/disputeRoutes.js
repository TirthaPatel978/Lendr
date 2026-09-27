const express = require('express');

const {
    createDispute,
    getMyDisputes,
    getDisputeById,
    updateDisputeStatus
} = require('../controllers/disputeController');

const protect = require('../middleware/authMiddleware');

const {
    validateObjectId
} = require('../middleware/validationMiddleware');

const upload = require('../middleware/uploadMiddleware');

const router = express.Router();


// Create dispute
router.post(
    '/',
    protect,
    upload.array('evidencePhotos', 5),
    createDispute
);


// My disputes
router.get(
    '/my-disputes',
    protect,
    getMyDisputes
);


// Get dispute
router.get(
    '/:id',
    protect,
    validateObjectId('id'),
    getDisputeById
);


// Update dispute status
router.put(
    '/:id/status',
    protect,
    validateObjectId('id'),
    updateDisputeStatus
);

module.exports = router;