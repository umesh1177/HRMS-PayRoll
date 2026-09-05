/**
 * Server Entrypoint and Process Listener
 * 
 * RESPONSIBILITY:
 * Loads environment configuration, binds the Express application to the configured
 * network port, and handles process-level lifecycle events (e.g. graceful shutdown).
 * 
 * NOT RESPONSIBLE FOR:
 * Routing, middleware setup, or database query definitions.
 */

const dotenv = require('dotenv');
dotenv.config();

// Enforce mandatory security configuration at server startup
if (!process.env.JWT_SECRET) {
  console.error('[FATAL CONFIG ERROR] JWT_SECRET environment variable is not set.');
  throw new Error('JWT_SECRET environment variable must be defined before server startup.');
}

const app = require('./app');

const PORT = Number(process.env.PORT) || 5000;

/**
 * Starts the HTTP server.
 * 
 * @returns {import('http').Server} Running HTTP server instance
 * @sideEffects Opens network socket on PORT
 */
const server = app.listen(PORT, () => {
  console.log(`🚀 PeoplePay360 Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check available at: http://localhost:${PORT}/api/v1/health`);
});

// Graceful termination handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

module.exports = server;
