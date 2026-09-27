const mongoose = require('mongoose');

const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: `Invalid ${paramName}`
            });
        }

        next();
    };
};

const validateCoordinates = (req, res, next) => {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        return res.status(400).json({
            message: 'Valid latitude and longitude are required'
        });
    }

    if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
            message: 'Latitude must be between -90 and 90'
        });
    }

    if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
            message: 'Longitude must be between -180 and 180'
        });
    }

    next();
};

const validateBorrowingDates = (req, res, next) => {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({
            message: 'Start date and end date are required'
        });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return res.status(400).json({
            message: 'Invalid start date or end date'
        });
    }

    if (end <= start) {
        return res.status(400).json({
            message: 'End date must be after start date'
        });
    }

    next();
};

module.exports = {
    validateObjectId,
    validateCoordinates,
    validateBorrowingDates
};