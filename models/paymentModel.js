// models/payment.model.js
const db = require("../config/db");

exports.createPayment = (orderId, paymentData, callback) => {
  const { payment_uid, payment_type, payment_status, payment_method } = paymentData;

  const paymentQuery = `
    INSERT INTO payments 
      (order_id, payment_uid, payment_type, payment_status, payment_method)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    paymentQuery,
    [orderId, payment_uid, payment_type, payment_status, payment_method],
    (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    }
  );
};
