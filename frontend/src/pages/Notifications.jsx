import { useEffect, useState } from 'react';

import {
    Bell,
    CheckCheck,
    CheckCircle2,
    Clock3,
    CreditCard,
    RotateCcw,
    XCircle,
    AlertTriangle,
    ShieldAlert,
    ExternalLink,
} from 'lucide-react';

import {
    Link
} from 'react-router-dom';

import api from '../services/api';

import './Notifications.css';


function Notifications() {
    const [notifications, setNotifications] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');


    useEffect(() => {
        let cancelled = false;

        const fetchNotifications = async () => {
            try {
                const response =
                    await api.get(
                        '/notifications'
                    );

                if (cancelled) {
                    return;
                }

                setNotifications(
                    response.data.notifications ||
                    response.data ||
                    []
                );

            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error(
                    'Failed to load notifications:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Unable to load notifications.'
                );

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchNotifications();

        return () => {
            cancelled = true;
        };
    }, []);


    
const markAsRead = async (id) => {
    try {
        await api.put(`/notifications/${id}/read`);

        // Remove the notification from the visible list.
        setNotifications((current) =>
            current.filter(
                (notification) => notification._id !== id
            )
        );

    } catch (err) {
        console.error(
            'Failed to mark notification as read:',
            err
        );

        setError(
            err.response?.data?.message ||
            'Unable to update notification.'
        );
    }
};


const markAllAsRead = async () => {
    try {
        setActionLoading(true);
        setError('');
        setSuccess('');

        await api.put('/notifications/read-all');

        // Clear all visible notifications after the request succeeds.
        setNotifications([]);

        setSuccess('All notifications cleared.');

    } catch (err) {
        console.error(
            'Failed to mark all notifications:',
            err
        );

        setError(
            err.response?.data?.message ||
            'Unable to update notifications.'
        );

    } finally {
        setActionLoading(false);
    }
};


    const getNotificationIcon = (type) => {
        switch (type) {
            case 'BORROW_REQUEST':
                return <Bell size={19} />;

            case 'REQUEST_APPROVED':
                return (
                    <CheckCircle2 size={19} />
                );

            case 'REQUEST_REJECTED':
                return (
                    <XCircle size={19} />
                );

            case 'PAYMENT_COMPLETED':
                return (
                    <CreditCard size={19} />
                );

            case 'DAMAGE_PAYMENT_COMPLETED':
                return (
                    <CreditCard size={19} />
                );

            case 'ITEM_RETURNED':
                return (
                    <RotateCcw size={19} />
                );

            case 'BORROWING_COMPLETED':
                return (
                    <CheckCheck size={19} />
                );

            case 'DUE_TOMORROW':
            case 'DUE_TODAY':
                return (
                    <Clock3 size={19} />
                );

            case 'OVERDUE':
                return (
                    <AlertTriangle size={19} />
                );

            case 'DISPUTE_CREATED':
                return (
                    <ShieldAlert size={19} />
                );

            case 'DISPUTE_UPDATED':
                return (
                    <ShieldAlert size={19} />
                );

            case 'ITEM_REMOVED':
                return (
                    <ShieldAlert size={19} />
                );

            default:
                return <Bell size={19} />;
        }
    };


    const getTypeLabel = (type) => {
        switch (type) {
            case 'BORROW_REQUEST':
                return 'Borrow request';

            case 'REQUEST_APPROVED':
                return 'Request approved';

            case 'REQUEST_REJECTED':
                return 'Request declined';

            case 'PAYMENT_COMPLETED':
                return 'Rental payment';

            case 'DAMAGE_PAYMENT_COMPLETED':
                return 'Damage payment';

            case 'ITEM_RETURNED':
                return 'Equipment returned';

            case 'BORROWING_COMPLETED':
                return 'Borrowing completed';

            case 'DUE_TOMORROW':
                return 'Due tomorrow';

            case 'DUE_TODAY':
                return 'Due today';

            case 'OVERDUE':
                return 'Overdue';

            case 'DISPUTE_CREATED':
                return 'Dispute reported';

            case 'DISPUTE_UPDATED':
                return 'Dispute update';

            case 'ITEM_REMOVED':
                return 'Equipment removed';

            default:
                return 'Notification';
        }
    };


    const formatDate = (date) => {
        if (!date) {
            return '';
        }

        return new Date(date).toLocaleString(
            'en-IN',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }
        );
    };


    const formatShortDate = (date) => {
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


    const formatAmount = (amount) => {
        if (
            amount === undefined ||
            amount === null
        ) {
            return null;
        }

        const numericAmount =
            Number(amount);

        if (Number.isNaN(numericAmount)) {
            return null;
        }

        return `₹${numericAmount.toLocaleString(
            'en-IN'
        )}`;
    };


    const getItem = (notification) => {
        return (
            notification.relatedItem ||
            notification.relatedBorrowing?.item ||
            notification.relatedDispute?.item ||
            null
        );
    };


    const getOtherUser = (
        notification
    ) => {

        /*
         * Preferred source:
         * the backend should provide the user
         * who caused the notification as sender.
         */
        if (
            notification.sender &&
            typeof notification.sender ===
                'object' &&
            notification.sender.name
        ) {
            return notification.sender;
        }


        /*
         * Fallback for notifications where
         * sender is unavailable.
         *
         * This keeps older notifications
         * useful instead of breaking them.
         */
        const borrowing =
            notification.relatedBorrowing;

        if (
            borrowing &&
            typeof borrowing === 'object'
        ) {

            const borrower =
                borrowing.borrower;

            const lender =
                borrowing.lender;


            if (
                borrower &&
                typeof borrower === 'object' &&
                borrower.name
            ) {
                return borrower;
            }


            if (
                lender &&
                typeof lender === 'object' &&
                lender.name
            ) {
                return lender;
            }
        }


        /*
         * Dispute fallback.
         *
         * If sender is unavailable but the
         * dispute has populated users, use
         * the relevant participant.
         */
        const dispute =
            notification.relatedDispute;

        if (
            dispute &&
            typeof dispute === 'object'
        ) {

            if (
                dispute.reportedBy &&
                typeof dispute.reportedBy ===
                    'object' &&
                dispute.reportedBy.name
            ) {
                return dispute.reportedBy;
            }


            if (
                dispute.againstUser &&
                typeof dispute.againstUser ===
                    'object' &&
                dispute.againstUser.name
            ) {
                return dispute.againstUser;
            }
        }


        return null;
    };


    const getNotificationMeta = (
        notification
    ) => {

        const item =
            getItem(notification);

        const otherUser =
            getOtherUser(notification);

        const borrowing =
            notification.relatedBorrowing;

        const dispute =
            notification.relatedDispute;

        const metadata = [];


        if (item?.name) {
            metadata.push({
                label: 'Equipment',
                value: item.name
            });
        }


        /*
         * NEW:
         * Show the other user involved in
         * causing the notification.
         */
        if (otherUser?.name) {
            metadata.push({
                label: 'Person',
                value: otherUser.name
            });
        }


        if (
            borrowing?.startDate &&
            borrowing?.endDate
        ) {
            metadata.push({
                label: 'Dates',
                value:
                    `${formatShortDate(
                        borrowing.startDate
                    )} — ${formatShortDate(
                        borrowing.endDate
                    )}`
            });
        }


        if (
            notification.type ===
                'DAMAGE_PAYMENT_COMPLETED' &&
            dispute?.damageAmount !==
                undefined
        ) {
            metadata.push({
                label: 'Amount',
                value:
                    formatAmount(
                        dispute.damageAmount
                    )
            });

        } else if (
            notification.type ===
                'PAYMENT_COMPLETED' &&
            borrowing?.totalAmount !==
                undefined
        ) {
            metadata.push({
                label: 'Amount',
                value:
                    formatAmount(
                        borrowing.totalAmount
                    )
            });
        }


        return metadata;
    };


    const getNotificationLink = (
        notification
    ) => {

        if (
            notification.relatedItem?._id
        ) {
            return `/items/${notification.relatedItem._id}`;
        }


        if (
            notification.relatedBorrowing?._id
        ) {
            return `/borrowings`;
        }


        if (
            notification.relatedDispute?._id
        ) {
            return `/disputes`;
        }


        if (
            notification.relatedBorrowing?.item?._id
        ) {
            return `/items/${notification.relatedBorrowing.item._id}`;
        }


        return null;
    };


    const handleNotificationClick = (
        notification
    ) => {

        if (!notification.isRead) {
            markAsRead(
                notification._id
            );
        }
    };


    const unreadCount =
        notifications.filter(
            (notification) =>
                !notification.isRead
        ).length;


    return (
        <main className="notifications-page">

            <section className="notifications-header">

                <div>

                    <span className="notifications-eyebrow">
                        YOUR ACTIVITY
                    </span>

                    <h1>
                        Stay in the
                        <br />
                        <em>loop.</em>
                    </h1>

                    <p>
                        Requests, approvals, payments,
                        returns, disputes and reminders
                        from your Lendr activity.
                    </p>

                </div>

                <div className="notifications-header-icon">
                    <Bell size={30} />
                </div>

            </section>


            {error && (
                <div className="notifications-message error">
                    <AlertTriangle size={17} />
                    <span>{error}</span>
                </div>
            )}


            {success && (
                <div className="notifications-message success">
                    <CheckCircle2 size={17} />
                    <span>{success}</span>
                </div>
            )}


            <section className="notifications-panel">

                <div className="notifications-panel-header">

                    <div>
                        <span className="notifications-count">
                            {unreadCount}
                        </span>

                        <span className="notifications-count-label">
                            unread
                        </span>
                    </div>


                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className="notifications-read-all"
                            onClick={
                                markAllAsRead
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            <CheckCheck size={16} />

                            {actionLoading
                                ? 'Updating...'
                                : 'Mark all as read'}
                        </button>
                    )}

                </div>


                {loading ? (

                    <div className="notifications-loading">

                        <div className="notifications-spinner" />

                        <p>
                            Loading your notifications...
                        </p>

                    </div>

                ) : notifications.length === 0 ? (

                    <div className="notifications-empty">

                        <div className="notifications-empty-icon">
                            <Bell size={24} />
                        </div>

                        <h2>
                            You're all caught up.
                        </h2>

                        <p>
                            New activity will appear here
                            when someone interacts with
                            your equipment or borrowing
                            requests.
                        </p>

                    </div>

                ) : (

                    <div className="notifications-list">

                        {notifications.map(
                            (notification) => {

                                const item =
                                    getItem(
                                        notification
                                    );

                                const metadata =
                                    getNotificationMeta(
                                        notification
                                    );

                                const link =
                                    getNotificationLink(
                                        notification
                                    );


                                const card = (
                                    <article
                                        key={
                                            notification._id
                                        }
                                        className={`notification-card ${
                                            notification.isRead
                                                ? 'read'
                                                : 'unread'
                                        } ${
                                            link
                                                ? 'clickable'
                                                : ''
                                        }`}
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification
                                            )
                                        }
                                    >

                                        <div className="notification-icon">
                                            {getNotificationIcon(
                                                notification.type
                                            )}
                                        </div>


                                        {item?.photos?.[0] ? (

                                            <div className="notification-thumbnail">

                                                <img
                                                    src={
                                                        item.photos[0]
                                                    }
                                                    alt={
                                                        item.name ||
                                                        'Equipment'
                                                    }
                                                />

                                            </div>

                                        ) : (

                                            <div className="notification-thumbnail placeholder">

                                                <Bell
                                                    size={17}
                                                />

                                            </div>

                                        )}


                                        <div className="notification-content">

                                            <div className="notification-top">

                                                <span className="notification-type">
                                                    {getTypeLabel(
                                                        notification.type
                                                    )}
                                                </span>

                                                {!notification.isRead && (
                                                    <span className="notification-dot" />
                                                )}

                                            </div>


                                            <h3>
                                                {notification.title ||
                                                    getTypeLabel(
                                                        notification.type
                                                    )}
                                            </h3>


                                            <p>
                                                {notification.message ||
                                                    'You have a new Lendr update.'}
                                            </p>


                                            {metadata.length > 0 && (

                                                <div className="notification-meta">

                                                    {metadata.map(
                                                        (entry) => (
                                                            <div
                                                                className="notification-meta-item"
                                                                key={`${notification._id}-${entry.label}`}
                                                            >

                                                                <span>
                                                                    {
                                                                        entry.label
                                                                    }
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        entry.value
                                                                    }
                                                                </strong>

                                                            </div>
                                                        )
                                                    )}

                                                </div>

                                            )}


                                            <div className="notification-bottom">

                                                <span className="notification-date">
                                                    {formatDate(
                                                        notification.createdAt
                                                    )}
                                                </span>

                                                {link && (
                                                    <span className="notification-open">
                                                        Open

                                                        <ExternalLink
                                                            size={13}
                                                        />

                                                    </span>
                                                )}

                                            </div>

                                        </div>

                                    </article>
                                );


                                if (link) {
                                    return (
                                        <Link
                                            key={
                                                notification._id
                                            }
                                            to={link}
                                            className="notification-link"
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification
                                                )
                                            }
                                        >
                                            {card}
                                        </Link>
                                    );
                                }


                                return card;
                            }
                        )}

                    </div>

                )}

            </section>

        </main>
    );
}


export default Notifications;