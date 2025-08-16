const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Profile = require('../models/Profile');
const QuizStatistics = require('../models/QuizStatistics')
const mongoose = require('mongoose');


// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private (Instructor)
exports.createQuiz = asyncHandler(async (req, res, next) => {
  const { title, description, yearOfStudy, startTime, endTime, duration, questions } = req.body;

  // Validate input
  if (!title || !yearOfStudy || !startTime || !endTime || !duration || !questions) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }
  if (new Date(endTime) <= new Date(startTime)) {
    return next(new ErrorResponse('End time must be after start time', 400));
  }

  // Create quiz
  const quiz = await Quiz.create({
    title,
    description,
    instructorId: req.user.id,
    yearOfStudy,
    startTime,
    endTime,
    duration,
    questions
  });

  res.status(201).json({
    quizId: quiz._id,
    title,
    yearOfStudy,
    startTime,
    endTime
  });
});

// @desc    Update a quiz
// @route   PUT /api/quizzes/:quizId
// @access  Private (Instructor)
exports.updateQuiz = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  const { title, description, yearOfStudy, startTime, endTime, duration, questions } = req.body;

  // Find quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ErrorResponse('Quiz not found', 404));
  }
  if (quiz.instructorId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this quiz', 403));
  }
  if (new Date() >= quiz.startTime) {
    return next(new ErrorResponse('Cannot update quiz after start time', 400));
  }

  // Update quiz
  const updatedQuiz = await Quiz.findByIdAndUpdate(
    quizId,
    { title, description, yearOfStudy, startTime, endTime, duration, questions },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    quizId: updatedQuiz._id,
    title: updatedQuiz.title,
    yearOfStudy: updatedQuiz.yearOfStudy,
    startTime: updatedQuiz.startTime,
    endTime: updatedQuiz.endTime
  });
});

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:quizId
// @access  Private (Instructor)
exports.deleteQuiz = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;

  // Find quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ErrorResponse('Quiz not found', 404));
  }
  if (quiz.instructorId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this quiz', 403));
  }
  if (new Date() >= quiz.startTime) {
    return next(new ErrorResponse('Cannot delete quiz after start time', 400));
  }

  // Delete quiz
  await Quiz.findByIdAndDelete(quizId);

  res.status(200).json({ message: 'Quiz deleted' });
});

// @desc    Get assigned quizzes for student
// @route   GET /api/quizzes/assigned
// @access  Private (Student)
exports.getAssignedQuizzes = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ userId: req.user.id });
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }

  const now = new Date();
  let query = { yearOfStudy: profile.yearOfStudy };

  // Filter by status
  const status = req.query.status || 'active';
  if (status === 'active') {
    query.startTime = { $lte: now };
    query.endTime = { $gte: now };
  } else if (status === 'upcoming') {
    query.startTime = { $gt: now };
  } else if (status === 'past') {
    query.endTime = { $lt: now };
  }

  const quizzes = await Quiz.find(query).select('title description yearOfStudy startTime endTime duration');

  res.status(200).json(quizzes);
});

// @desc    Get quiz details for attempt
// @route   GET /api/quizzes/:quizId
// @access  Private (Student)
exports.getQuizDetails = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  const profile = await Profile.findOne({ userId: req.user.id });
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }

  // Find quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ErrorResponse('Quiz not found', 404));
  }
  if (quiz.yearOfStudy !== profile.yearOfStudy) {
    return next(new ErrorResponse('Quiz not assigned to your year', 403));
  }
  if (new Date() < quiz.startTime || new Date() > quiz.endTime) {
    return next(new ErrorResponse('Quiz is not available', 400));
  }

  // Format response (exclude correct answers)
  const formattedQuiz = {
    quizId: quiz._id,
    title: quiz.title,
    duration: quiz.duration,
    questions: quiz.questions.map(q => ({
      questionId: q.questionId,
      text: q.text,
      options: q.options.map(o => ({ optionId: o.optionId, text: o.text }))
    }))
  };

  res.status(200).json(formattedQuiz);
});

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:quizId/attempt
// @access  Private (Student)
exports.submitQuizAttempt = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  const { answers } = req.body;
  const now = new Date();

  // Validate input
  if (!answers || !Array.isArray(answers)) {
    return next(new ErrorResponse('Please provide answers', 400));
  }

  // Find quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ErrorResponse('Quiz not found', 404));
  }
  if (now < quiz.startTime || now > quiz.endTime) {
    return next(new ErrorResponse('Quiz is not available', 400));
  }

  // Check if already attempted (for scored attempt)
  const existingAttempt = await QuizAttempt.findOne({ quizId, userId: req.user.id, isScored: true });
  if (existingAttempt && now >= quiz.startTime && now <= quiz.endTime) {
    return next(new ErrorResponse('Quiz already attempted', 403));
  }

  // Evaluate answers
  let totalScore = 0;
  const evaluatedAnswers = answers.map(answer => {
    const question = quiz.questions.find(q => q.questionId === answer.questionId);
    if (!question) {
      return { questionId: answer.questionId, selectedOptionIds: answer.selectedOptionIds, isCorrect: false, scoreAwarded: 0 };
    }

    const isCorrect = answer.selectedOptionIds.sort().join(',') === question.correctOptionIds.sort().join(',');
    const scoreAwarded = isCorrect ? question.score : 0;
    totalScore += scoreAwarded;

    return {
      questionId: answer.questionId,
      selectedOptionIds: answer.selectedOptionIds,
      isCorrect,
      scoreAwarded
    };
  });

  // Create attempt
  const isScored = now >= quiz.startTime && now <= quiz.endTime;
  const attempt = await QuizAttempt.create({
    quizId,
    userId: req.user.id,
    startTime: now,
    endTime: now,
    isScored,
    answers: evaluatedAnswers,
    totalScore
  });

  res.status(201).json({
    attemptId: attempt._id,
    quizId,
    totalScore,
    isScored
  });
});

// @desc    Get quiz results
// @route   GET /api/quizzes/:quizId/results
// @access  Private (Student)
exports.getQuizResults = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;

  // Find quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ErrorResponse('Quiz not found', 404));
  }
  if (new Date() < quiz.endTime) {
    return next(new ErrorResponse('Results not available until quiz ends', 403));
  }

  // Find attempt
  const attempt = await QuizAttempt.findOne({ quizId, userId: req.user.id });
  if (!attempt) {
    return next(new ErrorResponse('No attempt found for this quiz', 404));
  }

  res.status(200).json({
    attempt: {
      attemptId: attempt._id,
      quizId: attempt.quizId,
      totalScore: attempt.totalScore,
      answers: attempt.answers
    },
    quiz: {
      questions: quiz.questions.map(q => ({
        questionId: q.questionId,
        text: q.text,
        options: q.options,
        correctOptionIds: q.correctOptionIds,
        score: q.score
      }))
    }
  });
});


// @desc    Get quiz statistics
// @route   GET /api/quizzes/:quizId/statistics
// @access  Private (Instructor)
exports.getQuizStatistics = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;

  // Validate quizId
  if (!mongoose.isValidObjectId(quizId)) {
    return next(new ErrorResponse('Invalid quiz ID', 400));
  }

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
  if (!stats || req.query.refresh === 'true') {
    // Delete existing stats if refresh is requested
    if (stats && req.query.refresh === 'true') {
      await QuizStatistics.deleteOne({ quizId });
    }

    // Calculate statistics
    const attempts = await QuizAttempt.find({ quizId, isScored: true }).lean();
    const totalAttempts = attempts.length;

    // Calculate scores
    const scores = attempts
      .map(a => Number(a.totalScore))
      .filter(score => !isNaN(score) && score >= 0);
    const averageScore = totalAttempts
      ? Number((scores.reduce((sum, score) => sum + score, 0) / totalAttempts).toFixed(2))
      : 0;
    const highestScore = totalAttempts ? Math.max(...scores) : 0;
    const lowestScore = totalAttempts ? Math.min(...scores) : 0;

    // Get attempts by year
    const attemptsByYear = await QuizAttempt.aggregate([
      { $match: { quizId: new mongoose.Types.ObjectId(quizId), isScored: true } },
      {
        $lookup: {
          from: 'profiles',
          localField: 'userId',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$profile.yearOfStudy',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          yearOfStudy: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { yearOfStudy: 1 } }, // Sort by yearOfStudy for consistency
    ]);

    // Create or update statistics
    stats = await QuizStatistics.findOneAndUpdate(
      { quizId },
      {
        quizId,
        totalAttempts,
        averageScore,
        highestScore,
        lowestScore,
        attemptsByYear: attemptsByYear.length ? attemptsByYear : [],
        lastUpdated: Date.now(),
      },
      { upsert: true, new: true }
    );
  }

  res.status(200).json(stats);
});


 
// @desc    Get quiz results with student details
// @route   GET /api/quizzes/:quizId/resultsForInstructor
// @access  Private (Instructor)
exports.getQuizResultsForInstructor = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;

  // Find quiz and verify ownership
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ErrorResponse('Quiz not found', 404));
  }
  if (quiz.instructorId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to view this quiz', 403));
  }

  // Fetch quiz attempts with student profiles
  const attempts = await QuizAttempt.find({ quizId, isScored: true })
    .populate({
      path: 'userId',
      select: 'email profile',
      populate: {
        path: 'profile',
        model: 'Profile',
        select: 'usn firstName lastName yearOfStudy rollNumber',
      },
    })
    .select('totalScore createdAt')
    .lean();

  const results = attempts.map((attempt) => ({
    usn: attempt.userId?.profile?.rollNumber || 'N/A',
    studentName: attempt.userId?.profile
      ? `${attempt.userId.profile.firstName} ${attempt.userId.profile.lastName}`
      : 'N/A',
    score: attempt.totalScore,
    yearOfStudy: attempt.userId?.profile?.yearOfStudy || 'N/A',
    attemptDate: attempt.createdAt,
  }));

  res.status(200).json(results);
});


// @desc    Get quiz details for edit
// @route   GET /api/quizzes/:quizId/edit
// @access  Private (Instructor)
exports.getQuizDetailsForEdit = asyncHandler(async (req, res, next) => {
  const { quizId } = req.params;
  const profile = await Profile.findOne({ userId: req.user.id });
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }

  // Find quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    return next(new ErrorResponse('Quiz not found', 404));
  }

  // Format response (include isCorrect for each option)
  const formattedQuiz = {
    quizId: quiz._id,
    title: quiz.title,
    description: quiz.description,
    duration: quiz.duration,
    startTime: quiz.startTime,
    endTime: quiz.endTime,
    yearOfStudy: quiz.yearOfStudy,
    questions: quiz.questions.map(q => ({
      questionId: q.questionId,
      text: q.text,
      options: q.options.map(o => ({
        optionId: o.optionId,
        text: o.text,
        isCorrect: o.isCorrect   // <-- Added here
      })),
      correctOptionIds: q.correctOptionIds,
    }))
  };

  res.status(200).json(formattedQuiz);
});