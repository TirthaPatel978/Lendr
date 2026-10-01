const express = require('express');

const {
    createItem,
    getMyItems,
    getItemById,
    updateItem,
    deleteItem,
    searchItems
} = require('../controllers/itemController');

const protect =
    require('../middleware/authMiddleware');

const upload =
    require('../middleware/uploadMiddleware');

const {
    validateObjectId
} = require('../middleware/validationMiddleware');

const router = express.Router();


// ============================================
// SEARCH / BROWSE
// ============================================

router.get(
    '/',
    searchItems
);


// ============================================
// MY ITEMS
// ============================================

router.get(
    '/my-items',
    protect,
    getMyItems
);


// ============================================
// CREATE ITEM
// ============================================

router.post(
    '/',
    protect,
    upload.array('photos', 5),
    createItem
);


// ============================================
// SINGLE ITEM
// ============================================

router.get(
    '/:id',
    validateObjectId('id'),
    getItemById
);


// ============================================
// UPDATE ITEM
// ============================================

router.put(
    '/:id',
    protect,
    validateObjectId('id'),
    updateItem
);


// ============================================
// DELETE ITEM
// ============================================

router.delete(
    '/:id',
    protect,
    validateObjectId('id'),
    deleteItem
);


module.exports = router;