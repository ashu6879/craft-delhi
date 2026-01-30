const Reviews = require('../models/reviewsModel');

// ✅ Create Review
exports.createReview = (req, res) => {
  const reviewerId = req.user?.id;
  const { type, target_id, rating, description } = req.body;

  if (!reviewerId) {
    return res.status(401).json({ status: false, message: 'Unauthorized' });
  }

  if (!type || !target_id || !rating) {
    return res.status(400).json({ status: false, message: 'Required fields missing' });
  }

  if (!['product', 'seller'].includes(type)) {
    return res.status(400).json({ status: false, message: 'Invalid review type' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ status: false, message: 'Rating must be between 1 and 5' });
  }

  // 🔒 STEP 1: Check duplicate review
  Reviews.checkDuplicateReview(type, reviewerId, target_id, (err, exists) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ status: false, message: 'Server error' });
    }

    if (exists) {
      return res.status(409).json({
        status: false,
        message: 'You have already reviewed this item'
      });
    }

    // 🔒 STEP 2: Insert review
    Reviews.createReview(
      reviewerId,
      { type, target_id, rating, description },
      (err, result) => {
        if (err) {
          // Handles race condition if two requests hit at same time
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
              status: false,
              message: 'Duplicate review not allowed'
            });
          }

          console.error('Insert Error:', err);
          return res.status(500).json({ status: false, message: 'Server error' });
        }

        return res.status(201).json({
          status: true,
          message: 'Review added successfully',
          review_id: result.insertId
        });
      }
    );
  });
};

// ✅ Get all reviews
exports.getReview = (req, res) => {
  Reviews.getAllReviews((err, reviews) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'Server error' });
    }

    return res.status(200).json({
      status: true,
      message: 'Reviews fetched successfully',
      data: reviews
    });
  });
};

// ✅ Get reviews by user ID
exports.getReviewsbyUserId = (req, res) => {
  const { id } = req.params;

  Reviews.getReviewsByUserId(id, (err, reviews) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'Server error' });
    }

    return res.status(200).json({
      status: true,
      message: 'User reviews fetched successfully',
      data: reviews
    });
  });
};

// ✅ Get reviews by product ID (or seller)
exports.getReviewsbyProductId = (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // product | seller

  if (!type) {
    return res.status(400).json({ status: false, message: 'Review type required' });
  }

  Reviews.getReviewsByTargetId(type, id, (err, reviews) => {
    if (err) {
      return res.status(500).json({ status: false, message: 'Server error' });
    }

    return res.status(200).json({
      status: true,
      message: 'Reviews fetched successfully',
      data: reviews
    });
  });
};
