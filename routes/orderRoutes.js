const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

// seller orders
router.post('/create', verifyTokenforactions, orderController.createOrder);
router.get('/recentorders', verifyTokenforactions,orderController.recentOrderbySeller);
router.put('/updateorderstatus/:order_id', verifyTokenforactions,orderController.updateOrderStatus);
router.put('/updatedetails/:order_id', verifyTokenforactions,orderController.updateOrderDetails);

// user orders
router.get('/userorders', verifyTokenforactions,orderController.OrderbyUser);
router.put('/cancelorderbyuser/:order_id', verifyTokenforactions,orderController.cancelOrderbyUser);
module.exports = router;
