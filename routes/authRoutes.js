const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { verifyToken } = require('../utils/authMiddleware');

router.post('/register-details', auth.register);
router.post('/login', auth.login);

//forget password
router.post('/forgot-password', auth.sendOtp);         // Reuse sendOtp
router.post('/reset-password', auth.resetPassword);    // Handle OTP + new password



//for sending otp
router.post('/send-otp', auth.sendOtp);
router.post('/verify-otp', auth.verifyOtp);


router.post('/temp-approval', auth.tempApproval);

module.exports = router;
