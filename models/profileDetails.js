const db = require('../config/db');

exports.getProfileDetails = (userId, callback) => {
  const query = `
    SELECT 
    pd.phone_number,
    pd.email,
    pd.first_name,
    pd.last_name,
    pd.date_of_birth,
    pd.gender,
    od.city,
    od.home_address,
    od.profile_image,
    od.office_address
    FROM users pd
    LEFT JOIN seller_details od ON od.user_id = pd.id
    WHERE pd.id = ?
    LIMIT 1;
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null); // No store found

    return callback(null, results[0]); // Return the store row
  });
};

exports.getUserProfileDetails = (userId, callback) => {
  const query = `
    SELECT 
    pd.phone_number,
    pd.email,
    pd.first_name,
    pd.last_name,
    pd.date_of_birth,
    pd.gender,
    up.profile_image,
    ua.street,
    ua.city,
    ua.state,
    ua.country,
    ua.postal_code
    FROM users pd
    LEFT JOIN user_profile up ON up.user_id = pd.id
    LEFT JOIN user_addresses ua ON ua.user_id = pd.id
    WHERE pd.id = ?
    LIMIT 1;
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null); // No store found

    return callback(null, results[0]); // Return the store row
  });
};

exports.getProfileOtherDetails = (userId, callback) => {
  const query = `
    SELECT 
    od.city,
    od.home_address,
    od.profile_image,
    od.office_address
    FROM seller_details od
    WHERE od.user_id = ?
    LIMIT 1;
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null); // No store found

    return callback(null, results[0]); // Return the store row
  });
};


exports.createDetails = (user_id, callback) => {
  const query = `
    INSERT INTO seller_details (user_id, created_at)
    VALUES (?, NOW())
  `;
  db.query(query, [user_id], (err, result) => {
    if (err) return callback(err);
    return callback(null, result);
  });
};

exports.updateProfileDetails = (userId, data, callback) => {
  const userFields = [];
  const userValues = [];
  const detailFields = [];
  const detailValues = [];

  // Split fields between users and seller_details
  for (let key in data) {
    if (data[key] !== undefined) {
      if (["phone_number", "date_of_birth", "gender"].includes(key)) { // ✅ Added gender here
        userFields.push(`${key} = ?`);
        userValues.push(data[key]);
      } else if (["city", "home_address", "profile_image", "office_address"].includes(key)) {
        detailFields.push(`${key} = ?`);
        detailValues.push(data[key]);
      }
    }
  }

  const updateUser = () => {
    if (userFields.length === 0) {
      return Promise.resolve();
    }

    const userSql = `UPDATE users SET ${userFields.join(', ')} WHERE id = ?`;
    userValues.push(userId);

    return new Promise((resolve, reject) => {
      db.query(userSql, userValues, (err, result) => {
        if (err) {
          console.error("User Update Error:", err);
          return reject(err);
        }
        resolve(result);
      });
    });
  };

  const updateDetails = () => {
    if (detailFields.length === 0) {
      return Promise.resolve();
    }

    const updateDetailFields = [...detailFields, `updated_at = NOW()`];
    const detailSql = `UPDATE seller_details SET ${updateDetailFields.join(', ')} WHERE user_id = ?`;
    detailValues.push(userId);

    return new Promise((resolve, reject) => {
      db.query(detailSql, detailValues, (err, result) => {
        if (err) {
          console.error("Details Update Error:", err);
          return reject(err);
        }
        resolve(result);
      });
    });
  };

  // Run both updates
  Promise.all([updateUser(), updateDetails()])
    .then(([userRes, detailRes]) => {
      callback(null, {
        userUpdate: userRes || { affectedRows: 0 },
        detailUpdate: detailRes || { affectedRows: 0 }
      });
    })
    .catch(err => {
      console.error("Update Error (Promise.all):", err);
      callback(err, null);
    });
};


exports.getProfileIdforAuth = (userId, callback) => {
  const query = `SELECT * FROM users WHERE id = ? LIMIT 1`;
  db.query(query, [userId], (err, results) => {
    if (err) return callback(err, null);
    return callback(null, results[0] || null);
  });
};

exports.createBankDetails = (userId, callback) => {
  const sql = `INSERT INTO users_bank_details (user_id) VALUES (?)`;
  db.query(sql, [userId], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};

// 3. Update bank details
exports.updateBankDetails = (userId, updateData, callback) => {
  const {
    bank_name,
    branch_location,
    account_holder_name,
    account_number,
    ifsc_code
  } = updateData;

  const sql = `
    UPDATE users_bank_details
    SET bank_name = ?, branch_location = ?, account_holder_name = ?, account_number = ?, ifsc_code = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `;

  db.query(sql, [
    bank_name,
    branch_location,
    account_holder_name,
    account_number,
    ifsc_code,
    userId
  ], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};

// 4. (Optional) For authorization logic
exports.getBankDetailsForAuth = (userId, callback) => {
  const sql = `SELECT user_id FROM users_bank_details WHERE user_id = ? LIMIT 1`;
  db.query(sql, [userId], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0] || null);
  });
};



exports.getBankDetails = (userId, callback) => {
  const query = `
    SELECT 
      UBD.bank_name,
      UBD.branch_location,
      UBD.account_holder_name,
      UBD.account_number,    
      UBD.ifsc_code
    FROM users_bank_details UBD
    WHERE UBD.user_id = ?
    LIMIT 1;
  `;


  db.query(query, [userId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null); // No store found

    return callback(null, results[0]); // Return the store row
  });
};

exports.updateUserProfileDetails = (userId, data, callback) => {
  const userFields = [];
  const userValues = [];
  const detailFields = [];
  const detailValues = [];
  const addressFields = [];
  const addressValues = [];

  for (let key in data) {
    if (data[key] !== undefined) {
      if (
        ["phone_number", "date_of_birth", "gender", "first_name", "last_name", "email"].includes(key)
      ) {
        userFields.push(`${key} = ?`);
        userValues.push(data[key]);
      }
      else if (key === "profile_image") {
        detailFields.push(`${key} = ?`);
        detailValues.push(data[key]);
      }
      else if (
        ["city", "street", "postal_code", "country", "state"].includes(key)
      ) {
        addressFields.push(`${key} = ?`);
        addressValues.push(data[key]);
      }
    }
  }

  /* ---------- USERS TABLE ---------- */
  const updateUser = () => {
    if (userFields.length === 0) return Promise.resolve();

    const sql = `UPDATE users SET ${userFields.join(", ")} WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.query(sql, [...userValues, userId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };

  /* ---------- USER PROFILE (UPSERT) ---------- */
  const updateDetails = () => {
    if (detailFields.length === 0) return Promise.resolve();

    const sql = `
      INSERT INTO user_profile (user_id, profile_image)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        profile_image = VALUES(profile_image),
        updated_at = NOW()
    `;

    return new Promise((resolve, reject) => {
      db.query(sql, [userId, detailValues[0]], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };

  /* ---------- USER ADDRESS ---------- */
  const updateAddress = () => {
    if (addressFields.length === 0) {
      return Promise.resolve();
    }

    const columns = addressFields.map(f => f.split(" = ")[0]);

    const sql = `
      INSERT INTO user_addresses (user_id, ${columns.join(", ")})
      VALUES (?, ${columns.map(() => "?").join(", ")})
      ON DUPLICATE KEY UPDATE
        ${columns.map(col => `${col} = VALUES(${col})`).join(", ")},
        updated_at = NOW()
    `;

    const values = [userId, ...addressValues];

    return new Promise((resolve, reject) => {
      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("User Address Upsert Error:", err);
          return reject(err);
        }
        resolve(result);
      });
    });
  };
  
  /* ---------- RUN ALL ---------- */
  Promise.all([updateUser(), updateDetails(), updateAddress()])
    .then(([userRes, detailRes, addressRes]) => {
      callback(null, {
        userUpdate: userRes || { affectedRows: 0 },
        profileUpdate: detailRes || { affectedRows: 0 },
        addressUpdate: addressRes || { affectedRows: 0 }
      });
    })
    .catch(err => {
      console.error("Update Error:", err);
      callback(err);
    });
};
