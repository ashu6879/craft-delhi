const express = require('express');
const router = express.Router();
const orderTrackingController = require('../controllers/orderTrackingController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

// Add tracking info
router.post('/add', verifyTokenforactions, orderTrackingController.addTrackingInfo);

// Get tracking info by order ID
router.get('/get/:order_id', verifyTokenforactions, orderTrackingController.getTrackingByOrder);

// Update tracking info
router.put('/update/:id', verifyTokenforactions, orderTrackingController.updateTrackingInfo);

module.exports = router;
