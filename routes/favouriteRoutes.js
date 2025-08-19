const express = require('express');
const router = express.Router();
const favouriteController = require('../controllers/favouriteController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

router.post('/add/:product_id', verifyTokenforactions, favouriteController.addFavourite);
router.delete('/remove/:product_id', verifyTokenforactions, favouriteController.removeFavourite);

module.exports = router;
