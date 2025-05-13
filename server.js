const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const cors = require('cors');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Configure CORS to allow requests from http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // If your API uses cookies or auth headers
}));

// Body parser
app.use(express.json());

// Dev logging middleware (use in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/students', require('./routes/students'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});