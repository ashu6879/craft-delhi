const Order = require('../models/orderModel');
const authorizeAction = require('../utils/authorizeAction');

// ✅ Create Order
exports.createOrder = (req, res) => {
  const userId = req.user?.id;
  const { total_amount, order_status, payment_status, payment_type, shipping_address_id, items, buyer_note } = req.body;

  if (!userId) {
    return res.status(401).json({ status: false, message: 'Unauthorized: User ID not found' });
  }

  if (!total_amount || !payment_type || !shipping_address_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: false, message: 'Missing required fields' });
  }

  // ✅ Get seller_id from first item
  const seller_id = items[0].seller_id;

  const order_uid = `ORD${Date.now()}`; // Example: ORD1694712345678

  // Step 1: Insert order
  Order.createOrder(
    userId,
    { order_uid, total_amount, order_status, payment_status, payment_type, shipping_address_id, seller_id, buyer_note }, // ✅ add seller_id here
    (err, orderResult) => {
      if (err) {
        console.error('Order Insert Error:', err);
        return res.status(500).json({ status: false, message: 'Server error' });
      }

      const orderId = orderResult.insertId;

      // Step 2: Insert order items
      Order.createOrderItems(orderId, items, (err) => {
        if (err) {
          console.error('Order Items Insert Error:', err);
          return res.status(500).json({ status: false, message: 'Failed to insert order items' });
        }

        // Step 3: Fetch order with items
        Order.getOrderById(orderId, userId, (err, newOrder) => {
          if (err) {
            console.error('Fetch Error:', err);
            return res.status(500).json({ status: false, message: 'Failed to fetch order' });
          }

          return res.status(201).json({
            status: true,
            message: 'Order created successfully',
            data: newOrder
          });
        });
      });
    }
  );
};

exports.recentOrderbySeller = (req, res) => {
  const seller_id = req.user?.id;

  if (!seller_id) {
    return res.status(401).json({ status: false, message: 'Unauthorized: User ID not found' });
  }

  // You can limit recent orders to last 5 or 10 — customize as needed
  Order.getrecentOrdersbySellerID (seller_id, (err, orders) => {
    if (err) {
      console.error('Fetch Recent Orders Error:', err);
      return res.status(500).json({ status: false, message: 'Failed to fetch recent orders' });
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ status: false, message: 'No recent orders found' });
    }

    return res.status(200).json({
      status: true,
      message: 'Recent orders fetched successfully',
      data: orders
    });
  });
};

exports.updateOrderStatus = (req, res) => {
  const { order_id } = req.params;
  const { order_status } = req.body;
  const userId = req.user?.id;
  const roleId = req.user?.role;

  if (!order_id) {
    return res.status(400).json({ status: false, message: 'Order ID is required' });
  }

  if (typeof order_status === 'undefined') {
    return res.status(400).json({ status: false, message: 'Order status value is required' });
  }

  // 🔹 If Admin — can update any order
  if (roleId === parseInt(process.env.Admin_role_id)) {
    return Order.getOrderByIDforVerification(order_id, async (err, existingOrder) => {
      if (err || !existingOrder) {
        return res.status(404).json({ status: false, message: 'Order not found' });
      }

      await updateOrderStatusOnly(order_id, order_status, res);
    });
  }

  // 🔹 If Seller — must own the order
  authorizeAction(
    Order,
    order_id,
    userId,
    { getMethod: 'getOrderByIDforVerification', ownerField: 'seller_id' },
    async (authError, existingOrder) => {
      if (authError) {
        return res.status(authError.code).json({ status: false, message: authError.message });
      }

      await updateOrderStatusOnly(order_id, order_status, res);
    }
  );
};

// ✅ Helper Function
async function updateOrderStatusOnly(order_id, order_status, res) {
  try {
    Order.updateOrderByID(
      order_id,
      { order_status },
      (err, result) => {
        if (err) {
          console.error('DB update error:', err);
          return res.status(500).json({ status: false, message: 'Error updating order status' });
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
      }
    );
  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({ status: false, message: 'Error updating order status' });
  }
}

