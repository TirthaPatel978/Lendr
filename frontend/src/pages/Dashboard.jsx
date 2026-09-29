import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    ArrowDownToLine,
    ArrowUpFromLine,
    Bell,
    Star,
    ShieldCheck,
    Plus,
    Clock3,
    CheckCircle2,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

import api from '../services/api';

import './Dashboard.css';

function Dashboard() {
    const [profile, setProfile] = useState(null);
    const [items, setItems] = useState([]);
    const [borrowRequests, setBorrowRequests] = useState([]);
    const [lenderRequests, setLenderRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError('');

                const [
                    profileResponse,
                    itemsResponse,
                    borrowResponse,
                    lenderResponse,
                    notificationResponse
                ] = await Promise.all([
                    api.get('/users/profile'),
                    api.get('/items/my-items'),
                    api.get('/borrowings/my-requests'),
                    api.get('/borrowings/lender-requests'),
                    api.get('/notifications')
                ]);

                setProfile(profileResponse.data.user);

                setItems(
                    itemsResponse.data.items ||
                    itemsResponse.data ||
                    []
                );

                setBorrowRequests(
                    borrowResponse.data.borrowings ||
                    borrowResponse.data.requests ||
                    borrowResponse.data ||
                    []
                );

                setLenderRequests(
                    lenderResponse.data.borrowings ||
                    lenderResponse.data.requests ||
                    lenderResponse.data ||
                    []
                );

                setNotifications(
                    notificationResponse.data.notifications ||
                    notificationResponse.data ||
                    []
                );

            } catch (err) {
                console.error(
                    'Failed to load dashboard:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Failed to load dashboard data.'
                );

            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const unreadNotifications = notifications.filter(
        (notification) => !notification.isRead
    ).length;

    const activeBorrowings = borrowRequests.filter(
        (borrowing) =>
            borrowing.status === 'ACTIVE' ||
            borrowing.status === 'OVERDUE'
    ).length;

    const pendingIncoming = lenderRequests.filter(
        (borrowing) =>
            borrowing.status === 'REQUESTED'
    ).length;

    const formatDate = (date) => {
        if (!date) {
            return '—';
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

    const formatStatus = (status) => {
        if (!status) {
            return 'Unknown';
        }

        return status
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    if (loading) {
        return (
            <main className="dashboard-page">
                <div className="dashboard-loading">
                    <div className="dashboard-spinner" />

                    <p>
                        Getting your Lendr space ready...
                    </p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="dashboard-page">
                <div className="dashboard-error">
                    <AlertCircle size={30} />

                    <h2>
                        Something went wrong
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        Try again
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="dashboard-page">

            {/* --------------------------------
                INTRO
            -------------------------------- */}

            <section className="dashboard-intro">

                <div className="dashboard-intro-copy">

                    <span className="dashboard-eyebrow">
                        YOUR LENDR SPACE
                    </span>

                    <h1>
                        Welcome back,
                        <br />
                        <em>
                            {profile?.name || 'there'}.
                        </em>
                    </h1>

                    <p>
                        Everything you're sharing,
                        borrowing and keeping track of —
                        all in one place.
                    </p>

                </div>

                <a
                    href="/list-equipment"
                    className="dashboard-list-button"
                >
                    <Plus size={16} />
                    List equipment
                </a>

            </section>

            {/* --------------------------------
                QUICK NUMBERS
            -------------------------------- */}

            <section className="dashboard-numbers">

                <div className="dashboard-number">

                    <span>
                        EQUIPMENT
                    </span>

                    <strong>
                        {items.length}
                    </strong>

                    <p>
                        items you're sharing
                    </p>

                </div>

                <div className="dashboard-number">

                    <span>
                        BORROWING
                    </span>

                    <strong>
                        {activeBorrowings}
                    </strong>

                    <p>
                        active right now
                    </p>

                </div>

                <div className="dashboard-number">

                    <span>
                        REQUESTS
                    </span>

                    <strong>
                        {pendingIncoming}
                    </strong>

                    <p>
                        waiting for you
                    </p>

                </div>

                <div className="dashboard-number">

                    <span>
                        NOTIFICATIONS
                    </span>

                    <strong>
                        {unreadNotifications}
                    </strong>

                    <p>
                        waiting to be read
                    </p>

                </div>

            </section>

            {/* --------------------------------
                FEATURED ACTIVITY
            -------------------------------- */}

            <section className="dashboard-main-grid">

                {/* PROFILE */}

                <div className="dashboard-profile">

                    <div className="dashboard-section-label">
                        YOUR PROFILE
                    </div>

                    <div className="dashboard-profile-top">

                        <div className="dashboard-avatar">

                            {profile?.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt={profile.name}
                                />
                            ) : (
                                <span>
                                    {profile?.name
                                        ?.charAt(0)
                                        ?.toUpperCase() || 'U'}
                                </span>
                            )}

                        </div>

                        <div>

                            <h2>
                                {profile?.name}
                            </h2>

                            <p>
                                {profile?.email}
                            </p>

                        </div>

                    </div>

                    <div className="dashboard-trust">

                        <div>

                            <Star size={17} />

                            <span>
                                Rating
                            </span>

                            <strong>
                                {Number(
                                    profile?.rating || 0
                                ).toFixed(1)}
                            </strong>

                        </div>

                        <div>

                            <ShieldCheck size={17} />

                            <span>
                                Reliability
                            </span>

                            <strong>
                                {profile?.reliabilityScore || 0}
                            </strong>

                        </div>

                    </div>

                </div>

                {/* NOTIFICATIONS */}

                <div className="dashboard-activity">

                    <div className="dashboard-section-heading">

                        <div>

                            <span className="dashboard-section-label">
                                RECENT ACTIVITY
                            </span>

                            <h2>
                                What's happening
                            </h2>

                        </div>

                        <Bell size={19} />

                    </div>

                    {notifications.length === 0 ? (

                        <div className="dashboard-empty">
                            <Bell size={25} />

                            <p>
                                You're all caught up.
                            </p>
                        </div>

                    ) : (

                        <div className="dashboard-notifications">

                            {notifications
                                .slice(0, 4)
                                .map((notification) => (

                                    <div
                                        className={
                                            notification.isRead
                                                ? 'dashboard-notification'
                                                : 'dashboard-notification unread'
                                        }
                                        key={notification._id}
                                    >

                                        <div className="notification-mark">
                                            <Bell size={13} />
                                        </div>

                                        <div>

                                            <strong>
                                                {notification.title ||
                                                    formatStatus(
                                                        notification.type
                                                    )}
                                            </strong>

                                            <p>
                                                {notification.message}
                                            </p>

                                            <span>
                                                {formatDate(
                                                    notification.createdAt
                                                )}
                                            </span>

                                        </div>

                                    </div>

                                ))}

                        </div>

                    )}

                </div>

            </section>

            {/* --------------------------------
                MY EQUIPMENT
            -------------------------------- */}

            <section className="dashboard-content-section">

                <div className="dashboard-section-heading">

                    <div>

                        <span className="dashboard-section-label">
                            YOUR EQUIPMENT
                        </span>

                        <h2>
                            Things you're sharing
                        </h2>

                    </div>

                    <a
                        href="/list-equipment"
                        className="dashboard-text-link"
                    >
                        Add equipment
                        <ArrowRight size={14} />
                    </a>

                </div>

                {items.length === 0 ? (

                    <div className="dashboard-feature-empty">

                        <div>
                            <Package size={27} />
                        </div>

                        <h3>
                            Nothing here yet.
                        </h3>

                        <p>
                            Have a drill, ladder, camera or
                            another useful item sitting around?
                            Give it another life in your community.
                        </p>

                        <a
                            href="/list-equipment"
                            className="dashboard-outline-button"
                        >
                            List your first item
                        </a>

                    </div>

                ) : (

                    <div className="dashboard-equipment-list">

                        {items
                            .slice(0, 4)
                            .map((item) => (

                                <div
                                    className="dashboard-equipment"
                                    key={item._id}
                                >

                                    <div className="equipment-image">

                                        {item.photos?.[0] ? (

                                            <img
                                                src={item.photos[0]}
                                                alt={item.name}
                                            />

                                        ) : (

                                            <Package size={25} />

                                        )}

                                    </div>

                                    <div className="equipment-info">

                                        <span>
                                            {item.category}
                                        </span>

                                        <h3>
                                            {item.name}
                                        </h3>

                                        <p>
                                            {formatStatus(
                                                item.condition
                                            )}
                                        </p>

                                    </div>

                                    <div className="equipment-price">

                                        <strong>
                                            {item.rentalType === 'FREE'
                                                ? 'Free'
                                                : `₹${item.rentalPricePerDay}`}
                                        </strong>

                                        {item.rentalType === 'PAID' && (
                                            <span>
                                                / day
                                            </span>
                                        )}

                                    </div>

                                </div>

                            ))}

                    </div>

                )}

            </section>

            {/* --------------------------------
                BORROWING
            -------------------------------- */}

            <section className="dashboard-borrow-grid">

                <div className="dashboard-content-section">

                    <div className="dashboard-section-heading">

                        <div>

                            <span className="dashboard-section-label">
                                BORROWING
                            </span>

                            <h2>
                                Things you're borrowing
                            </h2>
                            <Link
                                to="/borrow-management"
                                className="dashboard-text-link"
                            >
                                Manage borrowing
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        <ArrowDownToLine size={19} />

                    </div>

                    {borrowRequests.length === 0 ? (

                        <div className="dashboard-small-empty">
                            <p>
                                You haven't requested anything yet.
                            </p>

                            <a href="/browse">
                                Explore equipment
                                <ArrowRight size={14} />
                            </a>
                        </div>

                    ) : (

                        <div className="dashboard-request-list">

                            {borrowRequests
                                .slice(0, 4)
                                .map((request) => (

                                    <div
                                        className="dashboard-request"
                                        key={request._id}
                                    >

                                        <div className="request-symbol">
                                            {request.status === 'COMPLETED' ? (
                                                <CheckCircle2 size={15} />
                                            ) : (
                                                <Clock3 size={15} />
                                            )}
                                        </div>

                                        <div>

                                            <strong>
                                                {request.item?.name ||
                                                    'Equipment'}
                                            </strong>

                                            <span>
                                                {formatDate(
                                                    request.startDate
                                                )}
                                                {' — '}
                                                {formatDate(
                                                    request.endDate
                                                )}
                                            </span>

                                        </div>

                                        <span
                                            className={`request-status request-${request.status?.toLowerCase()}`}
                                        >
                                            {formatStatus(
                                                request.status
                                            )}
                                        </span>

                                    </div>

                                ))}

                        </div>

                    )}

                </div>

                {/* INCOMING */}

                <div className="dashboard-content-section">

                    <div className="dashboard-section-heading">

                        <div>

                            <span className="dashboard-section-label">
                                LENDING
                            </span>

                            <h2>
                                People requesting your items
                            </h2>
                            <Link
                                to="/borrow-management"
                                className="dashboard-text-link"
                            >
                                Manage borrowing
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        <ArrowUpFromLine size={19} />

                    </div>

                    {lenderRequests.length === 0 ? (

                        <div className="dashboard-small-empty">
                            <p>
                                No incoming requests right now.
                            </p>
                        </div>

                    ) : (

                        <div className="dashboard-request-list">

                            {lenderRequests
                                .slice(0, 4)
                                .map((request) => (

                                    <div
                                        className="dashboard-request"
                                        key={request._id}
                                    >

                                        <div className="request-symbol">
                                            <ArrowUpFromLine size={15} />
                                        </div>

                                        <div>

                                            <strong>
                                                {request.item?.name ||
                                                    'Equipment'}
                                            </strong>

                                            <span>
                                                {formatDate(
                                                    request.startDate
                                                )}
                                                {' — '}
                                                {formatDate(
                                                    request.endDate
                                                )}
                                            </span>

                                        </div>

                                        <span
                                            className={`request-status request-${request.status?.toLowerCase()}`}
                                        >
                                            {formatStatus(
                                                request.status
                                            )}
                                        </span>

                                    </div>

                                ))}

                        </div>

                    )}

                </div>

            </section>

        </main>
    );
}

export default Dashboard;