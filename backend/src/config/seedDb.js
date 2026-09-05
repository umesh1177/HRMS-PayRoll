/**
 * Database Seed Script
 * 
 * RESPONSIBILITY:
 * Connects to the configured MySQL database and executes `seed.sql`
 * to populate initial demo data (departments, jobs, employees, users,
 * salary structures, rules, and contracts).
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seedDatabase() {
  console.log('🔄 Connecting to MySQL database...');

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = Number(process.env.DB_PORT) || 3306;
  const database = process.env.DB_NAME || 'peoplepay360';

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      database,
      multipleStatements: true
    });

    console.log(`✅ Connected to MySQL database '${database}' at ${host}:${port}`);

    const seedPath = path.join(__dirname, '../../database/seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found at: ${seedPath}`);
    }

    console.log('🌱 Executing database/seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);

    console.log('\n🎉 Seed data inserted successfully!');
    console.log('👉 Demo user accounts:');
    console.log('   • Admin:         admin@peoplepay360.com      / Admin@123');
    console.log('   • HR Manager:    hrmanager@peoplepay360.com  / HR@123');
    console.log('   • Payroll Mgr:   payrollmgr@peoplepay360.com / Payroll@123');
    console.log('   • Employee:      employee@peoplepay360.com   / Emp@123\n');
  } catch (err) {
    console.error('❌ Failed to seed database:');
    console.error(err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
