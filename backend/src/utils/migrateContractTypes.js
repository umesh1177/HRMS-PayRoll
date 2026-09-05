/**
 * Database Migration Script: Create & Populate `contract_types` table
 */

const pool = require('../config/db');

async function migrateContractTypes() {
  try {
    console.log('Running contract_types migration...');

    // 1. Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contract_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        default_duration VARCHAR(100) NULL,
        default_terms TEXT NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Insert initial standard contract types if empty
    const [existing] = await pool.query('SELECT COUNT(*) as count FROM contract_types');
    if (existing[0].count === 0) {
      const initialTypes = [
        [
          'permanent',
          'Permanent / Full-Time',
          'Standard indefinite employment agreements with full company benefits, annual leave quotas, and regular salary structures.',
          'Indefinite',
          'Standard notice period (30-60 days), full benefits & PTO accrual.',
          'active'
        ],
        [
          'fixed_term',
          'Fixed-Term / Temporary',
          'Time-bound employment agreements with designated start and end dates for project-based initiatives.',
          '12 Months (Renewable)',
          'Defined duration, renewal upon mutual consent, prorated leave & structure.',
          'active'
        ],
        [
          'contractor',
          'Contractor / Consultant',
          'Independent specialist contracts with milestone-based or hourly/monthly retainers without standard employee payroll tax withholding.',
          'Project / Retainer',
          'Service agreement basis, invoice-linked or direct rate, flexible working arrangement.',
          'active'
        ],
        [
          'intern',
          'Internship / Probationary',
          'Training and evaluation contracts for trainees, fresh graduates, or newly onboarded staff undergoing trial periods.',
          '3 to 6 Months',
          'Fixed 3 to 6 months duration, stipend or base wage, transition to permanent contract upon review.',
          'active'
        ],
        [
          'part_time',
          'Part-Time Employment',
          'Flexible schedule contracts with reduced weekly working hours and prorated compensation.',
          'Indefinite (Part-Time)',
          'Hourly or partial salary structure, flexible scheduling.',
          'active'
        ]
      ];

      for (const t of initialTypes) {
        await pool.query(
          `INSERT INTO contract_types (code, name, description, default_duration, default_terms, status)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          t
        );
      }
      console.log('Seeded initial contract types successfully.');
    }

    // 3. Update contracts table column `contract_type` to VARCHAR(50) if it was a restrictive ENUM so custom codes work
    try {
      await pool.query(`ALTER TABLE contracts MODIFY COLUMN contract_type VARCHAR(50) NOT NULL DEFAULT 'permanent'`);
      console.log('contracts.contract_type column expanded to VARCHAR(50).');
    } catch (colErr) {
      console.log('Column alter note:', colErr.message);
    }

    console.log('contract_types migration completed.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrateContractTypes();
