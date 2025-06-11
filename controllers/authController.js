const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const otpModel = require('../models/otpModel');
const userModel = require('../models/userModel');

// Send OTP to email
exports.sendOtp = (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
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
    if (err) return res.status(500).json({ error: err });

    if (!results.length) {
      userModel.createEmailOnlyUser(email, (e) => {
        if (e) return res.status(500).json({ error: e });
      });
    }

    otpModel.saveOtp(email, otp, expiresAt, (err2) => {
      if (err2) return res.status(500).json({ error: err2 });

      transporter.sendMail(mailOptions, (error) => {
        if (error) return res.status(500).json({ error });
        res.json({ message: 'OTP sent to email' });
      });
    });
  });
};

// Verify OTP
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  otpModel.findValidOtp(email, otp, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (!results.length) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const otpEntry = results[0];

    userModel.markEmailVerified(email, (err2) => {
      if (err2) return res.status(500).json({ error: err2 });

      otpModel.markOtpVerified(otpEntry.id, () => {
        res.json({ message: 'Email verified successfully' });
      });
    });
  });
};

// Complete Registration After Email Verification
exports.register = (req, res) => {
  const { email, first_name, last_name, password, phone_number, dob } = req.body;

  const hashed = bcrypt.hashSync(password, 10);

  userModel.findByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (!results.length || !results[0].is_email_verified) {
      return res.status(400).json({ message: 'Email not verified' });
    }

    userModel.updateUserDetails({
      email,
      first_name,
      last_name,
      password: hashed,
      phone_number,
      dob
    }, (err2) => {
      if (err2) return res.status(500).json({ error: err2 });
      res.status(201).json({ message: 'User registered. Awaiting approval.' });
    });
  });
};

// Login
exports.login = (req, res) => {
  const { email, password } = req.body;

  userModel.findByEmail(email, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (!results.length) return res.status(404).json({ message: 'User not found' });

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role });
  });
};
