const express = require('express');
const { register, login, sendResetOTP, resetPassword,verifyResetOTP } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', sendResetOTP);
router.post('/verify-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

module.exports = router;