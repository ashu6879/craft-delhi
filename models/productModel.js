const db = require('../config/db');

exports.insert = (data) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO products SET ?';
    db.query(query, data, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};
