const db = require('../config/db');

exports.getStoreBySellerId = (sellerId, callback) => {
  const query = `
    SELECT 
      ss.store_name,
      ss.store_username,
      ss.store_link,
      ss.description,
      ss.store_created_date,
      ss.business_number,
      ss.store_image
    FROM seller_stores ss
    WHERE seller_id = ? 
    LIMIT 1 
  `;

  db.query(query, [sellerId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null); // No store found

    return callback(null, results[0]); // Return the store row
  });
};


exports.createStore = (data, callback) => {
  const query = `
    INSERT INTO seller_stores (seller_id, created_at)
    VALUES (?, NOW())
  `;
  db.query(query, [data.seller_id], (err, result) => {
    if (err) return callback(err);
    return callback(null, result);
  });
};

exports.updateStoreBySellerId = (sellerId, data, callback) => {
  const fields = [];
  const values = [];

  // Dynamically build SET clause
  for (let key in data) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    return callback(null, { affectedRows: 0 }); // No update fields provided
  }

  // Add updated_at field automatically
  fields.push(`updated_at = NOW()`);

  const sql = `UPDATE seller_stores SET ${fields.join(', ')} WHERE seller_id = ?`;
  values.push(sellerId);

  db.query(sql, values, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};


exports.getStoreBySellerIdforAuth = (sellerId, callback) => {
  const query = `SELECT * FROM seller_stores WHERE seller_id = ? LIMIT 1`;
  db.query(query, [sellerId], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results[0] || null);
  });
};