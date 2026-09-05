const pool = require('../config/db');

async function initUserRoles() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id       INT AUTO_INCREMENT PRIMARY KEY,
        user_id  INT NOT NULL,
        role_id  INT NOT NULL,
        CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        UNIQUE KEY uq_user_role (user_id, role_id)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      INSERT IGNORE INTO user_roles (user_id, role_id)
      SELECT id, role_id FROM users WHERE role_id IS NOT NULL;
    `);

    const [rows] = await pool.query(`
      SELECT u.id, u.email, GROUP_CONCAT(r.name SEPARATOR ', ') as roles 
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      LEFT JOIN roles r ON ur.role_id = r.id 
      GROUP BY u.id
    `);
    console.log('User roles table initialized successfully:\n', rows);
  } catch (err) {
    console.error('Error initializing user_roles:', err);
  } finally {
    process.exit(0);
  }
}

initUserRoles();
