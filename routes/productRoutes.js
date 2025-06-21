const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload } = require('../utils/s3Uploader');
const { verifyToken } = require('../utils/authMiddleware');


router.post(
  '/add',
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'gallery_images', maxCount: 4 },
    { name: 'product_video', maxCount: 1 },
    { name: 'product_reel', maxCount: 1 }
  ]),
  verifyToken, productController.addProduct
);
router.get('/get',verifyToken ,productController.getProducts);
router.get('/getbyid/:product_id',verifyToken ,productController.getProductsbyID);

module.exports = router;
