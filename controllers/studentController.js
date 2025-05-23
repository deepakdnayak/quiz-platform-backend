const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Profile = require('../models/Profile');

// @desc    Get student dashboard
// @route   GET /api/students/dashboard
// @access  Private (Student)
exports.getStudentDashboard = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ userId: req.user.id });
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }

  const now = new Date();

  // Get completed quizzes
  const completedQuizzes = await QuizAttempt.find({ userId: req.user.id, isScored: true })
    .populate('quizId', 'title')
    .select('quizId totalScore createdAt')
    .lean();

  // Get active quizzes
  const activeQuizzes = await Quiz.find({
    yearOfStudy: profile.yearOfStudy,
    startTime: { $lte: now },
    endTime: { $gte: now }
  }).select('_id title startTime endTime');

  // Get upcoming quizzes
  const upcomingQuizzes = await Quiz.find({
    yearOfStudy: profile.yearOfStudy,
    startTime: { $gt: now }
  }).select('_id title startTime endTime');

  // Calculate average score
  const totalScore = completedQuizzes.reduce((sum, attempt) => sum + attempt.totalScore, 0);
  const averageScore = completedQuizzes.length ? totalScore / completedQuizzes.length : 0;

  res.status(200).json({
    completedQuizzes: completedQuizzes.map(a => ({
      quizId: a.quizId._id,
      title: a.quizId.title,
      totalScore: a.totalScore,
      attemptDate: a.createdAt
    })),
    activeQuizzes: activeQuizzes.map(q => ({
      id: q._id,
      title: q.title,
      startTime: q.startTime,
      endTime: q.endTime
    })),
    upcomingQuizzes: upcomingQuizzes.map(q => ({
      id: q._id,
      title: q.title,
      startTime: q.startTime,
      endTime: q.endTime
    })),
    averageScore
  });
});