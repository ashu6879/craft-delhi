const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminDetailsController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

router.get('/dashboard-stats', verifyTokenforactions,  adminController.getDashboardStats);

module.exports = router;