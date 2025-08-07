const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { email, password, role } = req.body;

  // Validate input
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }
  if (role && !['Student', 'Instructor'].includes(role)) {
    return next(new ErrorResponse('Invalid role', 400));
  }

  // Check for existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already exists', 400));
  }

  // Create user
  const user = await User.create({
    email,
    password,
    role: role || 'Student',
    isApproved: role === 'Instructor' ? false : null,
  });

  // Create dummy profile with default values
  const profile = await Profile.create({
    userId: user._id,
    firstName: 'FirstName', // Placeholder default
    lastName: 'LastName', // Placeholder default
    yearOfStudy: role === 'Student' ? '1' : null, // Default to '1' for students, null for instructors
    department: 'General', // Default department
    rollNumber: '4CB...' | null, // Generate a roll number for students
  });

  // Update user with profile reference
  await User.findByIdAndUpdate(user._id, { profile: profile._id }, { new: true });

  // Send response
  res.status(201).json({
    userId: user._id,
    email: user.email,
    role: user.role,
    profile: {
      profileId: profile._id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      yearOfStudy: profile.yearOfStudy,
      department: profile.department,
      rollNumber: profile.rollNumber,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Check user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Create JWT
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  res.status(200).json({
    token,
    user: { id: user._id, email: user.email, role: user.role }
  });
});