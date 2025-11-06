const db = require('../config/db');

// Check if tracking exists for an order
exports.checkTrackingExists = (order_id, callback) => {
  const query = `SELECT id FROM order_tracking WHERE order_id = ?`;
  db.query(query, [order_id], callback);
};

// Add tracking info
exports.addTracking = (data, callback) => {
  const query = `
    INSERT INTO order_tracking 
    (order_id, tracking_company, tracking_number, tracking_link, estimated_delivery_from, estimated_delivery_to, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    query,
    [
      data.order_id,
      data.tracking_company,
      data.tracking_number,
      data.tracking_link,
      data.estimated_delivery_from,
      data.estimated_delivery_to,
      data.status || 0
    ],
    callback
  );
};

// Get tracking info by order ID
exports.getTrackingByOrderId = (order_id, callback) => {
  const query = `
    SELECT 
      id, order_id, tracking_company, tracking_number, tracking_link,
      estimated_delivery_from, estimated_delivery_to, status,
      created_at, updated_at
    FROM order_tracking
    WHERE order_id = ?
    ORDER BY created_at DESC
  `;
  db.query(query, [order_id], callback);
};

// Update tracking info
exports.updateTracking = (id, data, callback) => {
  // 🔹 Filter out undefined or null fields
  const filteredData = Object.keys(data)
    .filter(key => data[key] !== undefined && data[key] !== null)
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});

  if (Object.keys(filteredData).length === 0) {
    return callback(new Error('No valid tracking fields to update'), null);
  }

  // 🔹 Build SQL dynamically
  const fields = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
  const values = Object.values(filteredData);
  const sql = `UPDATE order_tracking SET ${fields} WHERE id = ?`;

  db.query(sql, [...values, id], callback);
};
