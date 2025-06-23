const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../utils/authMiddleware');
const { verifyTokenforactions } = require('../utils/authMiddleware');

router.post('/create',verifyToken ,categoryController.createCategory);
router.get('/get',verifyToken ,categoryController.getCategories);
router.get('/getbyid/:category_id',verifyToken ,categoryController.getCategoryID);
router.delete('/delete/:category_id',verifyTokenforactions  ,categoryController.deleteCategory);
router.put('/update/:category_id',verifyTokenforactions  ,categoryController.updateCategory);

module.exports = router;
