const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../utils/authMiddleware');
const { verifyTokenforactions } = require('../utils/authMiddleware');
const { upload } = require('../utils/s3Uploader');

router.post(
  '/create',
  verifyTokenforactions,
  upload.single('category_image'), // 👈 ADD THIS
  categoryController.createCategory
);
router.get('/get' ,categoryController.getCategories);
router.get('/getbyid/:category_id' ,categoryController.getCategoryID);
router.delete('/delete/:category_id',verifyTokenforactions  ,categoryController.deleteCategory);
router.put('/update/:category_id',verifyTokenforactions  ,categoryController.updateCategory);
router.delete(
  '/delete-subcategory/:subcategory_id',
  verifyTokenforactions,
  categoryController.deleteSubCategory
);

router.put(
  '/update/:category_id',
  verifyTokenforactions,
  upload.single('category_image'), // 👈 ADD THIS
  categoryController.updateCategory
);
router.post('/create-subcategory', verifyToken, categoryController.createSubCategory);

router.get('/subcategories/:category_id', categoryController.getSubCategories);
router.get('/:category_id', categoryController.getProductsbyCatSubcatID);

module.exports = router;
