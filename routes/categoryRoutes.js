const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../utils/authMiddleware');

router.post('/create',verifyToken ,categoryController.createCategory);

module.exports = router;
