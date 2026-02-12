const express = require('express');
const router = express.Router();
const giftCategoriesController = require('../controllers/giftCategoriesController');
const { verifyTokenforactions } = require('../utils/authMiddleware');
const { upload } = require('../utils/s3Uploader');


// ✅ Create Gift Category
router.post(
  '/add',
  upload.single('gift_image'), // ⬅️ handles one file field named `gift_image`
  verifyTokenforactions,
  giftCategoriesController.createGiftCategory
);


// ✅ Get All Gift Categories
router.get(
  '/get',
  giftCategoriesController.getAllGiftCategories
);


// ✅ Get Gift Category By ID
router.get(
  '/getbyid/:id',
  giftCategoriesController.getGiftCategoryById
);


// ✅ Update Gift Category
router.put(
  '/edit/:id',
  upload.single('gift_image'), // ⬅️ handles image update
  verifyTokenforactions,
  giftCategoriesController.updateGiftCategory
);

// ✅ Update status Gift Category
router.put(
  '/editstatus/:id',
  verifyTokenforactions,
  giftCategoriesController.updateGiftCategoryStatus
);


// ✅ Delete Gift Category
router.delete(
  '/delete/:id',
  verifyTokenforactions,
  giftCategoriesController.deleteGiftCategory
);


module.exports = router;
