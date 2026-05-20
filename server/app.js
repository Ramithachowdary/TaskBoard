require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const passport = require('passport');

require('./src/config/passport');

const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const { initConnectionKeeper, connectionKeeperMiddleware } = require('./src/utils/connectionKeeper');

const app = express();

initConnectionKeeper();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(connectionKeeperMiddleware);
app.use(express.json());
app.use(passport.initialize());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);
module.exports = app;