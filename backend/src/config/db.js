/**
 * Database Connection Pool Configuration
 * 
 * RESPONSIBILITY:
 * Initializes and exports a centralized MySQL connection pool using mysql2/promise.
 * 
 * NOT RESPONSIBLE FOR:
 * Executing specific domain queries, managing transactions directly, or defining database schema.
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Shared MySQL Connection Pool.
 * 
 * Why Connection Pool instead of Single Connection:
 * Payroll computation involves high concurrency (batch payslip generation, simultaneous
 * line item insertions, and real-time attendance deductions). A pool allows multiple
 * database operations to run in parallel without bottlenecking on a single socket, supports
 * isolated ACID transactions concurrently across workers, and automatically recycles idle connections.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'peoplepay360',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

module.exports = pool;
