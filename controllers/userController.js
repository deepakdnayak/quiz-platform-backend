const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Quiz = require('../models/Quiz')

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const profile = await Profile.findOne({ userId: req.user.id });

  res.status(200).json({
    user: { id: user._id, email: user.email, role: user.role },
    profile: profile || null
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, yearOfStudy, department, rollNumber } = req.body;

  // Validate input (basic)
  if (!firstName || !lastName || !yearOfStudy || !department || !rollNumber) {
    return next(new ErrorResponse('Please provide all profile fields', 400));
  }

  // Update or create profile
  let profile = await Profile.findOne({ userId: req.user.id });
  if (profile) {
    profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { firstName, lastName, yearOfStudy, department, rollNumber },
      { new: true, runValidators: true }
    );
  } else {
    profile = await Profile.create({
      userId: req.user.id,
      firstName,
      lastName,
      yearOfStudy,
      department,
      rollNumber
    });
  }

  res.status(200).json({ profile });
});


exports.userCount = asyncHandler(async (req, res, next) => {
  // Count total quizzes
  const totalQuizzes = await Quiz.countDocuments();

  // Count total students (role: 'Student')
  const totalStudents = await User.countDocuments({ role: 'Student' });

  // Count total instructors (role: 'Instructor')
  const totalInstructors = await User.countDocuments({ role: 'Instructor' });

  // return NextResponse.json({
  //   totalQuizzes,
  //   totalStudents,
  //   totalInstructors,
  // });

  res.status(200).json({stats:{ totalQuizzes, totalStudents, totalInstructors} });
});