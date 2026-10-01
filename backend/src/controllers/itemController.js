const Item = require('../models/Item');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

const buildLocation = (location, latitude, longitude) => {
    if (
        latitude !== undefined &&
        longitude !== undefined
    ) {
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (
            Number.isNaN(lat) ||
            Number.isNaN(lng)
        ) {
            return null;
        }

        if (
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            return null;
        }

        return {
            type: 'Point',
            coordinates: [lng, lat]
        };
    }

    if (location !== undefined) {
        let parsedLocation = location;

        if (typeof location === 'string') {
            try {
                parsedLocation = JSON.parse(location);
            } catch (error) {
                return null;
            }
        }

        if (
            parsedLocation &&
            parsedLocation.type === 'Point' &&
            Array.isArray(parsedLocation.coordinates) &&
            parsedLocation.coordinates.length === 2
        ) {
            const lng = Number(
                parsedLocation.coordinates[0]
            );

            const lat = Number(
                parsedLocation.coordinates[1]
            );

            if (
                Number.isNaN(lat) ||
                Number.isNaN(lng) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
            ) {
                return null;
            }

            return {
                type: 'Point',
                coordinates: [lng, lat]
            };
        }
    }

    return null;
};


// ---------------------------------------------
// CREATE ITEM
// ---------------------------------------------

const createItem = async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            condition,
            rentalType,
            originalValue,
            rentalPricePerDay,
            location,
            latitude,
            longitude
        } = req.body;

        if (
            !name ||
            !category ||
            !description ||
            !condition
        ) {
            return res.status(400).json({
                message:
                    'Name, category, description and condition are required'
            });
        }

        if (
            rentalType &&
            !['FREE', 'PAID'].includes(rentalType)
        ) {
            return res.status(400).json({
                message:
                    'Rental type must be FREE or PAID'
            });
        }

        if (
            rentalType === 'PAID' &&
            (
                rentalPricePerDay === undefined ||
                Number(rentalPricePerDay) <= 0
            )
        ) {
            return res.status(400).json({
                message:
                    'Paid items must have a rental price greater than 0'
            });
        }

        const itemLocation = buildLocation(
            location,
            latitude,
            longitude
        );

        if (!itemLocation) {
            return res.status(400).json({
                message:
                    'A valid location is required. Provide latitude and longitude or a valid GeoJSON location.'
            });
        }

        let photoUrls = [];

        if (
            req.files &&
            req.files.length > 0
        ) {
            for (const file of req.files) {
                const result =
                    await uploadToCloudinary(
                        file.buffer,
                        'lendr/items'
                    );

                photoUrls.push(
                    result.secure_url
                );
            }
        }

        const item = await Item.create({
            owner: req.user,

            name: name.trim(),

            category: category.trim(),

            description: description.trim(),

            condition,

            rentalType:
                rentalType || 'FREE',

            originalValue:
                Number(originalValue) || 0,

            rentalPricePerDay:
                rentalType === 'PAID'
                    ? Number(rentalPricePerDay)
                    : 0,

            availability: true,

            location: itemLocation,

            photos: photoUrls
        });

        res.status(201).json({
            message:
                'Item listed successfully',

            item
        });

    } catch (error) {
        console.error(
            'Create item error:',
            error
        );

        res.status(500).json({
            message:
                'Failed to create item',

            error: error.message
        });
    }
};


// ---------------------------------------------
// GET MY ITEMS
// ---------------------------------------------

const getMyItems = async (req, res) => {
    try {
        const items = await Item.find({
            owner: req.user
        }).sort({
            createdAt: -1
        });

        res.json({
            count: items.length,
            items
        });

    } catch (error) {
        res.status(500).json({
            message:
                'Failed to fetch your items',

            error: error.message
        });
    }
};


// ---------------------------------------------
// GET SINGLE ITEM
// ---------------------------------------------

const getItemById = async (req, res) => {
    try {
        const item =
            await Item.findById(req.params.id)
                .populate(
                    'owner',
                    'name email avatar rating reliabilityScore'
                );

        if (!item) {
            return res.status(404).json({
                message:
                    'Item not found'
            });
        }

        res.json({
            item
        });

    } catch (error) {
        res.status(500).json({
            message:
                'Failed to fetch item',

            error: error.message
        });
    }
};


// ---------------------------------------------
// UPDATE ITEM
// ---------------------------------------------

const updateItem = async (req, res) => {
    try {
        const item =
            await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message:
                    'Item not found'
            });
        }

        // Owner-only protection
        if (
            item.owner.toString() !==
            req.user.toString()
        ) {
            return res.status(403).json({
                message:
                    'You are not allowed to update this item'
            });
        }

        const {
            name,
            category,
            description,
            condition,
            rentalType,
            originalValue,
            rentalPricePerDay,
            availability,
            location,
            latitude,
            longitude
        } = req.body;

        if (
            name !== undefined
        ) {
            item.name =
                name.trim();
        }

        if (
            category !== undefined
        ) {
            item.category =
                category.trim();
        }

        if (
            description !== undefined
        ) {
            item.description =
                description.trim();
        }

        if (
            condition !== undefined
        ) {
            item.condition =
                condition;
        }

        if (
            originalValue !== undefined
        ) {
            item.originalValue =
                Number(originalValue) || 0;
        }

        if (
            availability !== undefined
        ) {
            item.availability =
                availability === true ||
                availability === 'true';
        }

        const locationWasProvided =
            location !== undefined ||
            latitude !== undefined ||
            longitude !== undefined;

        if (locationWasProvided) {
            const updatedLocation =
                buildLocation(
                    location,
                    latitude,
                    longitude
                );

            if (!updatedLocation) {
                return res.status(400).json({
                    message:
                        'A valid location is required'
                });
            }

            item.location =
                updatedLocation;
        }

        if (
            rentalType !== undefined
        ) {
            if (
                !['FREE', 'PAID']
                    .includes(rentalType)
            ) {
                return res.status(400).json({
                    message:
                        'Rental type must be FREE or PAID'
                });
            }

            item.rentalType =
                rentalType;

            if (
                rentalType === 'FREE'
            ) {
                item.rentalPricePerDay =
                    0;

            } else {
                if (
                    rentalPricePerDay ===
                        undefined ||
                    Number(
                        rentalPricePerDay
                    ) <= 0
                ) {
                    return res.status(400).json({
                        message:
                            'Paid items must have a rental price greater than 0'
                    });
                }

                item.rentalPricePerDay =
                    Number(
                        rentalPricePerDay
                    );
            }

        } else if (
            rentalPricePerDay !==
            undefined
        ) {
            if (
                item.rentalType ===
                    'PAID' &&
                Number(
                    rentalPricePerDay
                ) <= 0
            ) {
                return res.status(400).json({
                    message:
                        'Rental price must be greater than 0'
                });
            }

            item.rentalPricePerDay =
                item.rentalType ===
                    'PAID'
                    ? Number(
                        rentalPricePerDay
                    )
                    : 0;
        }

        await item.save();

        res.json({
            message:
                'Item updated successfully',

            item
        });

    } catch (error) {
        console.error(
            'Update item error:',
            error
        );

        res.status(500).json({
            message:
                'Failed to update item',

            error: error.message
        });
    }
};


// ---------------------------------------------
// DELETE ITEM
// ---------------------------------------------

const deleteItem = async (req, res) => {
    try {
        const item =
            await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message:
                    'Item not found'
            });
        }

        if (
            item.owner.toString() !==
            req.user.toString()
        ) {
            return res.status(403).json({
                message:
                    'You are not allowed to delete this item'
            });
        }

        await item.deleteOne();

        res.json({
            message:
                'Item deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message:
                'Failed to delete item',

            error: error.message
        });
    }
};


// ---------------------------------------------
// SEARCH ITEMS / BROWSE
// ---------------------------------------------

const searchItems = async (req, res) => {
    try {
        const {
            search,
            category,
            rentalType,
            condition,
            minPrice,
            maxPrice,

            // New names
            latitude,
            longitude,

            // Existing frontend names
            lat,
            lng,

            radius
        } = req.query;

        /*
         * Normal Browse should only show active,
         * available listings.
         *
         * The $or also allows older backend-test
         * records which were created before the
         * availability field existed.
         */
        const query = {
            moderationStatus: {
                $ne: 'REMOVED'
            },

            $or: [
                {
                    availability: true
                },
                {
                    availability: {
                        $exists: false
                    }
                }
            ]
        };

        // Search text
        if (search) {
            query.$and = [
                {
                    $or: [
                        {
                            name: {
                                $regex: search,
                                $options: 'i'
                            }
                        },
                        {
                            category: {
                                $regex: search,
                                $options: 'i'
                            }
                        },
                        {
                            description: {
                                $regex: search,
                                $options: 'i'
                            }
                        }
                    ]
                }
            ];
        }

        if (category) {
            query.category =
                category;
        }

        if (rentalType) {
            query.rentalType =
                rentalType;
        }

        if (condition) {
            query.condition =
                condition;
        }

        if (
            minPrice !== undefined ||
            maxPrice !== undefined
        ) {
            query.rentalPricePerDay =
                {};

            if (
                minPrice !== undefined
            ) {
                query.rentalPricePerDay.$gte =
                    Number(minPrice);
            }

            if (
                maxPrice !== undefined
            ) {
                query.rentalPricePerDay.$lte =
                    Number(maxPrice);
            }
        }

        /*
         * Accept both:
         * latitude / longitude
         *
         * and:
         * lat / lng
         */
        const latitudeValue =
            latitude !== undefined
                ? latitude
                : lat;

        const longitudeValue =
            longitude !== undefined
                ? longitude
                : lng;

        if (
            latitudeValue !==
                undefined &&
            longitudeValue !==
                undefined
        ) {
            const latitudeNumber =
                Number(latitudeValue);

            const longitudeNumber =
                Number(longitudeValue);

            const radiusKm =
                Number(radius) || 5;

            if (
                Number.isNaN(
                    latitudeNumber
                ) ||
                Number.isNaN(
                    longitudeNumber
                ) ||
                Number.isNaN(radiusKm)
            ) {
                return res.status(400).json({
                    message:
                        'Latitude, longitude and radius must be valid numbers'
                });
            }

            if (
                latitudeNumber < -90 ||
                latitudeNumber > 90 ||
                longitudeNumber < -180 ||
                longitudeNumber > 180
            ) {
                return res.status(400).json({
                    message:
                        'Invalid latitude or longitude'
                });
            }

            if (radiusKm <= 0) {
                return res.status(400).json({
                    message:
                        'Radius must be greater than 0'
                });
            }

            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [
                            longitudeNumber,
                            latitudeNumber
                        ]
                    },

                    $maxDistance:
                        radiusKm * 1000
                }
            };
        }

        const items =
            await Item.find(query)
                .populate(
                    'owner',
                    'name rating reliabilityScore avatar'
                )
                .sort({
                    createdAt: -1
                });

        res.json({
            count: items.length,
            items
        });

    } catch (error) {
        console.error(
            'Search items error:',
            error
        );

        res.status(500).json({
            message:
                'Failed to search items',

            error: error.message
        });
    }
};


module.exports = {
    createItem,
    getMyItems,
    getItemById,
    updateItem,
    deleteItem,
    searchItems
};