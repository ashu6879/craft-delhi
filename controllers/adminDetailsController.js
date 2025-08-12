const adminModel = require('../models/adminModel');
require('dotenv').config();
const { uploadToS3, getS3KeyFromUrl } = require('../utils/s3Uploader');
const { deleteFilesFromS3 } = require('../utils/deleteFilesFromS3');

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

exports.adminBuyersView = (req, res) => {
  const role = req.user.role;

  if (role != process.env.Admin_role_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  adminModel.getAllBuyersForAdmin((err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch Buyers', error: err });
    }
    res.status(200).json({ success: true, data: result });
  });
};

exports.getSellersStats = (req, res) => {
  const role = req.user.role;
    if (role != process.env.Admin_role_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    adminModel.getSellerStats((err, stats) => {
      if (err) return res.status(500).json({ status: false, error: err });
      res.json({ status: true, data: stats });
    });
};

exports.adminSellersView = (req, res) => {
  const role = req.user.role;

  if (role != process.env.Admin_role_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  adminModel.getAllSellersForAdmin((err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch Buyers', error: err });
    }
    res.status(200).json({ success: true, data: result });
  });
};

// adminController.js
exports.updateSellerbyAdmin = (req, res) => {
  const role = req.user.role;
  if (role != process.env.Admin_role_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { user_id } = req.body;
  if (!user_id || isNaN(user_id)) {
    return res.status(400).json({ success: false, message: 'Invalid seller ID' });
  }

  // Get existing images for deletion if new ones are uploaded
  adminModel.getSellerImages(user_id, async (err, sellerImages) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to fetch seller images' });
    if (!sellerImages) return res.status(404).json({ success: false, message: 'Seller not found' });
    try {
      let profile_image_url = undefined;
      let store_image_url = undefined;

      // Handle profile_image
      if (req.files?.profile_image?.[0]) {
        if (sellerImages.profile_image) {
          const oldKey = getS3KeyFromUrl(sellerImages.profile_image);
          if (oldKey) await deleteFilesFromS3([oldKey], process.env.AWS_BUCKET_NAME);
        }
        profile_image_url = await uploadToS3(req.files.profile_image[0], 'profile_images');
      }

      // Handle store_image
      if (req.files?.store_image?.[0]) {
        if (sellerImages.store_image) {
          const oldKey = getS3KeyFromUrl(sellerImages.store_image);
          if (oldKey) await deleteFilesFromS3([oldKey], process.env.AWS_BUCKET_NAME);
        }
        store_image_url = await uploadToS3(req.files.store_image[0], 'store_images');
      }

      // Build updateData dynamically
      const updateData = { ...req.body };
      if (profile_image_url) updateData.profile_image = profile_image_url;
      if (store_image_url) updateData.store_image = store_image_url;

      // Call model to update only provided fields
      adminModel.updateSellerDetailsByAdmin(user_id, updateData, (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to update seller details' });
        res.status(200).json({ success: true, message: 'Seller details updated successfully' });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Image upload/update failed' });
    }
  });
};

exports.updateSellerStatus = (req, res) => {
  const role = req.user.role;
  if (role != process.env.Admin_role_id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { seller_id, user_approval } = req.body;

  if (![1, 2].includes(user_approval)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Use 1 (Approve) or 2 (Reject).' });
  }

  adminModel.updateSellerApprovalStatus(seller_id, user_approval, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Failed to update status', error: err });
    }

    res.status(200).json({ success: true, message: 'Status updated successfully' });
  });
};