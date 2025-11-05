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
      ss.store_image,
      s.first_name,
      s.last_name
    FROM seller_stores ss
    LEFT JOIN users s ON s.id = ss.seller_id
    WHERE ss.seller_id = ? 
    LIMIT 1
  `;

  db.query(query, [sellerId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null);

    let store = results[0];

    // Generate slug if it doesn't exist
    if (!store.slug) {
      const baseSlug = slugify(`${store.last_name}-${store.first_name}`, { lower: true });
      let slug = baseSlug;
      let counter = 1;

      const generateUniqueSlug = () => {
        db.query('SELECT id FROM seller_stores WHERE slug = ?', [slug], (err2, res2) => {
          if (err2) return callback(err2, null);

          if (res2.length > 0) {
            // Slug exists, add counter
            slug = `${baseSlug}-${counter}`;
            counter++;
            generateUniqueSlug();
          } else {
            // Slug is unique, update DB
            const storeLink = `https://backend.craftdelhi.com/backend/api/seller-store/${slug}`;
            db.query(
              'UPDATE seller_stores SET slug = ?, store_link = ? WHERE id = ?',
              [slug, storeLink, store.id],
              (err3) => {
                if (err3) return callback(err3, null);

                store.slug = slug;
                store.store_link = storeLink;

                return callback(null, store);
              }
            );
          }
        });
      };

      generateUniqueSlug();
    } else {
      // Slug already exists
      return callback(null, store);
    }
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

// Find store by ID
exports.findById = (id, callback) => {
  db.query('SELECT * FROM seller_stores WHERE id = ? LIMIT 1', [id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results[0] || null);
  });
};

// Check if slug exists
exports.isSlugExists = (slug, callback) => {
  db.query('SELECT id FROM seller_stores WHERE slug = ?', [slug], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results.length > 0);
  });
};

// Update slug and store_link
exports.updateSlug = (id, slug, storeLink, callback) => {
  db.query('UPDATE seller_stores SET slug = ?, store_link = ? WHERE id = ?', [slug, storeLink, id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

exports.getStoreBySlug = (slug, callback) => {
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
      ss.store_image,
      s.first_name,
      s.last_name
    FROM seller_stores ss
    LEFT JOIN users s ON s.id = ss.seller_id
    WHERE ss.slug = ?
    LIMIT 1
  `;

  db.query(query, [slug], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results[0] || null);
  });
};

exports.getSaleSummary = (sellerId, callback) => {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM order_details WHERE seller_id = ?) AS total_orders,
      (SELECT COUNT(*) FROM order_details WHERE seller_id = ? AND order_status = 0) AS total_pending_orders,
      (SELECT COUNT(*) FROM order_details WHERE seller_id = ? AND order_status = 4) AS total_cancelled_orders
  `;

  db.query(sql, [sellerId, sellerId, sellerId], (err, results) => {  // ✅ fix here
    if (err) return callback(err);
    callback(null, results[0]);
  });
};
exports.getAllProductsForSeller = (seller_id,callback) => {
  const sql = `
    SELECT p.*
    FROM products p where p.seller_id = ?
    ORDER BY p.created_at DESC
  `;
  db.query(sql,[seller_id], callback);
};

exports.getAllProductsForSellerbyID = (seller_id,product_id,callback) => {
  const sql = `
    SELECT p.*
    FROM products p where p.seller_id = ? and p.id = ?
    ORDER BY p.created_at DESC
  `;
  db.query(sql,[seller_id,product_id], callback);
};
