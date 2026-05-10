
// index.js
const app = require('./app');

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  if (typeof app.ensureDbConnection === 'function') {
    try {
      await app.ensureDbConnection();
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (err) {
      console.error('Failed to connect to MongoDB. Server will not start.', err.message);
      process.exit(1);
    }
  } else {
    console.warn('No database connection promise available. Starting server in test/mock mode.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
};

startServer();
 