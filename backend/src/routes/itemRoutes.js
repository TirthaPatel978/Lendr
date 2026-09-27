const express = require('express');

const {
    createItem,
    getMyItems,
    getItemById,
    updateItem,
    deleteItem,
    searchItems
} = require('../controllers/itemController');

const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
    validateObjectId,
    validateCoordinates
} = require('../middleware/validationMiddleware');

const router = express.Router();


// Search items
router.get('/', searchItems);


// Get user's own items
router.get('/my-items', protect, getMyItems);


// Get item by ID
router.get(
    '/:id',
    validateObjectId('id'),
    getItemById
);


// Create item
router.post(
    '/',
    protect,
    upload.array('photos', 5),
    validateCoordinates,
    createItem
);


// Update item
router.put(
    '/:id',
    protect,
    validateObjectId('id'),
    updateItem
);


// Delete item
router.delete(
    '/:id',
    protect,
    validateObjectId('id'),
    deleteItem
);

module.exports = router;