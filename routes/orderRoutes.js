const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

router.post('/create', verifyTokenforactions, orderController.createOrder);
router.get('/recentorders', verifyTokenforactions,orderController.recentOrderbySeller);

module.exports = router;
