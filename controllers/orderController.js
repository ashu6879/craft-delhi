const Order = require('../models/orderModel');

// ✅ Create Order
exports.createOrder = (req, res) => {
  const userId = req.user?.id;
  const { total_amount, order_status, payment_status, payment_type, shipping_address_id, items } = req.body;

  if (!userId) {
    return res.status(401).json({ status: false, message: 'Unauthorized: User ID not found' });
  }

  if (!total_amount || !payment_type || !shipping_address_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: false, message: 'Missing required fields' });
  }

  // Step 1: Insert order
  Order.createOrder(
    userId,
    { total_amount, order_status, payment_status, payment_type, shipping_address_id },
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
