const db = require('../config/db');

// Check if a category exists by name + creator
exports.findCategoryByNameAndCreator = (name, createdBy, creatorId) => {
  const query = `
    SELECT * FROM product_categories 
    WHERE name = ? AND created_by = ? AND creator_id ${creatorId ? '= ?' : 'IS NULL'}
  `;
  const values = creatorId ? [name, createdBy, creatorId] : [name, createdBy];
  return db.query(query, values);
};

// Insert a new category
exports.createCategory = (name, createdBy, creatorId) => {
  const query = `
    INSERT INTO product_categories (name, created_by, creator_id)
    VALUES (?, ?, ?)
  `;
  return db.query(query, [name, createdBy, creatorId]);
};

// Get a category by ID
exports.findCategoryById = (id) => {
  return db.query(`SELECT * FROM product_categories WHERE id = ?`, [id]);
};
