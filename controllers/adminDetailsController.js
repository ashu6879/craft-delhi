const adminModel = require('../models/adminModel');
require('dotenv').config();

exports.getDashboardStats = (req, res) => {
  const role = req.user.role;
    if (role != process.env.Admin_role_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    adminModel.getDashboardStats((err, stats) => {
      if (err) return res.status(500).json({ status: false, error: err });
      res.json({ status: true, data: stats });
    });
};

exports.adminProductsView = (req, res) => {
  const role = req.user.role;

  if (role != process.env.Admin_role_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  adminModel.getAllProductsForAdmin((err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch products', error: err });
    }
    res.status(200).json({ success: true, data: result });
  });
};

// adminController.js
exports.updateApprovalStatus = (req, res) => {
  const role = req.user.role;
  if (role != process.env.Admin_role_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { productId, status } = req.body;

  if (![1, 2].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Use 1 (Approve) or 2 (Reject).' });
  }

  adminModel.updateProductApprovalStatus(productId, status, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to update status', error: err });
    }

    // Emit product-specific update
    if (global.io) {
      global.io.emit('productApprovalStatusUpdated', { productId, status });

      // 🔄 Emit dashboard stats update
      adminModel.getDashboardStats((err, stats) => {
        if (!err && stats) {
          global.io.emit('dashboardStatsUpdate', stats);
        }
      });
    }

    res.status(200).json({ success: true, message: 'Status updated successfully' });
  });
};

exports.getBuyerStats = (req, res) => {
  const role = req.user.role;
    if (role != process.env.Admin_role_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    adminModel.getBuyerStats((err, stats) => {
      if (err) return res.status(500).json({ status: false, error: err });
      res.json({ status: true, data: stats });
    });
};

