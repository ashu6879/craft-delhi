const db = require('../config/db');

// ✅ Insert a new address
exports.createAddress = (userId, data, callback) => {
  const query = `
    INSERT INTO user_addresses (user_id, street, city, state, country, postal_code)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [userId, data.street, data.city, data.state, data.country, data.postal_code], (err, result) => {
    if (err) return callback(err, null);
    callback(null, result);
  });
};

// ✅ Get all addresses
exports.getAllAddresses = (callback) => {
  const sql = 'SELECT * FROM user_addresses';
  db.query(sql, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

// ✅ Get address by ID
exports.getAddressByID = (id, callback) => {
  const sql = 'SELECT * FROM user_addresses WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results[0]);
  });
};

// ✅ Delete address by ID
exports.deleteAddressByID = (id, callback) => {
  const sql = 'DELETE FROM user_addresses WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};

// ✅ Update address by ID
exports.updateAddressByID = (id, data, callback) => {
  const fields = [];
  const values = [];

  for (let key in data) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    return callback(null, { affectedRows: 0 }); // No update fields provided
  }

  const sql = `UPDATE user_addresses SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);

  db.query(sql, values, (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results);
  });
};
