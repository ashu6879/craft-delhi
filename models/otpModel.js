const db = require('../config/db');

exports.saveOtp = (email, otp, expires_at, callback) => {
  db.query(
    'INSERT INTO email_verifications (email, otp, expires_at) VALUES (?, ?, ?)',
    [email, otp, expires_at],
    callback
  );
};

exports.findValidOtp = (email, otp, callback) => {
  // Delete expired OTPs before checking valid ones
  db.query('DELETE FROM email_verifications WHERE expires_at <= NOW()', (deleteErr) => {
    if (deleteErr) return callback(deleteErr);

    const sql = `
      SELECT * FROM email_verifications 
      WHERE email = ? AND otp = ? AND verified = false AND expires_at > NOW()
      ORDER BY id DESC LIMIT 1
    `;
    db.query(sql, [email, otp], callback);
  });
};


exports.markOtpVerified = (id, callback) => {
  db.query(
    'UPDATE email_verifications SET verified = true WHERE id = ?',
    [id],
    callback
  );
};
