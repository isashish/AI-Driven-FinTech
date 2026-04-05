const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const profileRoutes     = require('./routes/profile');
const goalsRoutes       = require('./routes/goals');
const loansRoutes       = require('./routes/loans');
const chatRoutes        = require('./routes/chat');
const predictionsRoutes = require('./routes/predictions');

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Database connection failed.' });
  }
});
// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/goals',       goalsRoutes);
app.use('/api/loans',       loansRoutes);
app.use('/api/chat',        chatRoutes);
app.use('/api/predictions', predictionsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  isConnected = true;
};



if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
}

module.exports = app;