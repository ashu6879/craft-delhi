const Order = require('../models/orderModel');

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
