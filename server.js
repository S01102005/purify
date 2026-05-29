require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

// Import your routers
const waitlistRouter = require('./routes/waitlist');
const newsletterRouter = require('./routes/newsletter');

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());

// Dynamic CORS configuration based on your environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) 
  : ['http://127.0.0.1:5500'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serverless MongoDB Connection Logic ──────────────────────────────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = db.connections.readyState === 1;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

// Middleware to ensure DB is connected before processing any request on Vercel
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed.' });
  }
});

// ── Health Check Route ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── Route Mounts ──────────────────────────────────────────────────────────────
/*const path = require('path');

// Serve static frontend files from your "website" folder
app.use(express.static(path.resolve(__dirname, 'website')));

// Route to serve your main index.html for the landing page
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'website', 'index.html'));
});*/
app.use('/api/waitlist', waitlistRouter);
app.use('/api/newsletter', newsletterRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

// Local Development Server (Vercel skips this and uses its own handler)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}

module.exports = app;