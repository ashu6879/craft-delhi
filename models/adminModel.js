const db = require('../config/db'); // adjust path to your MySQL connection

exports.getDashboardStats = (callback) => {
  const sql = `
    SELECT 
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE role = 2 AND user_status = 1) AS active_sellers,
    (SELECT COUNT(*) FROM users WHERE role = 3 AND user_status = 1) AS active_buyers,
    (SELECT COUNT(*) FROM products WHERE admin_approval = 0) AS pending_products;
  `;

  db.query(sql, (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

// adminModel.js
exports.getAllProductsForAdmin = (callback) => {
  const sql = `
    SELECT 
      p.id, 
      p.name AS product_name, 
      p.admin_approval, 
      p.main_image_url, 
      u.first_name, 
      u.last_name
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    ORDER BY p.created_at DESC
  `;
  db.query(sql, callback);
};


exports.updateProductApprovalStatus = (productId, status, callback) => {
  const sql = `UPDATE products SET admin_approval = ? WHERE id = ?`;
  db.query(sql, [status, productId], callback);
};

exports.getBuyerStats = (callback) => {
  const sql = `
    SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 3) AS total_buyers,
    (SELECT COUNT(*) FROM users WHERE role = 3 AND user_status = 1 AND account_trashed = 0) AS active_buyers,
    (SELECT COUNT(*) FROM users WHERE role = 3 AND account_trashed = 1) AS trashed_accounts
  `;

  db.query(sql, (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

exports.getAllBuyersForAdmin = (callback) => {
  const sql = `
    SELECT 
      u.id AS user_id, 
      u.first_name, 
      u.last_name,
      u.email, 
      u.phone_number, 
      u.date_of_birth,
      ud.city,
      ud.profile_image
    FROM users u
    JOIN seller_details ud ON ud.user_id = u.id
    ORDER BY u.created_at DESC
  `;
  db.query(sql, callback);
};

exports.getSellerStats = (callback) => {
  const sql = `
    SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 2) AS total_sellers,
    (SELECT COUNT(*) FROM users WHERE role = 2 AND user_status = 1 AND account_trashed = 0) AS active_sellers,
    (SELECT COUNT(*) FROM users WHERE role = 2 AND account_trashed = 1) AS trashed_seller_accounts
  `;

  db.query(sql, (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

exports.getAllSellersForAdmin = (callback) => {
  const sql = `
    SELECT 
      u.id AS user_id, 
      u.first_name, 
      u.last_name,
      u.email, 
      u.phone_number, 
      u.date_of_birth, 
      u.gender,
      sd.office_address,
      sd.home_address,
      sd.profile_image,
      ss.store_name,
      ss.seller_id AS store_id,
      ss.store_link,
      ss.description,
      ss.store_created_date,
      ss.business_number,
      ss.store_image,
      bd.bank_name,
      bd.branch_location,
      bd.account_holder_name,
      bd.account_number,
      bd.ifsc_code 
    FROM users u
    JOIN seller_details sd ON sd.user_id = u.id
    JOIN seller_stores ss ON ss.seller_id = u.id
    JOIN users_bank_details bd ON bd.user_id = u.id
    ORDER BY u.created_at DESC
  `;
  db.query(sql, callback);
};