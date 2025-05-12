const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const QuizStatistics = require('../models/QuizStatistics');

// @desc    Get instructor quizzes
// @route   GET /api/instructors/quizzes
// @access  Private (Instructor)
exports.getInstructorQuizzes = asyncHandler(async (req, res, next) => {
  let query = { instructorId: req.user.id };
  const now = new Date();

  // Filter by status
  const status = req.query.status || 'all';
  if (status === 'active') {
    query.startTime = { $lte: now };
    query.endTime = { $gte: now };
  } else if (status === 'upcoming') {
    query.startTime = { $gt: now };
  } else if (status === 'past') {
    query.endTime = { $lt: now };
  }

  const quizzes = await Quiz.find(query).select('title yearOfStudy startTime endTime');
  const quizIds = quizzes.map(q => q._id);

  // Get total attempts
  const attempts = await QuizAttempt.aggregate([
    { $match: { quizId: { $in: quizIds }, isScored: true } },
    { $group: { _id: '$quizId', totalAttempts: { $sum: 1 } } }
  ]);

  const quizzesWithAttempts = quizzes.map(quiz => ({
    quizId: quiz._id,
    title: quiz.title,
    yearOfStudy: quiz.yearOfStudy,
    startTime: quiz.startTime,
    endTime: quiz.endTime,
    totalAttempts: attempts.find(a => a._id.toString() === quiz._id.toString())?.totalAttempts || 0
  }));

  res.status(200).json(quizzesWithAttempts);
});

// @desc    Get quiz statistics
// @route   GET /api/quizzes/:quizId/statistics
// @access  Private (Instructor)
exports.getQuizStatistics = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;

  // Find quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ErrorResponse('Quiz not found', 404));
  }
  if (quiz.instructorId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to view this quiz', 403));
  }

  // Check cached statistics
  let stats = await QuizStatistics.findOne({ quizId });
  if (!stats) {
    // Calculate statistics
    const attempts = await QuizAttempt.find({ quizId, isScored: true });
    const totalAttempts = attempts.length;
    const scores = attempts.map(a => a.totalScore);
    const averageScore = totalAttempts ? scores.reduce((sum, score) => sum + score, 0) / totalAttempts : 0;
    const highestScore = totalAttempts ? Math.max(...scores) : 0;
    const lowestScore = totalAttempts ? Math.min(...scores) : 0;

    // Get attempts by year
    const attemptsByYear = await QuizAttempt.aggregate([
      { $match: { quizId: quiz._id, isScored: true } },
      {
        $lookup: {
          from: 'profiles',
          localField: 'userId',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: '$profile' },
      {
        $group: {
          _id: '$profile.yearOfStudy',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          yearOfStudy: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    stats = await QuizStatistics.create({
      quizId,
      totalAttempts,
      averageScore,
      highestScore,
      lowestScore,
      attemptsByYear
    });
  }

  res.status(200).json(stats);
});

// @desc    Get instructor dashboard
// @route   GET /api/instructors/dashboard
// @access  Private (Instructor)
exports.getInstructorDashboard = asyncHandler(async (req, res, next) => {
  const now = new Date();

  // Get total quizzes
  const totalQuizzes = await Quiz.countDocuments({ instructorId: req.user.id });

  // Get active quizzes
  const activeQuizzes = await Quiz.find({
    instructorId: req.user.id,
    startTime: { $lte: now },
    endTime: { $gte: now }
  }).select('title startTime endTime');

  // Get stats from QuizStatistics
  const stats = await QuizStatistics.find({ quizId: { $in: await Quiz.find({ instructorId: req.user.id }).distinct('_id') } });
  const totalAttempts = stats.reduce((sum, s) => sum + s.totalAttempts, 0);
  const averageAttemptsPerQuiz = totalQuizzes ? totalAttempts / totalQuizzes : 0;
  const averageScoreAcrossQuizzes = stats.length ? stats.reduce((sum, s) => sum + s.averageScore, 0) / stats.length : 0;

  res.status(200).json({
    totalQuizzes,
    activeQuizzes,
    averageAttemptsPerQuiz,
    averageScoreAcrossQuizzes
  });
});