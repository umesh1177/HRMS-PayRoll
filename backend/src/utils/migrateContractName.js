/**
 * Database Migration Script: Add `name` column to `contracts` table
 */

const pool = require('../config/db');

async function migrateContractName() {
  try {
    console.log('Running contract name migration...');

    // 1. Check if column exists, add if not
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'contracts' 
        AND COLUMN_NAME = 'name'
    `);

    if (cols.length === 0) {
      await pool.query(`
        ALTER TABLE contracts 
        ADD COLUMN name VARCHAR(150) NULL AFTER id
      `);
      console.log('Added `name` column to `contracts` table.');
    } else {
      console.log('`name` column already exists in `contracts` table.');
    }

    // 2. Populate default names for existing contracts that have empty or null names
    await pool.query(`
      UPDATE contracts c
      JOIN employees e ON c.employee_id = e.id
      SET c.name = CONCAT(
        UPPER(SUBSTRING(COALESCE(c.contract_type, 'standard'), 1, 1)),
        SUBSTRING(COALESCE(c.contract_type, 'standard'), 2),
        ' Employment Contract (', e.first_name, ' ', e.last_name, ')'
      )
      WHERE c.name IS NULL OR c.name = ''
    `);

    console.log('Populated default names for existing contracts.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrateContractName();
