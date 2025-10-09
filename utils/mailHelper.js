const nodemailer = require('nodemailer');

// Configure transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // e.g. support@craftdelhi.com
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email using nodemailer with a professional Craft Delhi template
 * @param {Object} options
 * @param {string} options.to - Recipient's email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version
 * @param {string} options.title - Main heading inside email
 * @param {string} options.message - Main message content (HTML-safe)
 * @returns {Promise}
 */
const sendEmail = async ({ to, subject, text, title, message }) => {
  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 40px 0; text-align: center;">
    <table align="center" width="600" cellpadding="0" cellspacing="0"
      style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;">
      <tr>
        <td style="background: linear-gradient(90deg, #ff6600, #ff8533); padding: 20px 0; color: white; font-size: 22px; font-weight: bold;">
          ${subject}
        </td>
      </tr>
      <tr>
        <td style="padding: 30px;">
          ${title ? `<h2 style="color: #333; margin-bottom: 15px;">${title}</h2>` : ''}
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            ${message}
          </p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f1f1f1; padding: 15px; font-size: 12px; color: #777;">
          © ${new Date().getFullYear()} <strong>Craft Delhi</strong>. All rights reserved.<br/>
          Need help? <a href="mailto:support@craftdelhi.com" style="color:#ff6600; text-decoration:none;">Contact Support</a>
        </td>
      </tr>
    </table>
  </div>`;

  const mailOptions = {
    from: `"Craft Delhi" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
