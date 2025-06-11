const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

router.post('/register-details', auth.register);
router.post('/login', auth.login);

router.post('/send-otp', auth.sendOtp);
router.post('/verify-otp', auth.verifyOtp);

module.exports = router;
