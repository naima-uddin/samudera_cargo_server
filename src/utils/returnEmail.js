// utils/email.js
const nodemailer = require('nodemailer');
const {
  getFromAddress,
  getReplyToAddress
} = require('../config/email');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: { rejectUnauthorized: false }
});

const sendEmail = async (options) => {
  try {
    // Email options
    const mailOptions = {
      from: `"Samudera Traffic Co., Ltd." <${getFromAddress()}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: getReplyToAddress(),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

module.exports = sendEmail;