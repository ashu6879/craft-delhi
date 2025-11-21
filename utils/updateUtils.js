const Order = require('../models/orderModel');
const Payment = require('../models/paymentModel');
const orderTrackingModel = require('../models/orderTrackingModel');

/**
 * Updates an order and optionally adds/updates its tracking info.
 *
 * @param {number} order_id - The ID of the order to update.
 * @param {object} orderData - The fields to update in order_details.
 * @param {object} trackingData - The tracking details (optional).
 * @param {object} res - Express response object.
 */

exports.handleOrderAndTrackingUpdate = async (order_id, orderData = {}, trackingData = {}, paymentData = {}, res) => {
  try {
    const hasOrderFields = Object.keys(orderData).length > 0;
    const hasPaymentFields = Object.keys(paymentData).length > 0;

    const hasTrackingFields = Object.values(trackingData).some(
      (v) => v !== undefined && v !== null && v !== ""
    );

    // Convert callbacks to promises
    const updateOrder = (order_id, data) =>
      new Promise((resolve, reject) => {
        Order.updateOrderByID(order_id, data, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    const updatePayment = (order_id, data) =>
      new Promise((resolve, reject) => {
        Payment.updatePaymentByOrderID(order_id, data, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    const checkTracking = (order_id) =>
      new Promise((resolve, reject) => {
        orderTrackingModel.checkTrackingExists(order_id, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    const updateTracking = (id, data) =>
      new Promise((resolve, reject) => {
        orderTrackingModel.updateTracking(id, data, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    const addTracking = (data) =>
      new Promise((resolve, reject) => {
        orderTrackingModel.addTracking(data, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    // 1️⃣ Update Order
    if (hasOrderFields) {
      await updateOrder(order_id, orderData);
    }

    // 2️⃣ Update Payment
    if (hasPaymentFields) {
      await updatePayment(order_id, paymentData);
    }

    // 3️⃣ Tracking update
    if (hasTrackingFields) {
      const validTrackingData = {};
      Object.keys(trackingData).forEach((key) => {
        if (trackingData[key] !== undefined && trackingData[key] !== null) {
          validTrackingData[key] = trackingData[key];
        }
      });

      const trackingResult = await checkTracking(order_id);

      if (trackingResult.length > 0) {
        await updateTracking(trackingResult[0].id, validTrackingData);
      } else {
        await addTracking(validTrackingData);
      }

      return res.status(200).json({
        status: true,
        message:
          hasOrderFields
            ? "Order and tracking details updated successfully"
            : hasPaymentFields
            ? "Payment and tracking details updated successfully"
            : "Tracking details updated successfully",
      });
    }

    // 4️⃣ Only order updated
    if (hasOrderFields) {
      return res.status(200).json({
        status: true,
        message: "Order details updated successfully",
      });
    }

    // 5️⃣ Only payment updated (ADDED THIS)
    if (hasPaymentFields) {
      return res.status(200).json({
        status: true,
        message: "Payment details updated successfully",
      });
    }

    // 6️⃣ Nothing provided
    return res.status(400).json({
      status: false,
      message: "No valid data provided to update",
    });

  } catch (error) {
    console.error("❌ Order update error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
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

exports.runQuery = (connection, sql, params) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};
