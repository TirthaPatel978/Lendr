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
            await Borrowing.findById(
                borrowingId
            )
                .populate(
                    'item',
                    'name category photos'
                )
                .populate(
                    'borrower',
                    'name email avatar'
                )
                .populate(
                    'lender',
                    'name email avatar'
                );

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

        /*
         * borrower and lender are populated above,
         * so compare their _id values instead of
         * calling toString() directly on the objects.
         */
        const isBorrower =
            borrowing.borrower?._id?.toString() ===
            currentUserId;

        const isLender =
            borrowing.lender?._id?.toString() ===
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
        // DETERMINE REPORTER NAME
        // ------------------------------------------

        const reporterName = isBorrower
            ? borrowing.borrower?.name
            : borrowing.lender?.name;

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

        /*
         * No damage fee:
         *     NOT_REQUIRED
         *
         * Damage fee exists:
         *     PENDING
         *
         * The accused user will be able to
         * simulate payment later.
         */

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

                item: borrowing.item?._id,

                reportedBy: req.user,

                againstUser:
                    againstUser?._id,

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
            recipient:
                againstUser?._id,

            sender:
                req.user,

            type:
                'DISPUTE_CREATED',

            title:
                'New dispute reported',

            message:
                `${reporterName || 'A user'} reported a ${
                    dispute.reason
                        ?.toLowerCase()
                        .replace(/_/g, ' ')
                } issue involving ${
                    borrowing.item?.name ||
                    'your equipment'
                }${
                    Number(dispute.damageAmount || 0) > 0
                        ? ` with a damage amount of ₹${Number(
                            dispute.damageAmount
                        ).toLocaleString('en-IN')}.`
                        : '.'
                }`,

            relatedBorrowing:
                borrowing._id,

            relatedItem:
                borrowing.item?._id,

            relatedDispute:
                dispute._id
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

        const isInvolved =
            dispute.reportedBy?._id?.toString() ===
                currentUserId ||
            dispute.againstUser?._id?.toString() ===
                currentUserId;

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
            )
                .populate(
                    'item',
                    'name category photos'
                )
                .populate(
                    'reportedBy',
                    'name email avatar'
                )
                .populate(
                    'againstUser',
                    'name email avatar'
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
                dispute.reportedBy?._id,

            sender:
                req.user,

            type:
                'DISPUTE_UPDATED',

            title:
                status === 'RESOLVED'
                    ? 'Dispute resolved'
                    : status === 'REJECTED'
                        ? 'Dispute rejected'
                        : 'Dispute status updated',

            message:
                status === 'RESOLVED'
                    ? `Your dispute concerning ${
                        dispute.item?.name ||
                        'the equipment'
                    } has been resolved by the Lendr administrator.`
                    : status === 'REJECTED'
                        ? `Your dispute concerning ${
                            dispute.item?.name ||
                            'the equipment'
                        } has been rejected by the Lendr administrator.`
                        : `Your dispute concerning ${
                            dispute.item?.name ||
                            'the equipment'
                        } is now ${
                            status
                                .toLowerCase()
                                .replace(/_/g, ' ')
                        }.`,

            relatedBorrowing:
                dispute.borrowing,

            relatedItem:
                dispute.item?._id,

            relatedDispute:
                dispute._id
        });

        // ------------------------------------------
        // NOTIFY ACCUSED USER
        // ------------------------------------------

        await createNotification({
            recipient:
                dispute.againstUser?._id,

            sender:
                req.user,

            type:
                'DISPUTE_UPDATED',

            title:
                status === 'RESOLVED'
                    ? 'Dispute resolved'
                    : status === 'REJECTED'
                        ? 'Dispute rejected'
                        : 'Dispute status updated',

            message:
                status === 'RESOLVED'
                    ? `The dispute involving ${
                        dispute.item?.name ||
                        'the equipment'
                    } has been resolved by the Lendr administrator.`
                    : status === 'REJECTED'
                        ? `The dispute involving ${
                            dispute.item?.name ||
                            'the equipment'
                        } has been rejected by the Lendr administrator.`
                        : `The dispute involving ${
                            dispute.item?.name ||
                            'the equipment'
                        } is now ${
                            status
                                .toLowerCase()
                                .replace(/_/g, ' ')
                        }.`,

            relatedBorrowing:
                dispute.borrowing,

            relatedItem:
                dispute.item?._id,

            relatedDispute:
                dispute._id
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
            )
                .populate(
                    'item',
                    'name category photos'
                )
                .populate(
                    'reportedBy',
                    'name email avatar'
                )
                .populate(
                    'againstUser',
                    'name email avatar'
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
            dispute.againstUser?._id?.toString();

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
                dispute.reportedBy?._id,

            sender:
                dispute.againstUser?._id,

            type:
                'DAMAGE_PAYMENT_COMPLETED',

            title:
                'Damage payment received',

            message:
                `${dispute.againstUser?.name || 'The accused user'} completed the damage payment of ₹${Number(
                    dispute.damageAmount
                ).toLocaleString('en-IN')} for ${
                    dispute.item?.name ||
                    'the equipment'
                }.`,

            relatedBorrowing:
                dispute.borrowing,

            relatedItem:
                dispute.item?._id,

            relatedDispute:
                dispute._id
        });

        // ------------------------------------------
        // NOTIFY ACCUSED USER
        // ------------------------------------------

        await createNotification({
            recipient:
                dispute.againstUser?._id,

            /*
             * The reporter is the other participant.
             * This avoids showing the recipient's own
             * name as the "Person" involved.
             */
            sender:
                dispute.reportedBy?._id,

            type:
                'DAMAGE_PAYMENT_COMPLETED',

            title:
                'Damage payment recorded',

            message:
                `Your simulated damage payment of ₹${Number(
                    dispute.damageAmount
                ).toLocaleString('en-IN')} for ${
                    dispute.item?.name ||
                    'the equipment'
                } has been recorded.`,

            relatedBorrowing:
                dispute.borrowing,

            relatedItem:
                dispute.item?._id,

            relatedDispute:
                dispute._id
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