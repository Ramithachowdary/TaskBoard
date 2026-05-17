require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const passport = require('passport');

require('./src/config/passport');

const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;