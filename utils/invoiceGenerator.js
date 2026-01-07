const PDFDocument = require('pdfkit');

exports.generateInvoicePDF = (order, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  const fileName = `invoice-${order.order_uid}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fileName}"`
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  /* ================= PAGE BORDER ================= */
  doc
    .rect(20, 20, pageWidth - 40, pageHeight - 40)
    .lineWidth(1)
    .stroke('#cccccc');

  /* ================= HEADER BAR ================= */
  doc
    .rect(20, 20, pageWidth - 40, 80)
    .fill('#2c3e50');

  doc
    .fillColor('#ffffff')
    .fontSize(26)
    .text('INVOICE', 40, 45);

  doc
    .fontSize(10)
    .text('Craft Delhi', pageWidth - 220, 40, { align: 'right' })
    .text('info@craftdelhi.com', { align: 'right' })
    .text('+91-XXXXXXXXXX', { align: 'right' });

  doc.moveDown(5);
  doc.fillColor('#000000');

  /* ================= ORDER INFO ================= */
  doc
    .fontSize(10)
    .text(`Invoice No: ${order.order_uid}`)
    .text(`Invoice Date: ${new Date(order.created_at).toDateString()}`)
    .moveDown();

  /* ================= BILL TO ================= */
  doc
    .fontSize(12)
    .fillColor('#2c3e50')
    .text('BILL TO')
    .moveDown(0.5);

  doc
    .fillColor('#000000')
    .fontSize(10)
    .text(order.buyer_name)
    .text(order.email)
    .text(order.phone_number);

  doc.moveDown(1.5);

  /* ================= ITEMS TABLE ================= */
  const tableTop = doc.y;
  const itemX = 40;
  const qtyX = 300;
  const priceX = 360;
  const totalX = 450;

  // Table Header Background
  doc
    .rect(40, tableTop, pageWidth - 80, 25)
    .fill('#ecf0f1');

  doc
    .fillColor('#000000')
    .fontSize(10)
    .text('Product', itemX, tableTop + 7)
    .text('Qty', qtyX, tableTop + 7)
    .text('Price', priceX, tableTop + 7)
    .text('Total', totalX, tableTop + 7);

  doc.moveDown(2);

  let y = tableTop + 35;

  order.items.forEach((item, index) => {
    const itemTotal = item.quantity * item.price;

    doc
      .fontSize(10)
      .text(item.product_name, itemX, y)
      .text(item.quantity, qtyX, y)
      .text(`₹${item.price}`, priceX, y)
      .text(`₹${itemTotal}`, totalX, y);

    y += 22;
  });

  doc.moveDown(2);

  /* ================= TOTAL BOX ================= */
  const totalBoxY = y + 10;

  doc
    .rect(pageWidth - 260, totalBoxY, 220, 80)
    .fill('#f8f9fa')
    .stroke('#cccccc');

  doc
    .fillColor('#000000')
    .fontSize(12)
    .text('Total Amount', pageWidth - 240, totalBoxY + 15)
    .fontSize(16)
    .fillColor('#27ae60')
    .text(`₹${order.total_amount}`, {
      align: 'right',
      width: 180
    });

  doc.moveDown(6);

  /* ================= PAYMENT INFO ================= */
  doc
    .fillColor('#000000')
    .fontSize(10)
    .text(`Payment Method: ${order.payment_method}`)
    .text(`Payment ID: ${order.payment_uid}`);

  doc.moveDown(2);

  /* ================= FOOTER ================= */
  doc
    .fontSize(9)
    .fillColor('#7f8c8d')
    .text(
      'Thank you for shopping with us!\nThis is a computer-generated invoice.',
      { align: 'center' }
    );

  doc.end();
};
