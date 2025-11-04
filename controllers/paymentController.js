const Payment = require('../models/paymentModel');

exports.getselleryPaymentSummary = (req, res) => {
  const sellerId = req.user?.id;

  if (req.user.role !== 2) {
    return res.status(403).json({ status: false, message: 'Only sellers can access store details.' });
  }

  if (!sellerId || isNaN(sellerId)) {
    return res.status(400).json({ status: false, message: 'Invalid seller ID' });
  }

  Payment.getPaymentSummary(sellerId, (err, paymentSummary) => {
    if (err) {
      console.error('MySQL error:', err);
      return res.status(500).json({ status: false, message: 'Internal server error' });
    }

    if (!paymentSummary) {
      return res.status(404).json({ status: false, message: 'payment summary not found for this seller' });
    }

    return res.status(200).json({
      status: true,
      message: 'payment summary fetched successfully.',
      paymentSummary
    });
  });
};

exports.getselleryPaymentHistory = (req, res) => {
  const seller_id = req.user?.id;

  if (!seller_id) {
    return res.status(401).json({ status: false, message: 'Unauthorized: User ID not found' });
  }

  // You can limit recent orders to last 5 or 10 — customize as needed
  Payment.getpaymentHistorybySellerID (seller_id, (err, paymentHistory) => {
    if (err) {
      console.error('Fetch Recent Orders Error:', err);
      return res.status(500).json({ status: false, message: 'Failed to fetch recent orders' });
    }

    if (!paymentHistory || paymentHistory.length === 0) {
      return res.status(404).json({ status: false, message: 'No recent orders found' });
    }

    return res.status(200).json({
      status: true,
      message: 'Payment history fetched successfully',
      data: paymentHistory
    });
  });
};