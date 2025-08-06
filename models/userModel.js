const db = require('../config/db');

exports.findByEmail = (email, callback) => {
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], callback);
};

exports.verifyEmail = (email, callback) => {
  db.query('UPDATE users SET is_email_verified = true WHERE email = ?', [email], callback);
};

exports.createEmailRecord = (email, callback) => {
  db.query('INSERT INTO users (email) VALUES (?)', [email], callback);
};

exports.updateUserDetails = (userData, callback) => {
  const { email, first_name, last_name, password, phone_number, dob, role } = userData;
  const sql = `
    UPDATE users SET 
      first_name = ?, last_name = ?, password = ?, 
      phone_number = ?, date_of_birth = ?, user_status = true, 
      user_approval = 0, role = ?
    WHERE email = ? AND is_email_verified = true
  `;
  db.query(sql, [first_name, last_name, password, phone_number, dob, role, email], callback);
};

exports.markEmailVerified = (email, callback) => {
    db.query(
      'UPDATE users SET is_email_verified = true WHERE email = ?',
      [email],
      callback
    );
};
  
exports.createEmailOnlyUser = (email, callback) => {
    db.query('INSERT INTO users (email) VALUES (?)', [email], callback);
};

exports.updatePasswordByEmail = (email, newPassword, callback) => {
  const sql = 'UPDATE users SET password = ? WHERE email = ?';
  db.query(sql, [newPassword, email], callback);
};
  


exports.tempApproval = (email,status, callback) => {
  db.query(
    'UPDATE users SET user_approval = ? WHERE email = ?',
    [status,email],
    callback
  );
};

exports.makeAccountTrash = (id, callback) => {
  db.query(
    'UPDATE users SET account_trashed = 1 WHERE id = ?',
    [id],
    callback
  );
};
