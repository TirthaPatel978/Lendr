import { useEffect, useState } from 'react';
import {
    MessageSquare,
    Star,
    Send
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/useAuth';

import './Reviews.css';

function Reviews() {
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [completedBorrowings, setCompletedBorrowings] = useState([]);

    const [selectedBorrowing, setSelectedBorrowing] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchReviews = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                const [
                    reviewsResponse,
                    borrowingsResponse
                ] = await Promise.all([
                    api.get(`/reviews/user/${user.id}`),
                    api.get('/borrowings/my-requests')
                ]);

                if (cancelled) {
                    return;
                }

                setReviews(
                    reviewsResponse.data.reviews || []
                );

                setCompletedBorrowings(
                    (borrowingsResponse.data.borrowings || [])
                        .filter(
                            (borrowing) =>
                                borrowing.status === 'COMPLETED'
                        )
                );

            } catch (err) {
                if (cancelled) {
                    return;
                }

                setError(
                    err.response?.data?.message ||
                    'Failed to load reviews'
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchReviews();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const reloadReviews = async () => {
        if (!user?.id) {
            return;
        }

        try {
            const [
                reviewsResponse,
                borrowingsResponse
            ] = await Promise.all([
                api.get(`/reviews/user/${user.id}`),
                api.get('/borrowings/my-requests')
            ]);

            setReviews(
                reviewsResponse.data.reviews || []
            );

            setCompletedBorrowings(
                (borrowingsResponse.data.borrowings || [])
                    .filter(
                        (borrowing) =>
                            borrowing.status === 'COMPLETED'
                    )
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to refresh reviews'
            );
        }
    };

    const getOtherUser = (borrowing) => {
        if (!user?.id) {
            return null;
        }

        const borrowerId =
            borrowing.borrower?._id ||
            borrowing.borrower;

        const lenderId =
            borrowing.lender?._id ||
            borrowing.lender;

        if (
            borrowerId?.toString() ===
            user.id.toString()
        ) {
            return borrowing.lender;
        }

        if (
            lenderId?.toString() ===
            user.id.toString()
        ) {
            return borrowing.borrower;
        }

        return null;
    };

    const hasReviewedBorrowing = (borrowingId) => {
        return reviews.some((review) => {
            const reviewBorrowingId =
                review.borrowing?._id ||
                review.borrowing;

            return (
                reviewBorrowingId?.toString() ===
                borrowingId.toString()
            );
        });
    };

    const reviewableBorrowings =
        completedBorrowings.filter(
            (borrowing) =>
                !hasReviewedBorrowing(borrowing._id)
        );

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedBorrowing) {
            setError(
                'Please select a completed borrowing.'
            );
            setSuccess('');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/reviews', {
                borrowingId: selectedBorrowing,
                rating: Number(rating),
                comment
            });

            setSuccess(
                'Review submitted successfully.'
            );

            setSelectedBorrowing('');
            setRating(5);
            setComment('');

            await reloadReviews();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to submit review'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (value) => {
        return (
            <div className="review-stars">
                {Array.from(
                    { length: 5 },
                    (_, index) => (
                        <Star
                            key={index}
                            size={15}
                            fill={
                                index < value
                                    ? 'currentColor'
                                    : 'none'
                            }
                        />
                    )
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <main className="reviews-page">
                <div className="reviews-loading">
                    <div className="reviews-spinner"></div>

                    <p>
                        Loading reviews...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="reviews-page">

            {/* HEADER */}

            <header className="reviews-header">

                <div>
                    <span className="reviews-eyebrow">
                        COMMUNITY TRUST
                    </span>

                    <h1>
                        Reviews &amp; <em>ratings.</em>
                    </h1>

                    <p>
                        Build trust within the Lendr
                        community by sharing honest
                        feedback after completed
                        borrowings.
                    </p>
                </div>

                <div className="reviews-header-icon">
                    <MessageSquare size={28} />
                </div>

            </header>


            {/* MESSAGES */}

            {error && (
                <div className="reviews-message error">
                    {error}
                </div>
            )}

            {success && (
                <div className="reviews-message success">
                    {success}
                </div>
            )}


            {/* RECEIVED REVIEWS */}

            <section className="reviews-section">

                <div className="reviews-section-heading">

                    <span className="reviews-section-eyebrow">
                        WHAT PEOPLE SAY
                    </span>

                    <h2>
                        Reviews you've received
                    </h2>

                </div>


                {reviews.length === 0 ? (

                    <div className="reviews-empty">

                        <div className="reviews-empty-icon">
                            <MessageSquare size={23} />
                        </div>

                        <h3>
                            No reviews yet
                        </h3>

                        <p>
                            Once someone completes a
                            borrowing with you and leaves
                            feedback, their review will
                            appear here.
                        </p>

                    </div>

                ) : (

                    <div className="reviews-grid">

                        {reviews.map((review) => (

                            <article
                                className="review-card"
                                key={review._id}
                            >

                                <div className="review-card-top">

                                    <div className="review-user">

                                        <div className="review-avatar">

                                            {review.reviewer?.avatar ? (
                                                <img
                                                    src={
                                                        review
                                                            .reviewer
                                                            .avatar
                                                    }
                                                    alt={
                                                        review
                                                            .reviewer
                                                            .name
                                                    }
                                                />
                                            ) : (
                                                <MessageSquare
                                                    size={17}
                                                />
                                            )}

                                        </div>

                                        <div>

                                            <strong>
                                                {review.reviewer?.name ||
                                                    'Lendr user'}
                                            </strong>

                                            <span>
                                                {new Date(
                                                    review.createdAt
                                                ).toLocaleDateString()}
                                            </span>

                                        </div>

                                    </div>

                                    {renderStars(
                                        review.rating
                                    )}

                                </div>


                                {review.comment && (
                                    <p className="review-comment">
                                        “{review.comment}”
                                    </p>
                                )}

                            </article>

                        ))}

                    </div>

                )}

            </section>


            {/* WRITE REVIEW */}

            <section className="reviews-section">

                <div className="reviews-section-heading">

                    <span className="reviews-section-eyebrow">
                        SHARE YOUR EXPERIENCE
                    </span>

                    <h2>
                        Leave a review
                    </h2>

                </div>


                {reviewableBorrowings.length === 0 ? (

                    <div className="reviews-empty">

                        <div className="reviews-empty-icon">
                            <Star size={23} />
                        </div>

                        <h3>
                            Nothing to review
                        </h3>

                        <p>
                            Completed borrowings that have
                            not been reviewed yet will appear
                            here.
                        </p>

                    </div>

                ) : (

                    <div className="review-form-list">

                        {reviewableBorrowings.map(
                            (borrowing) => {

                                const otherUser =
                                    getOtherUser(
                                        borrowing
                                    );

                                return (
                                    <div
                                        className="review-form-card"
                                        key={borrowing._id}
                                    >

                                        <div className="review-form-info">

                                            <span>
                                                COMPLETED BORROWING
                                            </span>

                                            <h3>
                                                {borrowing
                                                    .item
                                                    ?.name ||
                                                    'Equipment'}
                                            </h3>

                                            <p>
                                                Share your
                                                experience with{' '}
                                                <strong>
                                                    {otherUser?.name ||
                                                        'the other user'}
                                                </strong>
                                                .
                                            </p>

                                        </div>


                                        <form
                                            className="review-form"
                                            onSubmit={
                                                handleSubmit
                                            }
                                        >

                                            <div className="review-rating-picker">

                                                {[1, 2, 3, 4, 5].map(
                                                    (value) => (

                                                        <button
                                                            key={value}
                                                            type="button"
                                                            className={
                                                                value <=
                                                                rating
                                                                    ? 'review-star active interactive'
                                                                    : 'review-star interactive'
                                                            }
                                                            onClick={() =>
                                                                setRating(
                                                                    value
                                                                )
                                                            }
                                                            aria-label={`${value} stars`}
                                                        >
                                                            <Star
                                                                size={21}
                                                                fill={
                                                                    value <=
                                                                    rating
                                                                        ? 'currentColor'
                                                                        : 'none'
                                                                }
                                                            />
                                                        </button>

                                                    )
                                                )}

                                            </div>


                                            <textarea
                                                value={comment}
                                                onChange={(event) =>
                                                    setComment(
                                                        event.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Share your experience with this borrowing..."
                                                maxLength={500}
                                            />


                                            <button
                                                type="submit"
                                                className="review-submit"
                                                disabled={
                                                    submitting
                                                }
                                                onClick={() =>
                                                    setSelectedBorrowing(
                                                        borrowing._id
                                                    )
                                                }
                                            >
                                                <Send size={16} />

                                                {submitting
                                                    ? 'Submitting...'
                                                    : 'Submit review'}
                                            </button>

                                        </form>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </section>

        </main>
    );
}

export default Reviews;