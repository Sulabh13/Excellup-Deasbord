const nodemailer = require('nodemailer');

/**
 * Send an email using Nodemailer + SMTP credentials from environment.
 * @param {Object} options
 * @param {string} options.to       - Recipient email address
 * @param {string} options.subject  - Email subject
 * @param {string} options.html     - HTML body of the email
 * @param {string} [options.text]   - Plain text fallback
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Excellup Coaching" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    ...(options.text && { text: options.text }),
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
