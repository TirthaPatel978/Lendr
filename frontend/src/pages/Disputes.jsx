import { useEffect, useState } from 'react';
import {
    AlertTriangle,
    Camera,
    CheckCircle2,
    Clock3,
    FileWarning,
    Send,
    ShieldAlert
} from 'lucide-react';

import api from '../services/api';

import './Disputes.css';

function Disputes() {
    const [disputes, setDisputes] = useState([]);
    const [borrowings, setBorrowings] = useState([]);

    const [selectedBorrowing, setSelectedBorrowing] =
        useState('');

    const [reason, setReason] = useState('DAMAGE');
    const [description, setDescription] = useState('');
    const [damageAmount, setDamageAmount] = useState('');
    const [evidencePhotos, setEvidencePhotos] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                const [
                    disputesResponse,
                    borrowingsResponse
                ] = await Promise.all([
                    api.get('/disputes/my-disputes'),
                    api.get('/borrowings/my-requests')
                ]);

                if (cancelled) {
                    return;
                }

                setDisputes(
                    disputesResponse.data.disputes || []
                );

                const completedBorrowings =
                    (borrowingsResponse.data.borrowings || [])
                        .filter(
                            (borrowing) =>
                                borrowing.status === 'RETURNED' ||
                                borrowing.status === 'COMPLETED'
                        );

                setBorrowings(completedBorrowings);

            } catch (err) {
                if (cancelled) {
                    return;
                }

                setError(
                    err.response?.data?.message ||
                    'Failed to load disputes'
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, []);

    const loadDisputes = async () => {
        try {
            const response =
                await api.get('/disputes/my-disputes');

            setDisputes(
                response.data.disputes || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to refresh disputes'
            );
        }
    };

    const handlePhotoChange = (event) => {
        const files = Array.from(
            event.target.files || []
        );

        if (files.length > 5) {
            setError(
                'You can upload a maximum of 5 evidence photos.'
            );
            return;
        }

        setEvidencePhotos(files);
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedBorrowing) {
            setError(
                'Please select a completed borrowing.'
            );
            return;
        }

        if (!description.trim()) {
            setError(
                'Please describe the issue.'
            );
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();

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

            formData.append(
                'damageAmount',
                damageAmount || '0'
            );

            evidencePhotos.forEach((file) => {
                formData.append(
                    'evidencePhotos',
                    file
                );
            });

            await api.post(
                '/disputes',
                formData
            );

            setSuccess(
                'Your dispute has been submitted successfully.'
            );

            setSelectedBorrowing('');
            setReason('DAMAGE');
            setDescription('');
            setDamageAmount('');
            setEvidencePhotos([]);

            const fileInput =
                document.getElementById(
                    'evidencePhotos'
                );

            if (fileInput) {
                fileInput.value = '';
            }

            await loadDisputes();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to submit dispute'
            );
        } finally {
            setSubmitting(false);
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

    const formatReason = (value) => {
        return value
            .replaceAll('_', ' ')
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'OPEN':
                return 'status-open';

            case 'UNDER_REVIEW':
                return 'status-review';

            case 'RESOLVED':
                return 'status-resolved';

            case 'REJECTED':
                return 'status-rejected';

            default:
                return '';
        }
    };

    const hasActiveDisputeForBorrowing = (borrowingId) => {
        return disputes.some(
            (dispute) =>
                dispute.borrowing?._id?.toString() ===
                    borrowingId.toString() &&
                (
                    dispute.status === 'OPEN' ||
                    dispute.status === 'UNDER_REVIEW'
                )
        );
    };

    const availableBorrowings =
        borrowings.filter(
            (borrowing) =>
                !hasActiveDisputeForBorrowing(
                    borrowing._id
                )
        );

    if (loading) {
        return (
            <main className="disputes-page">
                <div className="disputes-loading">
                    <div className="disputes-spinner"></div>

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
                        COMMUNITY SAFETY
                    </span>

                    <h1>
                        Disputes &amp; <em>support.</em>
                    </h1>

                    <p>
                        Report damage, missing parts,
                        lost equipment or other issues
                        after a borrowing has ended.
                    </p>
                </div>

                <div className="disputes-header-icon">
                    <ShieldAlert size={28} />
                </div>

            </header>


            {error && (
                <div className="disputes-message error">
                    <AlertTriangle size={17} />
                    {error}
                </div>
            )}

            {success && (
                <div className="disputes-message success">
                    <CheckCircle2 size={17} />
                    {success}
                </div>
            )}


            {/* CREATE DISPUTE */}

            <section className="disputes-section">

                <div className="disputes-section-heading">
                    <span>
                        REPORT AN ISSUE
                    </span>

                    <h2>
                        Submit a dispute
                    </h2>
                </div>

                {availableBorrowings.length === 0 ? (

                    <div className="disputes-empty">

                        <div className="disputes-empty-icon">
                            <CheckCircle2 size={23} />
                        </div>

                        <h3>
                            Nothing to report
                        </h3>

                        <p>
                            Disputes can be submitted for
                            returned or completed borrowings
                            that do not already have an active
                            dispute.
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
                                    value={selectedBorrowing}
                                    onChange={(event) =>
                                        setSelectedBorrowing(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Select a borrowing
                                    </option>

                                    {availableBorrowings.map(
                                        (borrowing) => (
                                            <option
                                                key={
                                                    borrowing._id
                                                }
                                                value={
                                                    borrowing._id
                                                }
                                            >
                                                {borrowing.item?.name ||
                                                    'Equipment'}
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
                                    value={damageAmount}
                                    onChange={(event) =>
                                        setDamageAmount(
                                            event.target.value
                                        )
                                    }
                                    placeholder="₹ 0"
                                />
                            </label>

                        </div>


                        <label>
                            Description

                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                maxLength={1000}
                                rows={6}
                                placeholder="Describe what happened and provide any useful details..."
                            />
                        </label>


                        <label className="evidence-upload">

                            <span>
                                Evidence photos
                            </span>

                            <div className="evidence-upload-box">

                                <Camera size={22} />

                                <div>
                                    <strong>
                                        Add photos
                                    </strong>

                                    <p>
                                        JPG, PNG or WebP ·
                                        maximum 5 photos
                                    </p>
                                </div>

                                <input
                                    id="evidencePhotos"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={
                                        handlePhotoChange
                                    }
                                />

                            </div>

                            {evidencePhotos.length > 0 && (
                                <small>
                                    {evidencePhotos.length}{' '}
                                    photo
                                    {evidencePhotos.length > 1
                                        ? 's'
                                        : ''}{' '}
                                    selected
                                </small>
                            )}

                        </label>


                        <button
                            type="submit"
                            className="dispute-submit"
                            disabled={submitting}
                        >
                            <Send size={16} />

                            {submitting
                                ? 'Submitting...'
                                : 'Submit dispute'}
                        </button>

                    </form>

                )}

            </section>


            {/* DISPUTE HISTORY */}

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
                            <FileWarning size={23} />
                        </div>

                        <h3>
                            No disputes
                        </h3>

                        <p>
                            Any disputes you submit or disputes
                            involving you will appear here.
                        </p>

                    </div>

                ) : (

                    <div className="disputes-list">

                        {disputes.map((dispute) => (

                            <article
                                className="dispute-card"
                                key={dispute._id}
                            >

                                <div className="dispute-card-top">

                                    <div className="dispute-card-icon">
                                        <AlertTriangle
                                            size={19}
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


                                <p className="dispute-description">
                                    {dispute.description}
                                </p>


                                <div className="dispute-meta">

                                    <span>
                                        <Clock3 size={14} />

                                        {new Date(
                                            dispute.createdAt
                                        ).toLocaleDateString()}
                                    </span>

                                    <span>
                                        Reported by{' '}
                                        <strong>
                                            {dispute.reportedBy?.name ||
                                                'Lendr user'}
                                        </strong>
                                    </span>

                                    {Number(
                                        dispute.damageAmount
                                    ) > 0 && (
                                        <span>
                                            Amount: ₹
                                            {Number(
                                                dispute.damageAmount
                                            ).toLocaleString(
                                                'en-IN'
                                            )}
                                        </span>
                                    )}

                                </div>


                                {dispute.resolution && (
                                    <div className="dispute-resolution">

                                        <strong>
                                            Resolution
                                        </strong>

                                        <p>
                                            {
                                                dispute.resolution
                                            }
                                        </p>

                                    </div>
                                )}

                            </article>

                        ))}

                    </div>

                )}

            </section>

        </main>
    );
}

export default Disputes;