const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verify() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME
  });

  const tables = [
    'departments','job_positions','working_schedules','schedule_lines',
    'employees','users','salary_structures','salary_rules','structure_rules',
    'contracts','time_off_types','time_off_allocations','time_off_requests',
    'attendances','payruns','payrun_employees','payslips','payslip_lines','audit_logs'
  ];

  console.log('\n📊 Record counts after seeding:');
  console.log('─'.repeat(45));
  for (const t of tables) {
    const [[row]] = await conn.query(`SELECT COUNT(*) AS cnt FROM ${t}`);
    const mark = row.cnt >= 20 ? '✅' : (row.cnt > 0 ? '🟡' : '❌');
    console.log(`  ${mark}  ${t.padEnd(28)} ${String(row.cnt).padStart(5)} rows`);
  }
  console.log('─'.repeat(45));
  await conn.end();
}
verify().catch(console.error);
