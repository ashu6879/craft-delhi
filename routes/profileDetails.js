const express = require('express');
const router = express.Router();
const profileDetailsController = require('../controllers/profileDetailsController');
const { verifyTokenforactions } = require('../utils/authMiddleware');
const { upload } = require('../utils/s3Uploader');

// PUT /api/seller-store/edit/:sellerId
router.put(
  '/edit',
  upload.single('profile_image'), // ⬅️ handles one file field named `store_image`
  verifyTokenforactions,
  profileDetailsController.updateProfile
);
router.get('/getdetails',verifyTokenforactions, profileDetailsController.getProfileDetails);


module.exports = router;
