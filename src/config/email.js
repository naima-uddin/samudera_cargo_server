const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

const getFrontendUrl = () => (
  normalize(
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL
  ).replace(/\/$/, '')
);

const getFromAddress = () => (
  normalize(process.env.EMAIL_FROM || process.env.SMTP_USER)
);

const getReplyToAddress = () => (
  normalize(process.env.EMAIL_REPLY_TO || getFromAddress())
);

const getSupportAddress = () => (
  normalize(process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM_INFO || process.env.SMTP_USER_INFO || getFromAddress())
);

const getAdminNotificationAddresses = () => (
  [...new Set([
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_DEFAULT_EMAIL,
    process.env.SMTP_USER_INFO,
    process.env.SMTP_USER,
    getSupportAddress()
  ].map(normalize).filter(Boolean))]
);

module.exports = {
  getFrontendUrl,
  getFromAddress,
  getReplyToAddress,
  getSupportAddress,
  getAdminNotificationAddresses
};
