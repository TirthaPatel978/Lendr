const User = require('../models/User');
const Item = require('../models/Item');
const Borrowing = require('../models/Borrowing');
const Dispute = require('../models/Dispute');
const Notification = require('../models/Notification');


/*
 * -----------------------------------------
 * ADMIN DASHBOARD
 * -----------------------------------------
 */

const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalItems,
            totalBorrowings,
            activeBorrowings,
            completedBorrowings,
            openDisputes,
            suspendedUsers
        ] = await Promise.all([
            User.countDocuments(),

            Item.countDocuments(),

            Borrowing.countDocuments(),

            Borrowing.countDocuments({
                status: {
                    $in: ['ACTIVE', 'OVERDUE']
                }
            }),

            Borrowing.countDocuments({
                status: 'COMPLETED'
            }),

            Dispute.countDocuments({
                status: {
                    $in: ['OPEN', 'UNDER_REVIEW']
                }
            }),

            User.countDocuments({
                isSuspended: true
            })
        ]);

        res.json({
            totalUsers,
            totalItems,
            totalBorrowings,
            activeBorrowings,
            completedBorrowings,
            openDisputes,
            suspendedUsers
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to load admin dashboard statistics',
            error: error.message
        });
    }
};


/*
 * -----------------------------------------
 * USERS
 * -----------------------------------------
 */

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({
                createdAt: -1
            });

        res.json({
            users
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};


const suspendUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.toString()) {
            return res.status(400).json({
                message: 'You cannot suspend your own account'
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if (user.role === 'ADMIN') {
            return res.status(403).json({
                message: 'Admin accounts cannot be suspended'
            });
        }

        user.isSuspended = true;

        await user.save();

        res.json({
            message: 'User suspended successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isSuspended: user.isSuspended
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to suspend user',
            error: error.message
        });
    }
};


const unsuspendUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        user.isSuspended = false;

        await user.save();

        res.json({
            message: 'User unsuspended successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isSuspended: user.isSuspended
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to unsuspend user',
            error: error.message
        });
    }
};


/*
 * -----------------------------------------
 * ITEMS
 * -----------------------------------------
 */

const getAllItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate(
                'owner',
                'name email avatar rating reliabilityScore'
            )
            .populate(
                'removedBy',
                'name email'
            )
            .sort({
                createdAt: -1
            });

        res.json({
            items
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch items',
            error: error.message
        });
    }
};


/*
 * SOFT REMOVE ITEM
 *
 * The item is deliberately NOT deleted.
 *
 * We preserve:
 * - moderationStatus
 * - removalReason
 * - removedAt
 * - removedBy
 *
 * The owner is also notified.
 */

const removeItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                message: 'A removal reason is required'
            });
        }

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        if (item.moderationStatus === 'REMOVED') {
            return res.status(400).json({
                message: 'This item has already been removed'
            });
        }

        /*
         * Soft removal.
         */
        item.moderationStatus = 'REMOVED';

        item.removalReason = reason.trim();

        item.removedAt = new Date();

        item.removedBy = req.user;

        /*
         * Make the item unavailable as well.
         *
         * This prevents it from being borrowed even if
         * another part of the system accesses it directly.
         */
        item.availability = false;

        await item.save();


        /*
         * Notify the owner.
         */
        await Notification.create({
            recipient: item.owner,
            type: 'ITEM_REMOVED',
            title: 'Your equipment was removed',
            message:
                `Your listing "${item.name}" was removed by an administrator. ` +
                `Reason: ${item.removalReason}`,
            relatedItem: item._id
        });


        /*
         * Return the updated item so the admin frontend
         * can immediately update its table/card.
         */
        const updatedItem = await Item.findById(item._id)
            .populate(
                'owner',
                'name email avatar rating reliabilityScore'
            )
            .populate(
                'removedBy',
                'name email'
            );

        res.json({
            message: 'Item removed successfully',
            item: updatedItem
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to remove item',
            error: error.message
        });
    }
};


/*
 * -----------------------------------------
 * BORROWINGS
 * -----------------------------------------
 */

const getAllBorrowings = async (req, res) => {
    try {
        const borrowings = await Borrowing.find()
            .populate(
                'item',
                'name category rentalType rentalPricePerDay'
            )
            .populate(
                'borrower',
                'name email'
            )
            .populate(
                'lender',
                'name email'
            )
            .sort({
                createdAt: -1
            });

        res.json({
            borrowings
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch borrowings',
            error: error.message
        });
    }
};


/*
 * -----------------------------------------
 * DISPUTES
 * -----------------------------------------
 */

const getAllDisputes = async (req, res) => {
    try {
        const disputes = await Dispute.find()
            .populate(
                'reportedBy',
                'name email'
            )
            .populate(
                'againstUser',
                'name email'
            )
            .populate(
                'borrowing',
                'item borrower lender startDate endDate status'
            )
            .sort({
                createdAt: -1
            });

        res.json({
            disputes
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch disputes',
            error: error.message
        });
    }
};


const updateDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status,
            resolution
        } = req.body;

        const allowedStatuses = [
            'OPEN',
            'UNDER_REVIEW',
            'RESOLVED',
            'REJECTED'
        ];

        if (
            status &&
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                message: 'Invalid dispute status'
            });
        }

        const dispute = await Dispute.findById(id);

        if (!dispute) {
            return res.status(404).json({
                message: 'Dispute not found'
            });
        }

        if (
            dispute.status === 'RESOLVED' ||
            dispute.status === 'REJECTED'
        ) {
            return res.status(400).json({
                message: 'This dispute is already closed'
            });
        }

        if (status) {
            dispute.status = status;
        }

        if (resolution !== undefined) {
            dispute.resolution = resolution.trim();
        }

        if (
            status === 'RESOLVED' ||
            status === 'REJECTED'
        ) {
            dispute.resolvedAt = new Date();
        }

        await dispute.save();

        const updatedDispute = await Dispute.findById(dispute._id)
            .populate(
                'reportedBy',
                'name email'
            )
            .populate(
                'againstUser',
                'name email'
            )
            .populate(
                'borrowing',
                'item borrower lender startDate endDate status'
            );

        res.json({
            message: 'Dispute updated successfully',
            dispute: updatedDispute
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update dispute',
            error: error.message
        });
    }
};


module.exports = {
    getDashboardStats,
    getAllUsers,
    suspendUser,
    unsuspendUser,
    getAllItems,
    removeItem,
    getAllBorrowings,
    getAllDisputes,
    updateDispute
};