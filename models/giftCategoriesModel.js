const db = require('../config/db'); // adjust if your DB path is different


// ✅ Create Gift Category
exports.createGiftCategory = (data, callback) => {
  const sql = `
    INSERT INTO gift_categories 
    (title, slug, description, gift_image) 
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      data.title,
      data.slug,
      data.description || null,
      data.gift_image || null
    ],
    callback
  );
};



// ✅ Get All Gift Categories
exports.getAllGiftCategories = (callback) => {
  const sql = `
    SELECT *
    FROM gift_categories
    ORDER BY id DESC
  `;

  db.query(sql, callback);
};



// ✅ Get Gift Category By ID
exports.getGiftCategoryById = (id, callback) => {
  const sql = `
    SELECT *
    FROM gift_categories
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};



// ✅ Update Gift Category (Dynamic Update)
exports.updateGiftCategory = (id, updateData, callback) => {

  const fields = [];
  const values = [];

  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updateData[key]);
    }
  });

  if (fields.length === 0) {
    return callback(null, { affectedRows: 0 });
  }

  const sql = `
    UPDATE gift_categories
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  values.push(id);

  db.query(sql, values, callback);
};


  // ✅ Update Status Only
  exports.updateGiftCategoryStatus = (id, status, callback) => {
    const sql = `
      UPDATE gift_categories 
      SET status = ?
      WHERE id = ?
    `;

    db.query(sql, [status, id], callback);
  },

// ✅ Delete Gift Category
exports.deleteGiftCategory = (id, callback) => {
  const sql = `
    DELETE FROM gift_categories
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};
