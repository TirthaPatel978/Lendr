const User = require('../models/User');
const Item = require('../models/Item');
const Borrowing = require('../models/Borrowing');
const Dispute = require('../models/Dispute');


// =========================
// DASHBOARD STATISTICS
// =========================

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
                status: 'ACTIVE'
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
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
};


// =========================
// GET ALL USERS
// =========================

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            count: users.length,
            users
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};


// =========================
// SUSPEND USER
// =========================

const suspendUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.toString()) {
            return res.status(400).json({
                message: 'Admin cannot suspend their own account'
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

        if (user.isSuspended) {
            return res.status(400).json({
                message: 'User is already suspended'
            });
        }

        user.isSuspended = true;

        await user.save();

        res.json({
            message: 'User suspended successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to suspend user',
            error: error.message
        });
    }
};


// =========================
// UNSUSPEND USER
// =========================

const unsuspendUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if (!user.isSuspended) {
            return res.status(400).json({
                message: 'User is not suspended'
            });
        }

        user.isSuspended = false;

        await user.save();

        res.json({
            message: 'User unsuspended successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to unsuspend user',
            error: error.message
        });
    }
};


// =========================
// GET ALL ITEMS
// =========================

const getAllItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate('owner', 'name email rating reliabilityScore')
            .sort({ createdAt: -1 });

        res.json({
            count: items.length,
            items
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch items',
            error: error.message
        });
    }
};


// =========================
// REMOVE ITEM
// =========================

const removeItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        await Item.findByIdAndDelete(id);

        res.json({
            message: 'Item removed successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to remove item',
            error: error.message
        });
    }
};


// =========================
// GET ALL BORROWINGS
// =========================

const getAllBorrowings = async (req, res) => {
    try {
        const borrowings = await Borrowing.find()
            .populate('item', 'name category')
            .populate('borrower', 'name email')
            .populate('lender', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            count: borrowings.length,
            borrowings
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch borrowings',
            error: error.message
        });
    }
};


// =========================
// GET ALL DISPUTES
// =========================

const getAllDisputes = async (req, res) => {
    try {
        const disputes = await Dispute.find()
            .populate('borrowing')
            .populate('item', 'name category')
            .populate('reportedBy', 'name email')
            .populate('againstUser', 'name email')
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


// =========================
// UPDATE DISPUTE
// =========================

const updateDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution } = req.body;

        const allowedStatuses = [
            'OPEN',
            'UNDER_REVIEW',
            'RESOLVED',
            'REJECTED'
        ];

        if (!status || !allowedStatuses.includes(status)) {
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
            (dispute.status === 'RESOLVED' ||
                dispute.status === 'REJECTED') &&
            dispute.status !== status
        ) {
            return res.status(400).json({
                message: 'Closed disputes cannot be reopened or changed'
            });
        }

        dispute.status = status;

        if (resolution !== undefined) {
            dispute.resolution = resolution;
        }

        if (status === 'RESOLVED' || status === 'REJECTED') {
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