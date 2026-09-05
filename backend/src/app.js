/**
 * Express Application Configuration and Route Mounting
 * 
 * RESPONSIBILITY:
 * Configures global middlewares (security headers, CORS, body parsing, request logging),
 * establishes base API routing prefixed with /api/v1, mounts all domain routes,
 * provides health checks, and attaches centralized error handling.
 * 
 * NOT RESPONSIBLE FOR:
 * Starting HTTP socket listeners (handled by server.js) or holding domain business logic.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const pool = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const contractRoutes = require('./routes/contractRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const timeoffRoutes = require('./routes/timeoffRoutes');
const payrollRoutes = require('./routes/payrollRoutes');

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Router for API v1
const apiRouter = express.Router();

/**
 * Health check endpoint.
 * Pings database pool to verify active connectivity.
 * 
 * @route GET /api/v1/health
 * @returns {object} { status: "ok", db: boolean }
 * @sideEffects Executes 'SELECT 1' against MySQL pool
 */
apiRouter.get('/health', async (req, res, next) => {
  let dbHealthy = false;
  try {
    const [rows] = await pool.query('SELECT 1 as ping');
    if (rows && rows.length > 0) {
      dbHealthy = true;
    }
  } catch (err) {
    console.error('[HEALTH CHECK] Database ping failed:', err.message);
  }

  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'ok' : 'degraded',
    db: dbHealthy
  });
});

// Domain Route Mounting under /api/v1/
apiRouter.use('/auth', authRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/schedules', scheduleRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/contracts', contractRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/timeoff', timeoffRoutes);
apiRouter.use('/payroll', payrollRoutes);

// Mount /api/v1 prefix
app.use('/api/v1', apiRouter);

// 404 Handler for unmatched routes
app.use((req, res, next) => {
  const notFoundError = new Error(`Cannot ${req.method} ${req.originalUrl}`);
  notFoundError.status = 404;
  notFoundError.code = 'NOT_FOUND';
  next(notFoundError);
});

// Centralized error handler mounted last
app.use(errorHandler);

module.exports = app;
