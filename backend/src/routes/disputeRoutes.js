const express = require('express');

const {
    createDispute,
    getMyDisputes,
    getDisputeById,
    updateDisputeStatus,
    payDamage
} = require('../controllers/disputeController');

const protect = require('../middleware/authMiddleware');

const adminMiddleware =
    require('../middleware/adminMiddleware');

const {
    validateObjectId
} = require('../middleware/validationMiddleware');

const upload =
    require('../middleware/uploadMiddleware');

const router = express.Router();

/*
 * Create dispute
 *
 * Any authenticated participant in a completed/returned
 * borrowing can create a dispute.
 */
router.post(
    '/',
    protect,
    upload.array('evidencePhotos', 5),
    createDispute
);

/*
 * Normal users can see disputes involving them.
 */
router.get(
    '/my-disputes',
    protect,
    getMyDisputes
);

/*
 * Normal users can view a dispute they are involved in.
 * Admins can also view it.
 */
router.get(
    '/:id',
    protect,
    validateObjectId('id'),
    getDisputeById
);

/*
 * ONLY THE ADMIN can change dispute status/resolution.
 */
router.put(
    '/:id/status',
    protect,
    adminMiddleware,
    validateObjectId('id'),
    updateDisputeStatus
);

/*
 * ONLY THE ACCUSED USER can pay the damage amount.
 */
router.put(
    '/:id/pay-damage',
    protect,
    validateObjectId('id'),
    payDamage
);

module.exports = router;