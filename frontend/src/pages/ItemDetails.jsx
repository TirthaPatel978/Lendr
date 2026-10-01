import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    MapPin,
    Pencil,
    ShieldCheck,
    Star,
    UserRound
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/useAuth';

import './ItemDetails.css';

function ItemDetails() {
    const { id } = useParams();
    const { user } = useAuth();

    const [item, setItem] = useState(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [pricePreview, setPricePreview] = useState(null);

    const [loading, setLoading] = useState(true);
    const [checkingPrice, setCheckingPrice] = useState(false);
    const [requesting, setRequesting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadItem = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await api.get(`/items/${id}`);

                setItem(response.data.item || response.data);

            } catch (err) {
                console.error(
                    'Failed to load item:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Unable to load this equipment.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadItem();
    }, [id]);

    const getId = (value) => {
        if (!value) {
            return null;
        }

        if (typeof value === 'string') {
            return value;
        }

        return value._id || value.id || null;
    };

    const ownerId = getId(item?.owner);
    const currentUserId = getId(user);

    const isOwner =
        Boolean(ownerId) &&
        Boolean(currentUserId) &&
        ownerId.toString() === currentUserId.toString();

    const formatCondition = (condition) => {
        if (!condition) {
            return 'Unknown';
        }

        return condition
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const formatDateForDisplay = (date) => {
        if (!date) {
            return '';
        }

        return new Date(date).toLocaleDateString(
            'en-IN',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }
        );
    };

    const getPriceText = () => {
        if (!item) {
            return '';
        }

        if (item.rentalType === 'FREE') {
            return 'Free to borrow';
        }

        return `₹${item.rentalPricePerDay} per day`;
    };

    const checkPrice = async () => {
        try {
            setError('');
            setSuccess('');
            setPricePreview(null);

            if (!startDate || !endDate) {
                setError(
                    'Please select both a start date and an end date.'
                );
                return;
            }

            setCheckingPrice(true);

            const response = await api.get(
                '/borrowings/price-preview',
                {
                    params: {
                        itemId: item._id,
                        startDate,
                        endDate
                    }
                }
            );

            setPricePreview(
                response.data.preview ||
                response.data
            );

        } catch (err) {
            console.error(
                'Failed to check price:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to calculate the rental price.'
            );
        } finally {
            setCheckingPrice(false);
        }
    };

    const requestToBorrow = async () => {
        try {
            setError('');
            setSuccess('');

            if (!startDate || !endDate) {
                setError(
                    'Please select both a start date and an end date.'
                );
                return;
            }

            if (isOwner) {
                setError(
                    'You cannot borrow your own equipment.'
                );
                return;
            }

            setRequesting(true);

            await api.post('/borrowings', {
                itemId: item._id,
                startDate,
                endDate
            });

            setSuccess(
                'Your borrow request has been sent to the owner.'
            );

            setPricePreview(null);

        } catch (err) {
            console.error(
                'Failed to request item:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to send your borrow request.'
            );
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <main className="item-details-page">
                <div className="item-details-loading">
                    <div className="item-details-spinner" />
                    <p>Loading equipment...</p>
                </div>
            </main>
        );
    }

    if (error && !item) {
        return (
            <main className="item-details-page">
                <div className="item-details-error">
                    <h2>We couldn't find that equipment.</h2>

                    <p>{error}</p>

                    <Link
                        to="/browse"
                        className="item-details-back-button"
                    >
                        <ArrowLeft size={15} />
                        Back to browse
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="item-details-page">

            <div className="item-details-container">

                <Link
                    to="/browse"
                    className="item-details-back"
                >
                    <ArrowLeft size={15} />
                    Back to browse
                </Link>

                <section className="item-details-hero">

                    <div className="item-details-image-wrap">

                        {item?.photos?.length > 0 ? (

                            <img
                                src={item.photos[0]}
                                alt={item.name}
                                className="item-details-image"
                            />

                        ) : (

                            <div className="item-details-image-placeholder">
                                <span>
                                    No image available
                                </span>
                            </div>

                        )}

                        <div className="item-details-image-badge">
                            {item.rentalType === 'FREE'
                                ? 'FREE TO BORROW'
                                : 'AVAILABLE TO BORROW'}
                        </div>

                    </div>

                    <div className="item-details-info">

                        <span className="item-details-eyebrow">
                            {item.category}
                            {item.condition && ` · ${formatCondition(item.condition)}`}
                        </span>

                        <h1>{item.name}</h1>

                        <p className="item-details-description">
                            {item.description}
                        </p>

                        <div className="item-details-facts">

                            <div className="item-details-fact">

                                <span>CONDITION</span>

                                <strong>
                                    {formatCondition(
                                        item.condition
                                    )}
                                </strong>

                            </div>

                            <div className="item-details-fact">

                                <span>AVAILABILITY</span>

                                <strong>
                                    {item.availability
                                        ? 'Available'
                                        : 'Unavailable'}
                                </strong>

                            </div>

                        </div>

                        <div className="item-details-owner">

                            <div className="item-owner-avatar">

                                {item.owner?.avatar ? (

                                    <img
                                        src={item.owner.avatar}
                                        alt={item.owner.name}
                                    />

                                ) : (

                                    <UserRound size={19} />

                                )}

                            </div>

                            <div className="item-owner-info">

                                <span>LISTED BY</span>

                                <strong>
                                    {item.owner?.name ||
                                        'Lendr member'}
                                </strong>

                            </div>

                            <div className="item-owner-rating">

                                <Star size={15} />

                                <span>
                                    {Number(
                                        item.owner?.rating || 0
                                    ).toFixed(1)}
                                </span>

                            </div>

                        </div>

                        <div className="item-details-location">

                            <div className="item-location-icon">
                                <MapPin size={18} />
                            </div>

                            <div>
                                <strong>
                                    Pickup nearby
                                </strong>

                                <span>
                                    This item is available within
                                    your local community.
                                </span>
                            </div>

                        </div>

                    </div>

                </section>

                {isOwner ? (

                    <section className="item-owner-panel">

                        <div className="item-owner-panel-icon">
                            <Pencil size={21} />
                        </div>

                        <div className="item-owner-panel-content">

                            <span className="item-owner-panel-eyebrow">
                                YOUR LISTING
                            </span>

                            <h2>
                                You're the owner of this item.
                            </h2>

                            <p>
                                This equipment is listed by you,
                                so it isn't available for you to
                                borrow. You can manage your listing
                                from your dashboard.
                            </p>

                        </div>

                        <Link
                            to={`/items/${item._id}/edit`}
                            className="item-owner-panel-button"
                        >
                            Manage listing
                            <ArrowRight size={15} />
                        </Link>

                    </section>

                ) : (

                    <section className="item-borrow-panel">

                        <div className="item-borrow-heading">

                            <div>
                                <span className="item-section-eyebrow">
                                    BORROW THIS ITEM
                                </span>

                                <h2>
                                    {getPriceText()}
                                </h2>
                            </div>

                            <div className="item-borrow-shield">
                                <ShieldCheck size={21} />
                            </div>

                        </div>

                        <div className="item-date-grid">

                            <label>
                                <span>
                                    <CalendarDays size={14} />
                                    START DATE
                                </span>

                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(event) => {
                                        setStartDate(
                                            event.target.value
                                        );
                                        setPricePreview(null);
                                        setError('');
                                    }}
                                />
                            </label>

                            <label>
                                <span>
                                    <CalendarDays size={14} />
                                    END DATE
                                </span>

                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate || undefined}
                                    onChange={(event) => {
                                        setEndDate(
                                            event.target.value
                                        );
                                        setPricePreview(null);
                                        setError('');
                                    }}
                                />
                            </label>

                        </div>

                        {pricePreview && (

                            <div className="item-price-preview">

                                <div>
                                    <span>
                                        ESTIMATED RENTAL
                                    </span>

                                    <strong>
                                        ₹
                                        {pricePreview.totalAmount ??
                                            pricePreview.total ??
                                            0}
                                    </strong>
                                </div>

                                <span>
                                    {formatDateForDisplay(
                                        startDate
                                    )}
                                    {' — '}
                                    {formatDateForDisplay(
                                        endDate
                                    )}
                                </span>

                            </div>

                        )}

                        {error && (

                            <div className="item-details-message error">
                                {error}
                            </div>

                        )}

                        {success && (

                            <div className="item-details-message success">
                                <CheckCircle2 size={16} />
                                {success}
                            </div>

                        )}

                        <div className="item-borrow-actions">

                            <button
                                type="button"
                                className="item-check-price"
                                onClick={checkPrice}
                                disabled={checkingPrice}
                            >
                                {checkingPrice
                                    ? 'Checking...'
                                    : 'Check price'}
                            </button>

                            <button
                                type="button"
                                className="item-request-button"
                                onClick={requestToBorrow}
                                disabled={
                                    requesting ||
                                    !item.availability
                                }
                            >
                                {requesting
                                    ? 'Sending request...'
                                    : 'Request to borrow'}

                                {!requesting && (
                                    <ArrowRight size={15} />
                                )}
                            </button>

                        </div>

                        <p className="item-borrow-note">
                            Your request will be sent to the
                            owner for approval. No payment is
                            taken at this stage.
                        </p>

                    </section>

                )}

            </div>

        </main>
    );
}

export default ItemDetails;