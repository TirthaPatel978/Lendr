const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const {
    createDispute,
    getMyDisputes,
    getDisputeById,
    updateDisputeStatus
} = require('../controllers/disputeController');

const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
    '/',
    protect,
    upload.array('evidencePhotos', 5),
    createDispute
);
router.get('/my-disputes', protect, getMyDisputes);

router.get('/:id', protect, getDisputeById);

router.put('/:id/status', protect, updateDisputeStatus);

module.exports = router;    