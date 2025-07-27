const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email using nodemailer
 * @param {Object} options
 * @param {string} options.to - Recipient's email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email body (plain text)
 * @param {string} [options.html] - Optional HTML body
 * @returns {Promise}
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
