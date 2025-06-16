const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const otpModel = require('../models/otpModel');
const userModel = require('../models/userModel');

// Send OTP to email
exports.sendOtp = (req, res) => {
  const { email, purpose = 'verify' } = req.body;

  if (!email) {
    return res.status(400).json({ status: false, message: 'Email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Craft Delhi OTP',
    text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
  };

  userModel.findByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ status: false, error: err });

    // Check based on purpose
    if (purpose === 'reset') {
      if (!results.length) {
        return res.status(404).json({ status: false, message: 'Email not found. Cannot reset password.' });
      }
    } else {
      // Purpose: verify
      if (!results.length) {
        userModel.createEmailOnlyUser(email, (e) => {
          if (e) return res.status(500).json({ status: false, error: e });
        });
      }
    }

    otpModel.saveOtp(email, otp, expiresAt, (err2) => {
      if (err2) return res.status(500).json({ status: false, error: err2 });

      transporter.sendMail(mailOptions, (error) => {
        if (error) return res.status(500).json({ status: false, error });
        res.json({ status: true, message: 'OTP sent to email' });
      });
    });
  });
};


// Verify OTP
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ status: false, message: 'Email and OTP are required' });
  }

  otpModel.findValidOtp(email, otp, (err, results) => {
    if (err) return res.status(500).json({ status: false, error: err });
    if (!results.length) return res.status(400).json({ status: false, message: 'Invalid or expired OTP' });

    const otpEntry = results[0];

    userModel.markEmailVerified(email, (err2) => {
      if (err2) return res.status(500).json({ status: false, error: err2 });

      otpModel.markOtpVerified(otpEntry.id, () => {
        res.json({ status: true, message: 'Email verified successfully' });
      });
    });
  });
};

// Complete Registration After Email Verification
exports.register = (req, res) => {
  const { email, first_name, last_name, password, phone_number, dob, role } = req.body;

  if (!email || !first_name || !last_name || !password || !phone_number || !dob || !role) {
    return res.status(400).json({ status: false, message: 'All fields are required' });
  }

  const hashed = bcrypt.hashSync(password, 10);

  userModel.findByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ status: false, error: err });

    if (!results.length) {
      return res.status(404).json({ status: false, message: 'Email not found. Please verify email first.' });
    }

    const user = results[0];

    if (user.is_email_verified && user.first_name) {
      return res.status(400).json({ status: false, message: 'User already exists. Please login.' });
    }

    if (!user.is_email_verified) {
      return res.status(400).json({ status: false, message: 'Email not verified' });
    }

    userModel.updateUserDetails({
      email,
      first_name,
      last_name,
      password: hashed,
      phone_number,
      dob,
      role
    }, (err2) => {
      if (err2) return res.status(500).json({ status: false, error: err2 });
      res.status(201).json({ status: true, message: 'User registered. Awaiting approval.' });
    });
  });
};

// Login
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: false, message: 'Email and password are required' });
  }

  userModel.findByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ status: false, error: err });
    if (!results.length) return res.status(404).json({ status: false, message: 'User not found' });

    const user = results[0];

    if (user.user_approval === 0) {
      return res.status(200).json({ status: false, message: 'Pending approval from admin. We will notify you once approved.' });
    }

    if (user.user_approval === 2) {
      return res.status(403).json({ status: false, message: 'Your registration has been rejected by admin.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ status: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ status: true, token, role: user.role });
  });
};

// Reset Password
exports.resetPassword = (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ status: false, message: 'Email, OTP, and new password are required' });
  }

  otpModel.findValidOtp(email, otp, (err, results) => {
    if (err) return res.status(500).json({ status: false, error: err });
    if (!results.length) return res.status(400).json({ status: false, message: 'Invalid or expired OTP' });

    const otpEntry = results[0];

    bcrypt.hash(newPassword, 10, (err2, hashedPassword) => {
      if (err2) return res.status(500).json({ status: false, error: err2 });

      userModel.updatePasswordByEmail(email, hashedPassword, (err3) => {
        if (err3) return res.status(500).json({ status: false, error: err3 });

        otpModel.markOtpVerified(otpEntry.id, () => {
          res.json({ status: true, message: 'Password reset successful' });
        });
      });
    });
  });
};
