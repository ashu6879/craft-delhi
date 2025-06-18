const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload } = require('../utils/s3Uploader');

router.post(
  '/add',
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'gallery_images', maxCount: 4 },
    { name: 'product_video', maxCount: 1 },
    { name: 'product_reel', maxCount: 1 }
  ]),
  productController.addProduct
);

module.exports = router;
