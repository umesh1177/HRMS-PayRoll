/**
 * Database Initialization and Schema Loader Script
 * 
 * RESPONSIBILITY:
 * Connects to the MySQL server (at server level without requiring database existence),
 * creates the `peoplepay360` database if it does not exist, and executes `schema.sql`
 * and `seed.sql` to provision all tables, views, foreign keys, roles, and demo users.
 * 
 * NOT RESPONSIBLE FOR:
 * Running runtime API queries or Express HTTP serving.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Initializes MySQL database, provisions schema, and seeds demo data.
 * 
 * @returns {Promise<void>}
 * @sideEffects Creates `peoplepay360` database and inserts demo accounts
 */
async function initializeDatabase() {
  console.log('🔄 Connecting to MySQL server...');

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = Number(process.env.DB_PORT) || 3306;

  let connection;
  try {
    // 1. Connect at the MySQL server root
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });

    console.log(`✅ Connected to MySQL server at ${host}:${port}`);

    // 2. Execute schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📦 Executing schema.sql (creating database & tables)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('✅ Schema & tables provisioned.');
    }

    // 3. Execute seed.sql
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Executing seed.sql (inserting demo users & payroll structures)...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('✅ Demo seed data populated.');
    }

    console.log('\n🎉 Database `peoplepay360` is fully initialized and ready!');
    console.log('👉 Demo user accounts:');
    console.log('   • Admin:         admin@peoplepay360.com      / Admin@123');
    console.log('   • HR Manager:    hrmanager@peoplepay360.com  / HR@123');
    console.log('   • Payroll Mgr:   payrollmgr@peoplepay360.com / Payroll@123');
    console.log('   • Employee:      employee@peoplepay360.com   / Emp@123\n');
  } catch (err) {
    console.error('❌ Failed to initialize database:');
    console.error(err.message);
    console.error('\n👉 Tips:');
    console.error('   1. Ensure your MySQL server (e.g. MySQL Workbench / XAMPP / Windows Service) is RUNNING.');
    console.error('   2. Verify DB_PASSWORD in backend/.env matches your local MySQL root password.');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
