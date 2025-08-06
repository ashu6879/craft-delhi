const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminDetailsController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

router.get('/dashboard-stats', verifyTokenforactions,  adminController.getDashboardStats);
router.get('/products-view', verifyTokenforactions, adminController.adminProductsView);
router.post('/update-product-approval', verifyTokenforactions, adminController.updateApprovalStatus);
router.get('/buyer-stats', verifyTokenforactions,  adminController.getBuyerStats);
router.get('/buyers-view', verifyTokenforactions, adminController.adminBuyersView);
// router.post('/update-buyerbyadmin', verifyTokenforactions, adminController.updateBuyerbyAdmin);
module.exports = router;