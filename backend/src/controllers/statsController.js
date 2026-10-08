
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
            // Registered, non-suspended community members
            User.countDocuments({
                role: 'USER',
                isSuspended: false
            }),

            // All listings that have not been removed
            Item.countDocuments({
                moderationStatus: 'ACTIVE'
            }),

            // Listings that are currently available
            Item.countDocuments({
                moderationStatus: 'ACTIVE',
                availability: true
            }),

            // Successfully completed borrowings
            Borrowing.countDocuments({
                status: 'COMPLETED'
            }),

            // Total days across completed borrowing periods
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

            // Most common categories among active listings
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
                        count: -1,
                        _id: 1
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

        return res.status(200).json({
            totalUsers,
            totalItems,
            activeItems,
            completedBorrowings,
            totalSharingDays,
            popularCategories
        });
    } catch (error) {
        console.error('Community statistics error:', error);

        return res.status(500).json({
            message: 'Failed to fetch community statistics'
        });
    }
};

module.exports = {
    getCommunityStats
};