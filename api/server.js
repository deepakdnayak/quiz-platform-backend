const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const cors = require('cors');

// Load environment variables
dotenv.config({ path: './config.env' });

// Connect to MongoDB
connectDB();

// Initialize Express app  https://computerscienceanddesign.vercel.app
const app = express();

// Configure CORS to allow requests from http://localhost:3000
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://computerscienceanddesign.vercel.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // If your API uses cookies or auth headers
}));
app.options('*', cors());


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


// const Profile = require('./models/Profile');
// const User = require('./models/User');



// async function updateUsersWithProfile() {
//   try {
//     // await mongoose.connect('mongodb://localhost:27017/your_database', {
//     //   useNewUrlParser: true,
//     //   useUnifiedTopology: true,
//     // });

//     const profiles = await Profile.find();
//     for (const profile of profiles) {
//       await User.findByIdAndUpdate(profile.userId, { profile: profile._id });
//     }
//     console.log('Users updated with profile IDs');
//     // mongoose.disconnect();
//   } catch (err) {
//     console.error('Error updating users:', err);
//   }
// }

// updateUsersWithProfile()