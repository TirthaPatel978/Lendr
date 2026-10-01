import { useEffect, useState } from 'react';
import {
    useNavigate,
    useParams
} from 'react-router-dom';

import {
    ArrowLeft,
    MapPin,
    IndianRupee,
    Save,
    CheckCircle2
} from 'lucide-react';

import api from '../services/api';

import './EditEquipment.css';


function EditEquipment() {

    const { id } = useParams();

    const navigate = useNavigate();


    const [form, setForm] = useState({
        name: '',
        category: '',
        description: '',
        condition: 'GOOD',
        rentalType: 'FREE',
        originalValue: '',
        rentalPricePerDay: '',
        availability: true
    });


    const [location, setLocation] = useState({
        latitude: '',
        longitude: ''
    });


    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [loadingLocation, setLoadingLocation] =
        useState(false);

    const [locationStatus, setLocationStatus] =
        useState('');

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');


    // ============================================
    // LOAD ITEM
    // ============================================

    useEffect(() => {

        const loadItem = async () => {

            try {

                setLoading(true);
                setError('');


                const response =
                    await api.get(
                        `/items/${id}`
                    );


                const item =
                    response.data.item ||
                    response.data;


                setForm({
                    name: item.name || '',
                    category:
                        item.category || '',
                    description:
                        item.description || '',
                    condition:
                        item.condition || 'GOOD',
                    rentalType:
                        item.rentalType || 'FREE',
                    originalValue:
                        item.originalValue ?? '',
                    rentalPricePerDay:
                        item.rentalPricePerDay ?? '',
                    availability:
                        item.availability !== false
                });


                if (
                    item.location?.coordinates &&
                    item.location.coordinates.length >= 2
                ) {

                    setLocation({
                        longitude:
                            item.location.coordinates[0],
                        latitude:
                            item.location.coordinates[1]
                    });
                }


            } catch (err) {

                console.error(
                    'Failed to load equipment:',
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


    // ============================================
    // FORM CHANGE
    // ============================================

    const handleChange = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;


        setForm((current) => ({
            ...current,
            [name]:
                type === 'checkbox'
                    ? checked
                    : value
        }));


        setError('');
        setSuccess('');
    };


    // ============================================
    // CURRENT LOCATION
    // ============================================

    const getLocation = () => {

        if (!navigator.geolocation) {

            setLocationStatus(
                'Location services are not supported by this browser.'
            );

            return;
        }


        setLoadingLocation(true);
        setLocationStatus('');
        setError('');


        navigator.geolocation.getCurrentPosition(

            (position) => {

                setLocation({
                    latitude:
                        position.coords.latitude,
                    longitude:
                        position.coords.longitude
                });


                setLocationStatus(
                    'Current location captured successfully.'
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


    // ============================================
    // MANUAL LOCATION CHANGE
    // ============================================

    const handleLocationChange = (event) => {

        const {
            name,
            value
        } = event.target;


        setLocation((current) => ({
            ...current,
            [name]: value
        }));


        setLocationStatus(
            'Manual coordinates entered.'
        );

        setError('');
        setSuccess('');
    };


    // ============================================
    // VALIDATE
    // ============================================

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


        if (
            form.rentalType === 'PAID'
        ) {

            const price =
                Number(
                    form.rentalPricePerDay
                );


            if (
                !Number.isFinite(price) ||
                price <= 0
            ) {
                return 'Enter a valid rental price per day.';
            }
        }


        const latitude =
            Number(location.latitude);

        const longitude =
            Number(location.longitude);


        if (
            !Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90
        ) {
            return 'Enter a valid latitude between -90 and 90.';
        }


        if (
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {
            return 'Enter a valid longitude between -180 and 180.';
        }


        return '';
    };


    // ============================================
    // SAVE
    // ============================================

    const handleSubmit = async (event) => {

        event.preventDefault();


        setError('');
        setSuccess('');


        const validationError =
            validateForm();


        if (validationError) {

            setError(
                validationError
            );

            return;
        }


        try {

            setSaving(true);


            await api.put(
                `/items/${id}`,
                {
                    name:
                        form.name.trim(),

                    category:
                        form.category.trim(),

                    description:
                        form.description.trim(),

                    condition:
                        form.condition,

                    rentalType:
                        form.rentalType,

                    originalValue:
                        Number(
                            form.originalValue
                        ) || 0,

                    rentalPricePerDay:
                        form.rentalType === 'PAID'
                            ? Number(
                                form.rentalPricePerDay
                            )
                            : 0,

                    availability:
                        form.availability,

                    latitude:
                        Number(
                            location.latitude
                        ),

                    longitude:
                        Number(
                            location.longitude
                        )
                }
            );


            setSuccess(
                'Equipment updated successfully.'
            );


            setTimeout(() => {

                navigate(
                    `/items/${id}`
                );

            }, 700);


        } catch (err) {

            console.error(
                'Failed to update equipment:',
                err
            );


            setError(
                err.response?.data?.message ||
                'Unable to update this equipment.'
            );

        } finally {

            setSaving(false);
        }
    };


    // ============================================
    // LOADING
    // ============================================

    if (loading) {

        return (
            <main className="edit-equipment-page">

                <div className="edit-equipment-loading">

                    <div className="edit-equipment-spinner" />

                    <p>
                        Loading your equipment...
                    </p>

                </div>

            </main>
        );
    }


    // ============================================
    // ERROR WITHOUT ITEM
    // ============================================

    if (error && !form.name) {

        return (
            <main className="edit-equipment-page">

                <div className="edit-equipment-error">

                    <h2>
                        Unable to edit equipment
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate('/dashboard')
                        }
                    >
                        Back to dashboard
                    </button>

                </div>

            </main>
        );
    }


    return (
        <main className="edit-equipment-page">

            <div className="edit-equipment-container">


                {/* BACK */}

                <button
                    type="button"
                    className="edit-equipment-back"
                    onClick={() =>
                        navigate(
                            `/items/${id}`
                        )
                    }
                >
                    <ArrowLeft size={15} />
                    Back to equipment
                </button>


                {/* HEADER */}

                <section className="edit-equipment-header">

                    <div>

                        <span>
                            MANAGE YOUR EQUIPMENT
                        </span>

                        <h1>
                            Edit your
                            <br />
                            <em>equipment.</em>
                        </h1>

                        <p>
                            Update the information borrowers
                            see before requesting your item.
                        </p>

                    </div>

                    <div className="edit-equipment-header-icon">
                        <Save size={22} />
                    </div>

                </section>


                <form
                    className="edit-equipment-form"
                    onSubmit={handleSubmit}
                >


                    {/* =================================
                        DETAILS
                    ================================= */}

                    <section className="edit-equipment-section">

                        <div className="edit-section-heading">

                            <span>
                                01
                            </span>

                            <div>

                                <small>
                                    EQUIPMENT DETAILS
                                </small>

                                <h2>
                                    What are you sharing?
                                </h2>

                            </div>

                        </div>


                        <div className="edit-fields">

                            <label className="edit-field edit-field-wide">

                                <span>
                                    Equipment name
                                </span>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    maxLength={100}
                                />

                            </label>


                            <label className="edit-field">

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


                            <label className="edit-field">

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


                            <label className="edit-field edit-field-wide">

                                <span>
                                    Description
                                </span>

                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows="6"
                                    maxLength={1000}
                                />

                                <small>
                                    {form.description.length}/1000
                                </small>

                            </label>

                        </div>

                    </section>


                    {/* =================================
                        RENTAL
                    ================================= */}

                    <section className="edit-equipment-section">

                        <div className="edit-section-heading">

                            <span>
                                02
                            </span>

                            <div>

                                <small>
                                    RENTAL
                                </small>

                                <h2>
                                    Change your pricing.
                                </h2>

                            </div>

                        </div>


                        <div className="edit-rental-options">

                            <label
                                className={
                                    form.rentalType === 'FREE'
                                        ? 'edit-rental-option selected'
                                        : 'edit-rental-option'
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
                                        Borrowers do not pay a
                                        rental charge.
                                    </p>

                                </div>

                                {form.rentalType === 'FREE' && (
                                    <CheckCircle2 size={18} />
                                )}

                            </label>


                            <label
                                className={
                                    form.rentalType === 'PAID'
                                        ? 'edit-rental-option selected'
                                        : 'edit-rental-option'
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
                                        Charge a daily amount for use.
                                    </p>

                                </div>

                                {form.rentalType === 'PAID' && (
                                    <CheckCircle2 size={18} />
                                )}

                            </label>

                        </div>


                        <div className="edit-fields edit-pricing-fields">

                            <label className="edit-field">

                                <span>
                                    Original value
                                </span>

                                <div className="edit-input-icon">

                                    <IndianRupee size={15} />

                                    <input
                                        type="number"
                                        name="originalValue"
                                        value={form.originalValue}
                                        onChange={handleChange}
                                        min="0"
                                    />

                                </div>

                            </label>


                            {form.rentalType === 'PAID' && (

                                <label className="edit-field">

                                    <span>
                                        Rental price per day
                                    </span>

                                    <div className="edit-input-icon">

                                        <IndianRupee size={15} />

                                        <input
                                            type="number"
                                            name="rentalPricePerDay"
                                            value={
                                                form.rentalPricePerDay
                                            }
                                            onChange={handleChange}
                                            min="1"
                                        />

                                    </div>

                                </label>

                            )}

                        </div>

                    </section>


                    {/* =================================
                        AVAILABILITY
                    ================================= */}

                    <section className="edit-equipment-section">

                        <div className="edit-section-heading">

                            <span>
                                03
                            </span>

                            <div>

                                <small>
                                    AVAILABILITY
                                </small>

                                <h2>
                                    Is it available?
                                </h2>

                            </div>

                        </div>


                        <label className="edit-availability">

                            <input
                                type="checkbox"
                                name="availability"
                                checked={
                                    form.availability
                                }
                                onChange={handleChange}
                            />

                            <div>

                                <strong>
                                    Available for borrowing
                                </strong>

                                <p>
                                    Turn this off when you temporarily
                                    don't want borrowers to request it.
                                </p>

                            </div>

                        </label>

                    </section>


                    {/* =================================
                        LOCATION
                    ================================= */}

                    <section className="edit-equipment-section">

                        <div className="edit-section-heading">

                            <span>
                                04
                            </span>

                            <div>

                                <small>
                                    PICKUP LOCATION
                                </small>

                                <h2>
                                    Where can people collect it?
                                </h2>

                            </div>

                        </div>


                        <div className="edit-location-box">

                            <div className="edit-location-top">

                                <div className="edit-location-icon">
                                    <MapPin size={20} />
                                </div>

                                <div>

                                    <strong>
                                        Use your current location
                                    </strong>

                                    <p>
                                        You can automatically capture
                                        your current coordinates.
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    onClick={getLocation}
                                    disabled={
                                        loadingLocation
                                    }
                                >
                                    {loadingLocation
                                        ? 'Locating...'
                                        : 'Use my location'}
                                </button>

                            </div>


                            <div className="edit-location-divider">
                                OR ENTER MANUALLY
                            </div>


                            <div className="edit-location-fields">

                                <label>

                                    <span>
                                        Latitude
                                    </span>

                                    <input
                                        type="number"
                                        name="latitude"
                                        value={
                                            location.latitude
                                        }
                                        onChange={
                                            handleLocationChange
                                        }
                                        step="any"
                                        min="-90"
                                        max="90"
                                        placeholder="e.g. 23.0225"
                                    />

                                </label>


                                <label>

                                    <span>
                                        Longitude
                                    </span>

                                    <input
                                        type="number"
                                        name="longitude"
                                        value={
                                            location.longitude
                                        }
                                        onChange={
                                            handleLocationChange
                                        }
                                        step="any"
                                        min="-180"
                                        max="180"
                                        placeholder="e.g. 72.5714"
                                    />

                                </label>

                            </div>


                            {locationStatus && (

                                <p className="edit-location-status">
                                    {locationStatus}
                                </p>

                            )}

                        </div>

                    </section>


                    {/* =================================
                        MESSAGES
                    ================================= */}

                    {error && (

                        <div className="edit-equipment-message error">
                            {error}
                        </div>

                    )}


                    {success && (

                        <div className="edit-equipment-message success">
                            <CheckCircle2 size={16} />
                            {success}
                        </div>

                    )}


                    {/* =================================
                        SAVE
                    ================================= */}

                    <div className="edit-equipment-actions">

                        <button
                            type="button"
                            className="edit-cancel-button"
                            onClick={() =>
                                navigate(
                                    `/items/${id}`
                                )
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="edit-save-button"
                            disabled={saving}
                        >

                            <Save size={16} />

                            {saving
                                ? 'Saving changes...'
                                : 'Save changes'}

                        </button>

                    </div>

                </form>

            </div>

        </main>
    );
}


export default EditEquipment;