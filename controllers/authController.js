const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


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

// @desc    Send OTP for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.sendResetOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse('No user found with this email', 404));
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  user.resetOTP = otp;
  user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiration
  await user.save();

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'Password Reset OTP - Act Now!',
  html: `
    <div style="background-color: #ecf0f1; padding: 20px; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #3182ce; color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Card Header -->
        <div style="background-color: #3498db; padding: 15px; text-align: center; border-bottom: 2px solid #2980b9;">
          <h2 style="margin: 0; font-size: 24px; color: #ffffff;">Password Reset Request</h2>
        </div>

        <!-- Card Content -->
        <div style="padding: 20px; color: black; background-color: white">
          <p style="font-size: 16px;">Hello ${email.split('@')[0]}!</p>
          <p style="font-size: 16px;">We’ve received a request to reset your password for your Quiz Platform account.</p>

          <!-- OTP Section -->
          <div style="background-color: #3498db; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
            <h3 style="margin: 0; font-size: 20px; color: #ffffff; font-weight: bold;">Your OTP: ${otp}</h3>
          </div>

          <!-- Instructions Section -->
          <div style="color: black, padding: 10px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0; font-size: 14px;">Please follow these steps to reset your password:</p>
            <ol style="margin: 0; padding-left: 20px;">
              <li style="margin: 5px 0;">Enter the OTP on the password reset page.</li>
              <li style="margin: 5px 0;">Create your new password.</li>
              <li style="margin: 5px 0;">Log in with your new credentials!</li>
            </ol>
          </div>

          <!-- Urgency Section -->
          <div style="background-color: #e74c3c; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #ffffff;"><strong>⏳ This OTP expires in 10 minutes!</strong> Act now to secure your account.</p>
          </div>

          <!-- Disclaimer Section -->
          <p style="font-size: 12px; color: #bdc3c7;">If you didn’t request this, please ignore this email or contact <a href="mailto:support@quizplatform.com" style="color: #3498db; text-decoration: none;">support@quizplatform.com</a>.</p>
        </div>

        <!-- Card Footer -->
        <div style="background-color: #3498db; padding: 10px; text-align: center; border-top: 2px solid #2980b9;">
          <p style="margin: 0; font-size: 14px; color: #ffffff;">Happy learning!<br>The Quiz Platform Team</p>
        </div>
      </div>
    </div>
  `,
};

  await transporter.sendMail(mailOptions);

  res.status(200).json({ success: true, message: 'OTP sent to email' });
});

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyResetOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    resetOTP: otp,
    resetOTPExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }

  // OTP is valid; clear it
  user.resetOTP = null;
  user.resetOTPExpires = null;
  await user.save();

  res.status(200).json({ success: true, message: 'OTP verified' });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse('No user found with this email', 404));
  }

  user.password = newPassword; // Will be hashed in pre-save hook
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successful' });
});