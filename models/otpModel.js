const db = require('../config/db');

exports.saveOtp = (email, otp, expires_at, otp_type = 'email_verification', callback) => {
  db.query(
    'INSERT INTO email_verifications (email, otp, expires_at, otp_type) VALUES (?, ?, ?, ?)',
    [email, otp, expires_at, otp_type],
    callback
  );
};


exports.findValidOtp = (email, otp, otpType, callback) => {
  db.query('DELETE FROM email_verifications WHERE expires_at <= NOW()', (deleteErr) => {
    if (deleteErr) return callback(deleteErr);

    const sql = `
      SELECT * FROM email_verifications 
      WHERE email = ? AND otp = ? AND verified = false AND otp_type = ? AND expires_at > NOW()
      ORDER BY id DESC LIMIT 1
    `;
    db.query(sql, [email, otp, otpType], callback);
  });
};


exports.markOtpVerified = (id, callback) => {
  db.query(
    'UPDATE email_verifications SET verified = true WHERE id = ?',
    [id],
    callback
  );
};

exports.clearOtpVerification = (email, otp_type, callback) => {
  db.query(
    'DELETE FROM email_verifications WHERE email = ? AND otp_type = ?',
    [email, otp_type],
    callback
  );
};

exports.checkIfOtpVerified = (email, otp_type, callback) => {
  const sql = `
    SELECT COUNT(*) as count FROM email_verifications 
    WHERE email = ? AND otp_type = ? AND verified = true
  `;
  db.query(sql, [email, otp_type], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0].count > 0);
  });
};
