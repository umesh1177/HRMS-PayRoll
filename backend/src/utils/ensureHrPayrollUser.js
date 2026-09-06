const pool = require('../config/db');

const EMAIL = 'hrpayroll@peoplepay360.com';
const PASSWORD_HASH = '$2b$10$6kLWDwB4JqypS9CiFe4fcejiDrSaxUgvSYI1daElOtrOjb.cPcMTS';

async function ensureHrPayrollUser() {
  const [[role]] = await pool.query(
    'SELECT id FROM roles WHERE name = ? LIMIT 1',
    ['HR Payroll User']
  );
  if (!role) throw new Error('HR Payroll User role is missing; initialize the database schema first');

  const [[employee]] = await pool.query(
    'SELECT id FROM employees WHERE email = ? LIMIT 1',
    [EMAIL]
  );

  const [[existingUser]] = await pool.query(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [EMAIL]
  );

  let userId = existingUser?.id;
  if (userId) {
    await pool.query(
      `UPDATE users
       SET password_hash = ?, role_id = ?, employee_id = COALESCE(employee_id, ?), status = 'active'
       WHERE id = ?`,
      [PASSWORD_HASH, role.id, employee?.id || null, userId]
    );
  } else {
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, role_id, employee_id, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [EMAIL, PASSWORD_HASH, role.id, employee?.id || null]
    );
    userId = result.insertId;
  }

  await pool.query(
    'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
    [userId, role.id]
  );

  return userId;
}

if (require.main === module) {
  ensureHrPayrollUser()
    .then(async (userId) => {
      console.log(`HR Payroll User account is ready: ${userId}`);
      await pool.end();
    })
    .catch(async (err) => {
      console.error(err.message);
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = ensureHrPayrollUser;