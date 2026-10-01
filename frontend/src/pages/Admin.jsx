import { useEffect, useState } from 'react';
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    FileWarning,
    Package,
    RefreshCw,
    Shield,
    Users
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/useAuth';

import './Admin.css';

function Admin() {
    const { user } = useAuth();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [items, setItems] = useState([]);
    const [borrowings, setBorrowings] = useState([]);
    const [disputes, setDisputes] = useState([]);

    const [activeTab, setActiveTab] = useState('overview');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadAdminData = async () => {
            if (user?.role !== 'ADMIN') {
                setLoading(false);
                return;
            }

            try {
                const [
                    statsResponse,
                    usersResponse,
                    itemsResponse,
                    borrowingsResponse,
                    disputesResponse
                ] = await Promise.all([
                    api.get('/admin/dashboard'),
                    api.get('/admin/users'),
                    api.get('/admin/items'),
                    api.get('/admin/borrowings'),
                    api.get('/admin/disputes')
                ]);

                if (cancelled) {
                    return;
                }

                setStats(statsResponse.data);
                setUsers(usersResponse.data.users || []);
                setItems(itemsResponse.data.items || []);
                setBorrowings(
                    borrowingsResponse.data.borrowings || []
                );
                setDisputes(
                    disputesResponse.data.disputes || []
                );

            } catch (err) {
                if (cancelled) {
                    return;
                }

                setError(
                    err.response?.data?.message ||
                    'Failed to load admin dashboard'
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadAdminData();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const refreshData = async () => {
        try {
            setError('');

            const [
                statsResponse,
                usersResponse,
                itemsResponse,
                borrowingsResponse,
                disputesResponse
            ] = await Promise.all([
                api.get('/admin/dashboard'),
                api.get('/admin/users'),
                api.get('/admin/items'),
                api.get('/admin/borrowings'),
                api.get('/admin/disputes')
            ]);

            setStats(statsResponse.data);
            setUsers(usersResponse.data.users || []);
            setItems(itemsResponse.data.items || []);
            setBorrowings(
                borrowingsResponse.data.borrowings || []
            );
            setDisputes(
                disputesResponse.data.disputes || []
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to refresh admin data'
            );
        }
    };

    const handleSuspend = async (userId) => {
        try {
            await api.put(
                `/admin/users/${userId}/suspend`
            );

            setActionMessage(
                'User suspended successfully.'
            );

            await refreshData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to suspend user'
            );
        }
    };

    const handleUnsuspend = async (userId) => {
        try {
            await api.put(
                `/admin/users/${userId}/unsuspend`
            );

            setActionMessage(
                'User unsuspended successfully.'
            );

            await refreshData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to unsuspend user'
            );
        }
    };

    const handleRemoveItem = async (itemId) => {
        const confirmed = window.confirm(
            'Remove this item from Lendr? This action cannot be undone from the admin panel.'
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.put(
                `/admin/items/${itemId}/remove`,
                {
                    reason: 'Removed by administrator'
                }
            );

            setActionMessage(
                'Item removed successfully.'
            );

            await refreshData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to remove item'
            );
        }
    };

    const handleDisputeUpdate = async (
        disputeId,
        status
    ) => {
        try {
            await api.put(
                `/admin/disputes/${disputeId}`,
                {
                    status
                }
            );

            setActionMessage(
                'Dispute updated successfully.'
            );

            await refreshData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to update dispute'
            );
        }
    };

    const formatStatus = (status) => {
        return status
            .replaceAll('_', ' ')
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const formatDate = (date) => {
        if (!date) {
            return '—';
        }

        return new Date(date).toLocaleDateString();
    };

    if (user?.role !== 'ADMIN') {
        return (
            <main className="admin-page">
                <div className="admin-denied">

                    <div className="admin-denied-icon">
                        <Shield size={25} />
                    </div>

                    <h1>
                        Admin access required
                    </h1>

                    <p>
                        This area is restricted to Lendr
                        administrators.
                    </p>

                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="admin-page">
                <div className="admin-loading">
                    <div className="admin-spinner"></div>

                    <p>
                        Loading admin dashboard...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="admin-page">

            <header className="admin-header">

                <div>
                    <span className="admin-eyebrow">
                        LENDR ADMINISTRATION
                    </span>

                    <h1>
                        Community <em>control.</em>
                    </h1>

                    <p>
                        Monitor users, equipment,
                        borrowings and disputes across
                        the Lendr community.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-refresh"
                    onClick={refreshData}
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>

            </header>


            {error && (
                <div className="admin-message error">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {actionMessage && (
                <div className="admin-message success">
                    <CheckCircle2 size={16} />
                    {actionMessage}
                </div>
            )}


            {/* STATS */}

            <section className="admin-stats">

                <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                        <Users size={19} />
                    </div>

                    <span>Total users</span>

                    <strong>
                        {stats?.totalUsers ?? 0}
                    </strong>
                </div>


                <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                        <Package size={19} />
                    </div>

                    <span>Total items</span>

                    <strong>
                        {stats?.totalItems ?? 0}
                    </strong>
                </div>


                <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                        <RefreshCw size={19} />
                    </div>

                    <span>Active borrowings</span>

                    <strong>
                        {stats?.activeBorrowings ?? 0}
                    </strong>
                </div>


                <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                        <FileWarning size={19} />
                    </div>

                    <span>Open disputes</span>

                    <strong>
                        {stats?.openDisputes ?? 0}
                    </strong>
                </div>

            </section>


            {/* TABS */}

            <nav className="admin-tabs">

                <button
                    className={
                        activeTab === 'overview'
                            ? 'active'
                            : ''
                    }
                    onClick={() =>
                        setActiveTab('overview')
                    }
                >
                    Overview
                </button>

                <button
                    className={
                        activeTab === 'users'
                            ? 'active'
                            : ''
                    }
                    onClick={() =>
                        setActiveTab('users')
                    }
                >
                    Users
                </button>

                <button
                    className={
                        activeTab === 'items'
                            ? 'active'
                            : ''
                    }
                    onClick={() =>
                        setActiveTab('items')
                    }
                >
                    Items
                </button>

                <button
                    className={
                        activeTab === 'borrowings'
                            ? 'active'
                            : ''
                    }
                    onClick={() =>
                        setActiveTab('borrowings')
                    }
                >
                    Borrowings
                </button>

                <button
                    className={
                        activeTab === 'disputes'
                            ? 'active'
                            : ''
                    }
                    onClick={() =>
                        setActiveTab('disputes')
                    }
                >
                    Disputes
                </button>

            </nav>


            {/* OVERVIEW */}

            {activeTab === 'overview' && (
                <section className="admin-overview">

                    <div className="admin-overview-card">

                        <span>
                            COMPLETED BORROWINGS
                        </span>

                        <strong>
                            {stats?.completedBorrowings ?? 0}
                        </strong>

                        <p>
                            Successfully completed
                            equipment-sharing transactions.
                        </p>

                    </div>


                    <div className="admin-overview-card">

                        <span>
                            TOTAL BORROWINGS
                        </span>

                        <strong>
                            {stats?.totalBorrowings ?? 0}
                        </strong>

                        <p>
                            All borrowing requests recorded
                            by the platform.
                        </p>

                    </div>


                    <div className="admin-overview-card">

                        <span>
                            SUSPENDED USERS
                        </span>

                        <strong>
                            {stats?.suspendedUsers ?? 0}
                        </strong>

                        <p>
                            Accounts currently restricted
                            from using Lendr.
                        </p>

                    </div>

                </section>
            )}


            {/* USERS */}

            {activeTab === 'users' && (
                <section className="admin-section">

                    <div className="admin-section-heading">
                        <div>
                            <span>
                                COMMUNITY
                            </span>

                            <h2>
                                Users
                            </h2>
                        </div>

                        <strong>
                            {users.length}
                        </strong>
                    </div>


                    <div className="admin-table-wrap">

                        <table className="admin-table">

                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Rating</th>
                                    <th>Reliability</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {users.map((itemUser) => (

                                    <tr key={itemUser._id}>

                                        <td>
                                            <strong>
                                                {itemUser.name}
                                            </strong>

                                            <small>
                                                {itemUser.email}
                                            </small>
                                        </td>

                                        <td>
                                            {itemUser.role}
                                        </td>

                                        <td>
                                            {itemUser.rating?.toFixed(
                                                1
                                            ) || '0.0'}
                                        </td>

                                        <td>
                                            {itemUser.reliabilityScore ??
                                                0}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    itemUser.isSuspended
                                                        ? 'table-status suspended'
                                                        : 'table-status active'
                                                }
                                            >
                                                {itemUser.isSuspended
                                                    ? 'Suspended'
                                                    : 'Active'}
                                            </span>
                                        </td>

                                        <td>

                                            {itemUser.role ===
                                            'ADMIN' ? (
                                                <span className="table-muted">
                                                    Admin
                                                </span>
                                            ) : itemUser.isSuspended ? (
                                                <button
                                                    className="table-action"
                                                    onClick={() =>
                                                        handleUnsuspend(
                                                            itemUser._id
                                                        )
                                                    }
                                                >
                                                    Unsuspend
                                                </button>
                                            ) : (
                                                <button
                                                    className="table-action danger"
                                                    onClick={() =>
                                                        handleSuspend(
                                                            itemUser._id
                                                        )
                                                    }
                                                >
                                                    Suspend
                                                </button>
                                            )}

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </section>
            )}


            {/* ITEMS */}

            {activeTab === 'items' && (
                <section className="admin-section">

                    <div className="admin-section-heading">
                        <div>
                            <span>
                                MODERATION
                            </span>

                            <h2>
                                Equipment
                            </h2>
                        </div>

                        <strong>
                            {items.length}
                        </strong>
                    </div>


                    <div className="admin-table-wrap">

                        <table className="admin-table">

                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Owner</th>
                                    <th>Category</th>
                                    <th>Condition</th>
                                    <th>Availability</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {items.map((item) => (

                                    <tr key={item._id}>

                                        <td>
                                            <strong>
                                                {item.name}
                                            </strong>

                                            <small>
                                                {formatDate(
                                                    item.createdAt
                                                )}
                                            </small>
                                        </td>

                                        <td>
                                            {item.owner?.name ||
                                                'Unknown'}
                                        </td>

                                        <td>
                                            {item.category}
                                        </td>

                                        <td>
                                            {formatStatus(
                                                item.condition
                                            )}
                                        </td>

                                        <td>
                                            {item.availability
                                                ? 'Available'
                                                : 'Unavailable'}
                                        </td>

                                        <td>
                                            <button
                                                className="table-action danger"
                                                onClick={() =>
                                                    handleRemoveItem(
                                                        item._id
                                                    )
                                                }
                                            >
                                                <Ban size={13} />
                                                Remove
                                            </button>
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </section>
            )}


            {/* BORROWINGS */}

            {activeTab === 'borrowings' && (
                <section className="admin-section">

                    <div className="admin-section-heading">
                        <div>
                            <span>
                                PLATFORM ACTIVITY
                            </span>

                            <h2>
                                Borrowings
                            </h2>
                        </div>

                        <strong>
                            {borrowings.length}
                        </strong>
                    </div>


                    <div className="admin-table-wrap">

                        <table className="admin-table">

                            <thead>
                                <tr>
                                    <th>Equipment</th>
                                    <th>Borrower</th>
                                    <th>Lender</th>
                                    <th>Dates</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>

                            <tbody>

                                {borrowings.map((borrowing) => (

                                    <tr key={borrowing._id}>

                                        <td>
                                            <strong>
                                                {borrowing.item?.name ||
                                                    'Equipment'}
                                            </strong>

                                            <small>
                                                {borrowing.item?.category ||
                                                    ''}
                                            </small>
                                        </td>

                                        <td>
                                            {borrowing.borrower?.name ||
                                                'Unknown'}
                                        </td>

                                        <td>
                                            {borrowing.lender?.name ||
                                                'Unknown'}
                                        </td>

                                        <td>
                                            <small>
                                                {formatDate(
                                                    borrowing.startDate
                                                )}
                                                {' — '}
                                                {formatDate(
                                                    borrowing.endDate
                                                )}
                                            </small>
                                        </td>

                                        <td>
                                            <span className="table-status active">
                                                {formatStatus(
                                                    borrowing.status
                                                )}
                                            </span>
                                        </td>

                                        <td>
                                            ₹
                                            {Number(
                                                borrowing.totalAmount ||
                                                    0
                                            ).toLocaleString(
                                                'en-IN'
                                            )}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </section>
            )}


            {/* DISPUTES */}

            {activeTab === 'disputes' && (
                <section className="admin-section">

                    <div className="admin-section-heading">
                        <div>
                            <span>
                                COMMUNITY SAFETY
                            </span>

                            <h2>
                                Disputes
                            </h2>
                        </div>

                        <strong>
                            {disputes.length}
                        </strong>
                    </div>


                    <div className="admin-dispute-list">

                        {disputes.map((dispute) => (

                            <article
                                className="admin-dispute-card"
                                key={dispute._id}
                            >

                                <div>

                                    <div className="admin-dispute-title">
                                        <AlertTriangle
                                            size={17}
                                        />

                                        <h3>
                                            {dispute.item?.name ||
                                                'Equipment dispute'}
                                        </h3>
                                    </div>

                                    <p>
                                        {dispute.description}
                                    </p>

                                    <div className="admin-dispute-meta">
                                        <span>
                                            Reason:{' '}
                                            {formatStatus(
                                                dispute.reason
                                            )}
                                        </span>

                                        <span>
                                            Reported by:{' '}
                                            {dispute.reportedBy
                                                ?.name ||
                                                'Unknown'}
                                        </span>

                                        <span>
                                            Against:{' '}
                                            {dispute.againstUser
                                                ?.name ||
                                                'Unknown'}
                                        </span>
                                    </div>

                                </div>


                                <div className="admin-dispute-actions">

                                    <span
                                        className={`table-status ${
                                            dispute.status ===
                                            'RESOLVED'
                                                ? 'active'
                                                : dispute.status ===
                                                  'REJECTED'
                                                    ? 'suspended'
                                                    : 'review'
                                        }`}
                                    >
                                        {formatStatus(
                                            dispute.status
                                        )}
                                    </span>

                                    {dispute.status !==
                                        'RESOLVED' &&
                                        dispute.status !==
                                            'REJECTED' && (
                                            <>
                                                <button
                                                    className="table-action"
                                                    onClick={() =>
                                                        handleDisputeUpdate(
                                                            dispute._id,
                                                            'UNDER_REVIEW'
                                                        )
                                                    }
                                                >
                                                    Review
                                                </button>

                                                <button
                                                    className="table-action success"
                                                    onClick={() =>
                                                        handleDisputeUpdate(
                                                            dispute._id,
                                                            'RESOLVED'
                                                        )
                                                    }
                                                >
                                                    Resolve
                                                </button>

                                                <button
                                                    className="table-action danger"
                                                    onClick={() =>
                                                        handleDisputeUpdate(
                                                            dispute._id,
                                                            'REJECTED'
                                                        )
                                                    }
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}

                                </div>

                            </article>

                        ))}

                    </div>

                </section>
            )}

        </main>
    );
}

export default Admin;