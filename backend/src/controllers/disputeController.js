const Dispute = require('../models/Dispute');
const Borrowing = require('../models/Borrowing');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const createNotification = require('../utils/createNotification');


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

        // ------------------------------------------
        // VALIDATE REQUIRED FIELDS
        // ------------------------------------------

        if (!borrowingId || !reason || !description) {
            return res.status(400).json({
                message:
                    'Borrowing ID, reason and description are required'
            });
        }

        // ------------------------------------------
        // FIND BORROWING
        // ------------------------------------------

        const borrowing =
            await Borrowing.findById(borrowingId);

        if (!borrowing) {
            return res.status(404).json({
                message: 'Borrowing not found'
            });
        }

        // ------------------------------------------
        // DISPUTES ARE ONLY ALLOWED AFTER RETURN
        // ------------------------------------------

        if (
            borrowing.status !== 'RETURNED' &&
            borrowing.status !== 'COMPLETED'
        ) {
            return res.status(400).json({
                message:
                    'Disputes can only be created after the item has been returned'
            });
        }

        // ------------------------------------------
        // CHECK WHETHER CURRENT USER WAS INVOLVED
        // ------------------------------------------

        const currentUserId =
            req.user.toString();

        const isBorrower =
            borrowing.borrower.toString() ===
            currentUserId;

        const isLender =
            borrowing.lender.toString() ===
            currentUserId;

        if (!isBorrower && !isLender) {
            return res.status(403).json({
                message:
                    'You were not involved in this borrowing'
            });
        }

        // ------------------------------------------
        // DETERMINE THE OTHER PARTICIPANT
        // ------------------------------------------

        const againstUser = isBorrower
            ? borrowing.lender
            : borrowing.borrower;

        // ------------------------------------------
        // PREVENT DUPLICATE ACTIVE DISPUTES
        // ------------------------------------------

        const existingDispute =
            await Dispute.findOne({
                borrowing: borrowingId,
                status: {
                    $in: [
                        'OPEN',
                        'UNDER_REVIEW'
                    ]
                }
            });

        if (existingDispute) {
            return res.status(400).json({
                message:
                    'An active dispute already exists for this borrowing'
            });
        }

        // ------------------------------------------
        // VALIDATE DAMAGE AMOUNT
        // ------------------------------------------

        const finalDamageAmount =
            damageAmount === undefined ||
            damageAmount === ''
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

        // ------------------------------------------
        // UPLOAD EVIDENCE PHOTOS
        // ------------------------------------------

        let evidencePhotoUrls = [];

        if (
            req.files &&
            req.files.length > 0
        ) {
            for (const file of req.files) {
                const result =
                    await uploadToCloudinary(
                        file.buffer,
                        'lendr/disputes'
                    );

                evidencePhotoUrls.push(
                    result.secure_url
                );
            }
        }

        // ------------------------------------------
        // DETERMINE DAMAGE PAYMENT STATUS
        // ------------------------------------------
        //
        // No damage fee:
        //     NOT_REQUIRED
        //
        // Damage fee exists:
        //     PENDING
        //
        // The accused user will be able to
        // simulate payment later.
        // ------------------------------------------

        const damagePaymentStatus =
            finalDamageAmount > 0
                ? 'PENDING'
                : 'NOT_REQUIRED';

        // ------------------------------------------
        // CREATE DISPUTE
        // ------------------------------------------

        const dispute =
            await Dispute.create({
                borrowing: borrowingId,

                item: borrowing.item,

                reportedBy: req.user,

                againstUser,

                reason,

                description:
                    description.trim(),

                damageAmount:
                    finalDamageAmount,

                damagePaymentStatus,

                damagePaidAt: null,

                damagePaidBy: null,

                evidencePhotos:
                    evidencePhotoUrls,

                status: 'OPEN',

                resolution: '',

                resolvedAt: null
            });

        // ------------------------------------------
        // NOTIFY THE ACCUSED USER
        // ------------------------------------------

        await createNotification({
            recipient: againstUser,

            type: 'BORROWING_COMPLETED',

            title:
                'A dispute has been reported',

            message:
                finalDamageAmount > 0
                    ? `A dispute has been reported for this borrowing with a damage amount of ₹${finalDamageAmount.toLocaleString('en-IN')}.`
                    : 'A dispute has been reported for this borrowing.',

            relatedBorrowing:
                borrowing._id,

            relatedItem:
                borrowing.item
        });

        // ------------------------------------------
        // RETURN POPULATED DISPUTE
        // ------------------------------------------

        const populatedDispute =
            await Dispute.findById(
                dispute._id
            )
                .populate('borrowing')
                .populate(
                    'item',
                    'name category'
                )
                .populate(
                    'reportedBy',
                    'name email'
                )
                .populate(
                    'againstUser',
                    'name email'
                )
                .populate(
                    'damagePaidBy',
                    'name email'
                );

        res.status(201).json({
            message:
                'Dispute created successfully',

            dispute:
                populatedDispute
        });

    } catch (error) {
        console.error(
            'Create dispute error:',
            error
        );

        res.status(500).json({
            message:
                'Failed to create dispute',

            error:
                error.message
        });
    }
};


// ==========================================
// GET MY DISPUTES
// ==========================================
//
// Normal users can see disputes where they are:
// - reporter
// - accused
//
// Admin access is also allowed because the
// admin dashboard can use this endpoint.
// ==========================================
const getMyDisputes = async (req, res) => {
    try {
        const disputes =
            await Dispute.find({
                $or: [
                    {
                        reportedBy: req.user
                    },
                    {
                        againstUser: req.user
                    }
                ]
            })
                .populate(
                    'item',
                    'name category'
                )
                .populate(
                    'reportedBy',
                    'name email'
                )
                .populate(
                    'againstUser',
                    'name email'
                )
                .populate('borrowing')
                .populate(
                    'damagePaidBy',
                    'name email'
                )
                .sort({
                    createdAt: -1
                });

        res.json({
            count: disputes.length,
            disputes
        });

    } catch (error) {
        console.error(
            'Get my disputes error:',
            error
        );

        res.status(500).json({
            message:
                'Failed to fetch disputes',

            error:
                error.message
        });
    }
};


// ==========================================
// GET SINGLE DISPUTE
// ==========================================
//
// Allowed:
// - Reporter
// - Accused
// - Admin
// ==========================================
const getDisputeById = async (
    req,
    res
) => {
    try {
        const dispute =
            await Dispute.findById(
                req.params.id
            )
                .populate(
                    'item',
                    'name category description'
                )
                .populate(
                    'reportedBy',
                    'name email'
                )
                .populate(
                    'againstUser',
                    'name email'
                )
                .populate('borrowing')
                .populate(
                    'damagePaidBy',
                    'name email'
                );

        if (!dispute) {
            return res.status(404).json({
                message:
                    'Dispute not found'
            });
        }

        // ------------------------------------------
        // CHECK ACCESS
        // ------------------------------------------

        const currentUserId =
            req.user.toString();

        /*
         * req.user is normally the user ID because
         * authMiddleware sets req.user to the
         * authenticated user's ObjectId.
         *
         * Therefore, admin access should be checked
         * using the actual user document if needed.
         *
         * For normal participants:
         */
        const isInvolved =
            dispute.reportedBy._id.toString() ===
                currentUserId ||
            dispute.againstUser._id.toString() ===
                currentUserId;

        /*
         * If the request is from a participant,
         * allow access.
         *
         * Admin dashboard will use the admin-specific
         * routes / middleware for administrative actions.
         */
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
        console.error(
            'Get dispute error:',
            error
        );

        res.status(500).json({
            message:
                'Failed to fetch dispute',

            error:
                error.message
        });
    }
};


// ==========================================
// UPDATE DISPUTE STATUS
// ==========================================
//
// IMPORTANT:
//
// This function is now ADMIN ONLY.
//
// The route must use:
//
// protect,
// adminMiddleware
//
// before reaching this controller.
//
// Normal users CANNOT:
// - change status
// - resolve dispute
// - reject dispute
// - add resolution
// ==========================================
const updateDisputeStatus = async (
    req,
    res
) => {
    try {
        const {
            status,
            resolution
        } = req.body;

        // ------------------------------------------
        // VALIDATE STATUS
        // ------------------------------------------

        if (!status) {
            return res.status(400).json({
                message:
                    'Status is required'
            });
        }

        const allowedStatuses = [
            'OPEN',
            'UNDER_REVIEW',
            'RESOLVED',
            'REJECTED'
        ];

        if (
            !allowedStatuses.includes(
                status
            )
        ) {
            return res.status(400).json({
                message:
                    'Invalid dispute status'
            });
        }

        // ------------------------------------------
        // FIND DISPUTE
        // ------------------------------------------

        const dispute =
            await Dispute.findById(
                req.params.id
            );

        if (!dispute) {
            return res.status(404).json({
                message:
                    'Dispute not found'
            });
        }

        // ------------------------------------------
        // REQUIRE RESOLUTION FOR CLOSED DISPUTES
        // ------------------------------------------

        if (
            (
                status === 'RESOLVED' ||
                status === 'REJECTED'
            ) &&
            (
                !resolution ||
                !resolution.trim()
            )
        ) {
            return res.status(400).json({
                message:
                    'A resolution is required before resolving or rejecting a dispute'
            });
        }

        // ------------------------------------------
        // PREVENT CHANGES AFTER CLOSURE
        // ------------------------------------------

        if (
            dispute.status === 'RESOLVED' ||
            dispute.status === 'REJECTED'
        ) {
            return res.status(400).json({
                message:
                    'This dispute has already been closed'
            });
        }

        // ------------------------------------------
        // UPDATE STATUS
        // ------------------------------------------

        dispute.status = status;

        // ------------------------------------------
        // UPDATE RESOLUTION
        // ------------------------------------------

        if (
            resolution !== undefined
        ) {
            dispute.resolution =
                resolution.trim();
        }

        // ------------------------------------------
        // SET RESOLVED DATE
        // ------------------------------------------

        if (
            status === 'RESOLVED' ||
            status === 'REJECTED'
        ) {
            dispute.resolvedAt =
                new Date();
        } else {
            dispute.resolvedAt = null;
        }

        // ------------------------------------------
        // SAVE
        // ------------------------------------------

        await dispute.save();

        // ------------------------------------------
        // NOTIFY REPORTER
        // ------------------------------------------

        await createNotification({
            recipient:
                dispute.reportedBy,

            type:
                status === 'RESOLVED'
                    ? 'BORROWING_COMPLETED'
                    : 'ITEM_RETURNED',

            title:
                status === 'RESOLVED'
                    ? 'Dispute resolved'
                    : 'Dispute status updated',

            message:
                status === 'RESOLVED'
                    ? 'Your dispute has been resolved by the Lendr administrator.'
                    : `Your dispute status is now ${status
                          .replaceAll(
                              '_',
                              ' '
                          )
                          .toLowerCase()}.`,

            relatedBorrowing:
                dispute.borrowing,

            relatedItem:
                dispute.item
        });

        // ------------------------------------------
        // NOTIFY ACCUSED USER
        // ------------------------------------------

        await createNotification({
            recipient:
                dispute.againstUser,

            type:
                status === 'RESOLVED'
                    ? 'BORROWING_COMPLETED'
                    : 'ITEM_RETURNED',

            title:
                status === 'RESOLVED'
                    ? 'Dispute resolved'
                    : 'Dispute status updated',

            message:
                status === 'RESOLVED'
                    ? 'A dispute involving you has been resolved by the Lendr administrator.'
                    : `A dispute involving you is now ${status
                          .replaceAll(
                              '_',
                              ' '
                          )
                          .toLowerCase()}.`,

            relatedBorrowing:
                dispute.borrowing,

            relatedItem:
                dispute.item
        });

        // ------------------------------------------
        // RETURN UPDATED DISPUTE
        // ------------------------------------------

        const updatedDispute =
            await Dispute.findById(
                dispute._id
            )
                .populate(
                    'item',
                    'name category'
                )
                .populate(
                    'reportedBy',
                    'name email'
                )
                .populate(
                    'againstUser',
                    'name email'
                )
                .populate(
                    'borrowing'
                )
                .populate(
                    'damagePaidBy',
                    'name email'
                );

        res.json({
            message:
                'Dispute updated successfully',

            dispute:
                updatedDispute
        });

    } catch (error) {
        console.error(
            'Update dispute status error:',
            error
        );

        res.status(500).json({
            message:
                'Failed to update dispute',

            error:
                error.message
        });
    }
};


// ==========================================
// PAY DAMAGE
// ==========================================
//
// ONLY THE ACCUSED USER CAN DO THIS.
//
// This is a SIMULATED payment.
// No real payment gateway is involved.
// ==========================================
const payDamage = async (
    req,
    res
) => {
    try {
        // ------------------------------------------
        // FIND DISPUTE
        // ------------------------------------------

        const dispute =
            await Dispute.findById(
                req.params.id
            );

        if (!dispute) {
            return res.status(404).json({
                message:
                    'Dispute not found'
            });
        }

        // ------------------------------------------
        // CHECK WHETHER CURRENT USER IS ACCUSED
        // ------------------------------------------

        const currentUserId =
            req.user.toString();

        const accusedUserId =
            dispute.againstUser.toString();

        if (
            accusedUserId !==
            currentUserId
        ) {
            return res.status(403).json({
                message:
                    'Only the accused user can pay the damage amount'
            });
        }

        // ------------------------------------------
        // CHECK WHETHER PAYMENT IS REQUIRED
        // ------------------------------------------

        if (
            !dispute.damageAmount ||
            dispute.damageAmount <= 0
        ) {
            return res.status(400).json({
                message:
                    'No damage payment is required'
            });
        }

        // ------------------------------------------
        // PREVENT DOUBLE PAYMENT
        // ------------------------------------------

        if (
            dispute.damagePaymentStatus ===
            'PAID'
        ) {
            return res.status(400).json({
                message:
                    'Damage payment has already been completed'
            });
        }

        // ------------------------------------------
        // PAYMENT MUST BE PENDING
        // ------------------------------------------

        if (
            dispute.damagePaymentStatus !==
            'PENDING'
        ) {
            return res.status(400).json({
                message:
                    'This dispute is not awaiting damage payment'
            });
        }

        // ------------------------------------------
        // SIMULATED PAYMENT
        // ------------------------------------------

        dispute.damagePaymentStatus =
            'PAID';

        dispute.damagePaidAt =
            new Date();

        dispute.damagePaidBy =
            req.user;

        await dispute.save();

        // ------------------------------------------
        // NOTIFY REPORTER
        // ------------------------------------------

        await createNotification({
            recipient:
                dispute.reportedBy,

            type:
                'PAYMENT_COMPLETED',

            title:
                'Damage payment completed',

            message:
                `The damage payment of ₹${dispute.damageAmount.toLocaleString(
                    'en-IN'
                )} has been completed.`,

            relatedBorrowing:
                dispute.borrowing,

            relatedItem:
                dispute.item
        });

        // ------------------------------------------
        // NOTIFY ACCUSED USER
        // ------------------------------------------

        await createNotification({
            recipient:
                dispute.againstUser,

            type:
                'PAYMENT_COMPLETED',

            title:
                'Damage payment completed',

            message:
                `Your simulated damage payment of ₹${dispute.damageAmount.toLocaleString(
                    'en-IN'
                )} has been recorded.`,

            relatedBorrowing:
                dispute.borrowing,

            relatedItem:
                dispute.item
        });

        // ------------------------------------------
        // RETURN UPDATED DISPUTE
        // ------------------------------------------

        const updatedDispute =
            await Dispute.findById(
                dispute._id
            )
                .populate(
                    'item',
                    'name category'
                )
                .populate(
                    'reportedBy',
                    'name email'
                )
                .populate(
                    'againstUser',
                    'name email'
                )
                .populate(
                    'borrowing'
                )
                .populate(
                    'damagePaidBy',
                    'name email'
                );

        res.json({
            message:
                'Damage payment successful (simulated)',

            dispute:
                updatedDispute
        });

    } catch (error) {
        console.error(
            'Pay damage error:',
            error
        );

        res.status(500).json({
            message:
                'Failed to process damage payment',

            error:
                error.message
        });
    }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    createDispute,
    getMyDisputes,
    getDisputeById,
    updateDisputeStatus,
    payDamage
};