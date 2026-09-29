import { useEffect, useState } from 'react';

import {
    ArrowDownToLine,
    ArrowUpFromLine,
    CheckCircle2,
    CreditCard,
    Package,
    RotateCcw,
    XCircle,
    AlertCircle,
    ShieldCheck
} from 'lucide-react';

import api from '../services/api';

import './BorrowManagement.css';

function BorrowManagement() {
    const [borrowRequests, setBorrowRequests] = useState([]);
    const [lenderRequests, setLenderRequests] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadBorrowings = async () => {
            try {
                setLoading(true);
                setError('');

                const [
                    borrowResponse,
                    lenderResponse
                ] = await Promise.all([
                    api.get('/borrowings/my-requests'),
                    api.get('/borrowings/lender-requests')
                ]);

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

            } catch (err) {
                console.error(
                    'Failed to load borrowings:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Unable to load your borrowing activity.'
                );

            } finally {
                setLoading(false);
            }
        };

        loadBorrowings();
    }, []);

    const refreshBorrowings = async () => {
        try {
            const [
                borrowResponse,
                lenderResponse
            ] = await Promise.all([
                api.get('/borrowings/my-requests'),
                api.get('/borrowings/lender-requests')
            ]);

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

        } catch (err) {
            console.error(
                'Failed to refresh borrowings:',
                err
            );
        }
    };

    const performAction = async (
        id,
        endpoint,
        successMessage
    ) => {
        try {
            setActionLoading(id);
            setError('');
            setSuccess('');

            await api.put(
                `/borrowings/${id}/${endpoint}`
            );

            setSuccess(successMessage);

            await refreshBorrowings();

        } catch (err) {
            console.error(
                `Failed to ${endpoint} borrowing:`,
                err
            );

            setError(
                err.response?.data?.message ||
                `Unable to ${endpoint} this borrowing.`
            );

        } finally {
            setActionLoading('');
        }
    };

    const approveRequest = (id) => {
        performAction(
            id,
            'approve',
            'Borrow request approved.'
        );
    };

    const rejectRequest = (id) => {
        performAction(
            id,
            'reject',
            'Borrow request rejected.'
        );
    };

    const makePayment = (id) => {
        performAction(
            id,
            'pay',
            'Payment completed successfully.'
        );
    };

    const returnItem = (id) => {
        performAction(
            id,
            'return',
            'Item marked as returned.'
        );
    };

    const completeBorrowing = (id) => {
        performAction(
            id,
            'complete',
            'Borrowing marked as completed.'
        );
    };

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

    const getStatusClass = (status) => {
        if (!status) {
            return '';
        }

        return `borrow-status-${status.toLowerCase()}`;
    };

    const getItemName = (borrowing) => {
        if (borrowing.item?.name) {
            return borrowing.item.name;
        }

        return 'Equipment';
    };

    const getOtherUser = (borrowing, type) => {
        if (type === 'borrower') {
            return (
                borrowing.lender?.name ||
                'Lendr member'
            );
        }

        return (
            borrowing.borrower?.name ||
            'Lendr member'
        );
    };

    const getAmount = (borrowing) => {
        if (
            borrowing.totalAmount === undefined ||
            borrowing.totalAmount === null
        ) {
            return null;
        }

        return Number(borrowing.totalAmount);
    };

    const getActionButton = (borrowing, type) => {
        const id = borrowing._id;
        const status = borrowing.status;

        if (type === 'borrower') {

            if (
                status === 'APPROVED' &&
                borrowing.paymentStatus !== 'PAID'
            ) {
                return (
                    <button
                        type="button"
                        className="borrow-action-button primary"
                        onClick={() => makePayment(id)}
                        disabled={actionLoading === id}
                    >
                        <CreditCard size={15} />

                        {actionLoading === id
                            ? 'Processing...'
                            : 'Pay & confirm'}
                    </button>
                );
            }

            if (
                status === 'ACTIVE' ||
                status === 'OVERDUE'
            ) {
                return (
                    <button
                        type="button"
                        className="borrow-action-button blue"
                        onClick={() => returnItem(id)}
                        disabled={actionLoading === id}
                    >
                        <RotateCcw size={15} />

                        {actionLoading === id
                            ? 'Returning...'
                            : 'Mark as returned'}
                    </button>
                );
            }

            return null;
        }

        if (
            type === 'lender' &&
            status === 'REQUESTED'
        ) {
            return (
                <div className="borrow-action-group">

                    <button
                        type="button"
                        className="borrow-action-button primary"
                        onClick={() => approveRequest(id)}
                        disabled={actionLoading === id}
                    >
                        <CheckCircle2 size={15} />

                        {actionLoading === id
                            ? 'Processing...'
                            : 'Approve'}
                    </button>

                    <button
                        type="button"
                        className="borrow-action-button danger"
                        onClick={() => rejectRequest(id)}
                        disabled={actionLoading === id}
                    >
                        <XCircle size={15} />
                        Reject
                    </button>

                </div>
            );
        }

        if (
            type === 'lender' &&
            status === 'RETURNED'
        ) {
            return (
                <button
                    type="button"
                    className="borrow-action-button primary"
                    onClick={() =>
                        completeBorrowing(id)
                    }
                    disabled={actionLoading === id}
                >
                    <CheckCircle2 size={15} />

                    {actionLoading === id
                        ? 'Completing...'
                        : 'Complete borrowing'}
                </button>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <main className="borrow-management-page">

                <div className="borrow-management-loading">
                    <div className="borrow-management-spinner" />

                    <p>
                        Loading your borrowing activity...
                    </p>
                </div>

            </main>
        );
    }

    return (
        <main className="borrow-management-page">

            <section className="borrow-management-header">

                <div>

                    <span className="borrow-management-eyebrow">
                        BORROWING & LENDING
                    </span>

                    <h1>
                        Keep track of
                        <br />
                        <em>everything you share.</em>
                    </h1>

                    <p>
                        Manage your borrow requests,
                        equipment requests and active
                        borrowings from one place.
                    </p>

                </div>

                <div className="borrow-management-header-icon">
                    <ShieldCheck size={30} />
                </div>

            </section>

            {error && (
                <div className="borrow-management-message error">
                    <AlertCircle size={17} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="borrow-management-message success">
                    <CheckCircle2 size={17} />
                    <span>{success}</span>
                </div>
            )}

            <section className="borrow-section">

                <div className="borrow-section-heading">

                    <div>

                        <span className="borrow-section-eyebrow">
                            I'M BORROWING
                        </span>

                        <h2>
                            Things you're borrowing
                        </h2>

                    </div>

                    <div className="borrow-heading-icon">
                        <ArrowDownToLine size={19} />
                    </div>

                </div>

                {borrowRequests.length === 0 ? (

                    <div className="borrow-empty">

                        <div className="borrow-empty-icon">
                            <Package size={23} />
                        </div>

                        <h3>
                            Nothing borrowed yet.
                        </h3>

                        <p>
                            When you request equipment from
                            someone in your community, it will
                            appear here.
                        </p>

                        <a
                            href="/browse"
                            className="borrow-empty-link"
                        >
                            Browse equipment
                        </a>

                    </div>

                ) : (

                    <div className="borrow-list">

                        {borrowRequests.map((borrowing) => {

                            const amount =
                                getAmount(borrowing);

                            return (
                                <article
                                    className="borrow-card"
                                    key={borrowing._id}
                                >

                                    <div className="borrow-card-main">

                                        <div className="borrow-card-image">

                                            {borrowing.item?.photos?.[0] ? (
                                                <img
                                                    src={
                                                        borrowing
                                                            .item
                                                            .photos[0]
                                                    }
                                                    alt={
                                                        getItemName(
                                                            borrowing
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <Package size={25} />
                                            )}

                                        </div>

                                        <div className="borrow-card-info">

                                            <span className="borrow-card-category">
                                                {borrowing.item?.category ||
                                                    'Equipment'}
                                            </span>

                                            <h3>
                                                {getItemName(
                                                    borrowing
                                                )}
                                            </h3>

                                            <p>
                                                From{' '}
                                                <strong>
                                                    {getOtherUser(
                                                        borrowing,
                                                        'borrower'
                                                    )}
                                                </strong>
                                            </p>

                                            <div className="borrow-card-dates">

                                                <span>
                                                    {formatDate(
                                                        borrowing.startDate
                                                    )}
                                                </span>

                                                <span>→</span>

                                                <span>
                                                    {formatDate(
                                                        borrowing.endDate
                                                    )}
                                                </span>

                                            </div>

                                        </div>

                                        <div className="borrow-card-side">

                                            <span
                                                className={`borrow-status ${getStatusClass(
                                                    borrowing.status
                                                )}`}
                                            >
                                                {formatStatus(
                                                    borrowing.status
                                                )}
                                            </span>

                                            {amount !== null && (
                                                <strong className="borrow-card-price">
                                                    {amount === 0
                                                        ? 'Free'
                                                        : `₹${amount}`}
                                                </strong>
                                            )}

                                            {borrowing.paymentStatus ===
                                                'PAID' && (
                                                <span className="borrow-payment">
                                                    Paid
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                    {getActionButton(
                                        borrowing,
                                        'borrower'
                                    ) && (
                                        <div className="borrow-card-actions">
                                            {getActionButton(
                                                borrowing,
                                                'borrower'
                                            )}
                                        </div>
                                    )}

                                </article>
                            );
                        })}

                    </div>

                )}

            </section>

            <section className="borrow-section">

                <div className="borrow-section-heading">

                    <div>

                        <span className="borrow-section-eyebrow">
                            I'M LENDING
                        </span>

                        <h2>
                            People requesting your equipment
                        </h2>

                    </div>

                    <div className="borrow-heading-icon">
                        <ArrowUpFromLine size={19} />
                    </div>

                </div>

                {lenderRequests.length === 0 ? (

                    <div className="borrow-empty">

                        <div className="borrow-empty-icon">
                            <ArrowUpFromLine size={23} />
                        </div>

                        <h3>
                            No requests yet.
                        </h3>

                        <p>
                            Requests from people who want to
                            borrow your equipment will appear here.
                        </p>

                    </div>

                ) : (

                    <div className="borrow-list">

                        {lenderRequests.map((borrowing) => {

                            const amount =
                                getAmount(borrowing);

                            return (
                                <article
                                    className="borrow-card lender-card"
                                    key={borrowing._id}
                                >

                                    <div className="borrow-card-main">

                                        <div className="borrow-card-image">

                                            {borrowing.item?.photos?.[0] ? (
                                                <img
                                                    src={
                                                        borrowing
                                                            .item
                                                            .photos[0]
                                                    }
                                                    alt={
                                                        getItemName(
                                                            borrowing
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <Package size={25} />
                                            )}

                                        </div>

                                        <div className="borrow-card-info">

                                            <span className="borrow-card-category">
                                                {borrowing.item?.category ||
                                                    'Equipment'}
                                            </span>

                                            <h3>
                                                {getItemName(
                                                    borrowing
                                                )}
                                            </h3>

                                            <p>
                                                Requested by{' '}
                                                <strong>
                                                    {getOtherUser(
                                                        borrowing,
                                                        'lender'
                                                    )}
                                                </strong>
                                            </p>

                                            <div className="borrow-card-dates">

                                                <span>
                                                    {formatDate(
                                                        borrowing.startDate
                                                    )}
                                                </span>

                                                <span>→</span>

                                                <span>
                                                    {formatDate(
                                                        borrowing.endDate
                                                    )}
                                                </span>

                                            </div>

                                        </div>

                                        <div className="borrow-card-side">

                                            <span
                                                className={`borrow-status ${getStatusClass(
                                                    borrowing.status
                                                )}`}
                                            >
                                                {formatStatus(
                                                    borrowing.status
                                                )}
                                            </span>

                                            {amount !== null && (
                                                <strong className="borrow-card-price">
                                                    {amount === 0
                                                        ? 'Free'
                                                        : `₹${amount}`}
                                                </strong>
                                            )}

                                        </div>

                                    </div>

                                    {getActionButton(
                                        borrowing,
                                        'lender'
                                    ) && (
                                        <div className="borrow-card-actions">
                                            {getActionButton(
                                                borrowing,
                                                'lender'
                                            )}
                                        </div>
                                    )}

                                </article>
                            );
                        })}

                    </div>

                )}

            </section>

            <section className="borrow-flow">

                <div className="borrow-flow-copy">

                    <span className="borrow-section-eyebrow">
                        HOW LENDR WORKS
                    </span>

                    <h2>
                        From request to return,
                        <br />
                        <em>everything stays clear.</em>
                    </h2>

                </div>

                <div className="borrow-flow-steps">

                    <div>
                        <span>01</span>
                        <strong>Request</strong>
                        <p>
                            Choose your dates and send
                            the owner a borrowing request.
                        </p>
                    </div>

                    <div>
                        <span>02</span>
                        <strong>Approve</strong>
                        <p>
                            The owner reviews your request
                            and approves or declines it.
                        </p>
                    </div>

                    <div>
                        <span>03</span>
                        <strong>Borrow</strong>
                        <p>
                            Confirm payment if required,
                            collect the item and use it.
                        </p>
                    </div>

                    <div>
                        <span>04</span>
                        <strong>Return</strong>
                        <p>
                            Return the equipment on time
                            and complete the borrowing.
                        </p>
                    </div>

                </div>

            </section>

        </main>
    );
}

export default BorrowManagement;