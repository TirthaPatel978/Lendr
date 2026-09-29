import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ArrowLeft,
    Camera,
    MapPin,
    IndianRupee,
    CheckCircle2,
    Upload,
    X
} from 'lucide-react';

import api from '../services/api';

import './ListEquipment.css';

function ListEquipment() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        category: '',
        description: '',
        condition: 'GOOD',
        rentalType: 'FREE',
        originalValue: '',
        rentalPricePerDay: ''
    });

    const [photos, setPhotos] = useState([]);

    const [location, setLocation] = useState({
        latitude: '',
        longitude: ''
    });

    const [locationStatus, setLocationStatus] = useState('');
    const [loadingLocation, setLoadingLocation] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handlePhotoChange = (event) => {
        const selectedFiles = Array.from(event.target.files || []);

        if (photos.length + selectedFiles.length > 5) {
            setError('You can upload a maximum of 5 photos.');
            return;
        }

        setError('');

        setPhotos((current) => [
            ...current,
            ...selectedFiles
        ]);
    };

    const removePhoto = (index) => {
        setPhotos((current) =>
            current.filter((_, photoIndex) => photoIndex !== index)
        );
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus(
                'Location services are not supported by this browser.'
            );
            return;
        }

        setLoadingLocation(true);
        setLocationStatus('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });

                setLocationStatus(
                    'Pickup location captured successfully.'
                );

                setLoadingLocation(false);
            },
            () => {
                setLocationStatus(
                    'Unable to access your location. Please allow location access and try again.'
                );

                setLoadingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        );
    };

    const validateForm = () => {
        if (!form.name.trim()) {
            return 'Equipment name is required.';
        }

        if (!form.category.trim()) {
            return 'Please select a category.';
        }

        if (!form.description.trim()) {
            return 'Please add a description.';
        }

        if (!form.condition) {
            return 'Please select the equipment condition.';
        }

        if (form.rentalType === 'PAID') {
            const rentalPrice = Number(form.rentalPricePerDay);

            if (!Number.isFinite(rentalPrice) || rentalPrice <= 0) {
                return 'Enter a valid rental price per day.';
            }
        }

        if (
            !Number.isFinite(Number(location.latitude)) ||
            !Number.isFinite(Number(location.longitude))
        ) {
            return 'Please capture your pickup location.';
        }

        return '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();

            formData.append('name', form.name.trim());
            formData.append('category', form.category.trim());
            formData.append(
                'description',
                form.description.trim()
            );
            formData.append('condition', form.condition);
            formData.append('rentalType', form.rentalType);

            formData.append(
                'originalValue',
                form.originalValue || '0'
            );

            formData.append(
                'rentalPricePerDay',
                form.rentalType === 'PAID'
                    ? form.rentalPricePerDay
                    : '0'
            );

            formData.append(
                'latitude',
                location.latitude
            );

            formData.append(
                'longitude',
                location.longitude
            );

            photos.forEach((photo) => {
                formData.append('photos', photo);
            });

            const response = await api.post(
                '/items',
                formData
            );

            const createdItem = response.data.item;

            if (createdItem?._id) {
                navigate(`/items/${createdItem._id}`);
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            console.error(
                'Failed to create equipment:',
                err
            );

            setError(
                err.response?.data?.message ||
                'Failed to list your equipment. Please try again.'
            );

        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="list-equipment-page">

            <div className="list-equipment-container">

                <button
                    type="button"
                    className="list-equipment-back"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={15} />
                    Back
                </button>

                <section className="list-equipment-header">

                    <div>

                        <span className="list-equipment-eyebrow">
                            SHARE WITH YOUR COMMUNITY
                        </span>

                        <h1>
                            Give your equipment
                            <br />
                            <em>another life.</em>
                        </h1>

                        <p>
                            List something you don't use every day
                            and let someone nearby put it to good use.
                        </p>

                    </div>

                    <div className="list-equipment-header-mark">
                        <Camera size={24} />
                    </div>

                </section>

                <form
                    className="list-equipment-form"
                    onSubmit={handleSubmit}
                >

                    <section className="listing-section">

                        <div className="listing-section-heading">

                            <div className="listing-section-number">
                                01
                            </div>

                            <div>
                                <span>
                                    EQUIPMENT DETAILS
                                </span>

                                <h2>
                                    Tell people about your item.
                                </h2>
                            </div>

                        </div>

                        <div className="listing-fields">

                            <label className="listing-field listing-field-wide">

                                <span>
                                    Equipment name
                                </span>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Cordless drill"
                                    maxLength={100}
                                />

                            </label>

                            <label className="listing-field">

                                <span>
                                    Category
                                </span>

                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        Select a category
                                    </option>

                                    <option value="Power Tools">
                                        Power Tools
                                    </option>

                                    <option value="Home & Garden">
                                        Home & Garden
                                    </option>

                                    <option value="Outdoor">
                                        Outdoor
                                    </option>

                                    <option value="Everyday Tools">
                                        Everyday Tools
                                    </option>

                                    <option value="Sports">
                                        Sports
                                    </option>

                                    <option value="Recreational">
                                        Recreational
                                    </option>

                                    <option value="Photography">
                                        Photography
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>

                            </label>

                            <label className="listing-field">

                                <span>
                                    Condition
                                </span>

                                <select
                                    name="condition"
                                    value={form.condition}
                                    onChange={handleChange}
                                >
                                    <option value="EXCELLENT">
                                        Excellent
                                    </option>

                                    <option value="GOOD">
                                        Good
                                    </option>

                                    <option value="FAIR">
                                        Fair
                                    </option>

                                    <option value="POOR">
                                        Poor
                                    </option>
                                </select>

                            </label>

                            <label className="listing-field listing-field-wide">

                                <span>
                                    Description
                                </span>

                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Describe the equipment, what it is useful for, and anything a borrower should know."
                                    rows="5"
                                    maxLength={1000}
                                />

                            </label>

                        </div>

                    </section>

                    <section className="listing-section">

                        <div className="listing-section-heading">

                            <div className="listing-section-number">
                                02
                            </div>

                            <div>
                                <span>
                                    PHOTOS
                                </span>

                                <h2>
                                    Show your equipment.
                                </h2>
                            </div>

                        </div>

                        <label className="listing-upload">

                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handlePhotoChange}
                            />

                            <div className="listing-upload-icon">
                                <Upload size={20} />
                            </div>

                            <strong>
                                Add photos
                            </strong>

                            <p>
                                JPG, PNG or WebP · up to 5 photos
                            </p>

                        </label>

                        {photos.length > 0 && (

                            <div className="listing-photo-grid">

                                {photos.map((photo, index) => (

                                    <div
                                        className="listing-photo"
                                        key={`${photo.name}-${index}`}
                                    >

                                        <img
                                            src={URL.createObjectURL(photo)}
                                            alt={`Preview ${index + 1}`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removePhoto(index)
                                            }
                                            aria-label="Remove photo"
                                        >
                                            <X size={13} />
                                        </button>

                                    </div>

                                ))}

                            </div>

                        )}

                    </section>

                    <section className="listing-section">

                        <div className="listing-section-heading">

                            <div className="listing-section-number">
                                03
                            </div>

                            <div>
                                <span>
                                    RENTAL
                                </span>

                                <h2>
                                    Choose how you'd like to share it.
                                </h2>
                            </div>

                        </div>

                        <div className="listing-rental-options">

                            <label
                                className={
                                    form.rentalType === 'FREE'
                                        ? 'rental-option selected'
                                        : 'rental-option'
                                }
                            >

                                <input
                                    type="radio"
                                    name="rentalType"
                                    value="FREE"
                                    checked={
                                        form.rentalType === 'FREE'
                                    }
                                    onChange={handleChange}
                                />

                                <div>
                                    <strong>
                                        Share for free
                                    </strong>

                                    <p>
                                        Let someone nearby borrow it
                                        without a rental charge.
                                    </p>
                                </div>

                                {form.rentalType === 'FREE' && (
                                    <CheckCircle2 size={18} />
                                )}

                            </label>

                            <label
                                className={
                                    form.rentalType === 'PAID'
                                        ? 'rental-option selected'
                                        : 'rental-option'
                                }
                            >

                                <input
                                    type="radio"
                                    name="rentalType"
                                    value="PAID"
                                    checked={
                                        form.rentalType === 'PAID'
                                    }
                                    onChange={handleChange}
                                />

                                <div>
                                    <strong>
                                        Set a rental price
                                    </strong>

                                    <p>
                                        Charge a daily amount to account
                                        for wear and use.
                                    </p>
                                </div>

                                {form.rentalType === 'PAID' && (
                                    <CheckCircle2 size={18} />
                                )}

                            </label>

                        </div>

                        <div className="listing-fields listing-pricing-fields">

                            <label className="listing-field">

                                <span>
                                    Original value
                                </span>

                                <div className="listing-input-with-icon">

                                    <IndianRupee size={15} />

                                    <input
                                        type="number"
                                        name="originalValue"
                                        value={form.originalValue}
                                        onChange={handleChange}
                                        placeholder="Optional"
                                        min="0"
                                    />

                                </div>

                            </label>

                            {form.rentalType === 'PAID' && (

                                <label className="listing-field">

                                    <span>
                                        Rental price per day
                                    </span>

                                    <div className="listing-input-with-icon">

                                        <IndianRupee size={15} />

                                        <input
                                            type="number"
                                            name="rentalPricePerDay"
                                            value={
                                                form.rentalPricePerDay
                                            }
                                            onChange={handleChange}
                                            placeholder="e.g. 300"
                                            min="1"
                                        />

                                    </div>

                                </label>

                            )}

                        </div>

                    </section>

                    <section className="listing-section">

                        <div className="listing-section-heading">

                            <div className="listing-section-number">
                                04
                            </div>

                            <div>
                                <span>
                                    PICKUP LOCATION
                                </span>

                                <h2>
                                    Where can people collect it?
                                </h2>
                            </div>

                        </div>

                        <div className="listing-location">

                            <div className="listing-location-icon">
                                <MapPin size={21} />
                            </div>

                            <div className="listing-location-content">

                                <strong>
                                    Use your current location
                                </strong>

                                <p>
                                    Your exact coordinates are used
                                    for nearby equipment search.
                                </p>

                                {locationStatus && (
                                    <span
                                        className={
                                            location.latitude
                                                ? 'location-success'
                                                : 'location-error'
                                        }
                                    >
                                        {locationStatus}
                                    </span>
                                )}

                            </div>

                            <button
                                type="button"
                                className="listing-location-button"
                                onClick={getLocation}
                                disabled={loadingLocation}
                            >
                                {loadingLocation
                                    ? 'Locating...'
                                    : location.latitude
                                        ? 'Location captured'
                                        : 'Use my location'}
                            </button>

                        </div>

                    </section>

                    {error && (

                        <div className="listing-error">
                            {error}
                        </div>

                    )}

                    <div className="listing-submit-area">

                        <div>

                            <strong>
                                Ready to share?
                            </strong>

                            <p>
                                You can edit or remove your listing
                                from your dashboard later.
                            </p>

                        </div>

                        <button
                            type="submit"
                            className="listing-submit-button"
                            disabled={submitting}
                        >
                            {submitting
                                ? 'Listing equipment...'
                                : 'List equipment'}
                        </button>

                    </div>

                </form>

            </div>

        </main>
    );
}

export default ListEquipment;