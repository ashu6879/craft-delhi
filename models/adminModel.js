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

// adminModel.js
exports.updateSellerDetailsByAdmin = (user_id, data, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return callback(err);
      }

      const updatePromises = [];

      // 1️⃣ Update `users` table
      const userFields = ["first_name", "last_name", "email", "phone_number", "date_of_birth", "gender", "user_approval"];
      const userUpdates = userFields.filter(f => data[f] !== undefined);
      if (userUpdates.length) {
        const sql = `UPDATE users SET ${userUpdates.map(f => `${f}=?`).join(", ")} WHERE id=? AND role=?`;
        updatePromises.push(runQuery(connection, sql, [...userUpdates.map(f => data[f]), user_id, process.env.Seller_role_id]));
      }

      // 2️⃣ Update `seller_details` table
      const detailsFields = ["office_address", "home_address", "profile_image"];
      const detailsUpdates = detailsFields.filter(f => data[f] !== undefined);
      if (detailsUpdates.length) {
        const sql = `UPDATE seller_details SET ${detailsUpdates.map(f => `${f}=?`).join(", ")} WHERE user_id=?`;
        updatePromises.push(runQuery(connection, sql, [...detailsUpdates.map(f => data[f]), user_id]));
      }

      // 3️⃣ Update `seller_stores` table
      const storeFields = ["store_name", "store_link", "description", "store_created_date", "business_number", "store_image"];
      const storeUpdates = storeFields.filter(f => data[f] !== undefined);
      if (storeUpdates.length) {
        const sql = `UPDATE seller_stores SET ${storeUpdates.map(f => `${f}=?`).join(", ")} WHERE seller_id=?`;
        updatePromises.push(runQuery(connection, sql, [...storeUpdates.map(f => data[f]), user_id]));
      }

      // 4️⃣ Update `users_bank_details` table
      const bankFields = ["bank_name", "branch_location", "account_holder_name", "account_number", "ifsc_code"];
      const bankUpdates = bankFields.filter(f => data[f] !== undefined);
      if (bankUpdates.length) {
        const sql = `UPDATE users_bank_details SET ${bankUpdates.map(f => `${f}=?`).join(", ")} WHERE user_id=?`;
        updatePromises.push(runQuery(connection, sql, [...bankUpdates.map(f => data[f]), user_id]));
      }

      // Run all queries
      Promise.all(updatePromises)
        .then(() => {
          connection.commit((err) => {
            if (err) return rollback(err);
            connection.release();
            callback(null, { success: true });
          });
        })
        .catch(rollback);

      function rollback(error) {
        connection.rollback(() => {
          connection.release();
          callback(error);
        });
      }
    });
  });
};

// Helper to wrap queries in a Promise
function runQuery(connection, sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

exports.getSellerImages = (user_id, callback) => {
  const sql = `
    SELECT sd.profile_image, ss.store_image
    FROM users u
    JOIN seller_details sd ON sd.user_id = u.id
    JOIN seller_stores ss ON ss.seller_id = u.id
    WHERE u.id = ? AND u.role = ?
  `;
  db.query(sql, [user_id, process.env.Seller_role_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

exports.updateSellerApprovalStatus = (seller_id, status, callback) => {
  const sql = `UPDATE users SET user_approval = ? WHERE id = ?`;
  db.query(sql, [status, seller_id], callback);
};