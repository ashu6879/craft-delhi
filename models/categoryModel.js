const db = require('../config/db');

// Check if a category exists by name + creator
exports.findCategoryByNameAndCreator = (name, createdBy, creatorId, callback) => {
  const query = `
    SELECT * FROM product_categories 
    WHERE name = ? AND created_by = ? AND ${creatorId ? 'creator_id = ?' : 'creator_id IS NULL'}
  `;

  const values = creatorId ? [name, createdBy, creatorId] : [name, createdBy];

  db.query(query, values, (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

// Insert a new category
exports.createCategory = (name, createdBy, creatorId, callback) => {
  const query = `
    INSERT INTO product_categories (name, created_by, creator_id)
    VALUES (?, ?, ?)
  `;

  db.query(query, [name, createdBy, creatorId], (err, result) => {
    if (err) return callback(err, null);
    callback(null, result);
  });
};

exports.getallCategories = (callback) => {
  const sql = 'SELECT * FROM product_categories'; // Adjust table name if needed
  db.query(sql, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

exports.getCategorybyID = (id, callback) => {
  const sql = 'SELECT * FROM product_categories WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results[0]); // assuming you want a single product
  });
};

exports.deleteCategoryID = (id, callback) => {
  const sql = 'DELETE FROM product_categories WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results); // returns info about the delete operation
  });
};

exports.updateCategoryByID = (id, data, callback) => {
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

  const sql = `UPDATE product_categories SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);

  db.query(sql, values, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};
