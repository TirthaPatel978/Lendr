require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
//Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// Test route
app.get('/', (req, res) => {
    res.json({
        message: 'Lendr API is running'
    });
});

// Start server
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Lendr server running on http://localhost:${PORT}`);
    });
};

startServer();