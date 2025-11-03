const db = require('../config/db');

// ✅ Create a new order
exports.createOrder = (userId, data, callback) => {
  const {
    order_uid,
    total_amount,
    order_status,
    payment_status,
    payment_type,
    shipping_address_id,
    seller_id,
    buyer_note // ✅ added seller_id
  } = data;

  const query = `
    INSERT INTO order_details 
      (order_uid, user_id, total_amount, order_status, payment_status, payment_type, shipping_address_id, seller_id, buyer_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [order_uid, userId, total_amount, order_status, payment_status, payment_type, shipping_address_id, seller_id, buyer_note],
    (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    }
  );
};


// ✅ Insert multiple order items
exports.createOrderItems = (orderId, items, callback) => {
  if (!Array.isArray(items) || items.length === 0) {
    return callback(null, { affectedRows: 0 }); // No items to insert
  }

  const values = items.map(item => [
    orderId,
    item.product_id,
    item.quantity,
    item.price,
    item.quantity * item.price // calculate subtotal
  ]);

  const query = `
    INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
    VALUES ?
  `;

  db.query(query, [values], (err, result) => {
    if (err) return callback(err, null);
    callback(null, result);
  });
};

// ✅ Get order with items
exports.getOrderById = (orderId, userId, callback) => {
  const query = `
    SELECT 
      od.id AS order_id,
      od.order_uid,
      od.user_id,
      od.total_amount,
      od.order_status,
      od.payment_status,
      od.payment_type,
      od.shipping_address_id,
      od.buyer_note,
      od.created_at,
      oi.id AS item_id,
      oi.product_id,
      oi.quantity,
      oi.price,
      oi.subtotal
    FROM order_details od
    LEFT JOIN order_items oi ON oi.order_id = od.id
    WHERE od.id = ? AND od.user_id = ?
  `;

  db.query(query, [orderId, userId], (err, results) => {
    if (err) return callback(err, null);

    if (!results.length) return callback(null, null); // no order found

    const order = {
      order_id: results[0].order_id,
      order_uid: results[0].order_uid,
      user_id: results[0].user_id,
      total_amount: results[0].total_amount,
      order_status: results[0].order_status,
      payment_status: results[0].payment_status,
      payment_type: results[0].payment_type,
      shipping_address_id: results[0].shipping_address_id,
      buyer_note: results[0].buyer_note,
      created_at: results[0].created_at,
      items: results.map(r => ({
        item_id: r.item_id,
        product_id: r.product_id,
        quantity: r.quantity,
        price: r.price,
        subtotal: r.subtotal
      }))
    };

    callback(null, order);
  });
};

exports.getrecentOrdersbySellerID = (sellerId, callback) => {
  const query = `
    SELECT 
      od.id AS order_id,
      od.order_uid,
      od.user_id,
      od.total_amount,
      od.order_status,
      od.payment_status,
      od.payment_type,
      od.shipping_address_id,
      od.buyer_note,
      od.seller_id,
      od.created_at,
      oi.id AS item_id,
      oi.product_id,
      oi.quantity,
      oi.price,
      oi.subtotal,
      u.first_name,
      u.last_name,
      p.name AS product_name,
      ua.street,
      ua.city,
      ua.state,
      ua.country,
      ua.postal_code
    FROM order_details od
    LEFT JOIN order_items oi ON oi.order_id = od.id
    LEFT JOIN users u ON u.id = od.user_id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN user_addresses ua ON ua.id = od.shipping_address_id
    WHERE od.seller_id = ?
    ORDER BY od.created_at DESC
  `;

  db.query(query, [sellerId], (err, results) => {
    if (err) return callback(err, null);
    if (!results.length) return callback(null, []);

    // ✅ Group items under each order
    const ordersMap = {};

    results.forEach(row => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          order_id: row.order_id,
          order_uid: row.order_uid,
          user_id: row.user_id,
          buyer_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          total_amount: row.total_amount,
          order_status: row.order_status,
          payment_status: row.payment_status,
          payment_type: row.payment_type,
          shipping_address_id: row.shipping_address_id,
          shipping_info: `${row.street || ''} ${row.city || ''} ${row.state || ''} ${row.country || ''} ${row.postal_code || ''}`.trim(),
          buyer_note: results[0].buyer_note,
          seller_id: row.seller_id,
          created_at: row.created_at,
          items: []
        };
      }

      if (row.item_id) {
        ordersMap[row.order_id].items.push({
          item_id: row.item_id,
          product_id: row.product_id,
          product_name: row.product_name,
          quantity: row.quantity,
          price: row.price,
          subtotal: row.subtotal
        });
      }
    });

    const orders = Object.values(ordersMap);
    callback(null, orders);
  });
};

