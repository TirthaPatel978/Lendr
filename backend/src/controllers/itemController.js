const Item = require('../models/Item');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
// Create a new item
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
            latitude,
            longitude
        } = req.body;

        // Required fields
        if (
            !name ||
            !category ||
            !description ||
            !condition ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                message:
                    'Name, category, description, condition, latitude and longitude are required'
            });
        }

        // Convert coordinates to numbers
        const lat = Number(latitude);
        const lng = Number(longitude);

        // Validate coordinates
        if (
            Number.isNaN(lat) ||
            Number.isNaN(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            return res.status(400).json({
                message: 'Latitude or longitude is invalid'
            });
        }

        // Validate rental type
        if (
            rentalType &&
            !['FREE', 'PAID'].includes(rentalType)
        ) {
            return res.status(400).json({
                message: 'Rental type must be FREE or PAID'
            });
        }

        // Paid items must have a rental price
        if (
            rentalType === 'PAID' &&
            (!rentalPricePerDay ||
                Number(rentalPricePerDay) <= 0)
        ) {
            return res.status(400).json({
                message:
                    'Paid items must have a rental price greater than 0'
            });
        }

        // Upload photos to Cloudinary
        let photoUrls = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToCloudinary(
                    file.buffer,
                    'lendr/items'
                );

                photoUrls.push(result.secure_url);
            }
        }

        // Create item
        const item = await Item.create({
            owner: req.user,

            name,
            category,
            description,
            condition,

            rentalType: rentalType || 'FREE',

            originalValue:
                Number(originalValue) || 0,

            rentalPricePerDay:
                rentalType === 'PAID'
                    ? Number(rentalPricePerDay)
                    : 0,

            availability: true,

            location: {
                type: 'Point',
                coordinates: [lng, lat]
            },

            photos: photoUrls
        });

        res.status(201).json({
            message: 'Item listed successfully',
            item
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to create item',
            error: error.message
        });
    }
};


// Get all items belonging to current user
const getMyItems = async (req, res) => {
    try {
        const items = await Item.find({
            owner: req.user
        }).sort({ createdAt: -1 });

        res.json({
            count: items.length,
            items
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch your items',
            error: error.message
        });
    }
};


// Get a single item
const getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('owner', 'name email rating reliabilityScore');

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        res.json({
            item
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch item',
            error: error.message
        });
    }
};


// Update an item
const updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        // Only the owner can update the item
        if (item.owner.toString() !== req.user) {
            return res.status(403).json({
                message: 'You are not allowed to update this item'
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
            location
        } = req.body;

        if (name !== undefined) item.name = name;
        if (category !== undefined) item.category = category;
        if (description !== undefined) item.description = description;
        if (condition !== undefined) item.condition = condition;
        if (originalValue !== undefined) {
            item.originalValue = originalValue;
        }
        if (availability !== undefined) {
            item.availability = availability;
        }
        if (location !== undefined) {
            item.location = location;
        }

        if (rentalType !== undefined) {
            if (!['FREE', 'PAID'].includes(rentalType)) {
                return res.status(400).json({
                    message: 'Rental type must be FREE or PAID'
                });
            }

            item.rentalType = rentalType;

            if (rentalType === 'FREE') {
                item.rentalPricePerDay = 0;
            } else {
                if (
                    rentalPricePerDay === undefined ||
                    rentalPricePerDay <= 0
                ) {
                    return res.status(400).json({
                        message: 'Paid items must have a rental price greater than 0'
                    });
                }

                item.rentalPricePerDay = rentalPricePerDay;
            }
        } else if (rentalPricePerDay !== undefined) {
            if (
                item.rentalType === 'PAID' &&
                rentalPricePerDay <= 0
            ) {
                return res.status(400).json({
                    message: 'Rental price must be greater than 0'
                });
            }

            item.rentalPricePerDay =
                item.rentalType === 'PAID'
                    ? rentalPricePerDay
                    : 0;
        }

        await item.save();

        res.json({
            message: 'Item updated successfully',
            item
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update item',
            error: error.message
        });
    }
};


// Delete an item
const deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        // Only the owner can delete the item
        if (item.owner.toString() !== req.user) {
            return res.status(403).json({
                message: 'You are not allowed to delete this item'
            });
        }

        await item.deleteOne();

        res.json({
            message: 'Item deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete item',
            error: error.message
        });
    }
};

const searchItems = async (req, res) => {
    try {
        const {
            search,
            category,
            rentalType,
            condition,
            minPrice,
            maxPrice,
            latitude,
            longitude,
            radius
        } = req.query;

        const query = {
            availability: true
        };

        // Search by name, category or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Free / Paid filter
        if (rentalType) {
            query.rentalType = rentalType;
        }

        // Condition filter
        if (condition) {
            query.condition = condition;
        }

        // Price filters
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.rentalPricePerDay = {};

            if (minPrice !== undefined) {
                query.rentalPricePerDay.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                query.rentalPricePerDay.$lte = Number(maxPrice);
            }
        }

        // Nearby search
        if (latitude !== undefined && longitude !== undefined) {
            const lat = Number(latitude);
            const lng = Number(longitude);
            const radiusKm = Number(radius) || 5;

            if (
                Number.isNaN(lat) ||
                Number.isNaN(lng) ||
                Number.isNaN(radiusKm)
            ) {
                return res.status(400).json({
                    message: 'Latitude, longitude and radius must be valid numbers'
                });
            }

            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return res.status(400).json({
                    message: 'Invalid latitude or longitude'
                });
            }

            if (radiusKm <= 0) {
                return res.status(400).json({
                    message: 'Radius must be greater than 0'
                });
            }

            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: radiusKm * 1000
                }
            };
        }

        const items = await Item.find(query)
            .populate('owner', 'name rating reliabilityScore')
            .sort({ createdAt: -1 });

        res.json({
            count: items.length,
            items
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to search items',
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