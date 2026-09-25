const Dispute = require('../models/Dispute');
const Borrowing = require('../models/Borrowing');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

// ==========================================
// CREATE DISPUTE
// ==========================================
const createDispute = async (req, res) => {
    try {
        const {
            borrowingId,
            reason,
            description,
            damageAmount
        } = req.body;

        // Validate required fields
        if (!borrowingId || !reason || !description) {
            return res.status(400).json({
                message:
                    'Borrowing ID, reason and description are required'
            });
        }

        // Find borrowing
        const borrowing = await Borrowing.findById(borrowingId);

        if (!borrowing) {
            return res.status(404).json({
                message: 'Borrowing not found'
            });
        }

        // Disputes are only allowed after the item has been returned
        if (
            borrowing.status !== 'RETURNED' &&
            borrowing.status !== 'COMPLETED'
        ) {
            return res.status(400).json({
                message:
                    'Disputes can only be created after the item has been returned'
            });
        }

        // Check whether current user was involved
        const isBorrower =
            borrowing.borrower.toString() === req.user;

        const isLender =
            borrowing.lender.toString() === req.user;

        if (!isBorrower && !isLender) {
            return res.status(403).json({
                message:
                    'You were not involved in this borrowing'
            });
        }

        // The other person becomes the user the dispute is against
        const againstUser = isBorrower
            ? borrowing.lender
            : borrowing.borrower;

        // Prevent duplicate active disputes
        const existingDispute = await Dispute.findOne({
            borrowing: borrowingId,
            status: {
                $in: ['OPEN', 'UNDER_REVIEW']
            }
        });

        if (existingDispute) {
            return res.status(400).json({
                message:
                    'An active dispute already exists for this borrowing'
            });
        }

        // Validate damage amount
        const finalDamageAmount =
            damageAmount === undefined
                ? 0
                : Number(damageAmount);

        if (
            Number.isNaN(finalDamageAmount) ||
            finalDamageAmount < 0
        ) {
            return res.status(400).json({
                message:
                    'Damage amount must be a valid non-negative number'
            });
        }

        // ==========================================
        // UPLOAD EVIDENCE PHOTOS
        // ==========================================

        let evidencePhotoUrls = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToCloudinary(
                    file.buffer,
                    'lendr/disputes'
                );

                evidencePhotoUrls.push(
                    result.secure_url
                );
            }
        }

        // Create dispute
        const dispute = await Dispute.create({
            borrowing: borrowingId,
            item: borrowing.item,
            reportedBy: req.user,
            againstUser,
            reason,
            description,
            damageAmount: finalDamageAmount,
            evidencePhotos: evidencePhotoUrls
        });

        const populatedDispute =
            await Dispute.findById(dispute._id)
                .populate('borrowing')
                .populate('item', 'name category')
                .populate('reportedBy', 'name email')
                .populate('againstUser', 'name email');

        res.status(201).json({
            message: 'Dispute created successfully',
            dispute: populatedDispute
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to create dispute',
            error: error.message
        });
    }
};

// ==========================================
// GET MY DISPUTES
// ==========================================
const getMyDisputes = async (req, res) => {
    try {
        const disputes = await Dispute.find({
            $or: [
                { reportedBy: req.user },
                { againstUser: req.user }
            ]
        })
            .populate('item', 'name category')
            .populate('reportedBy', 'name email')
            .populate('againstUser', 'name email')
            .populate('borrowing')
            .sort({ createdAt: -1 });

        res.json({
            count: disputes.length,
            disputes
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch disputes',
            error: error.message
        });
    }
};


// ==========================================
// GET SINGLE DISPUTE
// ==========================================
const getDisputeById = async (req, res) => {
    try {
        const dispute = await Dispute.findById(req.params.id)
            .populate('item', 'name category description')
            .populate('reportedBy', 'name email')
            .populate('againstUser', 'name email')
            .populate('borrowing');

        if (!dispute) {
            return res.status(404).json({
                message: 'Dispute not found'
            });
        }

        // Only involved users can view dispute
        const isInvolved =
            dispute.reportedBy._id.toString() === req.user ||
            dispute.againstUser._id.toString() === req.user;

        if (!isInvolved) {
            return res.status(403).json({
                message:
                    'You are not allowed to view this dispute'
            });
        }

        res.json({
            dispute
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch dispute',
            error: error.message
        });
    }
};


// ==========================================
// UPDATE DISPUTE STATUS
// ==========================================
const updateDisputeStatus = async (req, res) => {
    try {
        const {
            status,
            resolution
        } = req.body;

        if (!status) {
            return res.status(400).json({
                message: 'Status is required'
            });
        }

        const allowedStatuses = [
            'OPEN',
            'UNDER_REVIEW',
            'RESOLVED',
            'REJECTED'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid dispute status'
            });
        }

        const dispute = await Dispute.findById(
            req.params.id
        );

        if (!dispute) {
            return res.status(404).json({
                message: 'Dispute not found'
            });
        }

        // Only people involved in the dispute can update it
        const isInvolved =
            dispute.reportedBy.toString() === req.user ||
            dispute.againstUser.toString() === req.user;

        if (!isInvolved) {
            return res.status(403).json({
                message:
                    'You are not allowed to update this dispute'
            });
        }

        // Once resolved/rejected, don't allow reopening
        if (
            dispute.status === 'RESOLVED' ||
            dispute.status === 'REJECTED'
        ) {
            return res.status(400).json({
                message:
                    'This dispute has already been closed'
            });
        }

        dispute.status = status;

        if (resolution !== undefined) {
            dispute.resolution = resolution;
        }

        if (
            status === 'RESOLVED' ||
            status === 'REJECTED'
        ) {
            dispute.resolvedAt = new Date();
        }

        await dispute.save();

        res.json({
            message: 'Dispute updated successfully',
            dispute
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update dispute',
            error: error.message
        });
    }
};


module.exports = {
    createDispute,
    getMyDisputes,
    getDisputeById,
    updateDisputeStatus
};