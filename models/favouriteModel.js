const db = require('../config/db');

// Insert a new favourite
exports.addFavourite = (user_id, product_id, callback) => {
  const query = `
    INSERT INTO favourites_product (user_id, product_id)
    VALUES (?, ?)
  `;
  db.query(query, [user_id, product_id], (err, result) => {
    if (err) return callback(err, null);
    callback(null, result);
  });
};

// Remove a favourite
exports.removeFavourite = (user_id, product_id, callback) => {
  const query = `
    DELETE FROM favourites_product 
    WHERE user_id = ? AND product_id = ?
  `;
  db.query(query, [user_id, product_id], (err, result) => {
    if (err) return callback(err, null);
    callback(null, result);
  });
};
