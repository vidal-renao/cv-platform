require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const db = require('./db');

// 🔐 Validación de entorno
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is missing');
  process.exit(1);
}

// 📦 Routes (IMPORTANTE: todos deben exportar router directamente)
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const packageRoutes = require('./routes/packages');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const searchRoutes = require('./routes/search');
const clientPortalRoutes = require('./routes/client');
const usersRoutes = require('./routes/users');
const trackingRoutes = require('./routes/tracking');
const contactRoutes  = require('./routes/contact');
const chatRoutes     = require('./routes/chat');

// 🧱 Middlewares
const { errorHandler } = require('./middlewares/errorHandler');
const { rateLimit } = require('./middlewares/rateLimit');

const app = express();
const PORT = process.env.PORT || 5000;

// 🛡️ Seguridad básica
app.use(helmet());

// 🌐 CORS
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// 📥 Parse JSON
app.use(express.json());

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

app.use(rateLimit);

// 🔍 Logger básico
app.use((req, res, next) => {
  console.log(`${req.id} ${req.method} ${req.url}`);
  next();
});

// 🧪 Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', requestId: req.id });
});

app.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ready', database: 'ok', requestId: req.id });
  } catch (err) {
    console.error(`[READY] ${req.id} database check failed:`, err.message);
    res.status(503).json({ status: 'not_ready', database: 'error', requestId: req.id });
  }
});

// 🚀 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/client', clientPortalRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/track',   trackingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chat',   chatRoutes);

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 💥 Error handler global
app.use(errorHandler);

// ▶️ Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
