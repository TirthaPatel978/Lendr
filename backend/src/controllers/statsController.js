const User = require('../models/User');
const Item = require('../models/Item');
const Borrowing = require('../models/Borrowing');

const getCommunityStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalItems,
            activeItems,
            completedBorrowings,
            sharingDaysResult,
            popularCategories
        ] = await Promise.all([
            // Total registered users
            User.countDocuments({
                role: 'USER'
            }),

            // All items that have not been removed
            Item.countDocuments({
                moderationStatus: 'ACTIVE'
            }),

            // Currently available active items
            Item.countDocuments({
                moderationStatus: 'ACTIVE',
                availability: true
            }),

            // Completed borrowing transactions
            Borrowing.countDocuments({
                status: 'COMPLETED'
            }),

            // Total number of days items have been borrowed
            Borrowing.aggregate([
                {
                    $match: {
                        status: 'COMPLETED'
                    }
                },
                {
                    $project: {
                        days: {
                            $ceil: {
                                $divide: [
                                    {
                                        $subtract: [
                                            '$endDate',
                                            '$startDate'
                                        ]
                                    },
                                    1000 * 60 * 60 * 24
                                ]
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalDays: {
                            $sum: '$days'
                        }
                    }
                }
            ]),

            // Most popular item categories
            Item.aggregate([
                {
                    $match: {
                        moderationStatus: 'ACTIVE'
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                },
                {
                    $limit: 5
                },
                {
                    $project: {
                        _id: 0,
                        category: '$_id',
                        count: 1
                    }
                }
            ])
        ]);

        const totalSharingDays =
            sharingDaysResult.length > 0
                ? sharingDaysResult[0].totalDays
                : 0;

        res.json({
            totalUsers,
            totalItems,
            activeItems,
            completedBorrowings,
            totalSharingDays,
            popularCategories
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch community statistics',
            error: error.message
        });
    }
};

module.exports = {
    getCommunityStats
};