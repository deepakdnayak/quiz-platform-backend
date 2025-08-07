const express = require('express');
const { getProfile, updateProfile, userCount } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.route('/getUserCount').get(userCount)

module.exports = router;