import {
    useCallback,
    useEffect,
    useState
} from 'react';

import {
    Link,
    useSearchParams
} from 'react-router-dom';

import {
    LocateFixed
} from 'lucide-react';

import api from '../services/api';
import './Browse.css';

function Browse() {
    const [
        searchParams,
        setSearchParams
    ] = useSearchParams();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState(
        searchParams.get('search') || ''
    );

    const [category, setCategory] =
        useState(
            searchParams.get('category') || ''
        );

    const [rentalType, setRentalType] =
        useState(
            searchParams.get('rentalType') || ''
        );

    const [condition, setCondition] =
        useState(
            searchParams.get('condition') || ''
        );

    const [minPrice, setMinPrice] =
        useState(
            searchParams.get('minPrice') || ''
        );

    const [maxPrice, setMaxPrice] =
        useState(
            searchParams.get('maxPrice') || ''
        );

    const [radius, setRadius] =
        useState(
            searchParams.get('radius') || ''
        );

    const [latitude, setLatitude] =
        useState(
            searchParams.get('lat') ||
            searchParams.get('latitude') ||
            ''
        );

    const [longitude, setLongitude] =
        useState(
            searchParams.get('lng') ||
            searchParams.get('longitude') ||
            ''
        );

    const [locationLoading, setLocationLoading] =
        useState(false);

    const [
        locationMessage,
        setLocationMessage
    ] = useState('');


    const fetchItems = useCallback(
        async () => {
            try {
                setLoading(true);
                setError('');

                const params = {};

                const searchValue =
                    searchParams.get('search');

                const categoryValue =
                    searchParams.get('category');

                const rentalTypeValue =
                    searchParams.get('rentalType');

                const conditionValue =
                    searchParams.get('condition');

                const minPriceValue =
                    searchParams.get('minPrice');

                const maxPriceValue =
                    searchParams.get('maxPrice');

                const radiusValue =
                    searchParams.get('radius');

                const latValue =
                    searchParams.get('lat') ||
                    searchParams.get('latitude');

                const lngValue =
                    searchParams.get('lng') ||
                    searchParams.get('longitude');

                if (searchValue) {
                    params.search =
                        searchValue;
                }

                if (categoryValue) {
                    params.category =
                        categoryValue;
                }

                if (rentalTypeValue) {
                    params.rentalType =
                        rentalTypeValue;
                }

                if (conditionValue) {
                    params.condition =
                        conditionValue;
                }

                if (minPriceValue) {
                    params.minPrice =
                        minPriceValue;
                }

                if (maxPriceValue) {
                    params.maxPrice =
                        maxPriceValue;
                }

                if (
                    radiusValue &&
                    latValue &&
                    lngValue
                ) {
                    params.radius =
                        radiusValue;

                    params.latitude =
                        latValue;

                    params.longitude =
                        lngValue;
                }

                const response =
                    await api.get(
                        '/items',
                        { params }
                    );

                const fetchedItems =
                    response.data.items ||
                    response.data ||
                    [];

                setItems(
                    fetchedItems
                );

            } catch (err) {
                console.error(err);

                setError(
                    err.response?.data?.message ||
                    'Unable to load equipment right now.'
                );

            } finally {
                setLoading(false);
            }
        },
        [searchParams]
    );


    useEffect(() => {
        let cancelled = false;

        const loadItems = async () => {
            try {
                setLoading(true);
                setError('');

                const params = {};

                const searchValue =
                    searchParams.get('search');

                const categoryValue =
                    searchParams.get('category');

                const rentalTypeValue =
                    searchParams.get('rentalType');

                const conditionValue =
                    searchParams.get('condition');

                const minPriceValue =
                    searchParams.get('minPrice');

                const maxPriceValue =
                    searchParams.get('maxPrice');

                const radiusValue =
                    searchParams.get('radius');

                const latValue =
                    searchParams.get('lat') ||
                    searchParams.get('latitude');

                const lngValue =
                    searchParams.get('lng') ||
                    searchParams.get('longitude');

                if (searchValue) {
                    params.search =
                        searchValue;
                }

                if (categoryValue) {
                    params.category =
                        categoryValue;
                }

                if (rentalTypeValue) {
                    params.rentalType =
                        rentalTypeValue;
                }

                if (conditionValue) {
                    params.condition =
                        conditionValue;
                }

                if (minPriceValue) {
                    params.minPrice =
                        minPriceValue;
                }

                if (maxPriceValue) {
                    params.maxPrice =
                        maxPriceValue;
                }

                if (
                    radiusValue &&
                    latValue &&
                    lngValue
                ) {
                    params.radius =
                        radiusValue;

                    params.latitude =
                        latValue;

                    params.longitude =
                        lngValue;
                }

                const response =
                    await api.get(
                        '/items',
                        { params }
                    );

                if (cancelled) {
                    return;
                }

                const fetchedItems =
                    response.data.items ||
                    response.data ||
                    [];

                setItems(
                    fetchedItems
                );

            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error(err);

                setError(
                    err.response?.data?.message ||
                    'Unable to load equipment right now.'
                );

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadItems();

        return () => {
            cancelled = true;
        };
    }, [searchParams]);


    // USE CURRENT LOCATION
    const useCurrentLocation = () => {
        if (
            !navigator.geolocation
        ) {
            setLocationMessage(
                'Location services are not supported by this browser.'
            );

            return;
        }

        setLocationLoading(true);
        setLocationMessage('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat =
                    position.coords.latitude;

                const lng =
                    position.coords.longitude;

                setLatitude(
                    lat.toFixed(6)
                );

                setLongitude(
                    lng.toFixed(6)
                );

                if (!radius) {
                    setRadius('5');
                }

                setLocationMessage(
                    'Current location added.'
                );

                setLocationLoading(false);
            },

            () => {
                setLocationMessage(
                    'Unable to access your location. You can enter latitude and longitude manually.'
                );

                setLocationLoading(false);
            }
        );
    };


    // SEARCH
    const handleSearch = (
        event
    ) => {
        event.preventDefault();

        const params = {};

        if (search.trim()) {
            params.search =
                search.trim();
        }

        if (category) {
            params.category =
                category;
        }

        if (rentalType) {
            params.rentalType =
                rentalType;
        }

        if (condition) {
            params.condition =
                condition;
        }

        if (minPrice) {
            params.minPrice =
                minPrice;
        }

        if (maxPrice) {
            params.maxPrice =
                maxPrice;
        }

        if (
            radius &&
            latitude &&
            longitude
        ) {
            params.radius =
                radius;

            params.lat =
                latitude;

            params.lng =
                longitude;
        }

        setSearchParams(params);
    };


    // CLEAR FILTERS
    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setRentalType('');
        setCondition('');
        setMinPrice('');
        setMaxPrice('');
        setRadius('');
        setLatitude('');
        setLongitude('');
        setLocationMessage('');

        setSearchParams({});
    };


    const formatPrice = (
        item
    ) => {
        if (
            item.rentalType ===
            'FREE'
        ) {
            return 'Free';
        }

        if (
            item.rentalPricePerDay !==
                undefined &&
            item.rentalPricePerDay !==
                null
        ) {
            return `₹${item.rentalPricePerDay}/day`;
        }

        return 'Price unavailable';
    };


    const formatCondition = (
        value
    ) => {
        if (!value) {
            return '';
        }

        return value
            .toLowerCase()
            .replace(
                /_/g,
                ' '
            )
            .replace(
                /\b\w/g,
                (letter) =>
                    letter.toUpperCase()
            );
    };


    const getImage = (
        item
    ) => {
        if (
            item.photos &&
            item.photos.length > 0
        ) {
            return item.photos[0];
        }

        return null;
    };


    return (
        <main className="browse-page">

            <section className="browse-header">

                <div className="browse-header-content">

                    <div>
                        <span className="eyebrow">
                            EXPLORE LENDR
                        </span>

                        <h1>
                            Find equipment
                            <br />
                            near you.
                        </h1>

                        <p>
                            Discover useful equipment shared
                            by people in your local community.
                        </p>
                    </div>

                    <div className="browse-count">
                        <strong>
                            {items.length}
                        </strong>

                        <span>
                            equipment available
                        </span>
                    </div>

                </div>

            </section>


            <section className="browse-content">

                <aside className="filter-panel">

                    <div className="filter-heading">

                        <h2>
                            Find equipment
                        </h2>

                        <button
                            type="button"
                            onClick={
                                clearFilters
                            }
                        >
                            Clear all
                        </button>

                    </div>


                    <form
                        onSubmit={
                            handleSearch
                        }
                    >

                        {/* SEARCH */}

                        <div className="filter-group">

                            <label htmlFor="search">
                                Search
                            </label>

                            <input
                                id="search"
                                type="text"
                                placeholder="Drill, ladder, tools..."
                                value={search}
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        {/* CATEGORY */}

                        <div className="filter-group">

                            <label htmlFor="category">
                                Category
                            </label>

                            <select
                                id="category"
                                value={category}
                                onChange={(
                                    event
                                ) =>
                                    setCategory(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All categories
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
                            </select>

                        </div>


                        {/* RENTAL TYPE */}

                        <div className="filter-group">

                            <label htmlFor="rentalType">
                                Rental type
                            </label>

                            <select
                                id="rentalType"
                                value={rentalType}
                                onChange={(
                                    event
                                ) =>
                                    setRentalType(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All types
                                </option>

                                <option value="FREE">
                                    Free
                                </option>

                                <option value="PAID">
                                    Paid
                                </option>
                            </select>

                        </div>


                        {/* CONDITION */}

                        <div className="filter-group">

                            <label htmlFor="condition">
                                Condition
                            </label>

                            <select
                                id="condition"
                                value={condition}
                                onChange={(
                                    event
                                ) =>
                                    setCondition(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Any condition
                                </option>

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

                        </div>


                        {/* PRICE */}

                        <div className="filter-group">

                            <label>
                                Price per day
                            </label>

                            <div className="price-inputs">

                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(
                                        event
                                    ) =>
                                        setMinPrice(
                                            event.target.value
                                        )
                                    }
                                />

                                <span>
                                    —
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(
                                        event
                                    ) =>
                                        setMaxPrice(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                        </div>


                        {/* SEARCH DISTANCE */}

                        <div className="filter-group">

                            <label htmlFor="radius">
                                Search distance
                            </label>

                            <select
                                id="radius"
                                value={radius}
                                onChange={(
                                    event
                                ) =>
                                    setRadius(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    No distance filter
                                </option>

                                <option value="1">
                                    Within 1 km
                                </option>

                                <option value="2">
                                    Within 2 km
                                </option>

                                <option value="5">
                                    Within 5 km
                                </option>

                                <option value="10">
                                    Within 10 km
                                </option>

                                <option value="25">
                                    Within 25 km
                                </option>

                                <option value="50">
                                    Within 50 km
                                </option>
                            </select>

                        </div>


                        {/* LOCATION */}

                        <div className="filter-group">

                            <label>
                                Your location
                            </label>

                            <button
                                type="button"
                                className="location-button"
                                onClick={
                                    useCurrentLocation
                                }
                                disabled={
                                    locationLoading
                                }
                            >
                                <LocateFixed
                                    size={15}
                                />

                                {locationLoading
                                    ? 'Getting location...'
                                    : 'Use my current location'}
                            </button>


                            <div className="location-inputs">

                                <input
                                    type="number"
                                    step="any"
                                    min="-90"
                                    max="90"
                                    placeholder="Latitude"
                                    value={latitude}
                                    onChange={(
                                        event
                                    ) =>
                                        setLatitude(
                                            event.target.value
                                        )
                                    }
                                />

                                <input
                                    type="number"
                                    step="any"
                                    min="-180"
                                    max="180"
                                    placeholder="Longitude"
                                    value={longitude}
                                    onChange={(
                                        event
                                    ) =>
                                        setLongitude(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>


                            {locationMessage && (
                                <p className="location-message">
                                    {
                                        locationMessage
                                    }
                                </p>
                            )}

                        </div>


                        {/* SEARCH BUTTON */}

                        <button
                            type="submit"
                            className="apply-filter-button"
                        >
                            Search equipment
                        </button>

                    </form>

                </aside>


                {/* EQUIPMENT */}

                <div className="equipment-section">

                    <div className="equipment-toolbar">

                        <div>

                            <span className="toolbar-label">
                                AVAILABLE NOW
                            </span>

                            <h2>
                                Equipment around you
                            </h2>

                        </div>

                        <span className="result-count">
                            {items.length} results
                        </span>

                    </div>


                    {loading && (
                        <div className="browse-message">

                            <div className="loading-spinner" />

                            <p>
                                Finding equipment near you...
                            </p>

                        </div>
                    )}


                    {!loading &&
                        error && (
                            <div className="browse-message error-message">

                                <h3>
                                    Something went wrong
                                </h3>

                                <p>
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        fetchItems
                                    }
                                >
                                    Try again
                                </button>

                            </div>
                        )}


                    {!loading &&
                        !error &&
                        items.length === 0 && (
                            <div className="browse-message empty-message">

                                <div className="empty-icon">
                                    +
                                </div>

                                <h3>
                                    No equipment found
                                </h3>

                                <p>
                                    Try changing your filters
                                    or search for something else.
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    Clear filters
                                </button>

                            </div>
                        )}


                    {!loading &&
                        !error &&
                        items.length > 0 && (

                            <div className="equipment-grid">

                                {items.map(
                                    (item) => {

                                        const image =
                                            getImage(
                                                item
                                            );

                                        return (
                                            <Link
                                                to={`/items/${item._id}`}
                                                className="equipment-card"
                                                key={
                                                    item._id
                                                }
                                            >

                                                <div className="equipment-image">

                                                    {image ? (
                                                        <img
                                                            src={
                                                                image
                                                            }
                                                            alt={
                                                                item.name
                                                            }
                                                        />
                                                    ) : (
                                                        <div className="image-placeholder">

                                                            <span>
                                                                {item.name
                                                                    ?.charAt(0)
                                                                    ?.toUpperCase()}
                                                            </span>

                                                        </div>
                                                    )}

                                                    <span className="condition-badge">
                                                        {formatCondition(
                                                            item.condition
                                                        )}
                                                    </span>

                                                </div>


                                                <div className="equipment-card-body">

                                                    <span className="equipment-category">
                                                        {
                                                            item.category
                                                        }
                                                    </span>

                                                    <h3>
                                                        {
                                                            item.name
                                                        }
                                                    </h3>

                                                    <p className="equipment-description">
                                                        {
                                                            item.description ||
                                                            'No description available.'
                                                        }
                                                    </p>


                                                    <div className="equipment-card-footer">

                                                        <strong>
                                                            {formatPrice(
                                                                item
                                                            )}
                                                        </strong>

                                                        <span>
                                                            View details →
                                                        </span>

                                                    </div>

                                                </div>

                                            </Link>
                                        );
                                    }
                                )}

                            </div>
                        )}

                </div>

            </section>

        </main>
    );
}

export default Browse;