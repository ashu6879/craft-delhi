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

exports.getProductbyGiftSlug = (slug, callback) => {
  const sql = `
    SELECT 
      p.*,
      pc.name AS category_name,
      s.store_name,
      s.store_username,

      COALESCE(r.total_review, 0) AS total_review,
      COALESCE(r.avg_rating, 0) AS average_rating,
      COALESCE(o.total_order, 0) AS total_order

    FROM products p

    LEFT JOIN (
      SELECT 
        target_id,
        COUNT(*) AS total_review,
        ROUND(AVG(rating), 1) AS avg_rating
      FROM reviews
      WHERE type = 'product'
      GROUP BY target_id
    ) r ON r.target_id = p.id

    LEFT JOIN (
      SELECT 
        product_id,
        COUNT(*) AS total_order
      FROM order_items
      GROUP BY product_id
    ) o ON o.product_id = p.id

    LEFT JOIN seller_stores s ON s.seller_id = p.seller_id
    LEFT JOIN product_categories pc ON pc.id = p.category_id

    WHERE JSON_SEARCH(p.hashtags, 'one', ?) IS NOT NULL;
  `;

  db.query(sql, [slug], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

exports.checkSlugExists = (slug) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM gift_categories WHERE slug = ? LIMIT 1`;

    db.query(sql, [slug], (err, result) => {
      if (err) return reject(err);
      resolve(result.length > 0 ? result[0] : null); // 👈 return object instead of boolean
    });
  });
};