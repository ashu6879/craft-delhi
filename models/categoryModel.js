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

// Get a category by ID
exports.findCategoryById = (id, callback) => {
  db.query(`SELECT * FROM product_categories WHERE id = ?`, [id], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};
