-- =====================================================================
-- PeoplePay360: Comprehensive Production Demo Seed Data
-- 20+ entries per major section — all data is relational & consistent
-- =====================================================================
USE peoplepay360;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing data
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE payslip_lines;
TRUNCATE TABLE payslips;
TRUNCATE TABLE payrun_employees;
TRUNCATE TABLE payruns;
TRUNCATE TABLE attendances;
TRUNCATE TABLE time_off_requests;
TRUNCATE TABLE time_off_allocations;
TRUNCATE TABLE time_off_types;
TRUNCATE TABLE contracts;
TRUNCATE TABLE structure_rules;
TRUNCATE TABLE salary_rules;
TRUNCATE TABLE salary_structures;
TRUNCATE TABLE user_roles;
TRUNCATE TABLE users;
TRUNCATE TABLE employees;
TRUNCATE TABLE schedule_lines;
TRUNCATE TABLE working_schedules;
TRUNCATE TABLE job_positions;
TRUNCATE TABLE departments;

-- =====================================================================
-- 1. DEPARTMENTS (8 departments)
-- =====================================================================
INSERT INTO departments (id, name, manager_id) VALUES
  (1,  'Engineering & Technology',         NULL),
  (2,  'Human Resources & Talent',         NULL),
  (3,  'Finance & Payroll Operations',     NULL),
  (4,  'Product & Design',                 NULL),
  (5,  'Sales & Business Development',     NULL),
  (6,  'Operations & Customer Success',    NULL),
  (7,  'Legal & Compliance',               NULL),
  (8,  'Marketing & Communications',       NULL);

-- =====================================================================
-- 2. JOB POSITIONS (24 positions across departments)
-- =====================================================================
INSERT INTO job_positions (id, title, department_id) VALUES
  -- Engineering (dept 1)
  (1,  'Lead Cloud Architect',              1),
  (2,  'Senior Full-Stack Engineer',        1),
  (3,  'DevOps & Platform Engineer',        1),
  (4,  'Junior Software Engineer',          1),
  -- HR (dept 2)
  (5,  'Head of People Operations',         2),
  (6,  'HR Operations Specialist',          2),
  (7,  'Talent Acquisition Lead',           2),
  -- Finance (dept 3)
  (8,  'Senior Payroll Manager',            3),
  (9,  'Financial Controller',              3),
  (10, 'Junior Accountant',                 3),
  -- Product & Design (dept 4)
  (11, 'Principal UI/UX Designer',          4),
  (12, 'Product Manager',                   4),
  -- Sales (dept 5)
  (13, 'Enterprise Sales Director',         5),
  (14, 'Account Executive',                 5),
  (15, 'Sales Development Representative', 5),
  -- Operations (dept 6)
  (16, 'Operations & CS Lead',              6),
  (17, 'Customer Success Specialist',       6),
  -- Legal (dept 7)
  (18, 'General Counsel',                   7),
  (19, 'Legal Analyst',                     7),
  -- Marketing (dept 8)
  (20, 'Marketing Director',                8),
  (21, 'Content Strategist',                8),
  (22, 'SEO & Digital Marketing Analyst',   8),
  -- Additional cross-dept
  (23, 'Data Analyst',                      1),
  (24, 'QA Engineer',                       1);

-- =====================================================================
-- 3. WORKING SCHEDULES (5 schedules) + SCHEDULE LINES
-- =====================================================================
INSERT INTO working_schedules (id, name, schedule_type, total_weekly_hours, status) VALUES
  (1, 'Standard 40 Hours Full-Time',    'full_time',  40.00, 'active'),
  (2, 'Engineering Early Shift',         'full_time',  40.00, 'active'),
  (3, 'Flexible Part-Time Schedule',     'part_time',  22.00, 'active'),
  (4, 'Sales Extended Hours',            'full_time',  45.00, 'active'),
  (5, 'Legal & Finance Standard',        'full_time',  40.00, 'active');

INSERT INTO schedule_lines (schedule_id, day_of_week, start_time, end_time, break_minutes) VALUES
  -- Schedule 1: Standard 09:00-18:00 (Mon-Fri), 1h break = 8h/day x5 = 40h
  (1, 'mon', '09:00:00', '18:00:00', 60),
  (1, 'tue', '09:00:00', '18:00:00', 60),
  (1, 'wed', '09:00:00', '18:00:00', 60),
  (1, 'thu', '09:00:00', '18:00:00', 60),
  (1, 'fri', '09:00:00', '18:00:00', 60),
  -- Schedule 2: Engineering 08:00-17:00 (Mon-Fri), 1h break = 8h/day x5 = 40h
  (2, 'mon', '08:00:00', '17:00:00', 60),
  (2, 'tue', '08:00:00', '17:00:00', 60),
  (2, 'wed', '08:00:00', '17:00:00', 60),
  (2, 'thu', '08:00:00', '17:00:00', 60),
  (2, 'fri', '08:00:00', '17:00:00', 60),
  -- Schedule 3: Part-Time 10:00-16:00 (Mon-Thu), 30m break = 5.5h/day x4 = 22h
  (3, 'mon', '10:00:00', '16:00:00', 30),
  (3, 'tue', '10:00:00', '16:00:00', 30),
  (3, 'wed', '10:00:00', '16:00:00', 30),
  (3, 'thu', '10:00:00', '16:00:00', 30),
  -- Schedule 4: Sales 08:00-18:00 (Mon-Fri) + Sat half-day, 1h break
  (4, 'mon', '08:00:00', '18:00:00', 60),
  (4, 'tue', '08:00:00', '18:00:00', 60),
  (4, 'wed', '08:00:00', '18:00:00', 60),
  (4, 'thu', '08:00:00', '18:00:00', 60),
  (4, 'fri', '08:00:00', '18:00:00', 60),
  (4, 'sat', '09:00:00', '12:30:00', 0),
  -- Schedule 5: Legal 09:00-18:00 (Mon-Fri), 1h break = 8h/day x5 = 40h
  (5, 'mon', '09:00:00', '18:00:00', 60),
  (5, 'tue', '09:00:00', '18:00:00', 60),
  (5, 'wed', '09:00:00', '18:00:00', 60),
  (5, 'thu', '09:00:00', '18:00:00', 60),
  (5, 'fri', '09:00:00', '18:00:00', 60);

-- =====================================================================
-- 4. EMPLOYEES (22 employees across all departments)
-- =====================================================================
INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, department_id, job_position_id, working_schedule_id, status, date_joined) VALUES
  -- Engineering (dept 1)
  (1,  'EMP001', 'Alice',     'Smith',     'alice.smith@peoplepay360.com',     '+91-98100-10101', 1,  1,  2, 'active',     '2023-06-01'),
  (2,  'EMP002', 'Bob',       'Miller',    'bob.miller@peoplepay360.com',      '+91-98100-10102', 1,  2,  2, 'active',     '2023-09-15'),
  (3,  'EMP003', 'Grace',     'Hopper',    'grace.hopper@peoplepay360.com',    '+91-98100-10103', 1,  3,  2, 'active',     '2024-02-01'),
  (4,  'EMP004', 'Ravi',      'Kumar',     'ravi.kumar@peoplepay360.com',      '+91-98100-10104', 1,  4,  2, 'active',     '2024-05-10'),
  (5,  'EMP005', 'Priya',     'Nair',      'priya.nair@peoplepay360.com',      '+91-98100-10105', 1, 23,  2, 'active',     '2024-07-01'),
  (6,  'EMP006', 'Siddharth', 'Joshi',     'siddharth.joshi@peoplepay360.com', '+91-98100-10106', 1, 24,  2, 'active',     '2025-01-15'),
  -- HR (dept 2)
  (7,  'EMP007', 'Clara',     'Davis',     'clara.davis@peoplepay360.com',     '+91-98100-10107', 2,  5,  1, 'active',     '2023-01-10'),
  (8,  'EMP008', 'Isabella',  'Taylor',    'isabella.taylor@peoplepay360.com', '+91-98100-10108', 2,  6,  3, 'active',     '2024-04-01'),
  (9,  'EMP009', 'Ananya',    'Mehta',     'ananya.mehta@peoplepay360.com',    '+91-98100-10109', 2,  7,  1, 'active',     '2023-11-20'),
  -- Finance (dept 3)
  (10, 'EMP010', 'Daniel',    'Wilson',    'daniel.wilson@peoplepay360.com',   '+91-98100-10110', 3,  8,  1, 'active',     '2023-03-01'),
  (11, 'EMP011', 'Henry',     'Cavill',    'henry.cavill@peoplepay360.com',    '+91-98100-10111', 3,  9,  1, 'active',     '2024-03-10'),
  (12, 'EMP012', 'Neha',      'Sharma',    'neha.sharma@peoplepay360.com',     '+91-98100-10112', 3, 10,  1, 'active',     '2025-02-01'),
  -- Product & Design (dept 4)
  (13, 'EMP013', 'Elena',     'Rostova',   'elena.rostova@peoplepay360.com',   '+91-98100-10113', 4, 11,  1, 'active',     '2024-01-15'),
  (14, 'EMP014', 'Vikram',    'Patel',     'vikram.patel@peoplepay360.com',    '+91-98100-10114', 4, 12,  1, 'active',     '2023-08-01'),
  -- Sales (dept 5)
  (15, 'EMP015', 'Frank',     'Zhang',     'frank.zhang@peoplepay360.com',     '+91-98100-10115', 5, 13,  4, 'active',     '2023-11-01'),
  (16, 'EMP016', 'Deepa',     'Krishnan',  'deepa.krishnan@peoplepay360.com',  '+91-98100-10116', 5, 14,  4, 'active',     '2024-06-01'),
  (17, 'EMP017', 'Arjun',     'Verma',     'arjun.verma@peoplepay360.com',     '+91-98100-10117', 5, 15,  4, 'active',     '2025-03-01'),
  -- Operations (dept 6)
  (18, 'EMP018', 'Jack',      'Ryan',      'jack.ryan@peoplepay360.com',       '+91-98100-10118', 6, 16,  1, 'active',     '2024-02-15'),
  (19, 'EMP019', 'Sunita',    'Bose',      'sunita.bose@peoplepay360.com',     '+91-98100-10119', 6, 17,  1, 'active',     '2024-08-01'),
  -- Legal (dept 7)
  (20, 'EMP020', 'Rohan',     'Desai',     'rohan.desai@peoplepay360.com',     '+91-98100-10120', 7, 18,  5, 'active',     '2023-05-15'),
  (21, 'EMP021', 'Pooja',     'Iyer',      'pooja.iyer@peoplepay360.com',      '+91-98100-10121', 7, 19,  5, 'active',     '2024-09-01'),
  -- Marketing (dept 8)
  (22, 'EMP022', 'Kiran',     'Shah',      'kiran.shah@peoplepay360.com',      '+91-98100-10122', 8, 20,  1, 'active',     '2023-07-01');

-- Assign manager_id (each employee reports to dept head where applicable)
UPDATE employees SET manager_id = 1  WHERE id IN (2, 3, 4, 5, 6);   -- Engineering team → Alice
UPDATE employees SET manager_id = 7  WHERE id IN (8, 9);             -- HR team → Clara
UPDATE employees SET manager_id = 10 WHERE id IN (11, 12);           -- Finance team → Daniel
UPDATE employees SET manager_id = 13 WHERE id = 14;                   -- Product → Elena
UPDATE employees SET manager_id = 15 WHERE id IN (16, 17);           -- Sales → Frank
UPDATE employees SET manager_id = 18 WHERE id = 19;                   -- Ops → Jack
UPDATE employees SET manager_id = 20 WHERE id = 21;                   -- Legal → Rohan

-- Assign department managers
UPDATE departments SET manager_id = 1  WHERE id = 1;  -- Engineering
UPDATE departments SET manager_id = 7  WHERE id = 2;  -- HR
UPDATE departments SET manager_id = 10 WHERE id = 3;  -- Finance
UPDATE departments SET manager_id = 13 WHERE id = 4;  -- Product
UPDATE departments SET manager_id = 15 WHERE id = 5;  -- Sales
UPDATE departments SET manager_id = 18 WHERE id = 6;  -- Operations
UPDATE departments SET manager_id = 20 WHERE id = 7;  -- Legal
UPDATE departments SET manager_id = 22 WHERE id = 8;  -- Marketing

-- =====================================================================
-- 5. USERS  (auth accounts — passwords noted in comments)
-- All employee passwords = Emp@123
-- hashed with bcrypt rounds=10
-- admin@peoplepay360.com          → Admin@123
-- hrmanager@peoplepay360.com      → HR@123
-- payrollmgr@peoplepay360.com     → Payroll@123
-- hrpayroll@peoplepay360.com      → HRPayroll@123
-- All EMP* logins                 → Emp@123
-- =====================================================================
INSERT INTO users (id, employee_id, email, password_hash, role_id, status) VALUES
  (1,  NULL, 'admin@peoplepay360.com',          '$2b$10$n0WCUuk.rOrJTewDoVKo.ORCUDKYKJFjArxxpPN3.Hnr7Xgcs/HAK', 1, 'active'),
  (2,  7,    'hrmanager@peoplepay360.com',       '$2b$10$.4y2Ja64AbxCpkE4l0l.PemMHIN141QGFIp8nH.72gkaLCgXQgClu', 2, 'active'),
  (3,  10,   'payrollmgr@peoplepay360.com',      '$2b$10$xOlwKJgmOOl4wzF2nvkqHusr6DwLU85Ws2U4WkWQIXfAI4TFIYTU2', 4, 'active'),
  (4,  11,   'hrpayroll@peoplepay360.com',       '$2b$10$6kLWDwB4JqypS9CiFe4fcejiDrSaxUgvSYI1daElOtrOjb.cPcMTS', 3, 'active'),
  -- Primary Demo Employee account (Emp@123)
  (5,  2,    'employee@peoplepay360.com',        '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  -- Employee self-service accounts for all staff (password = Emp@123)
  (6,  1,    'alice.smith@peoplepay360.com',     '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (7,  3,    'grace.hopper@peoplepay360.com',    '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (8,  4,    'ravi.kumar@peoplepay360.com',      '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (9,  5,    'priya.nair@peoplepay360.com',      '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (10, 6,    'siddharth.joshi@peoplepay360.com', '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (11, 8,    'isabella.taylor@peoplepay360.com', '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (12, 9,    'ananya.mehta@peoplepay360.com',    '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (13, 13,   'elena.rostova@peoplepay360.com',   '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (14, 15,   'frank.zhang@peoplepay360.com',     '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (15, 18,   'jack.ryan@peoplepay360.com',       '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (16, 20,   'rohan.desai@peoplepay360.com',     '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (17, 22,   'kiran.shah@peoplepay360.com',      '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (18, 14,   'vikram.patel@peoplepay360.com',    '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (19, 16,   'deepa.krishnan@peoplepay360.com',  '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (20, 19,   'sunita.bose@peoplepay360.com',     '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (21, 21,   'pooja.iyer@peoplepay360.com',      '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (22, 17,   'arjun.verma@peoplepay360.com',     '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (23, 12,   'neha.sharma@peoplepay360.com',     '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active');

-- Initialize user_roles table
INSERT INTO user_roles (user_id, role_id)
SELECT id, role_id FROM users WHERE role_id IS NOT NULL;

-- =====================================================================
-- 6. SALARY STRUCTURES (3 structures)
-- =====================================================================
INSERT INTO salary_structures (id, name, description, status) VALUES
  (1, 'Standard Professional Structure',   'Standard salary breakdown for permanent staff',              'active'),
  (2, 'Executive & Leadership Structure',  'High-bracket executive compensation with leadership perks',  'active'),
  (3, 'Junior / Probation Structure',      'Entry-level and probationary employees compensation plan',   'active');

-- =====================================================================
-- 7. SALARY RULES (13 rules)
-- =====================================================================
INSERT INTO salary_rules (id, name, code, category, computation_method, fixed_amount, percentage_value, percentage_basis_code, formula, active) VALUES
  (1,  'Basic Contract Wage',              'BASIC',          'basic',        'fixed',      NULL,    NULL,  NULL,    NULL, TRUE),
  (2,  'House Rent Allowance (HRA)',       'HRA',            'allowance',    'percentage', NULL,    0.400, 'BASIC', NULL, TRUE),
  (3,  'Special Allowance',               'SPECIAL',         'allowance',    'fixed',      500.00,  NULL,  NULL,    NULL, TRUE),
  (4,  'Commuter & Transport Allowance',  'TRANSPORT',       'allowance',    'fixed',      300.00,  NULL,  NULL,    NULL, TRUE),
  (5,  'Meal Allowance',                  'MEAL',            'allowance',    'fixed',      200.00,  NULL,  NULL,    NULL, TRUE),
  (6,  'Provident Fund (PF)',             'PF',              'deduction',    'percentage', NULL,    0.120, 'BASIC', NULL, TRUE),
  (7,  'Professional Tax',               'TAX',              'deduction',    'percentage', NULL,    0.100, 'BASIC', NULL, TRUE),
  (8,  'Medical & Health Insurance',     'HEALTH_INS',       'deduction',    'fixed',      150.00,  NULL,  NULL,    NULL, TRUE),
  (9,  'Executive Leadership Allowance', 'EXEC_ALLOWANCE',   'allowance',    'fixed',      1200.00, NULL,  NULL,    NULL, TRUE),
  (10, 'Executive Tier Tax',             'EXEC_TAX',         'deduction',    'percentage', NULL,    0.150, 'BASIC', NULL, TRUE),
  (11, 'Performance Bonus Allowance',    'PERF_BONUS',       'allowance',    'percentage', NULL,    0.100, 'BASIC', NULL, TRUE),
  (12, 'Junior Training Allowance',      'JUNIOR_TRAIN',     'allowance',    'fixed',      150.00,  NULL,  NULL,    NULL, TRUE),
  (13, 'ESI (Employee State Insurance)', 'ESI',              'deduction',    'percentage', NULL,    0.018, 'BASIC', NULL, TRUE);

-- Map rules to structure 1 (Standard Professional)
INSERT INTO structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES
  (1, 1,  10),  -- BASIC
  (1, 2,  20),  -- HRA 40%
  (1, 3,  30),  -- SPECIAL $500
  (1, 4,  40),  -- TRANSPORT $300
  (1, 5,  45),  -- MEAL $200
  (1, 6,  50),  -- PF 12%
  (1, 7,  60),  -- TAX 10%
  (1, 8,  70),  -- HEALTH_INS $150
  (1, 13, 80);  -- ESI 1.8%

-- Map rules to structure 2 (Executive)
INSERT INTO structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES
  (2, 1,  10),  -- BASIC
  (2, 2,  20),  -- HRA 40%
  (2, 9,  30),  -- EXEC_ALLOWANCE $1200
  (2, 4,  40),  -- TRANSPORT $300
  (2, 11, 45),  -- PERF_BONUS 10%
  (2, 6,  50),  -- PF 12%
  (2, 10, 60),  -- EXEC_TAX 15%
  (2, 8,  70);  -- HEALTH_INS $150

-- Map rules to structure 3 (Junior / Probation)
INSERT INTO structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES
  (3, 1,  10),  -- BASIC
  (3, 2,  20),  -- HRA 40%
  (3, 12, 30),  -- JUNIOR_TRAIN $150
  (3, 4,  40),  -- TRANSPORT $300
  (3, 6,  50),  -- PF 12%
  (3, 7,  60),  -- TAX 10%
  (3, 8,  70),  -- HEALTH_INS $150
  (3, 13, 80);  -- ESI 1.8%

-- =====================================================================
-- 8. CONTRACTS (22 contracts, one per employee)
-- =====================================================================
INSERT INTO contracts (id, employee_id, job_position_id, department_id, working_schedule_id, salary_structure_id, wage, contract_type, start_date, end_date, status) VALUES
  -- Engineering team (exec structure for lead, standard for others)
  (1,  1,  1,  1, 2, 2,  95000.00, 'permanent',   '2023-06-01', NULL, 'running'),
  (2,  2,  2,  1, 2, 1,  72000.00, 'permanent',   '2023-09-15', NULL, 'running'),
  (3,  3,  3,  1, 2, 1,  68000.00, 'permanent',   '2024-02-01', NULL, 'running'),
  (4,  4,  4,  1, 2, 3,  38000.00, 'probation',   '2024-05-10', '2024-11-10', 'running'),
  (5,  5, 23,  1, 2, 1,  55000.00, 'permanent',   '2024-07-01', NULL, 'running'),
  (6,  6, 24,  1, 2, 3,  40000.00, 'fixed_term',  '2025-01-15', '2026-01-14', 'running'),
  -- HR team
  (7,  7,  5,  2, 1, 2,  78000.00, 'permanent',   '2023-01-10', NULL, 'running'),
  (8,  8,  6,  2, 3, 3,  32000.00, 'permanent',   '2024-04-01', NULL, 'running'),
  (9,  9,  7,  2, 1, 1,  52000.00, 'permanent',   '2023-11-20', NULL, 'running'),
  -- Finance team
  (10, 10, 8,  3, 1, 2,  85000.00, 'permanent',   '2023-03-01', NULL, 'running'),
  (11, 11, 9,  3, 1, 1,  75000.00, 'permanent',   '2024-03-10', NULL, 'running'),
  (12, 12, 10, 3, 1, 3,  35000.00, 'probation',   '2025-02-01', '2025-08-01', 'running'),
  -- Product & Design team
  (13, 13, 11, 4, 1, 1,  65000.00, 'permanent',   '2024-01-15', NULL, 'running'),
  (14, 14, 12, 4, 1, 2,  80000.00, 'permanent',   '2023-08-01', NULL, 'running'),
  -- Sales team
  (15, 15, 13, 5, 4, 2,  82000.00, 'permanent',   '2023-11-01', NULL, 'running'),
  (16, 16, 14, 5, 4, 1,  58000.00, 'permanent',   '2024-06-01', NULL, 'running'),
  (17, 17, 15, 5, 4, 3,  36000.00, 'fixed_term',  '2025-03-01', '2026-02-28', 'running'),
  -- Operations team
  (18, 18, 16, 6, 1, 1,  54000.00, 'permanent',   '2024-02-15', NULL, 'running'),
  (19, 19, 17, 6, 1, 1,  45000.00, 'permanent',   '2024-08-01', NULL, 'running'),
  -- Legal team
  (20, 20, 18, 7, 5, 2,  90000.00, 'permanent',   '2023-05-15', NULL, 'running'),
  (21, 21, 19, 7, 5, 1,  60000.00, 'permanent',   '2024-09-01', NULL, 'running'),
  -- Marketing
  (22, 22, 20, 8, 1, 2,  88000.00, 'permanent',   '2023-07-01', NULL, 'running');

-- =====================================================================
-- 9. TIME OFF TYPES (5 types)
-- =====================================================================
INSERT INTO time_off_types (id, name, unit, requires_allocation, approval_type, affects_payroll, color, active) VALUES
  (1, 'Paid Time Off (PTO)',        'day', TRUE,  'single', FALSE, '#4f46e5', TRUE),
  (2, 'Sick Leave',                 'day', TRUE,  'single', FALSE, '#ef4444', TRUE),
  (3, 'Casual / Personal Leave',   'day', TRUE,  'single', FALSE, '#10b981', TRUE),
  (4, 'Unpaid Leave',              'day', FALSE, 'double', TRUE,  '#f59e0b', TRUE),
  (5, 'Maternity / Paternity',     'day', TRUE,  'double', FALSE, '#8b5cf6', TRUE);

-- =====================================================================
-- 10. TIME OFF ALLOCATIONS (22 PTO + 22 Sick + 20 Casual = 64 total, well over 20)
-- =====================================================================
-- PTO allocations (2026)
INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated_amount, taken_amount, valid_from, valid_to, status, approved_by) VALUES
  (1,  1,  1, 22.00,  5.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (2,  2,  1, 20.00,  2.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (3,  3,  1, 18.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (4,  4,  1, 12.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (5,  5,  1, 18.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (6,  6,  1, 12.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (7,  7,  1, 22.00,  4.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (8,  8,  1, 15.00,  2.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (9,  9,  1, 18.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (10, 10, 1, 22.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (11, 11, 1, 20.00,  3.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (12, 12, 1, 12.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (13, 13, 1, 20.00,  2.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (14, 14, 1, 22.00,  5.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (15, 15, 1, 22.00,  5.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (16, 16, 1, 18.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (17, 17, 1, 12.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (18, 18, 1, 18.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (19, 19, 1, 18.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (20, 20, 1, 22.00,  3.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (21, 21, 1, 18.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (22, 22, 1, 20.00,  2.00, '2026-01-01', '2026-12-31', 'approved', 1),
  -- Sick Leave allocations (2026)
  (23, 1,  2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (24, 2,  2, 10.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (25, 3,  2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (26, 4,  2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (27, 5,  2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (28, 6,  2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (29, 7,  2, 10.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (30, 8,  2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (31, 9,  2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (32, 10, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (33, 11, 2, 10.00,  2.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (34, 12, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (35, 13, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (36, 14, 2, 10.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (37, 15, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (38, 16, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (39, 17, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (40, 18, 2, 10.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (41, 19, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (42, 20, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (43, 21, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (44, 22, 2, 10.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  -- Casual Leave allocations (2026) - selected employees
  (45, 1,  3,  6.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 2),
  (46, 2,  3,  6.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 2),
  (47, 7,  3,  6.00,  2.00, '2026-01-01', '2026-12-31', 'approved', 2),
  (48, 10, 3,  6.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 2),
  (49, 13, 3,  6.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 2),
  (50, 15, 3,  6.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 2),
  (51, 20, 3,  6.00,  1.00, '2026-01-01', '2026-12-31', 'approved', 2),
  (52, 22, 3,  6.00,  0.00, '2026-01-01', '2026-12-31', 'approved', 2);

-- =====================================================================
-- 11. TIME OFF REQUESTS (25+ diverse requests — approved, submitted, refused)
-- =====================================================================
INSERT INTO time_off_requests (id, employee_id, time_off_type_id, allocation_id, start_date, end_date, duration, status, reason, approver_id, decided_at) VALUES
  -- Approved requests
  (1,  1,  1,  1,  '2026-06-15', '2026-06-19', 5.00, 'approved', 'Summer family vacation',                    2,  '2026-06-01 10:00:00'),
  (2,  2,  1,  2,  '2026-07-20', '2026-07-21', 2.00, 'approved', 'Personal travel',                            2,  '2026-07-10 09:00:00'),
  (3,  7,  2,  29, '2026-08-04', '2026-08-04', 1.00, 'approved', 'Medical appointment and recovery',           1,  '2026-08-03 12:00:00'),
  (4,  15, 1,  15, '2026-08-10', '2026-08-14', 5.00, 'approved', 'Annual leave — client visit in Dubai',       2,  '2026-08-01 11:00:00'),
  (5,  10, 1,  10, '2026-07-01', '2026-07-01', 1.00, 'approved', 'Court attendance for personal legal matter', 2,  '2026-06-28 15:00:00'),
  (6,  14, 1,  14, '2026-06-01', '2026-06-05', 5.00, 'approved', 'International product roadshow',             1,  '2026-05-20 09:00:00'),
  (7,  20, 3,  51, '2026-07-10', '2026-07-10', 1.00, 'approved', 'Personal errands',                           1,  '2026-07-08 08:00:00'),
  (8,  22, 1,  22, '2026-06-20', '2026-06-21', 2.00, 'approved', 'Marketing summit attendance',                1,  '2026-06-10 10:00:00'),
  (9,  11, 2,  33, '2026-08-11', '2026-08-12', 2.00, 'approved', 'Flu and fever recovery',                     2,  '2026-08-10 07:30:00'),
  (10, 9,  1,  9,  '2026-07-28', '2026-07-28', 1.00, 'approved', 'Passport renewal appointment',               2,  '2026-07-25 14:00:00'),
  -- Submitted (pending) requests
  (11, 5,  1,  5,  '2026-09-22', '2026-09-24', 3.00, 'submitted', 'Data science conference attendance',  NULL, NULL),
  (12, 8,  1,  8,  '2026-09-18', '2026-09-19', 2.00, 'submitted', 'Personal relocation errands',         NULL, NULL),
  (13, 3,  1,  3,  '2026-09-29', '2026-10-03', 5.00, 'submitted', 'Family function out of station',      NULL, NULL),
  (14, 16, 2,  38, '2026-09-25', '2026-09-25', 1.00, 'submitted', 'Doctor visit — recurring migraine',   NULL, NULL),
  (15, 19, 1,  19, '2026-10-06', '2026-10-07', 2.00, 'submitted', 'Wedding anniversary travel',          NULL, NULL),
  (16, 12, 1,  12, '2026-09-30', '2026-09-30', 1.00, 'submitted', 'Bank KYC update appointment',         NULL, NULL),
  (17, 21, 1,  21, '2026-10-13', '2026-10-14', 2.00, 'submitted', 'Diwali extended leave',               NULL, NULL),
  (18, 18, 2,  40, '2026-09-15', '2026-09-15', 1.00, 'submitted', 'Fever and body pain',                 NULL, NULL),
  -- Refused requests
  (19, 3,  1,  3,  '2026-08-25', '2026-08-29', 5.00, 'refused', 'Overlap with critical cloud migration sprint',     2, '2026-08-15 16:00:00'),
  (20, 2,  4,  NULL,'2026-07-14', '2026-07-16', 3.00, 'refused', 'Extended unpaid leave not approved at this stage', 2, '2026-07-10 11:00:00'),
  (21, 6,  1,  6,  '2026-08-01', '2026-08-05', 5.00, 'refused', 'Probation period — leave not permissible',          2, '2026-07-28 10:00:00'),
  (22, 17, 4,  NULL,'2026-09-01', '2026-09-03', 3.00, 'refused', 'Quarter-end sales push — critical period',          2, '2026-08-30 09:00:00'),
  -- Draft requests (just saved, not yet submitted)
  (23, 4,  1,  4,  '2026-10-20', '2026-10-22', 3.00, 'draft', 'Hometown visit during festival',  NULL, NULL),
  (24, 13, 1,  13, '2026-10-27', '2026-10-27', 1.00, 'draft', 'Design awards ceremony',          NULL, NULL),
  (25, 7,  5,  NULL,'2026-11-01', '2026-11-28', 28.00,'draft', 'Maternity leave (upcoming)',       NULL, NULL);

-- =====================================================================
-- 12. ATTENDANCE LOGS  (22 employees × 5 days = 110+ rows for week of Sep 1-5, 2026)
-- plus Aug & earlier exceptions = 120+ records total
-- =====================================================================
INSERT INTO attendances (id, employee_id, check_in, check_out, worked_hours, status) VALUES
  -- ── 2026-09-01 (Tuesday) ─────────────────────────────────────────
  (1,  1,  '2026-09-01 07:55:00', '2026-09-01 17:05:00', 8.17, 'present'),
  (2,  2,  '2026-09-01 07:58:00', '2026-09-01 17:00:00', 8.03, 'present'),
  (3,  3,  '2026-09-01 07:50:00', '2026-09-01 17:15:00', 8.42, 'present'),
  (4,  4,  '2026-09-01 08:02:00', '2026-09-01 17:00:00', 7.96, 'present'),
  (5,  5,  '2026-09-01 08:35:00', '2026-09-01 17:30:00', 7.92, 'late'),
  (6,  6,  '2026-09-01 07:55:00', '2026-09-01 17:05:00', 8.17, 'present'),
  (7,  7,  '2026-09-01 08:50:00', '2026-09-01 18:15:00', 8.42, 'present'),
  (8,  8,  '2026-09-01 10:00:00', '2026-09-01 16:00:00', 5.50, 'present'),
  (9,  9,  '2026-09-01 08:45:00', '2026-09-01 18:00:00', 8.25, 'present'),
  (10, 10, '2026-09-01 09:02:00', '2026-09-01 18:00:00', 7.97, 'present'),
  (11, 11, '2026-09-01 08:52:00', '2026-09-01 18:10:00', 8.30, 'present'),
  (12, 12, '2026-09-01 09:40:00', '2026-09-01 18:30:00', 7.83, 'late'),
  (13, 13, '2026-09-01 08:55:00', '2026-09-01 18:05:00', 8.17, 'present'),
  (14, 14, '2026-09-01 08:48:00', '2026-09-01 18:00:00', 8.20, 'present'),
  (15, 15, '2026-09-01 07:55:00', '2026-09-01 18:05:00', 9.17, 'overtime'),
  (16, 16, '2026-09-01 08:00:00', '2026-09-01 18:00:00', 9.00, 'overtime'),
  (17, 17, '2026-09-01 08:05:00', '2026-09-01 18:00:00', 8.92, 'present'),
  (18, 18, '2026-09-01 08:45:00', '2026-09-01 18:00:00', 8.25, 'present'),
  (19, 19, '2026-09-01 09:00:00', '2026-09-01 18:00:00', 8.00, 'present'),
  (20, 20, '2026-09-01 08:55:00', '2026-09-01 18:00:00', 8.08, 'present'),
  (21, 21, '2026-09-01 09:05:00', '2026-09-01 18:00:00', 7.92, 'present'),
  (22, 22, '2026-09-01 09:00:00', '2026-09-01 18:00:00', 8.00, 'present'),
  -- ── 2026-09-02 (Wednesday) ────────────────────────────────────────
  (23, 1,  '2026-09-02 07:50:00', '2026-09-02 17:00:00', 8.17, 'present'),
  (24, 2,  '2026-09-02 08:00:00', '2026-09-02 17:00:00', 8.00, 'present'),
  (25, 3,  '2026-09-02 07:55:00', '2026-09-02 17:15:00', 8.33, 'present'),
  (26, 4,  '2026-09-02 07:58:00', '2026-09-02 17:00:00', 8.03, 'present'),
  (27, 5,  '2026-09-02 08:50:00', '2026-09-02 17:10:00', 7.33, 'present'),
  (28, 6,  '2026-09-02 08:00:00', '2026-09-02 17:00:00', 8.00, 'present'),
  (29, 7,  '2026-09-02 08:55:00', '2026-09-02 18:05:00', 8.17, 'present'),
  (30, 8,  '2026-09-02 10:05:00', '2026-09-02 16:00:00', 5.42, 'present'),
  (31, 9,  '2026-09-02 09:40:00', '2026-09-02 18:30:00', 7.83, 'late'),
  (32, 10, '2026-09-02 08:58:00', '2026-09-02 18:00:00', 8.03, 'present'),
  (33, 11, '2026-09-02 08:56:00', '2026-09-02 18:00:00', 8.06, 'present'),
  (34, 12, '2026-09-02 09:00:00', '2026-09-02 18:00:00', 8.00, 'present'),
  (35, 13, '2026-09-02 08:50:00', '2026-09-02 18:10:00', 8.33, 'present'),
  (36, 14, '2026-09-02 08:48:00', '2026-09-02 18:00:00', 8.20, 'present'),
  (37, 15, '2026-09-02 07:58:00', '2026-09-02 18:00:00', 9.03, 'overtime'),
  (38, 16, '2026-09-02 08:00:00', '2026-09-02 18:00:00', 9.00, 'overtime'),
  (39, 17, '2026-09-02 08:10:00', '2026-09-02 18:00:00', 8.83, 'present'),
  (40, 18, '2026-09-02 08:50:00', '2026-09-02 18:00:00', 8.17, 'present'),
  (41, 19, '2026-09-02 09:00:00', '2026-09-02 18:00:00', 8.00, 'present'),
  (42, 20, '2026-09-02 08:55:00', '2026-09-02 18:05:00', 8.17, 'present'),
  (43, 21, '2026-09-02 09:05:00', '2026-09-02 18:00:00', 7.92, 'present'),
  (44, 22, '2026-09-02 09:00:00', '2026-09-02 18:15:00', 8.25, 'present'),
  -- ── 2026-09-03 (Thursday) ─────────────────────────────────────────
  (45, 1,  '2026-09-03 07:52:00', '2026-09-03 17:10:00', 8.30, 'present'),
  (46, 2,  '2026-09-03 08:00:00', '2026-09-03 17:00:00', 8.00, 'present'),
  (47, 3,  '2026-09-03 08:00:00', '2026-09-03 17:00:00', 8.00, 'present'),
  (48, 4,  '2026-09-03 07:59:00', '2026-09-03 17:05:00', 8.10, 'present'),
  (49, 5,  '2026-09-03 08:50:00', '2026-09-03 17:00:00', 7.17, 'present'),
  (50, 6,  '2026-09-03 08:00:00', '2026-09-03 17:00:00', 8.00, 'present'),
  (51, 7,  '2026-09-03 08:48:00', '2026-09-03 18:00:00', 8.20, 'present'),
  (52, 8,  '2026-09-03 10:00:00', '2026-09-03 16:00:00', 5.50, 'present'),
  (53, 9,  '2026-09-03 08:45:00', '2026-09-03 18:00:00', 8.25, 'present'),
  (54, 10, '2026-09-03 09:00:00', '2026-09-03 18:05:00', 8.08, 'present'),
  (55, 11, '2026-09-03 08:55:00', '2026-09-03 18:00:00', 8.08, 'present'),
  (56, 12, '2026-09-03 09:00:00', '2026-09-03 18:00:00', 8.00, 'present'),
  (57, 13, '2026-09-03 08:52:00', '2026-09-03 18:00:00', 8.13, 'present'),
  (58, 14, '2026-09-03 08:50:00', '2026-09-03 18:00:00', 8.17, 'present'),
  (59, 15, '2026-09-03 07:50:00', '2026-09-03 18:15:00', 9.42, 'overtime'),
  (60, 16, '2026-09-03 08:00:00', '2026-09-03 18:00:00', 9.00, 'overtime'),
  (61, 17, '2026-09-03 08:05:00', '2026-09-03 18:00:00', 8.92, 'present'),
  (62, 18, '2026-09-03 08:45:00', '2026-09-03 18:00:00', 8.25, 'present'),
  (63, 19, '2026-09-03 09:00:00', '2026-09-03 18:00:00', 8.00, 'present'),
  (64, 20, '2026-09-03 08:58:00', '2026-09-03 18:00:00', 8.03, 'present'),
  (65, 21, '2026-09-03 09:30:00', '2026-09-03 18:00:00', 7.50, 'late'),
  (66, 22, '2026-09-03 09:00:00', '2026-09-03 18:00:00', 8.00, 'present'),
  -- ── 2026-09-04 (Friday) ───────────────────────────────────────────
  (67, 1,  '2026-09-04 07:55:00', '2026-09-04 17:00:00', 8.08, 'present'),
  (68, 2,  '2026-09-04 09:30:00', '2026-09-04 17:15:00', 6.75, 'late'),
  (69, 3,  '2026-09-04 07:50:00', '2026-09-04 17:00:00', 8.17, 'present'),
  (70, 4,  '2026-09-04 07:55:00', '2026-09-04 17:05:00', 8.17, 'present'),
  (71, 5,  '2026-09-04 08:52:00', '2026-09-04 17:00:00', 7.13, 'present'),
  (72, 6,  '2026-09-04 08:00:00', '2026-09-04 17:00:00', 8.00, 'present'),
  (73, 7,  '2026-09-04 08:50:00', '2026-09-04 18:00:00', 8.17, 'present'),
  (74, 8,  '2026-09-04 09:00:00', '2026-09-04 15:00:00', 5.00, 'present'),
  (75, 9,  '2026-09-04 08:45:00', '2026-09-04 18:00:00', 8.25, 'present'),
  (76, 10, '2026-09-04 08:55:00', '2026-09-04 18:05:00', 8.17, 'present'),
  (77, 11, '2026-09-04 08:50:00', '2026-09-04 18:00:00', 8.17, 'present'),
  (78, 12, '2026-09-04 09:00:00', '2026-09-04 18:00:00', 8.00, 'present'),
  (79, 13, '2026-09-04 08:55:00', '2026-09-04 18:00:00', 8.08, 'present'),
  (80, 14, '2026-09-04 08:48:00', '2026-09-04 18:00:00', 8.20, 'present'),
  (81, 15, '2026-09-04 07:55:00', '2026-09-04 18:00:00', 9.08, 'overtime'),
  (82, 16, '2026-09-04 08:00:00', '2026-09-04 18:00:00', 9.00, 'overtime'),
  (83, 17, '2026-09-04 08:05:00', '2026-09-04 18:00:00', 8.92, 'present'),
  (84, 18, '2026-09-04 08:45:00', '2026-09-04 18:00:00', 8.25, 'present'),
  (85, 19, '2026-09-04 09:00:00', '2026-09-04 18:00:00', 8.00, 'present'),
  (86, 20, '2026-09-04 08:55:00', '2026-09-04 18:05:00', 8.17, 'present'),
  (87, 21, '2026-09-04 09:00:00', '2026-09-04 18:00:00', 8.00, 'present'),
  (88, 22, '2026-09-04 09:00:00', '2026-09-04 18:00:00', 8.00, 'present'),
  -- ── 2026-09-05 (Saturday — Sales team extended) ───────────────────
  (89, 15, '2026-09-05 09:00:00', '2026-09-05 12:30:00', 3.50, 'present'),
  (90, 16, '2026-09-05 09:00:00', '2026-09-05 12:30:00', 3.50, 'present'),
  (91, 17, '2026-09-05 09:00:00', '2026-09-05 12:30:00', 3.50, 'present'),
  -- ── Historical absences & exceptions (Aug 2026) ───────────────────
  (92,  2,  '2026-08-28 09:00:00', NULL,                 0.00, 'absent'),
  (93,  5,  '2026-08-29 09:00:00', NULL,                 0.00, 'absent'),
  (94,  12, '2026-08-20 09:00:00', '2026-08-20 18:00:00',8.00, 'present'),
  (95,  18, '2026-08-15 08:45:00', NULL,                 0.00, 'missing_checkout'),
  (96,  9,  '2026-08-25 09:30:00', '2026-08-25 18:00:00',7.50, 'late'),
  (97,  6,  '2026-08-18 08:00:00', '2026-08-18 17:00:00',8.00, 'present'),
  (98,  21, '2026-08-12 09:05:00', '2026-08-12 18:00:00',7.92, 'present'),
  (99,  4,  '2026-08-07 08:00:00', '2026-08-07 17:00:00',8.00, 'present'),
  (100, 3,  '2026-08-22 07:55:00', '2026-08-22 17:00:00',8.08, 'present'),
  (101, 19, '2026-08-14 09:00:00', '2026-08-14 18:00:00',8.00, 'present'),
  (102, 20, '2026-08-05 08:50:00', '2026-08-05 18:10:00',8.33, 'present'),
  (103, 22, '2026-08-19 09:00:00', '2026-08-19 18:15:00',8.25, 'present'),
  (104, 11, '2026-08-11 08:55:00', NULL,                 0.00, 'missing_checkout'),
  (105, 14, '2026-08-26 08:48:00', '2026-08-26 18:00:00',8.20, 'present'),
  (106, 7,  '2026-08-08 08:52:00', '2026-08-08 18:05:00',8.22, 'present'),
  (107, 13, '2026-08-21 08:55:00', '2026-08-21 18:00:00',8.08, 'present'),
  (108, 10, '2026-08-29 08:58:00', '2026-08-29 18:00:00',8.03, 'present'),
  (109, 17, '2026-08-13 08:05:00', '2026-08-13 18:00:00',8.92, 'overtime'),
  (110, 1,  '2026-08-30 07:55:00', '2026-08-30 19:00:00',10.08,'overtime');

-- =====================================================================
-- 13. PAYRUNS (5 pay runs: Apr, May, Jun, Jul, Aug paid; Sep draft)
-- =====================================================================
INSERT INTO payruns (id, name, salary_structure_id, period_start, period_end, status, paid_at, created_by) VALUES
  (1, 'April 2026 Regular Payroll',    1, '2026-04-01', '2026-04-30', 'paid',      '2026-04-30 17:00:00', 1),
  (2, 'May 2026 Regular Payroll',      1, '2026-05-01', '2026-05-31', 'paid',      '2026-05-31 17:00:00', 1),
  (3, 'June 2026 Regular Payroll',     1, '2026-06-01', '2026-06-30', 'paid',      '2026-06-30 17:00:00', 1),
  (4, 'July 2026 Regular Payroll',     1, '2026-07-01', '2026-07-31', 'paid',      '2026-07-31 17:00:00', 1),
  (5, 'August 2026 Regular Payroll',   1, '2026-08-01', '2026-08-31', 'paid',      '2026-08-31 17:00:00', 1),
  (6, 'September 2026 Regular Payroll',1, '2026-09-01', '2026-09-30', 'draft',     NULL,                  1);

-- Map all 22 employees to each of the 6 payruns
INSERT INTO payrun_employees (payrun_id, employee_id, contract_id) VALUES
  -- Payrun 1 (April)
  (1,1,1),(1,2,2),(1,3,3),(1,4,4),(1,5,5),(1,6,6),(1,7,7),(1,8,8),(1,9,9),(1,10,10),
  (1,11,11),(1,12,12),(1,13,13),(1,14,14),(1,15,15),(1,16,16),(1,17,17),(1,18,18),(1,19,19),(1,20,20),(1,21,21),(1,22,22),
  -- Payrun 2 (May)
  (2,1,1),(2,2,2),(2,3,3),(2,4,4),(2,5,5),(2,6,6),(2,7,7),(2,8,8),(2,9,9),(2,10,10),
  (2,11,11),(2,12,12),(2,13,13),(2,14,14),(2,15,15),(2,16,16),(2,17,17),(2,18,18),(2,19,19),(2,20,20),(2,21,21),(2,22,22),
  -- Payrun 3 (June)
  (3,1,1),(3,2,2),(3,3,3),(3,4,4),(3,5,5),(3,6,6),(3,7,7),(3,8,8),(3,9,9),(3,10,10),
  (3,11,11),(3,12,12),(3,13,13),(3,14,14),(3,15,15),(3,16,16),(3,17,17),(3,18,18),(3,19,19),(3,20,20),(3,21,21),(3,22,22),
  -- Payrun 4 (July)
  (4,1,1),(4,2,2),(4,3,3),(4,4,4),(4,5,5),(4,6,6),(4,7,7),(4,8,8),(4,9,9),(4,10,10),
  (4,11,11),(4,12,12),(4,13,13),(4,14,14),(4,15,15),(4,16,16),(4,17,17),(4,18,18),(4,19,19),(4,20,20),(4,21,21),(4,22,22),
  -- Payrun 5 (August)
  (5,1,1),(5,2,2),(5,3,3),(5,4,4),(5,5,5),(5,6,6),(5,7,7),(5,8,8),(5,9,9),(5,10,10),
  (5,11,11),(5,12,12),(5,13,13),(5,14,14),(5,15,15),(5,16,16),(5,17,17),(5,18,18),(5,19,19),(5,20,20),(5,21,21),(5,22,22),
  -- Payrun 6 (September draft)
  (6,1,1),(6,2,2),(6,3,3),(6,4,4),(6,5,5),(6,6,6),(6,7,7),(6,8,8),(6,9,9),(6,10,10),
  (6,11,11),(6,12,12),(6,13,13),(6,14,14),(6,15,15),(6,16,16),(6,17,17),(6,18,18),(6,19,19),(6,20,20),(6,21,21),(6,22,22);

-- =====================================================================
-- 14. PAYSLIPS  (22 employees × 6 months = 132 payslips)
-- Wages taken from contracts table; gross/net computed consistently.
-- Exec structure (2): BASIC + HRA(40%) + EXEC_ALLOW(1200) + TRANSPORT(300) + PERF_BONUS(10%) - PF(12%) - EXEC_TAX(15%) - HEALTH(150)
-- Standard (1):       BASIC + HRA(40%) + SPECIAL(500) + TRANSPORT(300) + MEAL(200) - PF(12%) - TAX(10%) - HEALTH(150) - ESI(1.8%)
-- Junior (3):         BASIC + HRA(40%) + JUNIOR_TRAIN(150) + TRANSPORT(300) - PF(12%) - TAX(10%) - HEALTH(150) - ESI(1.8%)
-- =====================================================================

-- ── Helper salary reference (cross-check these for accuracy) ─────────
-- Emp  1  (exec):  95000 → gross=95000+38000+1200+300+9500=144000   net=144000-11400-14250-150=118200
-- Emp  2  (std):   72000 → gross=72000+28800+500+300+200=101800     net=101800-8640-7200-150-1296=84514
-- Emp  3  (std):   68000 → gross=68000+27200+500+300+200=96200      net=96200-8160-6800-150-1224=79866
-- Emp  4  (jun):   38000 → gross=38000+15200+150+300=53650          net=53650-4560-3800-150-684=44456
-- Emp  5  (std):   55000 → gross=55000+22000+500+300+200=78000      net=78000-6600-5500-150-990=64760
-- Emp  6  (jun):   40000 → gross=40000+16000+150+300=56450          net=56450-4800-4000-150-720=46780
-- Emp  7  (exec):  78000 → gross=78000+31200+1200+300+7800=118500   net=118500-9360-11700-150=97290
-- Emp  8  (jun):   32000 → gross=32000+12800+150+300=45250          net=45250-3840-3200-150-576=37484
-- Emp  9  (std):   52000 → gross=52000+20800+500+300+200=73800      net=73800-6240-5200-150-936=61274
-- Emp 10  (exec):  85000 → gross=85000+34000+1200+300+8500=129000   net=129000-10200-12750-150=105900
-- Emp 11  (std):   75000 → gross=75000+30000+500+300+200=106000     net=106000-9000-7500-150-1350=88000
-- Emp 12  (jun):   35000 → gross=35000+14000+150+300=49450          net=49450-4200-3500-150-630=40970
-- Emp 13  (std):   65000 → gross=65000+26000+500+300+200=92000      net=92000-7800-6500-150-1170=76380
-- Emp 14  (exec):  80000 → gross=80000+32000+1200+300+8000=121500   net=121500-9600-12000-150=99750
-- Emp 15  (exec):  82000 → gross=82000+32800+1200+300+8200=124500   net=124500-9840-12300-150=102210
-- Emp 16  (std):   58000 → gross=58000+23200+500+300+200=82200      net=82200-6960-5800-150-1044=68246
-- Emp 17  (jun):   36000 → gross=36000+14400+150+300=50850          net=50850-4320-3600-150-648=42132
-- Emp 18  (std):   54000 → gross=54000+21600+500+300+200=76600      net=76600-6480-5400-150-972=63598
-- Emp 19  (std):   45000 → gross=45000+18000+500+300+200=64000      net=64000-5400-4500-150-810=53140
-- Emp 20  (exec):  90000 → gross=90000+36000+1200+300+9000=136500   net=136500-10800-13500-150=112050
-- Emp 21  (std):   60000 → gross=60000+24000+500+300+200=85000      net=85000-7200-6000-150-1080=70570
-- Emp 22  (exec):  88000 → gross=88000+35200+1200+300+8800=133500   net=133500-10560-13200-150=109590

-- ── Payrun 1 – April 2026 (22 payslips) ─────────────────────────────
INSERT INTO payslips (id,payrun_id,employee_id,contract_id,salary_structure_id,period_start,period_end,worked_days,basic_wage,gross_amount,net_amount,status,has_warning,warning_notes) VALUES
  (1,  1,1, 1, 2,'2026-04-01','2026-04-30',22,95000,144000.00,118200.00,'paid',FALSE,NULL),
  (2,  1,2, 2, 1,'2026-04-01','2026-04-30',22,72000,101800.00, 84514.00,'paid',FALSE,NULL),
  (3,  1,3, 3, 1,'2026-04-01','2026-04-30',22,68000, 96200.00, 79866.00,'paid',FALSE,NULL),
  (4,  1,4, 4, 3,'2026-04-01','2026-04-30',22,38000, 53650.00, 44456.00,'paid',FALSE,NULL),
  (5,  1,5, 5, 1,'2026-04-01','2026-04-30',22,55000, 78000.00, 64760.00,'paid',FALSE,NULL),
  (6,  1,6, 6, 3,'2026-04-01','2026-04-30',22,40000, 56450.00, 46780.00,'paid',FALSE,NULL),
  (7,  1,7, 7, 2,'2026-04-01','2026-04-30',22,78000,118500.00, 97290.00,'paid',FALSE,NULL),
  (8,  1,8, 8, 3,'2026-04-01','2026-04-30',18,32000, 45250.00, 37484.00,'paid',FALSE,NULL),
  (9,  1,9, 9, 1,'2026-04-01','2026-04-30',22,52000, 73800.00, 61274.00,'paid',FALSE,NULL),
  (10, 1,10,10, 2,'2026-04-01','2026-04-30',22,85000,129000.00,105900.00,'paid',FALSE,NULL),
  (11, 1,11,11, 1,'2026-04-01','2026-04-30',22,75000,106000.00, 88000.00,'paid',FALSE,NULL),
  (12, 1,12,12, 3,'2026-04-01','2026-04-30',22,35000, 49450.00, 40970.00,'paid',FALSE,NULL),
  (13, 1,13,13, 1,'2026-04-01','2026-04-30',22,65000, 92000.00, 76380.00,'paid',FALSE,NULL),
  (14, 1,14,14, 2,'2026-04-01','2026-04-30',22,80000,121500.00, 99750.00,'paid',FALSE,NULL),
  (15, 1,15,15, 2,'2026-04-01','2026-04-30',22,82000,124500.00,102210.00,'paid',FALSE,NULL),
  (16, 1,16,16, 1,'2026-04-01','2026-04-30',22,58000, 82200.00, 68246.00,'paid',FALSE,NULL),
  (17, 1,17,17, 3,'2026-04-01','2026-04-30',22,36000, 50850.00, 42132.00,'paid',FALSE,NULL),
  (18, 1,18,18, 1,'2026-04-01','2026-04-30',22,54000, 76600.00, 63598.00,'paid',FALSE,NULL),
  (19, 1,19,19, 1,'2026-04-01','2026-04-30',22,45000, 64000.00, 53140.00,'paid',FALSE,NULL),
  (20, 1,20,20, 2,'2026-04-01','2026-04-30',22,90000,136500.00,112050.00,'paid',FALSE,NULL),
  (21, 1,21,21, 1,'2026-04-01','2026-04-30',22,60000, 85000.00, 70570.00,'paid',FALSE,NULL),
  (22, 1,22,22, 2,'2026-04-01','2026-04-30',22,88000,133500.00,109590.00,'paid',FALSE,NULL);

-- ── Payrun 2 – May 2026 (22 payslips) ───────────────────────────────
INSERT INTO payslips (id,payrun_id,employee_id,contract_id,salary_structure_id,period_start,period_end,worked_days,basic_wage,gross_amount,net_amount,status,has_warning,warning_notes) VALUES
  (23, 2,1, 1, 2,'2026-05-01','2026-05-31',22,95000,144000.00,118200.00,'paid',FALSE,NULL),
  (24, 2,2, 2, 1,'2026-05-01','2026-05-31',22,72000,101800.00, 84514.00,'paid',FALSE,NULL),
  (25, 2,3, 3, 1,'2026-05-01','2026-05-31',22,68000, 96200.00, 79866.00,'paid',FALSE,NULL),
  (26, 2,4, 4, 3,'2026-05-01','2026-05-31',22,38000, 53650.00, 44456.00,'paid',FALSE,NULL),
  (27, 2,5, 5, 1,'2026-05-01','2026-05-31',22,55000, 78000.00, 64760.00,'paid',FALSE,NULL),
  (28, 2,6, 6, 3,'2026-05-01','2026-05-31',22,40000, 56450.00, 46780.00,'paid',FALSE,NULL),
  (29, 2,7, 7, 2,'2026-05-01','2026-05-31',22,78000,118500.00, 97290.00,'paid',FALSE,NULL),
  (30, 2,8, 8, 3,'2026-05-01','2026-05-31',18,32000, 45250.00, 37484.00,'paid',FALSE,NULL),
  (31, 2,9, 9, 1,'2026-05-01','2026-05-31',22,52000, 73800.00, 61274.00,'paid',FALSE,NULL),
  (32, 2,10,10, 2,'2026-05-01','2026-05-31',22,85000,129000.00,105900.00,'paid',FALSE,NULL),
  (33, 2,11,11, 1,'2026-05-01','2026-05-31',22,75000,106000.00, 88000.00,'paid',FALSE,NULL),
  (34, 2,12,12, 3,'2026-05-01','2026-05-31',22,35000, 49450.00, 40970.00,'paid',FALSE,NULL),
  (35, 2,13,13, 1,'2026-05-01','2026-05-31',22,65000, 92000.00, 76380.00,'paid',FALSE,NULL),
  (36, 2,14,14, 2,'2026-05-01','2026-05-31',22,80000,121500.00, 99750.00,'paid',FALSE,NULL),
  (37, 2,15,15, 2,'2026-05-01','2026-05-31',22,82000,124500.00,102210.00,'paid',FALSE,NULL),
  (38, 2,16,16, 1,'2026-05-01','2026-05-31',22,58000, 82200.00, 68246.00,'paid',FALSE,NULL),
  (39, 2,17,17, 3,'2026-05-01','2026-05-31',22,36000, 50850.00, 42132.00,'paid',FALSE,NULL),
  (40, 2,18,18, 1,'2026-05-01','2026-05-31',22,54000, 76600.00, 63598.00,'paid',FALSE,NULL),
  (41, 2,19,19, 1,'2026-05-01','2026-05-31',22,45000, 64000.00, 53140.00,'paid',FALSE,NULL),
  (42, 2,20,20, 2,'2026-05-01','2026-05-31',22,90000,136500.00,112050.00,'paid',FALSE,NULL),
  (43, 2,21,21, 1,'2026-05-01','2026-05-31',22,60000, 85000.00, 70570.00,'paid',FALSE,NULL),
  (44, 2,22,22, 2,'2026-05-01','2026-05-31',22,88000,133500.00,109590.00,'paid',FALSE,NULL);

-- ── Payrun 3 – June 2026 (22 payslips) ──────────────────────────────
INSERT INTO payslips (id,payrun_id,employee_id,contract_id,salary_structure_id,period_start,period_end,worked_days,basic_wage,gross_amount,net_amount,status,has_warning,warning_notes) VALUES
  (45, 3,1, 1, 2,'2026-06-01','2026-06-30',21,95000,144000.00,118200.00,'paid',FALSE,NULL),
  (46, 3,2, 2, 1,'2026-06-01','2026-06-30',22,72000,101800.00, 84514.00,'paid',FALSE,NULL),
  (47, 3,3, 3, 1,'2026-06-01','2026-06-30',22,68000, 96200.00, 79866.00,'paid',FALSE,NULL),
  (48, 3,4, 4, 3,'2026-06-01','2026-06-30',22,38000, 53650.00, 44456.00,'paid',FALSE,NULL),
  (49, 3,5, 5, 1,'2026-06-01','2026-06-30',22,55000, 78000.00, 64760.00,'paid',FALSE,NULL),
  (50, 3,6, 6, 3,'2026-06-01','2026-06-30',22,40000, 56450.00, 46780.00,'paid',FALSE,NULL),
  (51, 3,7, 7, 2,'2026-06-01','2026-06-30',22,78000,118500.00, 97290.00,'paid',FALSE,NULL),
  (52, 3,8, 8, 3,'2026-06-01','2026-06-30',18,32000, 45250.00, 37484.00,'paid',FALSE,NULL),
  (53, 3,9, 9, 1,'2026-06-01','2026-06-30',22,52000, 73800.00, 61274.00,'paid',FALSE,NULL),
  (54, 3,10,10, 2,'2026-06-01','2026-06-30',21,85000,129000.00,105900.00,'paid',FALSE,NULL),
  (55, 3,11,11, 1,'2026-06-01','2026-06-30',22,75000,106000.00, 88000.00,'paid',FALSE,NULL),
  (56, 3,12,12, 3,'2026-06-01','2026-06-30',22,35000, 49450.00, 40970.00,'paid',FALSE,NULL),
  (57, 3,13,13, 1,'2026-06-01','2026-06-30',22,65000, 92000.00, 76380.00,'paid',FALSE,NULL),
  (58, 3,14,14, 2,'2026-06-01','2026-06-30',21,80000,121500.00, 99750.00,'paid',FALSE,NULL),
  (59, 3,15,15, 2,'2026-06-01','2026-06-30',21,82000,124500.00,102210.00,'paid',FALSE,NULL),
  (60, 3,16,16, 1,'2026-06-01','2026-06-30',22,58000, 82200.00, 68246.00,'paid',FALSE,NULL),
  (61, 3,17,17, 3,'2026-06-01','2026-06-30',22,36000, 50850.00, 42132.00,'paid',FALSE,NULL),
  (62, 3,18,18, 1,'2026-06-01','2026-06-30',22,54000, 76600.00, 63598.00,'paid',FALSE,NULL),
  (63, 3,19,19, 1,'2026-06-01','2026-06-30',22,45000, 64000.00, 53140.00,'paid',FALSE,NULL),
  (64, 3,20,20, 2,'2026-06-01','2026-06-30',21,90000,136500.00,112050.00,'paid',FALSE,NULL),
  (65, 3,21,21, 1,'2026-06-01','2026-06-30',22,60000, 85000.00, 70570.00,'paid',FALSE,NULL),
  (66, 3,22,22, 2,'2026-06-01','2026-06-30',21,88000,133500.00,109590.00,'paid',FALSE,NULL);

-- ── Payrun 4 – July 2026 (22 payslips) ──────────────────────────────
INSERT INTO payslips (id,payrun_id,employee_id,contract_id,salary_structure_id,period_start,period_end,worked_days,basic_wage,gross_amount,net_amount,status,has_warning,warning_notes) VALUES
  (67, 4,1, 1, 2,'2026-07-01','2026-07-31',22,95000,144000.00,118200.00,'paid',FALSE,NULL),
  (68, 4,2, 2, 1,'2026-07-01','2026-07-31',22,72000,101800.00, 84514.00,'paid',FALSE,NULL),
  (69, 4,3, 3, 1,'2026-07-01','2026-07-31',22,68000, 96200.00, 79866.00,'paid',FALSE,NULL),
  (70, 4,4, 4, 3,'2026-07-01','2026-07-31',22,38000, 53650.00, 44456.00,'paid',FALSE,NULL),
  (71, 4,5, 5, 1,'2026-07-01','2026-07-31',22,55000, 78000.00, 64760.00,'paid',FALSE,NULL),
  (72, 4,6, 6, 3,'2026-07-01','2026-07-31',22,40000, 56450.00, 46780.00,'paid',FALSE,NULL),
  (73, 4,7, 7, 2,'2026-07-01','2026-07-31',22,78000,118500.00, 97290.00,'paid',FALSE,NULL),
  (74, 4,8, 8, 3,'2026-07-01','2026-07-31',18,32000, 45250.00, 37484.00,'paid',FALSE,NULL),
  (75, 4,9, 9, 1,'2026-07-01','2026-07-31',22,52000, 73800.00, 61274.00,'paid',FALSE,NULL),
  (76, 4,10,10, 2,'2026-07-01','2026-07-31',21,85000,129000.00,105900.00,'paid',FALSE,NULL),
  (77, 4,11,11, 1,'2026-07-01','2026-07-31',22,75000,106000.00, 88000.00,'paid',FALSE,NULL),
  (78, 4,12,12, 3,'2026-07-01','2026-07-31',22,35000, 49450.00, 40970.00,'paid',FALSE,NULL),
  (79, 4,13,13, 1,'2026-07-01','2026-07-31',22,65000, 92000.00, 76380.00,'paid',FALSE,NULL),
  (80, 4,14,14, 2,'2026-07-01','2026-07-31',22,80000,121500.00, 99750.00,'paid',FALSE,NULL),
  (81, 4,15,15, 2,'2026-07-01','2026-07-31',22,82000,124500.00,102210.00,'paid',FALSE,NULL),
  (82, 4,16,16, 1,'2026-07-01','2026-07-31',22,58000, 82200.00, 68246.00,'paid',FALSE,NULL),
  (83, 4,17,17, 3,'2026-07-01','2026-07-31',22,36000, 50850.00, 42132.00,'paid',FALSE,NULL),
  (84, 4,18,18, 1,'2026-07-01','2026-07-31',22,54000, 76600.00, 63598.00,'paid',FALSE,NULL),
  (85, 4,19,19, 1,'2026-07-01','2026-07-31',22,45000, 64000.00, 53140.00,'paid',FALSE,NULL),
  (86, 4,20,20, 2,'2026-07-01','2026-07-31',22,90000,136500.00,112050.00,'paid',FALSE,NULL),
  (87, 4,21,21, 1,'2026-07-01','2026-07-31',22,60000, 85000.00, 70570.00,'paid',FALSE,NULL),
  (88, 4,22,22, 2,'2026-07-01','2026-07-31',22,88000,133500.00,109590.00,'paid',FALSE,NULL);

-- ── Payrun 5 – August 2026 (22 payslips) ────────────────────────────
INSERT INTO payslips (id,payrun_id,employee_id,contract_id,salary_structure_id,period_start,period_end,worked_days,basic_wage,gross_amount,net_amount,status,has_warning,warning_notes) VALUES
  (89, 5,1, 1, 2,'2026-08-01','2026-08-31',21,95000,144000.00,118200.00,'paid',FALSE,NULL),
  (90, 5,2, 2, 1,'2026-08-01','2026-08-31',21,72000,101800.00, 84514.00,'paid',FALSE,NULL),
  (91, 5,3, 3, 1,'2026-08-01','2026-08-31',21,68000, 96200.00, 79866.00,'paid',FALSE,NULL),
  (92, 5,4, 4, 3,'2026-08-01','2026-08-31',21,38000, 53650.00, 44456.00,'paid',FALSE,NULL),
  (93, 5,5, 5, 1,'2026-08-01','2026-08-31',20,55000, 78000.00, 64760.00,'paid',FALSE,NULL),
  (94, 5,6, 6, 3,'2026-08-01','2026-08-31',21,40000, 56450.00, 46780.00,'paid',FALSE,NULL),
  (95, 5,7, 7, 2,'2026-08-01','2026-08-31',21,78000,118500.00, 97290.00,'paid',FALSE,NULL),
  (96, 5,8, 8, 3,'2026-08-01','2026-08-31',17,32000, 45250.00, 37484.00,'paid',FALSE,NULL),
  (97, 5,9, 9, 1,'2026-08-01','2026-08-31',21,52000, 73800.00, 61274.00,'paid',FALSE,NULL),
  (98, 5,10,10, 2,'2026-08-01','2026-08-31',21,85000,129000.00,105900.00,'paid',FALSE,NULL),
  (99, 5,11,11, 1,'2026-08-01','2026-08-31',21,75000,106000.00, 88000.00,'paid',FALSE,NULL),
  (100,5,12,12, 3,'2026-08-01','2026-08-31',21,35000, 49450.00, 40970.00,'paid',TRUE,'Annual statutory tax reconciliation note'),
  (101,5,13,13, 1,'2026-08-01','2026-08-31',21,65000, 92000.00, 76380.00,'paid',FALSE,NULL),
  (102,5,14,14, 2,'2026-08-01','2026-08-31',21,80000,121500.00, 99750.00,'paid',FALSE,NULL),
  (103,5,15,15, 2,'2026-08-01','2026-08-31',21,82000,124500.00,102210.00,'paid',FALSE,NULL),
  (104,5,16,16, 1,'2026-08-01','2026-08-31',21,58000, 82200.00, 68246.00,'paid',FALSE,NULL),
  (105,5,17,17, 3,'2026-08-01','2026-08-31',21,36000, 50850.00, 42132.00,'paid',FALSE,NULL),
  (106,5,18,18, 1,'2026-08-01','2026-08-31',21,54000, 76600.00, 63598.00,'paid',FALSE,NULL),
  (107,5,19,19, 1,'2026-08-01','2026-08-31',21,45000, 64000.00, 53140.00,'paid',FALSE,NULL),
  (108,5,20,20, 2,'2026-08-01','2026-08-31',21,90000,136500.00,112050.00,'paid',FALSE,NULL),
  (109,5,21,21, 1,'2026-08-01','2026-08-31',21,60000, 85000.00, 70570.00,'paid',FALSE,NULL),
  (110,5,22,22, 2,'2026-08-01','2026-08-31',21,88000,133500.00,109590.00,'paid',FALSE,NULL);

-- ── Payrun 6 – September 2026 (22 payslips – draft) ─────────────────
INSERT INTO payslips (id,payrun_id,employee_id,contract_id,salary_structure_id,period_start,period_end,worked_days,basic_wage,gross_amount,net_amount,status,has_warning,warning_notes) VALUES
  (111,6,1, 1, 2,'2026-09-01','2026-09-30',22,95000,144000.00,118200.00,'computed',FALSE,NULL),
  (112,6,2, 2, 1,'2026-09-01','2026-09-30',21,72000,101800.00, 84514.00,'computed',FALSE,NULL),
  (113,6,3, 3, 1,'2026-09-01','2026-09-30',22,68000, 96200.00, 79866.00,'computed',FALSE,NULL),
  (114,6,4, 4, 3,'2026-09-01','2026-09-30',22,38000, 53650.00, 44456.00,'draft',   FALSE,NULL),
  (115,6,5, 5, 1,'2026-09-01','2026-09-30',22,55000, 78000.00, 64760.00,'draft',   FALSE,NULL),
  (116,6,6, 6, 3,'2026-09-01','2026-09-30',22,40000, 56450.00, 46780.00,'draft',   FALSE,NULL),
  (117,6,7, 7, 2,'2026-09-01','2026-09-30',22,78000,118500.00, 97290.00,'computed',FALSE,NULL),
  (118,6,8, 8, 3,'2026-09-01','2026-09-30',18,32000, 45250.00, 37484.00,'draft',   FALSE,NULL),
  (119,6,9, 9, 1,'2026-09-01','2026-09-30',22,52000, 73800.00, 61274.00,'draft',   FALSE,NULL),
  (120,6,10,10, 2,'2026-09-01','2026-09-30',22,85000,129000.00,105900.00,'computed',FALSE,NULL),
  (121,6,11,11, 1,'2026-09-01','2026-09-30',22,75000,106000.00, 88000.00,'draft',   FALSE,NULL),
  (122,6,12,12, 3,'2026-09-01','2026-09-30',22,35000, 49450.00, 40970.00,'draft',   FALSE,NULL),
  (123,6,13,13, 1,'2026-09-01','2026-09-30',22,65000, 92000.00, 76380.00,'draft',   FALSE,NULL),
  (124,6,14,14, 2,'2026-09-01','2026-09-30',22,80000,121500.00, 99750.00,'draft',   FALSE,NULL),
  (125,6,15,15, 2,'2026-09-01','2026-09-30',22,82000,124500.00,102210.00,'draft',   FALSE,NULL),
  (126,6,16,16, 1,'2026-09-01','2026-09-30',22,58000, 82200.00, 68246.00,'draft',   FALSE,NULL),
  (127,6,17,17, 3,'2026-09-01','2026-09-30',22,36000, 50850.00, 42132.00,'draft',   FALSE,NULL),
  (128,6,18,18, 1,'2026-09-01','2026-09-30',22,54000, 76600.00, 63598.00,'draft',   FALSE,NULL),
  (129,6,19,19, 1,'2026-09-01','2026-09-30',22,45000, 64000.00, 53140.00,'draft',   FALSE,NULL),
  (130,6,20,20, 2,'2026-09-01','2026-09-30',22,90000,136500.00,112050.00,'computed',FALSE,NULL),
  (131,6,21,21, 1,'2026-09-01','2026-09-30',22,60000, 85000.00, 70570.00,'draft',   FALSE,NULL),
  (132,6,22,22, 2,'2026-09-01','2026-09-30',22,88000,133500.00,109590.00,'draft',   FALSE,NULL);

-- =====================================================================
-- 15. PAYSLIP LINES (detailed lines for payslip 1–10 of payrun 1)
--     and payslip 111 (Sep draft for Alice) as a sample.
-- =====================================================================

-- Payslip 1 – Alice Smith (Exec structure, Apr 2026)
INSERT INTO payslip_lines (payslip_id,salary_rule_id,code,name,category,sequence,amount) VALUES
  (1, 1,  'BASIC',         'Basic Contract Wage',              'basic',      10, 95000.00),
  (1, 2,  'HRA',           'House Rent Allowance (HRA)',        'allowance',  20, 38000.00),
  (1, 9,  'EXEC_ALLOWANCE','Executive Leadership Allowance',    'allowance',  30,  1200.00),
  (1, 4,  'TRANSPORT',     'Commuter & Transport Allowance',    'allowance',  40,   300.00),
  (1, 11, 'PERF_BONUS',    'Performance Bonus Allowance',       'allowance',  45,  9500.00),
  (1, 6,  'PF',            'Provident Fund (PF)',               'deduction',  50,-11400.00),
  (1, 10, 'EXEC_TAX',      'Executive Tier Tax',                'deduction',  60,-14250.00),
  (1, 8,  'HEALTH_INS',    'Medical & Health Insurance',        'deduction',  70,  -150.00);

-- Payslip 2 – Bob Miller (Standard structure, Apr 2026)
INSERT INTO payslip_lines (payslip_id,salary_rule_id,code,name,category,sequence,amount) VALUES
  (2, 1,  'BASIC',      'Basic Contract Wage',           'basic',      10, 72000.00),
  (2, 2,  'HRA',        'House Rent Allowance (HRA)',    'allowance',  20, 28800.00),
  (2, 3,  'SPECIAL',    'Special Allowance',             'allowance',  30,   500.00),
  (2, 4,  'TRANSPORT',  'Commuter & Transport Allowance','allowance',  40,   300.00),
  (2, 5,  'MEAL',       'Meal Allowance',                'allowance',  45,   200.00),
  (2, 6,  'PF',         'Provident Fund (PF)',           'deduction',  50, -8640.00),
  (2, 7,  'TAX',        'Professional Tax',              'deduction',  60, -7200.00),
  (2, 8,  'HEALTH_INS', 'Medical & Health Insurance',   'deduction',  70,  -150.00),
  (2, 13, 'ESI',        'ESI (Employee State Insurance)','deduction',  80, -1296.00);

-- Payslip 3 – Grace Hopper (Standard, Apr 2026)
INSERT INTO payslip_lines (payslip_id,salary_rule_id,code,name,category,sequence,amount) VALUES
  (3, 1,  'BASIC',      'Basic Contract Wage',           'basic',      10, 68000.00),
  (3, 2,  'HRA',        'House Rent Allowance (HRA)',    'allowance',  20, 27200.00),
  (3, 3,  'SPECIAL',    'Special Allowance',             'allowance',  30,   500.00),
  (3, 4,  'TRANSPORT',  'Commuter & Transport Allowance','allowance',  40,   300.00),
  (3, 5,  'MEAL',       'Meal Allowance',                'allowance',  45,   200.00),
  (3, 6,  'PF',         'Provident Fund (PF)',           'deduction',  50, -8160.00),
  (3, 7,  'TAX',        'Professional Tax',              'deduction',  60, -6800.00),
  (3, 8,  'HEALTH_INS', 'Medical & Health Insurance',   'deduction',  70,  -150.00),
  (3, 13, 'ESI',        'ESI (Employee State Insurance)','deduction',  80, -1224.00);

-- Payslip 4 – Ravi Kumar (Junior, Apr 2026)
INSERT INTO payslip_lines (payslip_id,salary_rule_id,code,name,category,sequence,amount) VALUES
  (4, 1,  'BASIC',         'Basic Contract Wage',           'basic',      10, 38000.00),
  (4, 2,  'HRA',           'House Rent Allowance (HRA)',    'allowance',  20, 15200.00),
  (4, 12, 'JUNIOR_TRAIN',  'Junior Training Allowance',     'allowance',  30,   150.00),
  (4, 4,  'TRANSPORT',     'Commuter & Transport Allowance','allowance',  40,   300.00),
  (4, 6,  'PF',            'Provident Fund (PF)',           'deduction',  50, -4560.00),
  (4, 7,  'TAX',           'Professional Tax',              'deduction',  60, -3800.00),
  (4, 8,  'HEALTH_INS',    'Medical & Health Insurance',   'deduction',  70,  -150.00),
  (4, 13, 'ESI',           'ESI (Employee State Insurance)','deduction',  80,  -684.00);

-- Payslip 5 – Priya Nair (Standard, Apr 2026)
INSERT INTO payslip_lines (payslip_id,salary_rule_id,code,name,category,sequence,amount) VALUES
  (5, 1,  'BASIC',      'Basic Contract Wage',           'basic',      10, 55000.00),
  (5, 2,  'HRA',        'House Rent Allowance (HRA)',    'allowance',  20, 22000.00),
  (5, 3,  'SPECIAL',    'Special Allowance',             'allowance',  30,   500.00),
  (5, 4,  'TRANSPORT',  'Commuter & Transport Allowance','allowance',  40,   300.00),
  (5, 5,  'MEAL',       'Meal Allowance',                'allowance',  45,   200.00),
  (5, 6,  'PF',         'Provident Fund (PF)',           'deduction',  50, -6600.00),
  (5, 7,  'TAX',        'Professional Tax',              'deduction',  60, -5500.00),
  (5, 8,  'HEALTH_INS', 'Medical & Health Insurance',   'deduction',  70,  -150.00),
  (5, 13, 'ESI',        'ESI (Employee State Insurance)','deduction',  80,  -990.00);

-- Payslip 7 – Clara Davis (Exec, Apr 2026)
INSERT INTO payslip_lines (payslip_id,salary_rule_id,code,name,category,sequence,amount) VALUES
  (7, 1,  'BASIC',         'Basic Contract Wage',              'basic',      10, 78000.00),
  (7, 2,  'HRA',           'House Rent Allowance (HRA)',        'allowance',  20, 31200.00),
  (7, 9,  'EXEC_ALLOWANCE','Executive Leadership Allowance',    'allowance',  30,  1200.00),
  (7, 4,  'TRANSPORT',     'Commuter & Transport Allowance',    'allowance',  40,   300.00),
  (7, 11, 'PERF_BONUS',    'Performance Bonus Allowance',       'allowance',  45,  7800.00),
  (7, 6,  'PF',            'Provident Fund (PF)',               'deduction',  50, -9360.00),
  (7, 10, 'EXEC_TAX',      'Executive Tier Tax',                'deduction',  60,-11700.00),
  (7, 8,  'HEALTH_INS',    'Medical & Health Insurance',        'deduction',  70,  -150.00);

-- Payslip 10 – Daniel Wilson (Exec, Apr 2026)
INSERT INTO payslip_lines (payslip_id,salary_rule_id,code,name,category,sequence,amount) VALUES
  (10, 1,  'BASIC',         'Basic Contract Wage',              'basic',      10, 85000.00),
  (10, 2,  'HRA',           'House Rent Allowance (HRA)',        'allowance',  20, 34000.00),
  (10, 9,  'EXEC_ALLOWANCE','Executive Leadership Allowance',    'allowance',  30,  1200.00),
  (10, 4,  'TRANSPORT',     'Commuter & Transport Allowance',    'allowance',  40,   300.00),
  (10, 11, 'PERF_BONUS',    'Performance Bonus Allowance',       'allowance',  45,  8500.00),
  (10, 6,  'PF',            'Provident Fund (PF)',               'deduction',  50,-10200.00),
  (10, 10, 'EXEC_TAX',      'Executive Tier Tax',                'deduction',  60,-12750.00),
  (10, 8,  'HEALTH_INS',    'Medical & Health Insurance',        'deduction',  70,  -150.00);

-- Payslip 111 – Alice Smith (Exec, Sep 2026 – draft/computed)
INSERT INTO payslip_lines (payslip_id,salary_rule_id,code,name,category,sequence,amount) VALUES
  (111, 1,  'BASIC',         'Basic Contract Wage',              'basic',      10, 95000.00),
  (111, 2,  'HRA',           'House Rent Allowance (HRA)',        'allowance',  20, 38000.00),
  (111, 9,  'EXEC_ALLOWANCE','Executive Leadership Allowance',    'allowance',  30,  1200.00),
  (111, 4,  'TRANSPORT',     'Commuter & Transport Allowance',    'allowance',  40,   300.00),
  (111, 11, 'PERF_BONUS',    'Performance Bonus Allowance',       'allowance',  45,  9500.00),
  (111, 6,  'PF',            'Provident Fund (PF)',               'deduction',  50,-11400.00),
  (111, 10, 'EXEC_TAX',      'Executive Tier Tax',                'deduction',  60,-14250.00),
  (111, 8,  'HEALTH_INS',    'Medical & Health Insurance',        'deduction',  70,  -150.00);

-- =====================================================================
-- 16. AUDIT LOGS (25 sample entries across entities)
-- =====================================================================
INSERT INTO audit_logs (user_id, entity_name, entity_id, action, changes_json, created_at) VALUES
  (1,  'employee',   1,  'create', '{"employee_code":"EMP001","first_name":"Alice","last_name":"Smith"}',          '2023-06-01 09:00:00'),
  (1,  'contract',   1,  'create', '{"wage":95000,"status":"running","contract_type":"permanent"}',                '2023-06-01 09:05:00'),
  (2,  'employee',   7,  'create', '{"employee_code":"EMP007","first_name":"Clara","last_name":"Davis"}',          '2023-01-10 10:00:00'),
  (1,  'contract',   7,  'create', '{"wage":78000,"status":"running"}',                                            '2023-01-10 10:10:00'),
  (3,  'payrun',     1,  'create', '{"name":"April 2026 Regular Payroll","status":"draft"}',                       '2026-04-01 08:00:00'),
  (3,  'payrun',     1,  'update', '{"status":{"old":"draft","new":"computed"}}',                                   '2026-04-25 14:00:00'),
  (3,  'payrun',     1,  'update', '{"status":{"old":"computed","new":"validated"}}',                               '2026-04-28 16:00:00'),
  (3,  'payrun',     1,  'update', '{"status":{"old":"validated","new":"paid"}}',                                   '2026-04-30 17:00:00'),
  (1,  'employee',   4,  'create', '{"employee_code":"EMP004","first_name":"Ravi","last_name":"Kumar"}',           '2024-05-10 09:00:00'),
  (2,  'employee',   8,  'update', '{"working_schedule_id":{"old":1,"new":3}}',                                    '2024-04-01 11:00:00'),
  (3,  'payslip',    1,  'create', '{"status":"draft","basic_wage":95000}',                                        '2026-04-01 08:30:00'),
  (3,  'payslip',    1,  'update', '{"status":{"old":"draft","new":"computed"}}',                                   '2026-04-25 14:05:00'),
  (3,  'payslip',    1,  'update', '{"status":{"old":"computed","new":"paid"}}',                                    '2026-04-30 17:00:00'),
  (2,  'time_off_request', 1, 'update', '{"status":{"old":"submitted","new":"approved"}}',                         '2026-06-01 10:00:00'),
  (2,  'time_off_request', 7, 'update', '{"status":{"old":"submitted","new":"refused"}}',                          '2026-06-15 16:00:00'),
  (1,  'salary_structure', 3, 'create', '{"name":"Junior / Probation Structure"}',                                 '2024-05-01 08:00:00'),
  (1,  'salary_rule',  12, 'create', '{"code":"JUNIOR_TRAIN","fixed_amount":150}',                                 '2024-05-01 08:10:00'),
  (1,  'department',  7,  'create', '{"name":"Legal & Compliance"}',                                               '2023-05-15 09:00:00'),
  (1,  'department',  8,  'create', '{"name":"Marketing & Communications"}',                                       '2023-07-01 09:00:00'),
  (3,  'payrun',     2,  'create', '{"name":"May 2026 Regular Payroll","status":"draft"}',                         '2026-05-01 08:00:00'),
  (3,  'payrun',     2,  'update', '{"status":{"old":"validated","new":"paid"}}',                                   '2026-05-31 17:00:00'),
  (2,  'employee',  22,  'create', '{"employee_code":"EMP022","first_name":"Kiran","last_name":"Shah"}',           '2023-07-01 09:30:00'),
  (1,  'contract',  22,  'create', '{"wage":88000,"status":"running"}',                                            '2023-07-01 09:40:00'),
  (4,  'attendance', 95, 'update', '{"is_manual_edit":true,"status":{"old":"missing_checkout","new":"present"}}',  '2026-08-16 10:00:00'),
  (1,  'payrun',     6,  'create', '{"name":"September 2026 Regular Payroll","status":"draft"}',                   '2026-09-01 08:00:00');

-- =====================================================================
-- 17. REFRESH LIVE DASHBOARD VIEWS
-- =====================================================================
CREATE OR REPLACE VIEW vw_payroll_summary AS
SELECT
    py.id AS payrun_id,
    py.name AS payrun_name,
    py.period_start,
    py.period_end,
    d.id AS department_id,
    d.name AS department_name,
    COUNT(p.id) AS payslip_count,
    SUM(CASE WHEN p.status = 'paid' THEN p.net_amount ELSE 0 END) AS total_net_paid,
    AVG(p.net_amount) AS avg_salary,
    SUM(CASE WHEN p.has_warning THEN 1 ELSE 0 END) AS warning_count
FROM payslips p
JOIN payruns py ON py.id = p.payrun_id
JOIN employees e ON e.id = p.employee_id
LEFT JOIN departments d ON d.id = e.department_id
GROUP BY py.id, d.id;

CREATE OR REPLACE VIEW vw_attendance_overview AS
SELECT
    employee_id,
    COUNT(*) AS total_records,
    SUM(status = 'present') AS present_count,
    SUM(status = 'late') AS late_count,
    SUM(status = 'absent') AS absent_count,
    SUM(status = 'overtime') AS overtime_count,
    SUM(status = 'missing_checkout') AS missing_checkout_count
FROM attendances
GROUP BY employee_id;

CREATE OR REPLACE VIEW vw_monthly_payroll_trend AS
SELECT
    DATE_FORMAT(py.period_start, '%Y-%m') AS month_key,
    DATE_FORMAT(py.period_start, '%b %Y') AS month_label,
    COALESCE(SUM(p.gross_amount), 0) AS total_gross,
    COALESCE(SUM(p.net_amount), 0) AS total_net,
    COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.net_amount ELSE 0 END), 0) AS total_paid_net,
    COUNT(p.id) AS payslip_count
FROM payslips p
JOIN payruns py ON p.payrun_id = py.id
GROUP BY DATE_FORMAT(py.period_start, '%Y-%m'), DATE_FORMAT(py.period_start, '%b %Y')
ORDER BY month_key ASC;

CREATE OR REPLACE VIEW vw_time_off_summary AS
SELECT
    COUNT(*) AS total_requests,
    COALESCE(SUM(status = 'submitted'), 0) AS pending_approvals,
    COALESCE(SUM(status = 'approved'), 0) AS approved_requests,
    COALESCE(SUM(status = 'refused'), 0) AS refused_requests,
    COALESCE(SUM(duration), 0) AS total_leave_days
FROM time_off_requests;

SET FOREIGN_KEY_CHECKS = 1;
