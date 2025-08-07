const express = require('express');
const {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getAssignedQuizzes,
  getQuizDetails,
  submitQuizAttempt,
  getQuizResults,
  getQuizStatistics,
  getQuizResultsForInstructor
} = require('../controllers/quizController');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .get(protect, restrictTo('Student'), getAssignedQuizzes)
  .post(protect, restrictTo('Instructor'), createQuiz);

router.route('/:quizId')
  .get(protect, restrictTo('Student'), getQuizDetails)
  .put(protect, restrictTo('Instructor'), updateQuiz)
  .delete(protect, restrictTo('Instructor'), deleteQuiz);

router.post('/:quizId/attempt', protect, restrictTo('Student'), submitQuizAttempt);
router.get('/:quizId/results', protect, restrictTo('Student'), getQuizResults);
router.get('/:quizId/statistics', protect, restrictTo('Instructor'), getQuizStatistics);
router.get('/:quizId/resultsForInstructor',protect, restrictTo('Instructor'), getQuizResultsForInstructor);

module.exports = router;