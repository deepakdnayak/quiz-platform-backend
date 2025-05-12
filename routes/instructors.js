const express = require('express');
const { getInstructorQuizzes, getInstructorDashboard } = require('../controllers/instructorController');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();

router.get('/quizzes', protect, restrictTo('Instructor'), getInstructorQuizzes);
router.get('/dashboard', protect, restrictTo('Instructor'), getInstructorDashboard);

module.exports = router;