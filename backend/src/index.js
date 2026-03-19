require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

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

// 🧱 Middlewares
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// 🛡️ Seguridad básica
app.use(helmet());

// 🌐 CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// 📥 Parse JSON
app.use(express.json());

// 🔍 Logger básico
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 🧪 Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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