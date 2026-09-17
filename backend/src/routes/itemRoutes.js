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

const router = express.Router();

router.post('/', protect, createItem);

router.get('/my-items', protect, getMyItems);

router.get('/', searchItems);

router.get('/:id', getItemById);

router.put('/:id', protect, updateItem);

router.delete('/:id', protect, deleteItem);

module.exports = router;