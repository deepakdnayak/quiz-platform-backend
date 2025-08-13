const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const QuizStatistics = require('../models/QuizStatistics');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  let query = {};
  if (req.query.role) {
    query.role = req.query.role;
  }

  const users = await User.find(query).select('email role isApproved createdAt');

  res.status(200).json(users);
});

// @desc    Approve instructor
// @route   PUT /api/admin/users/:userId/approve
// @access  Private (Admin)
exports.approveInstructor = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { isApproved } = req.body;

  // Validate input
  if (typeof isApproved !== 'boolean') {
    return next(new ErrorResponse('Please provide isApproved as a boolean', 400));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  if (user.role !== 'Instructor') {
    return next(new ErrorResponse('User is not an instructor', 400));
  }

  // Update user
  user.isApproved = isApproved;
  await user.save();

  res.status(200).json({
    userId: user._id,
    email: user.email,
    role: user.role,
    isApproved: user.isApproved
  });
});

// @desc    Change user role
// @route   PUT /api/admin/users/:userId/role
// @access  Private (Admin)
exports.changeUserRole = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  // Validate input
  if (!['Student', 'Instructor', 'Admin'].includes(role)) {
    return next(new ErrorResponse('Invalid role', 400));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Update user
  user.role = role;
  user.isApproved = role === 'Instructor' ? false : null;
  await user.save();

  res.status(200).json({
    userId: user._id,
    email: user.email,
    role: user.role,
    isApproved: user.isApproved
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Delete user and related data
  await User.findByIdAndDelete(userId);
  await Profile.findOneAndDelete({ userId });
  await QuizAttempt.deleteMany({ userId });
  if (user.role === 'Instructor') {
    await Quiz.deleteMany({ instructorId: userId });
    await QuizStatistics.deleteMany({ quizId: { $in: await Quiz.find({ instructorId: userId }).distinct('_id') } });
  }

  res.status(200).json({ message: 'User deleted' });
});

// @desc    Get student progress
// @route   GET /api/admin/students/:userId/progress
// @access  Private (Admin)
exports.getStudentProgress = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Find user and profile
  const user = await User.findById(userId);
  if (!user || user.role !== 'Student') {
    return next(new ErrorResponse('Student not found', 404));
  }
  const profile = await Profile.findOne({ userId });
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }

  // Get attempts
  const attempts = await QuizAttempt.find({ userId, isScored: true })
    .populate('quizId', 'title')
    .select('quizId totalScore createdAt')
    .lean();

  // Calculate stats
  const totalQuizzesAttempted = attempts.length;
  const averageScore = totalQuizzesAttempted ? attempts.reduce((sum, a) => sum + a.totalScore, 0) / totalQuizzesAttempted : 0;

  res.status(200).json({
    student: {
      userId: user._id,
      email: user.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      yearOfStudy: profile.yearOfStudy
    },
    attempts: attempts.map(a => ({
      quizId: a.quizId._id,
      title: a.quizId.title,
      totalScore: a.totalScore,
      attemptDate: a.createdAt
    })),
    averageScore,
    totalQuizzesAttempted
  });
});


// @desc    Get platform statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin)
exports.getPlatformStatistics = asyncHandler(async (req, res, next) => {
  const now = new Date();

  // Get user counts
  const totalUsers = await User.countDocuments();
  const studentCount = await User.countDocuments({ role: 'Student' });
  const instructorCount = await User.countDocuments({ role: 'Instructor' });
  const adminCount = await User.countDocuments({ role: 'Admin' });

  // Get total quizzes
  const totalQuizzes = await Quiz.countDocuments();

  // Get active quizzes
  const activeQuizzes = await Quiz.countDocuments({
    startTime: { $lte: now },
    endTime: { $gte: now }
  });

  // Get total completions (scored attempts)
  const totalCompletions = await QuizAttempt.countDocuments({ isScored: true });

  // Get stats from QuizStatistics for average score
  const stats = await QuizStatistics.find();
  const averageScore = stats.length ? stats.reduce((sum, s) => sum + s.averageScore, 0) / stats.length : 0;

  // Get instructor details
  const instructorDetails = await User.find({ role: 'Instructor' }).select('_id email isApproved').lean();

  // Get student details with yearOfStudy from Profile
  const studentDetails = await User.aggregate([
    { $match: { role: 'Student' } },
    {
      $lookup: {
        from: 'profiles',
        localField: '_id',
        foreignField: 'userId',
        as: 'profile'
      }
    },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        id: '$_id',
        email: 1,
        yearOfStudy: '$profile.yearOfStudy',
        _id: 0
      }
    }
  ]);

  res.status(200).json({
    totalUsers,
    studentCount,
    instructorCount,
    adminCount,
    totalQuizzes,
    totalCompletions,
    instructorDetails: instructorDetails.map((instructor) => ({
      id: instructor._id.toString(),
      email: instructor.email,
      status: instructor.isApproved ? 'approved' : 'Not approved' // Default to 'approved' if not set
    })),
    studentDetails,
    activeQuizzes,
    averageScore
  });
});


// @desc    Get pending instructor approval requests
// @route   GET /api/admin/notifications
// @access  Private (Admin)
exports.getPendingInstructors = asyncHandler(async (req, res, next) => {
  const pendingInstructors = await User.find({
    role: 'Instructor',
    isApproved: false, // Pending instructors have isApproved: null
  }).select('_id email createdAt').lean();

  const notifications = pendingInstructors.map((instructor) => ({
    id: instructor._id.toString(),
    userId: instructor._id.toString(),
    email: instructor.email,
    requestedRole: 'Instructor',
    createdAt: instructor.createdAt,
  }));

  res.status(200).json(notifications);
});