import { useEffect, useState } from 'react';

import {
    Star,
    MessageSquare,
    Send,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/useAuth';
import './Reviews.css';

const Reviews = () => {
    const {
    user,
    loading: authLoading
} = useAuth();

    const userId = user?._id || user?.id;

    const [reviews, setReviews] = useState([]);
    const [completedBorrowings, setCompletedBorrowings] =
        useState([]);

    const [ratings, setRatings] = useState({});
    const [comments, setComments] = useState({});

    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState(null);

    const [message, setMessage] = useState({
        type: '',
        text: ''
    });

    useEffect(() => {
        if (!userId) {
    return;
}

        let cancelled = false;

        const loadData = async () => {
            try {
                const [
                    reviewsResponse,
                    borrowingsResponse
                ] = await Promise.all([
                    api.get(`/reviews/user/${userId}`),
                    api.get('/borrowings/my-requests')
                ]);

                if (cancelled) {
                    return;
                }

                const existingReviews =
                    reviewsResponse.data.reviews || [];

                const borrowings =
                    borrowingsResponse.data.borrowings ||
                    borrowingsResponse.data.requests ||
                    [];

                const completed =
                    borrowings.filter(
                        (borrowing) =>
                            borrowing.status === 'COMPLETED'
                    );

                setReviews(existingReviews);
                setCompletedBorrowings(completed);

            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    'Failed to load reviews:',
                    error
                );

                setMessage({
                    type: 'error',
                    text:
                        error.response?.data?.message ||
                        'Failed to load reviews.'
                });

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const reloadData = async () => {
        if (!userId) {
            return;
        }

        try {
            const [
                reviewsResponse,
                borrowingsResponse
            ] = await Promise.all([
                api.get(`/reviews/user/${userId}`),
                api.get('/borrowings/my-requests')
            ]);

            const existingReviews =
                reviewsResponse.data.reviews || [];

            const borrowings =
                borrowingsResponse.data.borrowings ||
                borrowingsResponse.data.requests ||
                [];

            const completed =
                borrowings.filter(
                    (borrowing) =>
                        borrowing.status === 'COMPLETED'
                );

            setReviews(existingReviews);
            setCompletedBorrowings(completed);

        } catch (error) {
            console.error(
                'Failed to reload reviews:',
                error
            );

            setMessage({
                type: 'error',
                text:
                    error.response?.data?.message ||
                    'Failed to refresh reviews.'
            });
        }
    };

    const hasReviewed = (borrowingId) => {
        return reviews.some(
            (review) =>
                review.borrowing?._id === borrowingId ||
                review.borrowing === borrowingId
        );
    };

    const reviewableBorrowings =
        completedBorrowings.filter(
            (borrowing) =>
                !hasReviewed(borrowing._id)
        );

    const handleSubmit = async (borrowingId) => {
        const borrowingRating =
            ratings[borrowingId] || 5;

        const borrowingComment =
            comments[borrowingId] || '';

        try {
            setSubmittingId(borrowingId);

            setMessage({
                type: '',
                text: ''
            });

            await api.post('/reviews', {
                borrowingId,
                rating: Number(borrowingRating),
                comment: borrowingComment
            });

            setMessage({
                type: 'success',
                text:
                    'Your review has been submitted successfully.'
            });

            setRatings((previous) => {
                const updated = {
                    ...previous
                };

                delete updated[borrowingId];

                return updated;
            });

            setComments((previous) => {
                const updated = {
                    ...previous
                };

                delete updated[borrowingId];

                return updated;
            });

            await reloadData();

        } catch (error) {
            console.error(
                'Failed to submit review:',
                error
            );

            setMessage({
                type: 'error',
                text:
                    error.response?.data?.message ||
                    'Failed to submit review.'
            });

        } finally {
            setSubmittingId(null);
        }
    };

    const handleRatingChange = (
        borrowingId,
        value
    ) => {
        setRatings((previous) => ({
            ...previous,
            [borrowingId]: value
        }));
    };

    const handleCommentChange = (
        borrowingId,
        value
    ) => {
        setComments((previous) => ({
            ...previous,
            [borrowingId]: value
        }));
    };

    const getItemName = (borrowing) => {
        if (
            borrowing?.item &&
            typeof borrowing.item === 'object'
        ) {
            return borrowing.item.name;
        }

        return 'Equipment';
    };

    const getOtherUser = (borrowing) => {
        if (!borrowing) {
            return null;
        }

        if (
            borrowing.borrower?._id === userId
        ) {
            return borrowing.lender;
        }

        return borrowing.borrower;
    };

    if (authLoading || loading) {
        return (
            <main className="reviews-page">
                <div className="reviews-loading">
                    <div className="reviews-spinner" />
                    <p>Loading reviews...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="reviews-page">

            <header className="reviews-header">

                <div>

                    <span className="reviews-eyebrow">
                        TRUST & COMMUNITY
                    </span>

                    <h1>
                        Reviews &{' '}
                        <em>reputation.</em>
                    </h1>

                    <p>
                        Share your experience after a
                        completed borrowing and help build
                        a more reliable Lendr community.
                    </p>

                </div>

                <div className="reviews-header-icon">
                    <MessageSquare size={28} />
                </div>

            </header>

            {message.text && (
                <div
                    className={`reviews-message ${message.type}`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle size={16} />
                    ) : (
                        <AlertCircle size={16} />
                    )}

                    <span>
                        {message.text}
                    </span>
                </div>
            )}

            <section className="reviews-section">

                <div className="reviews-section-heading">

                    <span className="reviews-section-eyebrow">
                        YOUR REVIEWS
                    </span>

                    <h2>
                        Reviews you've received
                    </h2>

                </div>

                {reviews.length === 0 ? (
                    <div className="reviews-empty">

                        <div className="reviews-empty-icon">
                            <Star size={23} />
                        </div>

                        <h3>
                            No reviews yet
                        </h3>

                        <p>
                            Reviews from other members
                            will appear here after completed
                            borrowings.
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
                                                        review.reviewer.avatar
                                                    }
                                                    alt={
                                                        review.reviewer.name ||
                                                        'Reviewer'
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
                                                    'Lendr member'}
                                            </strong>

                                            <span>
                                                {review.createdAt
                                                    ? new Date(
                                                        review.createdAt
                                                    ).toLocaleDateString()
                                                    : ''}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="review-stars">

                                        {[1, 2, 3, 4, 5].map(
                                            (value) => (
                                                <Star
                                                    key={value}
                                                    size={15}
                                                    fill={
                                                        value <=
                                                        review.rating
                                                            ? 'currentColor'
                                                            : 'none'
                                                    }
                                                    className={`review-star ${
                                                        value <=
                                                        review.rating
                                                            ? 'active'
                                                            : ''
                                                    }`}
                                                />
                                            )
                                        )}

                                    </div>

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

            <section className="reviews-section">

                <div className="reviews-section-heading">

                    <span className="reviews-section-eyebrow">
                        COMPLETE A REVIEW
                    </span>

                    <h2>
                        Share your experience
                    </h2>

                </div>

                {reviewableBorrowings.length === 0 ? (
                    <div className="reviews-empty">

                        <div className="reviews-empty-icon">
                            <CheckCircle size={23} />
                        </div>

                        <h3>
                            You're all caught up
                        </h3>

                        <p>
                            There are no completed borrowings
                            waiting for a review.
                        </p>

                    </div>
                ) : (
                    <div className="review-form-list">

                        {reviewableBorrowings.map(
                            (borrowing) => {

                                const borrowingRating =
                                    ratings[borrowing._id] || 5;

                                const otherUser =
                                    getOtherUser(
                                        borrowing
                                    );

                                return (
                                    <article
                                        className="review-form-card"
                                        key={borrowing._id}
                                    >

                                        <div className="review-form-info">

                                            <span>
                                                Completed borrowing
                                            </span>

                                            <h3>
                                                {getItemName(
                                                    borrowing
                                                )}
                                            </h3>

                                            <p>
                                                Your experience with{' '}
                                                <strong>
                                                    {otherUser?.name ||
                                                        'another Lendr member'}
                                                </strong>
                                            </p>

                                        </div>

                                        <div className="review-form">

                                            <div className="review-rating-picker">

                                                {[1, 2, 3, 4, 5].map(
                                                    (value) => (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            className={`review-star interactive ${
                                                                value <=
                                                                borrowingRating
                                                                    ? 'active'
                                                                    : ''
                                                            }`}
                                                            onClick={() =>
                                                                handleRatingChange(
                                                                    borrowing._id,
                                                                    value
                                                                )
                                                            }
                                                            aria-label={`${value} star rating`}
                                                        >
                                                            <Star
                                                                size={22}
                                                                fill={
                                                                    value <=
                                                                    borrowingRating
                                                                        ? 'currentColor'
                                                                        : 'none'
                                                                }
                                                            />
                                                        </button>
                                                    )
                                                )}

                                            </div>

                                            <textarea
                                                placeholder="Share a few thoughts about your experience..."
                                                value={
                                                    comments[
                                                        borrowing._id
                                                    ] || ''
                                                }
                                                onChange={(event) =>
                                                    handleCommentChange(
                                                        borrowing._id,
                                                        event.target.value
                                                    )
                                                }
                                                maxLength={500}
                                            />

                                            <button
                                                type="button"
                                                className="review-submit"
                                                disabled={
                                                    submittingId ===
                                                    borrowing._id
                                                }
                                                onClick={() =>
                                                    handleSubmit(
                                                        borrowing._id
                                                    )
                                                }
                                            >
                                                <Send size={14} />

                                                {submittingId ===
                                                borrowing._id
                                                    ? 'Submitting...'
                                                    : 'Submit review'}
                                            </button>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>
                )}

            </section>

        </main>
    );
};

export default Reviews;