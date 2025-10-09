const express = require('express');
const router = express.Router();
const sellerStoreController = require('../controllers/sellerStoreController');
const { verifyTokenforactions } = require('../utils/authMiddleware');
const { upload } = require('../utils/s3Uploader');

// PUT /api/seller-store/edit/:sellerId
router.put(
  '/edit',
  upload.single('store_image'), // ⬅️ handles one file field named `store_image`
  verifyTokenforactions,
  sellerStoreController.updateStore
);
router.get('/getdetails',verifyTokenforactions, sellerStoreController.getStoreBySellerId);
router.get('/link/:id',verifyTokenforactions, sellerStoreController.getStoreLinkBySellerId);

module.exports = router;
