const db = require('../config/db');
const slugify = require('slugify');

// ---------------- Callback-style Methods ---------------- //

// Get store by seller ID
exports.getStoreBySellerId = (sellerId, callback) => {
  const query = `
    SELECT 
      ss.id,
      ss.store_name,
      ss.store_username,
      ss.store_link,
      ss.slug,
      ss.description,
      ss.store_created_date,
      ss.business_number,
      ss.store_image
    FROM seller_stores ss
    WHERE seller_id = ? 
    LIMIT 1 
  `;

  db.query(query, [sellerId], async (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null);

    let store = results[0];

    // Generate slug if it doesn't exist
    if (!store.slug) {
      let baseSlug = slugify(`${store.store_name}`, { lower: true });
      let slug = baseSlug;
      let counter = 1;

      // Ensure uniqueness using async isSlugExists
      while (await exports.isSlugExists(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const storeLink = `https://craftdelhi.com/store/${slug}`;

      // Save slug and store_link in DB
      await exports.updateSlug(store.id, slug, storeLink);

      store.slug = slug;
      store.store_link = storeLink;
    }

    return callback(null, store);
  });
};

// Create a store
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

// Update store by seller ID
exports.updateStoreBySellerId = (sellerId, data, callback) => {
  const fields = [];
  const values = [];

  for (let key in data) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return callback(null, { affectedRows: 0 });

  fields.push('updated_at = NOW()');
  const sql = `UPDATE seller_stores SET ${fields.join(', ')} WHERE seller_id = ?`;
  values.push(sellerId);

  db.query(sql, values, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

// Get store for auth
exports.getStoreBySellerIdforAuth = (sellerId, callback) => {
  const query = `SELECT * FROM seller_stores WHERE seller_id = ? LIMIT 1`;
  db.query(query, [sellerId], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results[0] || null);
  });
};

// ---------------- Async Utility Methods ---------------- //

// Find store by ID
exports.findById = async (id) => {
  const [result] = await db.query('SELECT * FROM seller_stores WHERE id = ?', [id]);
  return result; // assuming result is an array
};

// Check if slug exists
exports.isSlugExists = async (slug) => {
  const [result] = await db.query('SELECT id FROM seller_stores WHERE slug = ?', [slug]);
  return result.length > 0;
};

// Update slug and store_link
exports.updateSlug = async (id, slug, storeLink) => {
  await db.query('UPDATE seller_stores SET slug = ?, store_link = ? WHERE id = ?', [slug, storeLink, id]);
};
