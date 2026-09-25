const Review = require('../models/Review');
const Borrowing = require('../models/Borrowing');
const User = require('../models/User');


// ===============================
// CREATE REVIEW
// ===============================
const createReview = async (req, res) => {
    try {
        const {
            borrowingId,
            rating,
            comment
        } = req.body;

        // Validate required fields
        if (!borrowingId || !rating) {
            return res.status(400).json({
                message: 'Borrowing ID and rating are required'
            });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5'
            });
        }

        // Find borrowing
        const borrowing = await Borrowing.findById(borrowingId);

        if (!borrowing) {
            return res.status(404).json({
                message: 'Borrowing not found'
            });
        }

        // Reviews are allowed only after completion
        if (borrowing.status !== 'COMPLETED') {
            return res.status(400).json({
                message:
                    'Reviews can only be submitted after borrowing is completed'
            });
        }

        // Check whether current user was involved
        const isBorrower =
            borrowing.borrower.toString() === req.user;

        const isLender =
            borrowing.lender.toString() === req.user;

        if (!isBorrower && !isLender) {
            return res.status(403).json({
                message: 'You were not involved in this borrowing'
            });
        }

        // Determine who is being reviewed
        const reviewedUser = isBorrower
            ? borrowing.lender
            : borrowing.borrower;

        // Prevent self-review
        if (reviewedUser.toString() === req.user) {
            return res.status(400).json({
                message: 'You cannot review yourself'
            });
        }

        // Prevent duplicate review
        const existingReview = await Review.findOne({
            reviewer: req.user,
            borrowing: borrowingId
        });

        if (existingReview) {
            return res.status(400).json({
                message: 'You have already reviewed this borrowing'
            });
        }

        // Create review
        const review = await Review.create({
            reviewer: req.user,
            reviewedUser,
            borrowing: borrowingId,
            rating,
            comment: comment || ''
        });


        // ==========================================
        // RECALCULATE USER'S AVERAGE RATING
        // ==========================================

        const reviews = await Review.find({
            reviewedUser
        });

        const totalRating = reviews.reduce(
            (sum, review) => sum + review.rating,
            0
        );

        const averageRating =
            totalRating / reviews.length;

        const roundedRating =
            Math.round(averageRating * 10) / 10;


        // ==========================================
        // RELIABILITY SCORE
        // ==========================================

        // 1. Rating contribution
        // Maximum: 50 points
        const ratingContribution =
            (roundedRating / 5) * 50;


        // 2. Completed borrowings
        // Maximum: 20 points
        //
        // Each completed borrowing = 4 points
        // 5+ completed borrowings = full 20 points

        const completedBorrowings =
            await Borrowing.countDocuments({
                $or: [
                    { borrower: reviewedUser },
                    { lender: reviewedUser }
                ],
                status: 'COMPLETED'
            });

        const completedContribution =
            Math.min(
                completedBorrowings * 4,
                20
            );


        // 3. On-time returns
        // Maximum: 20 points
        //
        // This applies when the user was the borrower.

        const returnedBorrowings =
            await Borrowing.find({
                borrower: reviewedUser,
                status: {
                    $in: ['RETURNED', 'COMPLETED']
                },
                returnedAt: {
                    $ne: null
                }
            });

        let onTimeReturns = 0;

        for (const borrowing of returnedBorrowings) {
            if (borrowing.returnedAt <= borrowing.endDate) {
                onTimeReturns++;
            }
        }

        let returnContribution = 20;

        if (returnedBorrowings.length > 0) {
            returnContribution =
                (onTimeReturns / returnedBorrowings.length) * 20;
        }


        // 4. Overdue penalty
        // Maximum penalty: 10 points
        //
        // wasOverdue is set when a borrowing becomes overdue.

        const overdueBorrowings =
            await Borrowing.countDocuments({
                borrower: reviewedUser,
                wasOverdue: true
            });

        const overduePenalty =
            Math.min(
                overdueBorrowings * 5,
                10
            );


        // ==========================================
        // FINAL RELIABILITY SCORE
        // ==========================================

        const reliabilityScore =
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(
                        ratingContribution +
                        completedContribution +
                        returnContribution -
                        overduePenalty
                    )
                )
            );


        // ==========================================
        // UPDATE USER
        // ==========================================

        await User.findByIdAndUpdate(
            reviewedUser,
            {
                rating: roundedRating,
                reliabilityScore
            }
        );


        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(201).json({
            message: 'Review submitted successfully',
            review,
            updatedUserStats: {
                rating: roundedRating,
                reliabilityScore
            }
        });

    } catch (error) {

        // Handle duplicate review race condition
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'You have already reviewed this borrowing'
            });
        }

        res.status(500).json({
            message: 'Failed to submit review',
            error: error.message
        });
    }
};


// ===============================
// GET USER REVIEWS
// ===============================
const getUserReviews = async (req, res) => {
    try {

        const reviews = await Review.find({
            reviewedUser: req.params.userId
        })
            .populate('reviewer', 'name')
            .populate('borrowing')
            .sort({ createdAt: -1 });

        res.json({
            count: reviews.length,
            reviews
        });

    } catch (error) {

        res.status(500).json({
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};


module.exports = {
    createReview,
    getUserReviews
};