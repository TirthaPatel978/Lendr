require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const itemRoutes = require('./src/routes/itemRoutes');
const borrowingRoutes = require('./src/routes/borrowingRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const checkBorrowingDeadlines = require('./src/utils/borrowingReminder');
const reviewRoutes = require('./src/routes/reviewRoutes');
const disputeRoutes = require('./src/routes/disputeRoutes');
const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
//Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
// Test route
app.get('/', (req, res) => {
    res.json({
        message: 'Lendr API is running'
    });
});

// Start server
const startServer = async () => {
    await connectDB();

    checkBorrowingDeadlines();

    app.listen(PORT, () => {
        console.log(`Lendr server running on http://localhost:${PORT}`);
    });
};

startServer();