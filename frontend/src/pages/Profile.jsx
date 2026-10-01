import { useEffect, useRef, useState } from 'react';
import {
    ArrowLeft,
    Camera,
    Save,
    Star,
    ShieldCheck,
    LockKeyhole,
    Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

import './Profile.css';


function Profile() {
    const navigate = useNavigate();

    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);

    const [name, setName] = useState('');

    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [gettingLocation, setGettingLocation] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [changingPassword, setChangingPassword] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


    // ============================================
    // LOAD PROFILE
    // ============================================

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError('');

                const response =
                    await api.get('/users/profile');

                const user =
                    response.data.user ||
                    response.data;

                setProfile(user);
                setName(user.name || '');

                // Load existing GeoJSON location
                if (
                    user.location &&
                    Array.isArray(user.location.coordinates) &&
                    user.location.coordinates.length === 2
                ) {
                    const [
                        userLongitude,
                        userLatitude
                    ] = user.location.coordinates;

                    setLatitude(
                        Number(userLatitude).toFixed(6)
                    );

                    setLongitude(
                        Number(userLongitude).toFixed(6)
                    );
                }

            } catch (err) {
                console.error(
                    'Failed to load profile:',
                    err
                );

                setError(
                    err.response?.data?.message ||
                    'Unable to load your profile.'
                );

            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);


    // ============================================
    // SAVE PROFILE
    // ============================================

    const handleSave = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            if (!name.trim()) {
                setError(
                    'Please enter your full name.'
                );
                return;
            }

            const parsedLatitude =
                Number(latitude);

            const parsedLongitude =
                Number(longitude);

            if (
                latitude === '' ||
                longitude === ''
            ) {
                setError(
                    'Please enter both latitude and longitude.'
                );
                return;
            }

            if (
                !Number.isFinite(parsedLatitude) ||
                parsedLatitude < -90 ||
                parsedLatitude > 90
            ) {
                setError(
                    'Latitude must be between -90 and 90.'
                );
                return;
            }

            if (
                !Number.isFinite(parsedLongitude) ||
                parsedLongitude < -180 ||
                parsedLongitude > 180
            ) {
                setError(
                    'Longitude must be between -180 and 180.'
                );
                return;
            }

            const response =
                await api.put(
                    '/users/profile',
                    {
                        name: name.trim(),

                        location: {
                            type: 'Point',
                            coordinates: [
                                parsedLongitude,
                                parsedLatitude
                            ]
                        }
                    }
                );

            const updatedUser =
                response.data.user ||
                response.data;

            setProfile((current) => ({
                ...current,
                ...updatedUser
            }));

            setName(
                updatedUser.name ||
                name.trim()
            );

            if (
                updatedUser.location &&
                Array.isArray(
                    updatedUser.location.coordinates
                )
            ) {
                const [
                    updatedLongitude,
                    updatedLatitude
                ] = updatedUser.location.coordinates;

                setLatitude(
                    Number(updatedLatitude).toFixed(6)
                );

                setLongitude(
                    Number(updatedLongitude).toFixed(6)
                );
            }

            setSuccess(
                'Your profile has been updated successfully.'
            );

        } catch (err) {
            console.error(
                'Failed to update profile:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to update your profile.'
            );

        } finally {
            setSaving(false);
        }
    };


    // ============================================
    // USE CURRENT LOCATION
    // ============================================

    const handleUseCurrentLocation = () => {
        setError('');
        setSuccess('');

        if (!navigator.geolocation) {
            setError(
                'Location services are not supported by your browser.'
            );
            return;
        }

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const {
                    latitude: currentLatitude,
                    longitude: currentLongitude
                } = position.coords;

                setLatitude(
                    currentLatitude.toFixed(6)
                );

                setLongitude(
                    currentLongitude.toFixed(6)
                );

                setGettingLocation(false);

                setSuccess(
                    'Current location detected. Save your profile to update it.'
                );
            },

            (locationError) => {
                console.error(
                    'Failed to get current location:',
                    locationError
                );

                let message =
                    'Unable to get your current location.';

                if (
                    locationError.code ===
                    locationError.PERMISSION_DENIED
                ) {
                    message =
                        'Location permission was denied. Please allow location access in your browser or enter your coordinates manually.';
                } else if (
                    locationError.code ===
                    locationError.POSITION_UNAVAILABLE
                ) {
                    message =
                        'Your current location could not be determined. Please enter your coordinates manually.';
                } else if (
                    locationError.code ===
                    locationError.TIMEOUT
                ) {
                    message =
                        'Getting your location took too long. Please try again or enter your coordinates manually.';
                }

                setError(message);
                setGettingLocation(false);
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };


    // ============================================
    // CHANGE PASSWORD
    // ============================================

    const handleChangePassword = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            setError(
                'Please fill in all password fields.'
            );
            return;
        }

        if (newPassword.length < 6) {
            setError(
                'New password must be at least 6 characters.'
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(
                'New password and confirmation password do not match.'
            );
            return;
        }

        try {
            setChangingPassword(true);

            await api.put(
                '/users/change-password',
                {
                    currentPassword,
                    newPassword
                }
            );

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setSuccess(
                'Your password has been changed successfully.'
            );

        } catch (err) {
            console.error(
                'Failed to change password:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to change your password.'
            );

        } finally {
            setChangingPassword(false);
        }
    };


    // ============================================
    // AVATAR UPLOAD
    // ============================================

    const handlePhotoChange = async (event) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            ![
                'image/jpeg',
                'image/png',
                'image/webp'
            ].includes(file.type)
        ) {
            setError(
                'Please choose a JPG, PNG or WebP image.'
            );

            event.target.value = '';
            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setError(
                'Profile photos must be smaller than 5 MB.'
            );

            event.target.value = '';
            return;
        }

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            const formData =
                new FormData();

            formData.append(
                'avatar',
                file
            );

            const response =
                await api.put(
                    '/users/profile/avatar',
                    formData
                );

            const updatedUser =
                response.data.user ||
                response.data;

            setProfile((current) => ({
                ...current,
                ...updatedUser
            }));

            setSuccess(
                'Your profile photo has been updated.'
            );

        } catch (err) {
            console.error(
                'Failed to upload profile photo:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Unable to upload your profile photo.'
            );

        } finally {
            setUploading(false);

            event.target.value = '';
        }
    };


    // ============================================
    // LOADING
    // ============================================

    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-loading">
                    <div className="profile-loading-spinner" />

                    <p>
                        Loading your profile...
                    </p>
                </div>
            </main>
        );
    }


    // ============================================
    // ERROR
    // ============================================

    if (error && !profile) {
        return (
            <main className="profile-page">
                <div className="profile-error">
                    <h1>
                        We couldn't load your profile.
                    </h1>

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


    const initial =
        profile?.name
            ?.charAt(0)
            ?.toUpperCase() ||
        'U';


    return (
        <main className="profile-page">

            <div className="profile-container">

                {/* =====================================
                    TOP NAVIGATION
                ===================================== */}

                <div className="profile-topbar">

                    <button
                        type="button"
                        className="profile-back"
                        onClick={() =>
                            navigate('/dashboard')
                        }
                    >
                        <ArrowLeft size={16} />

                        <span>
                            Back to dashboard
                        </span>
                    </button>

                    <span className="profile-topbar-label">
                        ACCOUNT SETTINGS
                    </span>

                </div>


                {/* =====================================
                    PAGE INTRO
                ===================================== */}

                <header className="profile-page-intro">

                    <span className="profile-page-eyebrow">
                        YOUR LENDR PROFILE
                    </span>

                    <h1>
                        Your profile.
                    </h1>

                    <p>
                        Keep your Lendr profile up to
                        date so your community knows
                        who they're sharing with.
                    </p>

                </header>


                {/* =====================================
                    PROFILE CARD
                ===================================== */}

                <section className="profile-card">

                    <div className="profile-card-header">

                        <span className="profile-card-eyebrow">
                            PROFILE INFORMATION
                        </span>


                        <div className="profile-identity">

                            {/* AVATAR */}

                            <div className="profile-avatar-column">

                                <div className="profile-avatar">

                                    {profile?.avatar ? (
                                        <img
                                            src={
                                                profile.avatar
                                            }
                                            alt={
                                                profile.name ||
                                                'Profile'
                                            }
                                        />
                                    ) : (
                                        <span>
                                            {initial}
                                        </span>
                                    )}

                                </div>


                                <button
                                    type="button"
                                    className="profile-photo-button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={uploading}
                                >
                                    <Camera size={16} />

                                    {uploading
                                        ? 'Uploading...'
                                        : 'Change photo'}
                                </button>

                                <input
                                    ref={fileInputRef}
                                    className="profile-file-input"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={
                                        handlePhotoChange
                                    }
                                />

                            </div>


                            {/* IDENTITY */}

                            <div className="profile-identity-content">

                                <h2>
                                    {profile?.name ||
                                        'Lendr member'}
                                </h2>

                                <p className="profile-email">
                                    {profile?.email}
                                </p>


                                <div className="profile-trust">

                                    <div className="profile-trust-item">

                                        <Star
                                            size={16}
                                        />

                                        <span>
                                            Rating
                                        </span>

                                        <strong>
                                            {Number(
                                                profile?.rating ||
                                                0
                                            ).toFixed(1)}
                                        </strong>

                                    </div>


                                    <div className="profile-trust-divider" />


                                    <div className="profile-trust-item">

                                        <ShieldCheck
                                            size={16}
                                        />

                                        <span>
                                            Reliability
                                        </span>

                                        <strong>
                                            {profile?.reliabilityScore ??
                                                0}
                                        </strong>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================
                        FORM
                    ================================= */}

                    <form
                        className="profile-form"
                        onSubmit={handleSave}
                    >

                        {success && (
                            <div className="profile-message success">
                                {success}
                            </div>
                        )}

                        {error && (
                            <div className="profile-message error">
                                {error}
                            </div>
                        )}


                        <div className="profile-form-grid">

                            {/* FULL NAME */}

                            <div className="profile-field">

                                <label htmlFor="profile-name">
                                    Full name
                                </label>

                                <div className="profile-input-wrapper">

                                    <input
                                        id="profile-name"
                                        type="text"
                                        value={name}
                                        onChange={(event) =>
                                            setName(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Your full name"
                                        autoComplete="name"
                                    />

                                </div>

                            </div>


                            {/* EMAIL */}

                            <div className="profile-field">

                                <label htmlFor="profile-email">
                                    Email address
                                </label>

                                <input
                                    id="profile-email"
                                    type="email"
                                    value={
                                        profile?.email ||
                                        ''
                                    }
                                    disabled
                                />

                                <span className="profile-field-help">
                                    Email cannot be changed here.
                                </span>

                            </div>


                            {/* LOCATION */}

                            <div className="profile-field profile-field-full">

                                <label htmlFor="profile-latitude">
                                    Location
                                </label>

                                <div className="profile-location-grid">

                                    <div className="profile-location-coordinate">

                                        <label htmlFor="profile-latitude">
                                            Latitude
                                        </label>

                                        <input
                                            id="profile-latitude"
                                            type="number"
                                            step="any"
                                            min="-90"
                                            max="90"
                                            value={latitude}
                                            onChange={(event) =>
                                                setLatitude(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="e.g. 23.0225"
                                        />

                                    </div>


                                    <div className="profile-location-coordinate">

                                        <label htmlFor="profile-longitude">
                                            Longitude
                                        </label>

                                        <input
                                            id="profile-longitude"
                                            type="number"
                                            step="any"
                                            min="-180"
                                            max="180"
                                            value={longitude}
                                            onChange={(event) =>
                                                setLongitude(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="e.g. 72.5714"
                                        />

                                    </div>

                                </div>


                                <button
                                    type="button"
                                    className="profile-location-button"
                                    onClick={
                                        handleUseCurrentLocation
                                    }
                                    disabled={
                                        gettingLocation ||
                                        saving
                                    }
                                >
                                    <Navigation size={15} />

                                    {gettingLocation
                                        ? 'Detecting your location...'
                                        : 'Use my current location'}
                                </button>


                                <span className="profile-field-help">
                                    Enter your latitude and longitude
                                    manually, or use your current
                                    browser location. Your browser may
                                    ask for permission to access your
                                    location.
                                </span>

                            </div>

                        </div>


                        {/* =================================
                            FORM FOOTER
                        ================================= */}

                        <div className="profile-form-footer">

                            <button
                                type="submit"
                                className="profile-save-button"
                                disabled={saving}
                            >
                                <Save size={16} />

                                {saving
                                    ? 'Saving...'
                                    : 'Save changes'}
                            </button>

                        </div>

                    </form>

                </section>


                {/* =====================================
                    SECURITY
                ===================================== */}

                <section className="profile-security-card">

                    <div className="profile-security-header">

                        <div className="profile-security-icon">
                            <LockKeyhole size={20} />
                        </div>

                        <div>
                            <span className="profile-security-eyebrow">
                                SECURITY
                            </span>

                            <h2>
                                Change your password.
                            </h2>

                            <p>
                                Keep your Lendr account secure by
                                using a strong password.
                            </p>
                        </div>

                    </div>


                    <form
                        className="profile-password-form"
                        onSubmit={handleChangePassword}
                    >

                        <div className="profile-password-grid">

                            <div className="profile-field">
                                <label htmlFor="current-password">
                                    Current password
                                </label>

                                <input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(event) =>
                                        setCurrentPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your current password"
                                    autoComplete="current-password"
                                />
                            </div>


                            <div className="profile-field">
                                <label htmlFor="new-password">
                                    New password
                                </label>

                                <input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="At least 6 characters"
                                    autoComplete="new-password"
                                />
                            </div>


                            <div className="profile-field">
                                <label htmlFor="confirm-password">
                                    Confirm new password
                                </label>

                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your new password again"
                                    autoComplete="new-password"
                                />
                            </div>

                        </div>


                        <div className="profile-password-footer">

                            <button
                                type="submit"
                                className="profile-save-button"
                                disabled={changingPassword}
                            >
                                <LockKeyhole size={16} />

                                {changingPassword
                                    ? 'Changing password...'
                                    : 'Change password'}
                            </button>

                        </div>

                    </form>

                </section>

            </div>

        </main>
    );
}

export default Profile;