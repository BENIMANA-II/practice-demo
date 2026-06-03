require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const connectDB = require('./config/db');
const seedDatabase = require('./config/seed');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const transactionRoutes = require('./routes/transaction.routes');
const reportRoutes = require('./routes/reports.routes');

// Fail fast if critical secrets are missing — the app cannot run safely without them.
const REQUIRED_ENV = ['MONGODB_URI', 'SESSION_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.set('trust proxy', 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));

// Final fallback so unexpected errors still return the { error } shape, never a stack trace.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);
    await seedDatabase();
    app.listen(PORT, () => console.log(`SMS backend running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
