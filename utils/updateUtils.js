const Order = require('../models/orderModel');
const orderTrackingModel = require('../models/orderTrackingModel');

/**
 * Updates an order and optionally adds/updates its tracking info.
 *
 * @param {number} order_id - The ID of the order to update.
 * @param {object} orderData - The fields to update in order_details.
 * @param {object} trackingData - The tracking details (optional).
 * @param {object} res - Express response object.
 */

exports.handleOrderAndTrackingUpdate = async (order_id, orderData, trackingData, res) => {
  try {
    const hasOrderFields = Object.keys(orderData || {}).length > 0;
    const hasTrackingFields =
      trackingData.tracking_company ||
      trackingData.tracking_number ||
      trackingData.tracking_link ||
      trackingData.estimated_delivery_from ||
      trackingData.estimated_delivery_to ||
      trackingData.status !== undefined;

    // 🧱 Step 1️⃣ — Update order details (only if orderData has valid fields)
    if (hasOrderFields) {
      await new Promise((resolve, reject) => {
        Order.updateOrderByID(order_id, orderData, (err, result) => {
          if (err) {
            console.error('❌ Order update error:', err);
            return reject('Error updating order details');
          }
          resolve(result);
        });
      });
    }

    // 🧭 Step 2️⃣ — Add or update tracking info (only if tracking data provided)
    if (hasTrackingFields) {
      // 🔹 Filter out undefined/null tracking fields
      const validTrackingData = {};
      Object.keys(trackingData).forEach(key => {
        if (trackingData[key] !== undefined && trackingData[key] !== null) {
          validTrackingData[key] = trackingData[key];
        }
      });

      // Check if tracking already exists
      orderTrackingModel.checkTrackingExists(order_id, (checkErr, result) => {
        if (checkErr) {
          console.error('❌ Tracking check error:', checkErr);
          return res.status(500).json({
            status: false,
            message: 'Error checking tracking info',
          });
        }

        if (result.length > 0) {
          // 🔄 Update existing tracking record
          orderTrackingModel.updateTracking(result[0].id, validTrackingData, (updateErr) => {
            if (updateErr) {
              console.error('❌ Tracking update error:', updateErr);
              return res.status(500).json({
                status: false,
                message: 'Error updating tracking info',
              });
            }

            // ✅ Conditional response
            return res.status(200).json({
              status: true,
              message: hasOrderFields
                ? 'Order and tracking details updated successfully'
                : 'Tracking details updated successfully',
            });
          });
        } else {
          // ➕ Insert new tracking record
          orderTrackingModel.addTracking(validTrackingData, (addErr) => {
            if (addErr) {
              console.error('❌ Tracking insert error:', addErr);
              return res.status(500).json({
                status: false,
                message: 'Error adding tracking info',
              });
            }

            // ✅ Conditional response
            return res.status(200).json({
              status: true,
              message: hasOrderFields
                ? 'Order details updated and tracking added successfully'
                : 'Tracking details added successfully',
            });
          });
        }
      });
    } else if (hasOrderFields) {
      // ✅ Only order updated
      return res.status(200).json({
        status: true,
        message: 'Order details updated successfully',
      });
    } else {
      // 🚫 Nothing to update
      return res.status(400).json({
        status: false,
        message: 'No valid data provided to update',
      });
    }
  } catch (error) {
    console.error('❌ Order update error:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
    });
  }
};



exports.updateOrderStatusOnly = async (order_id, order_status, res) => {
  try {
    Order.updateOrderByID(order_id, { order_status }, (err, result) => {
      if (err) {
        console.error('❌ DB update error:', err);
        return res.status(500).json({
          status: false,
          message: 'Error updating order status'
        });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: 'Order status updated successfully'
        });
      } else {
        return res.status(400).json({
          status: false,
          message: 'No order updated (possibly same status)'
        });
      }
    });
  } catch (error) {
    console.error('❌ Status update error:', error);
    return res.status(500).json({
      status: false,
      message: 'Error updating order status'
    });
  }
};

exports.addTrackingAuthorized = async (order_id, trackingData, res) => {
  try {
    // 🔹 Check if tracking already exists for this order
    orderTrackingModel.checkTrackingExists(order_id, (checkErr, result) => {
      if (checkErr) {
        console.error('❌ Error checking tracking info:', checkErr);
        return res.status(500).json({
          status: false,
          message: 'Server error while checking tracking info.'
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          status: false,
          message: 'Tracking info already exists for this order. Use update API.'
        });
      }

      // 🔹 Filter out undefined or null fields before insert
      const filteredData = Object.keys(trackingData)
        .filter(key => trackingData[key] !== undefined && trackingData[key] !== null)
        .reduce((obj, key) => {
          obj[key] = trackingData[key];
          return obj;
        }, {});

      // 🔹 Add new tracking info
      orderTrackingModel.addTracking(filteredData, (err, result) => {
        if (err) {
          console.error('❌ Error adding tracking info:', err);
          return res.status(500).json({
            status: false,
            message: 'Failed to add tracking info.'
          });
        }

        return res.status(201).json({
          status: true,
          message: 'Tracking info added successfully.',
          id: result.insertId
        });
      });
    });
  } catch (error) {
    console.error('❌ Error in addTrackingAuthorized:', error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error while adding tracking info.'
    });
  }
};

exports.updateTrackingAuthorized = async (id, data, res) => {
  orderTrackingModel.updateTracking(id, data, (err, result) => {
    if (err) {
      console.error('Error updating tracking info:', err);
      return res.status(500).json({ message: 'Failed to update tracking info.' });
    }
    res.status(200).json({ message: 'Tracking info updated successfully.' });
  });
};
