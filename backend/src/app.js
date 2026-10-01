const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Route imports
const authRoutes = require('./routes/auth.routes');
const assetRoutes = require('./routes/asset.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const transferRoutes = require('./routes/transfer.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const expenseRoutes = require('./routes/expense.routes');
const transactionRoutes = require('./routes/transaction.routes');
const userRoutes = require('./routes/user.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();


app.use(helmet());

const allowedOrigins = env.corsOrigin ? env.corsOrigin.split(',').map((o) => o.trim()) : ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate limiting ─────────────────────────────────
const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.isDev ? 5000 : env.rateLimitMax,
  message: { success: false, message: 'Too many requests, please try again later', error: { code: 'RATE_LIMIT_EXCEEDED' } },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ─── Body parsing ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ───────────────────────────────────────
if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Health checks ─────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', success: true, message: 'AssetFlow API is running', timestamp: new Date().toISOString() });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', success: true, message: 'AssetFlow API is running', timestamp: new Date().toISOString() });
});

// ─── API v1 routes ─────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reports', reportRoutes);

// ─── 404 and error handling ────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
