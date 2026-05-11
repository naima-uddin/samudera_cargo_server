// app.js - WITH GOOGLE AUTH SUPPORT
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const seedDefaultAdmin = require('./createDefaultAdminSeed');
const route = require('./src/routes/api');
const quoteRoutes = require('./src/service/quoteTamplate');
const contactRoutes = require('./src/service/contactTamplate');
const authRoutes = require('./src/routes/AuthRoutes'); // NEW: Google auth routes
const app = express();

const allowedOrigins = [
  'https://samuderathai.com',
  'https://api.samuderathai.com',
  'https://samuderathai.com',
  'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:8000',
  'https://samudera-cargo-server.vercel.app'
];

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow Vercel preview/prod domains and the production custom domains.
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
    return true;
  }

  if (/^http:\/\/localhost:\d+$/i.test(origin)) {
    return true;
  }

  if (/^http:\/\/127\.0\.0\.1:\d+$/i.test(origin)) {
    return true;
  }

  if (/^https:\/\/(?:[a-z0-9-]+\.)?samuderathai\.com$/i.test(origin)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header) and known frontends.
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ===================== MIDDLEWARE =====================
app.use((req, res, next) => {
  console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Auth header:', req.headers.authorization ? 'Present ✓' : 'Missing ✗');
  console.log('Body keys:', Object.keys(req.body).length > 0 ? Object.keys(req.body) : 'Empty');
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Auth header:', req.headers.authorization ? 'Present ✓' : 'Missing ✗');
  console.log('Body keys:', Object.keys(req.body).length > 0 ? Object.keys(req.body) : 'Empty');
  next();
});

// ===================== MONGOOSE CONNECT =====================
let mongoose;
let dbConnectPromise = null;
app.dbConnectPromise = null;
app.ensureDbConnection = null;
try {
  mongoose = require('mongoose');
  console.log('Mongoose version:', mongoose.version);

  const url = process.env.DATABASE_URL || process.env.MONGODB_URI || `mongodb+srv://naimauddinnitu_db_user:naimauddinnitu_db_password@cluster0.8abx6t9.mongodb.net/samudera_cargo?retryWrites=true&w=majority`;

  mongoose.set('strictQuery', false);
  mongoose.set('bufferCommands', false);
  mongoose.set('bufferTimeoutMS', 10000);

  console.log('🔗 MongoDB connection URL source:', process.env.DATABASE_URL ? 'DATABASE_URL' : process.env.MONGODB_URI ? 'MONGODB_URI' : 'fallback');

  mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Mongoose disconnected from MongoDB');
  });

  const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (dbConnectPromise) {
      return dbConnectPromise;
    }

    dbConnectPromise = mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    })
      .then(async () => {
        console.log("✅ Samudera Cargo DB Connected");
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🌍 Host: ${mongoose.connection.host}`);

        try {
          await seedDefaultAdmin();
        } catch (seedError) {
          console.error('❌ Default admin seed failed:', seedError.message);
        }
      })
      .catch(err => {
        // Allow next request to retry a fresh connection attempt.
        dbConnectPromise = null;
        console.log("❌ MongoDB Connection Error:", err.message);
        throw err;
      });

    return dbConnectPromise;
  };

  // Defer initial DB connection to request time so a failed cold-start
  // connection attempt does not crash the serverless invocation.
  app.dbConnectPromise = null;
  app.ensureDbConnection = connectToDatabase;

} catch (error) {
  console.log("⚠️ Mongoose not available, running in test mode");
}

// ===================== ROUTES =====================
app.use("/api/v1/auth", authRoutes);    // NEW: Google auth routes
app.use('/api/v1', quoteRoutes);
app.use("/api/v1", contactRoutes);
app.use("/api/v1", route);

// ===================== HEALTH CHECK =====================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'running',
    database: mongoose && mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'running',
    database: mongoose && mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    message: 'Welcome to the Samudera Cargo Samudera Traffic Co., Ltd.s API. Please refer to /api/v1 for available endpoints. Server running on the port {Process.env.PORT || 8000}'
  });
});

// ===================== 404 HANDLER =====================
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ===================== ERROR HANDLER =====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

module.exports = app;