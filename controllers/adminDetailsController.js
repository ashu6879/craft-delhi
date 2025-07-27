const adminModel = require('../models/adminModel');

exports.getDashboardStats = (req, res) => {
  adminModel.getDashboardStats((err, stats) => {
    if (err) return res.status(500).json({ status: false, error: err });
    res.json({ status: true, data: stats });
  });
};