const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

router.get('/summary', verifyTokenforactions,paymentController.getselleryPaymentSummary);
router.get('/history', verifyTokenforactions,paymentController.getselleryPaymentHistory);

module.exports = router;
