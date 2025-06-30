const db = require('../config/db');

exports.insert = (data) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO products SET ?';
    db.query(query, data, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.getallProducts = (callback) => {
  const sql = 'SELECT * FROM products'; // Adjust table name if needed
  db.query(sql, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

exports.getProductbyID = (id, callback) => {
  const sql = 'SELECT * FROM products WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results[0]); // assuming you want a single product
  });
};

exports.deleteProductID = (id, callback) => {
  const sql = 'DELETE FROM products WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results); // returns info about the delete operation
  });
};

exports.updateProductByID = (id, data, callback) => {
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

  const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);

  db.query(sql, values, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};