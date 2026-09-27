const mongoose = require('mongoose');
const Item = require('../models/Item');

const validateBorrowableItem = async (req, res, next) => {
    try {
        const { itemId } = req.body;

        if (!itemId) {
            return res.status(400).json({
                message: 'Item ID is required'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                message: 'Invalid item ID'
            });
        }

        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        if (item.moderationStatus === 'REMOVED') {
            return res.status(403).json({
                message: 'This item has been removed by an administrator'
            });
        }

        if (!item.availability) {
            return res.status(400).json({
                message: 'This item is currently unavailable'
            });
        }

        if (item.owner.toString() === req.user.toString()) {
            return res.status(400).json({
                message: 'You cannot borrow your own item'
            });
        }

        req.borrowableItem = item;

        next();

    } catch (error) {
        next(error);
    }
};

module.exports = validateBorrowableItem;