import { useEffect, useState } from 'react';

import {
    Bell,
    CheckCheck,
    CheckCircle2,
    Clock3,
    CreditCard,
    RotateCcw,
    XCircle,
    AlertTriangle
} from 'lucide-react';

import api from '../services/api';

import './Notifications.css';

function Notifications() {
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchNotifications = async () => {
            try {
                const response = await api.get(
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
            await api.put(
                `/notifications/${id}/read`
            );

            setNotifications((current) =>
                current.map((notification) =>
                    notification._id === id
                        ? {
                              ...notification,
                              isRead: true
                          }
                        : notification
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

            await api.put(
                '/notifications/read-all'
            );

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    isRead: true
                }))
            );

            setSuccess(
                'All notifications marked as read.'
            );

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
                return <CheckCircle2 size={19} />;

            case 'REQUEST_REJECTED':
                return <XCircle size={19} />;

            case 'PAYMENT_COMPLETED':
                return <CreditCard size={19} />;

            case 'ITEM_RETURNED':
                return <RotateCcw size={19} />;

            case 'BORROWING_COMPLETED':
                return <CheckCheck size={19} />;

            case 'DUE_TOMORROW':
                return <Clock3 size={19} />;

            case 'DUE_TODAY':
                return <Clock3 size={19} />;

            case 'OVERDUE':
                return <AlertTriangle size={19} />;

            default:
                return <Bell size={19} />;
        }
    };

    const formatType = (type) => {
        if (!type) {
            return 'Notification';
        }

        return type
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
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

    const unreadCount = notifications.filter(
        (notification) => !notification.isRead
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
                        Requests, approvals, returns and
                        reminders from your Lendr activity.
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
                            onClick={markAllAsRead}
                            disabled={actionLoading}
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
                            New activity will appear here when
                            someone interacts with your equipment
                            or borrowing requests.
                        </p>

                    </div>

                ) : (

                    <div className="notifications-list">

                        {notifications.map((notification) => (

                            <article
                                key={notification._id}
                                className={`notification-card ${
                                    notification.isRead
                                        ? 'read'
                                        : 'unread'
                                }`}
                                onClick={() => {
                                    if (!notification.isRead) {
                                        markAsRead(
                                            notification._id
                                        );
                                    }
                                }}
                            >

                                <div className="notification-icon">
                                    {getNotificationIcon(
                                        notification.type
                                    )}
                                </div>

                                <div className="notification-content">

                                    <div className="notification-top">

                                        <span className="notification-type">
                                            {formatType(
                                                notification.type
                                            )}
                                        </span>

                                        {!notification.isRead && (
                                            <span className="notification-dot" />
                                        )}

                                    </div>

                                    <h3>
                                        {notification.title ||
                                            formatType(
                                                notification.type
                                            )}
                                    </h3>

                                    <p>
                                        {notification.message ||
                                            'You have a new Lendr update.'}
                                    </p>

                                    <span className="notification-date">
                                        {formatDate(
                                            notification.createdAt
                                        )}
                                    </span>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </section>

        </main>
    );
}

export default Notifications;