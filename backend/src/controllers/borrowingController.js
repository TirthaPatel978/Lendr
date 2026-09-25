const Borrowing = require('../models/Borrowing');
const Item = require('../models/Item');
const createNotification = require('../utils/createNotification');
const getRentalPricePreview = async (req, res) => {
    try {
        const { itemId, startDate, endDate } = req.query;

        if (!itemId || !startDate || !endDate) {
            return res.status(400).json({
                message: 'Item, start date and end date are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({
                message: 'Invalid start or end date'
            });
        }

        if (start >= end) {
            return res.status(400).json({
                message: 'End date must be after start date'
            });
        }

        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        if (!item.availability) {
            return res.status(400).json({
                message: 'This item is currently unavailable'
            });
        }

        const millisecondsPerDay = 1000 * 60 * 60 * 24;

        const numberOfDays = Math.ceil(
            (end - start) / millisecondsPerDay
        );

        const rentalPricePerDay =
            item.rentalType === 'PAID'
                ? item.rentalPricePerDay
                : 0;

        const totalAmount =
            rentalPricePerDay * numberOfDays;

        res.json({
            item: {
                id: item._id,
                name: item.name,
                rentalType: item.rentalType
            },
            startDate: start,
            endDate: end,
            numberOfDays,
            rentalPricePerDay,
            totalAmount
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to calculate rental price',
            error: error.message
        });
    }
};

const createBorrowingRequest = async (req, res) => {
    try {
        const { itemId, startDate, endDate } = req.body;

        if (!itemId || !startDate || !endDate) {
            return res.status(400).json({
                message: 'Item, start date and end date are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({
                message: 'Invalid start or end date'
            });
        }

        if (start >= end) {
            return res.status(400).json({
                message: 'End date must be after start date'
            });
        }

        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: 'Item not found'
            });
        }

        if (!item.availability) {
            return res.status(400).json({
                message: 'This item is currently unavailable'
            });
        }

        if (item.owner.toString() === req.user) {
            return res.status(400).json({
                message: 'You cannot borrow your own item'
            });
        }

        // Check for overlapping active/approved borrowing
        const overlappingBorrowing = await Borrowing.findOne({
            item: itemId,
            status: { $in: ['APPROVED', 'ACTIVE'] },
            startDate: { $lt: end },
            endDate: { $gt: start }
        });

        if (overlappingBorrowing) {
            return res.status(400).json({
                message: 'Item is already booked for the selected dates'
            });
        }

        const millisecondsPerDay = 1000 * 60 * 60 * 24;

        const numberOfDays = Math.ceil(
            (end - start) / millisecondsPerDay
        );

        const rentalPricePerDay =
            item.rentalType === 'PAID'
                ? item.rentalPricePerDay
                : 0;

        const totalAmount =
            rentalPricePerDay * numberOfDays;

        const paymentStatus =
            item.rentalType === 'PAID'
                ? 'PENDING'
                : 'NOT_REQUIRED';

        const borrowing = await Borrowing.create({
            item: item._id,
            borrower: req.user,
            lender: item.owner,
            startDate: start,
            endDate: end,
            rentalPricePerDay,
            totalAmount,
            paymentStatus,
            status: 'REQUESTED'
        });
        await createNotification({
            recipient: item.owner,
            sender: req.user,
            type: 'BORROW_REQUEST',
            message: `You received a new borrow request for ${item.name}.`,
            borrowing: borrowing._id
        });
        res.status(201).json({
            message: 'Borrow request sent successfully',
            borrowing
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to create borrow request',
            error: error.message
        });
    }
};


const getMyBorrowRequests = async (req, res) => {
    try {
        const requests = await Borrowing.find({
            borrower: req.user
        })
            .populate('item', 'name category rentalType rentalPricePerDay')
            .populate('lender', 'name rating reliabilityScore')
            .sort({ createdAt: -1 });

        res.json({
            count: requests.length,
            requests
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch borrow requests',
            error: error.message
        });
    }
};


const getLenderRequests = async (req, res) => {
    try {
        const requests = await Borrowing.find({
            lender: req.user
        })
            .populate('item', 'name category rentalType rentalPricePerDay')
            .populate('borrower', 'name rating reliabilityScore')
            .sort({ createdAt: -1 });

        res.json({
            count: requests.length,
            requests
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch lender requests',
            error: error.message
        });
    }
};


const approveBorrowing = async (req, res) => {
    try {
        const borrowing = await Borrowing.findById(req.params.id);

        if (!borrowing) {
            return res.status(404).json({
                message: 'Borrow request not found'
            });
        }

        if (borrowing.lender.toString() !== req.user) {
            return res.status(403).json({
                message: 'You are not allowed to approve this request'
            });
        }

        if (borrowing.status !== 'REQUESTED') {
            return res.status(400).json({
                message: 'Only requested borrowings can be approved'
            });
        }

        borrowing.status = 'APPROVED';

        await borrowing.save();
        await createNotification({
            recipient: borrowing.borrower,
            sender: req.user,
            type: 'REQUEST_APPROVED',
            message: 'Your borrow request has been approved.',
            borrowing: borrowing._id
        });
        res.json({
            message: 'Borrow request approved',
            borrowing
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to approve borrow request',
            error: error.message
        });
    }
};


const rejectBorrowing = async (req, res) => {
    try {
        const borrowing = await Borrowing.findById(req.params.id);

        if (!borrowing) {
            return res.status(404).json({
                message: 'Borrow request not found'
            });
        }

        if (borrowing.lender.toString() !== req.user) {
            return res.status(403).json({
                message: 'You are not allowed to reject this request'
            });
        }

        if (borrowing.status !== 'REQUESTED') {
            return res.status(400).json({
                message: 'Only requested borrowings can be rejected'
            });
        }

        borrowing.status = 'REJECTED';

        await borrowing.save();
        await createNotification({
            recipient: borrowing.borrower,
            sender: req.user,
            type: 'REQUEST_REJECTED',
            message: 'Your borrow request has been rejected.',
            borrowing: borrowing._id
        });
        res.json({
            message: 'Borrow request rejected',
            borrowing
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to reject borrow request',
            error: error.message
        });
    }
};


const makePayment = async (req, res) => {
    try {
        const borrowing = await Borrowing.findById(req.params.id);

        if (!borrowing) {
            return res.status(404).json({
                message: 'Borrowing not found'
            });
        }

        if (borrowing.borrower.toString() !== req.user) {
            return res.status(403).json({
                message: 'You are not allowed to make this payment'
            });
        }

        if (borrowing.status !== 'APPROVED') {
            return res.status(400).json({
                message: 'Payment can only be made for an approved borrowing'
            });
        }

        if (borrowing.paymentStatus === 'PAID') {
            return res.status(400).json({
                message: 'Payment has already been completed'
            });
        }

        if (borrowing.totalAmount === 0) {
            borrowing.paymentStatus = 'NOT_REQUIRED';
        } else {
            // Simulated payment for the project
            borrowing.paymentStatus = 'PAID';
        }

        borrowing.status = 'ACTIVE';

        await borrowing.save();
        if (borrowing.totalAmount > 0) {
            await createNotification({
                recipient: borrowing.lender,
                sender: req.user,
                type: 'PAYMENT_COMPLETED',
                message: `Payment of ₹${borrowing.totalAmount} has been completed.`,
                borrowing: borrowing._id
            });
        }
        res.json({
            message: borrowing.totalAmount > 0
                ? 'Payment successful (simulated)'
                : 'Borrowing activated successfully',
            borrowing
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to process payment',
            error: error.message
        });
    }
};


const returnItem = async (req, res) => {
    try {
        const borrowing = await Borrowing.findById(req.params.id);

        if (!borrowing) {
            return res.status(404).json({
                message: 'Borrowing not found'
            });
        }

        if (
            borrowing.borrower.toString() !== req.user &&
            borrowing.lender.toString() !== req.user
        ) {
            return res.status(403).json({
                message: 'You are not allowed to return this item'
            });
        }

        if (
            borrowing.status !== 'ACTIVE' &&
            borrowing.status !== 'OVERDUE'
        ) {
            return res.status(400).json({
                message: 'Only active or overdue borrowings can be returned'
            });
        }
        borrowing.status = 'RETURNED';
        borrowing.returnedAt = new Date();

        await borrowing.save();
        await createNotification({
            recipient: borrowing.lender,
            sender: req.user,
            type: 'ITEM_RETURNED',
            message: 'The borrowed item has been marked as returned.',
            borrowing: borrowing._id
        });
        res.json({
            message: 'Item marked as returned',
            borrowing
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to return item',
            error: error.message
        });
    }
};


const completeBorrowing = async (req, res) => {
    try {
        const borrowing = await Borrowing.findById(req.params.id);

        if (!borrowing) {
            return res.status(404).json({
                message: 'Borrowing not found'
            });
        }

        if (borrowing.lender.toString() !== req.user) {
            return res.status(403).json({
                message: 'Only the lender can complete the borrowing'
            });
        }

        if (borrowing.status !== 'RETURNED') {
            return res.status(400).json({
                message: 'Only returned borrowings can be completed'
            });
        }

        borrowing.status = 'COMPLETED';

        await borrowing.save();
        await createNotification({
            recipient: borrowing.borrower,
            sender: req.user,
            type: 'BORROWING_COMPLETED',
            message: 'Your borrowing has been completed successfully.',
            borrowing: borrowing._id
        });
        res.json({
            message: 'Borrowing completed successfully',
            borrowing
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to complete borrowing',
            error: error.message
        });
    }
};


module.exports = {
    getRentalPricePreview,
    createBorrowingRequest,
    getMyBorrowRequests,
    getLenderRequests,
    approveBorrowing,
    rejectBorrowing,
    makePayment,
    returnItem,
    completeBorrowing
};