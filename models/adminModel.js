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
