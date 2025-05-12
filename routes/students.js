const express = require('express');
const { getStudentDashboard } = require('../controllers/studentController');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', protect, restrictTo('Student'), getStudentDashboard);

module.exports = router;