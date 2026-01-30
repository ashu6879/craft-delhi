const db = require('../config/db');

// ✅ Create review
exports.createReview = (reviewerId, data, callback) => {
  const sql = `
    INSERT INTO reviews (type, reviewer_id, target_id, rating, description)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [data.type, reviewerId, data.target_id, data.rating, data.description],
    (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    }
  );
};

// ✅ Get all reviews
exports.getAllReviews = (callback) => {
  const sql = `SELECT * FROM reviews ORDER BY created_at DESC`;
  db.query(sql, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

// ✅ Get reviews by user
exports.getReviewsByUserId = (reviewer_id, callback) => {
  const sql = `SELECT * FROM reviews WHERE reviewer_id = ? ORDER BY created_at DESC`;
  db.query(sql, [reviewer_id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

// ✅ Get reviews by product / seller
exports.getReviewsByTargetId = (type, target_id, callback) => {
  const sql = `
    SELECT * FROM reviews
    WHERE type = ? AND target_id = ?
    ORDER BY created_at DESC
  `;
  db.query(sql, [type, target_id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

exports.checkDuplicateReview = (type, reviewer_id, target_id, callback) => {
  const sql = `
    SELECT id 
    FROM reviews 
    WHERE type = ? AND reviewer_id = ? AND target_id = ?
    LIMIT 1
  `;

  db.query(sql, [type, reviewer_id, target_id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results.length > 0);
  });
};