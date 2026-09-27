const errorHandler = (err, req, res, next) => {
    console.error(err);

    let statusCode = res.statusCode !== 200
        ? res.statusCode
        : 500;

    let message = err.message || 'Internal server error';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((error) => error.message)
            .join(', ');
    }

    // Invalid MongoDB ObjectId
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid resource ID';
    }

    // Duplicate MongoDB key
    if (err.code === 11000) {
        statusCode = 400;
        message = 'A record with this value already exists';
    }

    // Multer errors
    if (err.name === 'MulterError') {
        statusCode = 400;
        message = err.message;
    }

    res.status(statusCode).json({
        message
    });
};

const notFound = (req, res, next) => {
    const error = new Error(
        `Route not found: ${req.originalUrl}`
    );

    res.status(404);

    next(error);
};

module.exports = {
    errorHandler,
    notFound
};