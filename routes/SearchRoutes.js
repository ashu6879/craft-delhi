const express = require('express');
const { verifyTokenforactions } = require('../utils/authMiddleware');

const router = express.Router();
const SearchController = require('../controllers/searchController');
router.get('/',  SearchController.searchProducts);
module.exports = router;
