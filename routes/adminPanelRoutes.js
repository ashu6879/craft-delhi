const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminDetailsController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

router.get('/dashboard-stats', verifyTokenforactions,  adminController.getDashboardStats);
router.get('/products-view', verifyTokenforactions, adminController.adminProductsView);
router.post('/update-approval-status', verifyTokenforactions, adminController.updateApprovalStatus);

module.exports = router;