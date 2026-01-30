const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

router.post('/add',verifyTokenforactions, reviewsController.createReview);
router.get('/get',verifyTokenforactions, reviewsController.getReview);
router.get('/getbyuserid/:id',verifyTokenforactions, reviewsController.getReviewsbyUserId);
router.get('/getbyproductid/:id',verifyTokenforactions, reviewsController.getReviewsbyProductId);

module.exports = router;
