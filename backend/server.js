require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const itemRoutes = require('./src/routes/itemRoutes');
const borrowingRoutes = require('./src/routes/borrowingRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const disputeRoutes = require('./src/routes/disputeRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const checkBorrowingDeadlines = require('./src/utils/borrowingReminder');
const {
    notFound,
    errorHandler
} = require('./src/middleware/errorMiddleware');
const app = express();

const PORT = process.env.PORT || 5000;
// =========================
// Security Middleware
// =========================
app.use(cors());
app.use(helmet());
app.use(express.json({
    limit: '1mb'
}));
// =========================
// Rate Limiting
// =========================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        message: 'Too many requests. Please try again later.'
    }
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        message: 'Too many authentication attempts. Please try again later.'
    }
});
app.use('/api', apiLimiter);
// =========================
// Routes
// =========================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
// =========================
// Root Route
// =========================
app.get('/', (req, res) => {
    res.json({
        message: 'Lendr API is running'
    });
});
// =========================
// Error Handling
// =========================
app.use(notFound);
app.use(errorHandler);
// =========================
// Start Server
// =========================
const startServer = async () => {
    try {
        await connectDB();
        checkBorrowingDeadlines();
        app.listen(PORT, () => {
            console.log(
                `Lendr server running on http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            'Failed to start server:',
            error.message
        );
        process.exit(1);
    }
};

startServer();