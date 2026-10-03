import {
    useEffect,
    useState
} from 'react';

import {
    AlertTriangle,
    Upload,
    Send,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Clock3,
    ShieldCheck
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/useAuth';

import './Disputes.css';

const Disputes = () => {
    const {
        user,
        loading: authLoading
    } = useAuth();

    const userId = user?._id || user?.id;

    const [disputes, setDisputes] = useState([]);
    const [borrowings, setBorrowings] = useState([]);

    const [selectedBorrowing, setSelectedBorrowing] =
        useState('');

    const [reason, setReason] =
        useState('DAMAGE');

    const [description, setDescription] =
        useState('');

    const [damageAmount, setDamageAmount] =
        useState('');

    const [evidencePhotos, setEvidencePhotos] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [payingDisputeId, setPayingDisputeId] =
        useState(null);

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
                    disputesResponse,
                    borrowerResponse,
                    lenderResponse
                ] = await Promise.all([
                    api.get('/disputes/my-disputes'),
                    api.get('/borrowings/my-requests'),
                    api.get('/borrowings/lender-requests')
                ]);

                if (cancelled) {
                    return;
                }

                setDisputes(
                    disputesResponse.data.disputes || []
                );

                const borrowerBorrowings =
                    borrowerResponse.data.borrowings ||
                    borrowerResponse.data.requests ||
                    [];

                const lenderBorrowings =
                    lenderResponse.data.borrowings ||
                    lenderResponse.data.requests ||
                    [];

                const allBorrowings = [
                    ...borrowerBorrowings,
                    ...lenderBorrowings
                ];

                const uniqueBorrowings =
                    Array.from(
                        new Map(
                            allBorrowings.map(
                                (borrowing) => [
                                    borrowing._id,
                                    borrowing
                                ]
                            )
                        ).values()
                    );

                const completedBorrowings =
                    uniqueBorrowings.filter(
                        (borrowing) =>
                            borrowing.status === 'RETURNED' ||
                            borrowing.status === 'COMPLETED'
                    );

                setBorrowings(
                    completedBorrowings
                );

            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    'Failed to load disputes:',
                    error
                );

                setMessage({
                    type: 'error',
                    text:
                        error.response?.data?.message ||
                        'Failed to load disputes.'
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

    const loadDisputes = async () => {
        try {
            const response =
                await api.get('/disputes/my-disputes');

            setDisputes(
                response.data.disputes || []
            );

        } catch (error) {
            console.error(
                'Failed to reload disputes:',
                error
            );
        }
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

        const borrowerId =
            borrowing.borrower?._id ||
            borrowing.borrower;

        if (
            borrowerId &&
            borrowerId.toString() === userId?.toString()
        ) {
            return borrowing.lender;
        }

        return borrowing.borrower;
    };


    const isAccused = (dispute) => {
        const againstUserId =
            dispute.againstUser?._id ||
            dispute.againstUser;

        return (
            againstUserId &&
            againstUserId.toString() ===
                userId?.toString()
        );
    };

    const handleFileChange = (event) => {
        const files = Array.from(
            event.target.files || []
        );

        if (files.length > 5) {
            setMessage({
                type: 'error',
                text:
                    'You can upload a maximum of 5 evidence photos.'
            });

            setEvidencePhotos(
                files.slice(0, 5)
            );

            return;
        }

        setEvidencePhotos(files);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedBorrowing) {
            setMessage({
                type: 'error',
                text:
                    'Please select a completed borrowing.'
            });

            return;
        }

        if (!description.trim()) {
            setMessage({
                type: 'error',
                text:
                    'Please describe the issue.'
            });

            return;
        }

        if (
            damageAmount !== '' &&
            (
                Number.isNaN(Number(damageAmount)) ||
                Number(damageAmount) < 0
            )
        ) {
            setMessage({
                type: 'error',
                text:
                    'Damage amount must be a valid non-negative number.'
            });

            return;
        }

        try {
            setSubmitting(true);

            setMessage({
                type: '',
                text: ''
            });

            const formData =
                new FormData();

            formData.append(
                'borrowingId',
                selectedBorrowing
            );

            formData.append(
                'reason',
                reason
            );

            formData.append(
                'description',
                description.trim()
            );

            if (damageAmount !== '') {
                formData.append(
                    'damageAmount',
                    damageAmount
                );
            }

            evidencePhotos.forEach(
                (file) => {
                    formData.append(
                        'evidencePhotos',
                        file
                    );
                }
            );

            await api.post(
                '/disputes',
                formData,
                {
                    headers: {
                        'Content-Type':
                            'multipart/form-data'
                    }
                }
            );

            setMessage({
                type: 'success',
                text:
                    'Your dispute has been submitted successfully.'
            });

            setSelectedBorrowing('');
            setReason('DAMAGE');
            setDescription('');
            setDamageAmount('');
            setEvidencePhotos([]);

            await loadDisputes();

        } catch (error) {
            console.error(
                'Failed to create dispute:',
                error
            );

            setMessage({
                type: 'error',
                text:
                    error.response?.data?.message ||
                    'Failed to submit dispute.'
            });

        } finally {
            setSubmitting(false);
        }
    };

    const handlePayDamage = async (dispute) => {
        if (!isAccused(dispute)) {
            return;
        }

        const amount =
            Number(dispute.damageAmount || 0);

        if (amount <= 0) {
            return;
        }

        const confirmed = window.confirm(
            `Pay ₹${amount.toLocaleString(
                'en-IN'
            )} as the damage fee?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setPayingDisputeId(dispute._id);

            setMessage({
                type: '',
                text: ''
            });

            const response = await api.put(
                `/disputes/${dispute._id}/pay-damage`
            );

            const updatedDispute =
                response.data.dispute;

            setDisputes((currentDisputes) =>
                currentDisputes.map(
                    (currentDispute) =>
                        currentDispute._id ===
                        dispute._id
                            ? updatedDispute
                            : currentDispute
                )
            );

            setMessage({
                type: 'success',
                text:
                    'Damage payment recorded successfully.'
            });

        } catch (error) {
            console.error(
                'Failed to pay damage:',
                error
            );

            setMessage({
                type: 'error',
                text:
                    error.response?.data?.message ||
                    'Failed to record damage payment.'
            });

        } finally {
            setPayingDisputeId(null);
        }
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'UNDER_REVIEW':
                return 'Under review';

            case 'RESOLVED':
                return 'Resolved';

            case 'REJECTED':
                return 'Rejected';

            default:
                return 'Open';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'UNDER_REVIEW':
                return 'status-review';

            case 'RESOLVED':
                return 'status-resolved';

            case 'REJECTED':
                return 'status-rejected';

            default:
                return 'status-open';
        }
    };

    const formatReason = (value) => {
        switch (value) {
            case 'MISSING_PARTS':
                return 'Missing parts';

            case 'LOST_ITEM':
                return 'Lost item';

            case 'LATE_RETURN':
                return 'Late return';

            case 'DAMAGE':
                return 'Damage';

            default:
                return 'Other';
        }
    };

    const formatPaymentStatus = (status) => {
        switch (status) {
            case 'PAID':
                return 'Paid';

            case 'PENDING':
                return 'Payment pending';

            case 'NOT_REQUIRED':
                return 'Not required';

            default:
                return 'Not available';
        }
    };

    const getEffectivePaymentStatus = (dispute) => {
        if (dispute?.damagePaymentStatus === 'PAID') {
            return 'PAID';
        }

        if (Number(dispute?.damageAmount || 0) > 0) {
            return 'PENDING';
        }

        return 'NOT_REQUIRED';
    };

    const getPaymentClass = (status) => {
        switch (status) {
            case 'PAID':
                return 'payment-paid';

            case 'PENDING':
                return 'payment-pending';

            default:
                return 'payment-not-required';
        }
    };

    if (authLoading || loading) {
        return (
            <main className="disputes-page">

                <div className="disputes-loading">

                    <div className="disputes-spinner" />

                    <p>
                        Loading disputes...
                    </p>

                </div>

            </main>
        );
    }

    return (
        <main className="disputes-page">

            <header className="disputes-header">

                <div>

                    <span className="disputes-eyebrow">
                        RESOLUTION & SUPPORT
                    </span>

                    <h1>
                        Disputes &{' '}
                        <em>damage.</em>
                    </h1>

                    <p>
                        Report damage, missing parts,
                        lost equipment or other issues
                        after a completed borrowing.
                    </p>

                </div>

                <div className="disputes-header-icon">
                    <AlertTriangle size={28} />
                </div>

            </header>

            {message.text && (
                <div
                    className={`disputes-message ${message.type}`}
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

            {/* --------------------------------
                CREATE DISPUTE
            -------------------------------- */}

            <section className="disputes-section">

                <div className="disputes-section-heading">

                    <span>
                        REPORT AN ISSUE
                    </span>

                    <h2>
                        Create a new dispute
                    </h2>

                </div>

                {borrowings.length === 0 ? (

                    <div className="disputes-empty">

                        <div className="disputes-empty-icon">
                            <CheckCircle size={23} />
                        </div>

                        <h3>
                            No completed borrowings
                        </h3>

                        <p>
                            You can create a dispute after
                            an item has been returned or the
                            borrowing has been completed.
                        </p>

                    </div>

                ) : (

                    <form
                        className="dispute-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="dispute-form-grid">

                            <label>
                                Borrowing

                                <select
                                    value={
                                        selectedBorrowing
                                    }
                                    onChange={(event) =>
                                        setSelectedBorrowing(
                                            event.target.value
                                        )
                                    }
                                    required
                                >

                                    <option value="">
                                        Select a borrowing
                                    </option>

                                    {borrowings.map(
                                        (borrowing) => (

                                            <option
                                                key={
                                                    borrowing._id
                                                }
                                                value={
                                                    borrowing._id
                                                }
                                            >
                                                {getItemName(
                                                    borrowing
                                                )}
                                            </option>

                                        )
                                    )}

                                </select>

                            </label>

                            <label>
                                Reason

                                <select
                                    value={reason}
                                    onChange={(event) =>
                                        setReason(
                                            event.target.value
                                        )
                                    }
                                >

                                    <option value="DAMAGE">
                                        Damage
                                    </option>

                                    <option value="MISSING_PARTS">
                                        Missing parts
                                    </option>

                                    <option value="LOST_ITEM">
                                        Lost item
                                    </option>

                                    <option value="LATE_RETURN">
                                        Late return
                                    </option>

                                    <option value="OTHER">
                                        Other
                                    </option>

                                </select>

                            </label>

                            <label>
                                Damage amount

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="₹ 0"
                                    value={
                                        damageAmount
                                    }
                                    onChange={(event) =>
                                        setDamageAmount(
                                            event.target.value
                                        )
                                    }
                                />

                            </label>

                        </div>

                        {selectedBorrowing && (
                            <div
                                style={{
                                    marginBottom: '18px',
                                    color: '#817a72',
                                    fontSize: '12px'
                                }}
                            >
                                This dispute concerns{' '}

                                <strong
                                    style={{
                                        color: '#557da8'
                                    }}
                                >
                                    {getItemName(
                                        borrowings.find(
                                            (borrowing) =>
                                                borrowing._id ===
                                                selectedBorrowing
                                        )
                                    )}
                                </strong>

                                {' '}and{' '}

                                <strong
                                    style={{
                                        color: '#557da8'
                                    }}
                                >
                                    {getOtherUser(
                                        borrowings.find(
                                            (borrowing) =>
                                                borrowing._id ===
                                                selectedBorrowing
                                        )
                                    )?.name ||
                                        'the other member'}
                                </strong>
                                .
                            </div>
                        )}

                        <label>
                            Description

                            <textarea
                                placeholder="Describe what happened and provide any relevant details..."
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                maxLength={1000}
                                required
                            />

                        </label>

                        <div className="evidence-upload">

                            <div className="evidence-upload-box">

                                <Upload size={20} />

                                <div>

                                    <strong>
                                        Add evidence photos
                                    </strong>

                                    <p>
                                        JPG, PNG or WebP ·
                                        maximum 5 photos
                                    </p>

                                </div>

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={
                                        handleFileChange
                                    }
                                />

                            </div>

                            {evidencePhotos.length > 0 && (
                                <small>
                                    {
                                        evidencePhotos.length
                                    }{' '}
                                    photo
                                    {evidencePhotos.length ===
                                    1
                                        ? ''
                                        : 's'}{' '}
                                    selected
                                </small>
                            )}

                        </div>

                        <button
                            type="submit"
                            className="dispute-submit"
                            disabled={submitting}
                        >

                            <Send size={14} />

                            {submitting
                                ? 'Submitting...'
                                : 'Submit dispute'}

                        </button>

                    </form>

                )}

            </section>

            {/* --------------------------------
                DISPUTE HISTORY
            -------------------------------- */}

            <section className="disputes-section">

                <div className="disputes-section-heading">

                    <span>
                        DISPUTE HISTORY
                    </span>

                    <h2>
                        Your disputes
                    </h2>

                </div>

                {disputes.length === 0 ? (

                    <div className="disputes-empty">

                        <div className="disputes-empty-icon">
                            <AlertTriangle size={23} />
                        </div>

                        <h3>
                            No disputes
                        </h3>

                        <p>
                            Disputes you create or disputes
                            involving you will appear here.
                        </p>

                    </div>

                ) : (

                    <div className="disputes-list">

                        {disputes.map(
                            (dispute) => (

                                <article
                                    className="dispute-card"
                                    key={dispute._id}
                                >

                                    {/* TOP */}

                                    <div className="dispute-card-top">

                                        <div className="dispute-card-icon">
                                            <AlertTriangle
                                                size={18}
                                            />
                                        </div>

                                        <div className="dispute-card-title">

                                            <h3>
                                                {dispute.item?.name ||
                                                    'Equipment dispute'}
                                            </h3>

                                            <span>
                                                {formatReason(
                                                    dispute.reason
                                                )}
                                                {' · '}
                                                {dispute.createdAt
                                                    ? new Date(
                                                        dispute.createdAt
                                                    ).toLocaleDateString(
                                                        'en-IN'
                                                    )
                                                    : ''}
                                            </span>

                                        </div>

                                        <span
                                            className={`dispute-status ${getStatusClass(
                                                dispute.status
                                            )}`}
                                        >
                                            {formatStatus(
                                                dispute.status
                                            )}
                                        </span>

                                    </div>

                                    {/* DESCRIPTION */}

                                    <p className="dispute-description">
                                        {dispute.description}
                                    </p>

                                    {/* BASIC META */}

                                    <div className="dispute-meta">

                                        <span>
                                            Reported by:{' '}
                                            <strong>
                                                {dispute.reportedBy?.name ||
                                                    'Lendr member'}
                                            </strong>
                                        </span>

                                        <span>
                                            Against:{' '}
                                            <strong>
                                                {dispute.againstUser?.name ||
                                                    'Lendr member'}
                                            </strong>
                                        </span>

                                        <span>
                                            Damage amount:{' '}
                                            <strong>
                                                ₹
                                                {Number(
                                                    dispute.damageAmount ||
                                                        0
                                                ).toLocaleString(
                                                    'en-IN'
                                                )}
                                            </strong>
                                        </span>

                                    </div>

                                    {/* EVIDENCE */}

                                    {dispute.evidencePhotos?.length > 0 && (
                                        <div
                                            className="dispute-evidence"
                                            style={{
                                                marginTop: '18px'
                                            }}
                                        >

                                            <div
                                                style={{
                                                    marginBottom: '9px',
                                                    color: '#557da8',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.12em'
                                                }}
                                            >
                                                EVIDENCE
                                            </div>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '8px'
                                                }}
                                            >

                                                {dispute.evidencePhotos.map(
                                                    (
                                                        photo,
                                                        index
                                                    ) => (

                                                        <a
                                                            href={photo}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            key={`${dispute._id}-evidence-${index}`}
                                                        >

                                                            <img
                                                                src={photo}
                                                                alt={`Evidence ${index + 1}`}
                                                                style={{
                                                                    width: '76px',
                                                                    height: '76px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '9px',
                                                                    border: '1px solid #e6e0d7'
                                                                }}
                                                            />

                                                        </a>

                                                    )
                                                )}

                                            </div>

                                        </div>
                                    )}

                                    {/* DAMAGE PAYMENT */}

                                    {Number(
                                        dispute.damageAmount || 0
                                    ) > 0 && (

                                        <div
                                            className="dispute-payment"
                                            style={{
                                                marginTop: '20px',
                                                padding: '16px',
                                                borderRadius: '12px',
                                                background: '#faf8f4',
                                                border: '1px solid #e6e0d7'
                                            }}
                                        >

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '15px',
                                                    flexWrap: 'wrap'
                                                }}
                                            >

                                                <div>

                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '7px',
                                                            color: '#557da8',
                                                            fontSize: '10px',
                                                            fontWeight: 700,
                                                            letterSpacing: '0.1em'
                                                        }}
                                                    >
                                                        <CreditCard size={14} />
                                                        DAMAGE PAYMENT
                                                    </div>

                                                    <strong
                                                        style={{
                                                            display: 'block',
                                                            marginTop: '7px',
                                                            color: '#35322d',
                                                            fontSize: '18px'
                                                        }}
                                                    >
                                                        ₹
                                                        {Number(
                                                            dispute.damageAmount
                                                        ).toLocaleString(
                                                            'en-IN'
                                                        )}
                                                    </strong>

                                                </div>

                                                <span
                                                    className={`dispute-payment-status ${getPaymentClass(
                                                        getEffectivePaymentStatus(dispute)
                                                    )}`}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '6px 9px',
                                                        borderRadius: '999px',
                                                        fontSize: '10px',
                                                        fontWeight: 700
                                                    }}
                                                >

                                                    {getEffectivePaymentStatus(dispute) ===
                                                    'PAID' ? (
                                                        <CheckCircle size={12} />
                                                    ) : getEffectivePaymentStatus(dispute) ===
                                                      'PENDING' ? (
                                                        <Clock3 size={12} />
                                                    ) : (
                                                        <ShieldCheck size={12} />
                                                    )}

                                                    {formatPaymentStatus(
                                                        getEffectivePaymentStatus(dispute)
                                                    )}

                                                </span>

                                            </div>

                                            {/* ACCUSED CAN PAY */}

                                            {isAccused(dispute) &&
                                                getEffectivePaymentStatus(dispute) ===
                                                    'PENDING' && (

                                                    <div
                                                        style={{
                                                            marginTop: '14px'
                                                        }}
                                                    >

                                                        <p
                                                            style={{
                                                                margin: '0 0 10px',
                                                                color: '#817a72',
                                                                fontSize: '12px',
                                                                lineHeight: 1.6
                                                            }}
                                                        >
                                                            You are listed as
                                                            the person
                                                            responsible for
                                                            this damage
                                                            amount. Payment
                                                            is simulated in
                                                            Lendr and does not
                                                            transfer real
                                                            money.
                                                        </p>

                                                        <button
                                                            type="button"
                                                            className="dispute-submit"
                                                            onClick={() =>
                                                                handlePayDamage(
                                                                    dispute
                                                                )
                                                            }
                                                            disabled={
                                                                payingDisputeId ===
                                                                dispute._id
                                                            }
                                                            style={{
                                                                display: 'inline-flex',
                                                                width: 'auto'
                                                            }}
                                                        >

                                                            <CreditCard
                                                                size={14}
                                                            />

                                                            {payingDisputeId ===
                                                            dispute._id
                                                                ? 'Processing...'
                                                                : 'Pay damage fee'}

                                                        </button>

                                                    </div>

                                                )}

                                            {getEffectivePaymentStatus(dispute) ===
                                                'PAID' && (
                                                <p
                                                    style={{
                                                        margin: '12px 0 0',
                                                        color: '#4c725d',
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    Damage payment recorded
                                                    {dispute.damagePaidAt
                                                        ? ` on ${new Date(
                                                            dispute.damagePaidAt
                                                        ).toLocaleDateString(
                                                            'en-IN'
                                                        )}`
                                                        : ''}
                                                    .
                                                </p>
                                            )}

                                        </div>
                                    )}

                                    {/* RESOLUTION */}

                                    {dispute.resolution && (
                                        <div className="dispute-resolution">

                                            <strong>
                                                Resolution
                                            </strong>

                                            <p>
                                                {dispute.resolution}
                                            </p>

                                        </div>
                                    )}

                                </article>

                            )
                        )}

                    </div>

                )}

            </section>

        </main>
    );
};

export default Disputes;