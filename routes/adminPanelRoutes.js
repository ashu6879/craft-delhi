const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminDetailsController');
const { verifyTokenforactions } = require('../utils/authMiddleware');
const { upload } = require('../utils/s3Uploader');

router.get('/dashboard-stats', verifyTokenforactions,  adminController.getDashboardStats);

router.get('/products-view', verifyTokenforactions, adminController.adminProductsView);
router.post('/update-product-approval', verifyTokenforactions, adminController.updateApprovalStatus);

router.get('/buyer-stats', verifyTokenforactions,  adminController.getBuyerStats);
router.get('/buyers-view', verifyTokenforactions, adminController.adminBuyersView);
// router.post('/update-buyerbyadmin', verifyTokenforactions, adminController.updateBuyerbyAdmin);

router.get('/seller-stats', verifyTokenforactions,  adminController.getSellersStats);
router.get('/seller-view', verifyTokenforactions, adminController.adminSellersView);
router.put(
  '/update-sellerbyadmin',
  verifyTokenforactions,
  upload.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'store_image', maxCount: 1 }
  ]),
  adminController.updateSellerbyAdmin
);
router.post('/update-seller-approval', verifyTokenforactions, adminController.updateSellerStatus);
router.delete('/delete-sellerbyadmin/:seller_id', verifyTokenforactions, adminController.deleteSellerAccount);
module.exports = router;