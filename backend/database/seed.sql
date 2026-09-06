-- =====================================================================
-- PeoplePay360: Comprehensive Production Demo Seed Data
-- =====================================================================
USE peoplepay360;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing data cleanly
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
TRUNCATE TABLE users;
TRUNCATE TABLE employees;
TRUNCATE TABLE schedule_lines;
TRUNCATE TABLE working_schedules;
TRUNCATE TABLE job_positions;
TRUNCATE TABLE departments;

-- ---------------------------------------------------------------------
-- 1. ORG STRUCTURE: DEPARTMENTS & JOB POSITIONS
-- ---------------------------------------------------------------------
INSERT INTO departments (id, name, manager_id) VALUES
  (1, 'Engineering & Technology', NULL),
  (2, 'Human Resources & Talent', NULL),
  (3, 'Finance & Payroll Operations', NULL),
  (4, 'Product & Design', NULL),
  (5, 'Sales & Business Development', NULL),
  (6, 'Operations & Customer Success', NULL);

INSERT INTO job_positions (id, title, department_id) VALUES
  (1, 'Lead Cloud Architect', 1),
  (2, 'Senior Full-Stack Engineer', 1),
  (3, 'DevOps & Platform Engineer', 1),
  (4, 'Head of People Operations', 2),
  (5, 'HR Operations Specialist', 2),
  (6, 'Senior Payroll Manager', 3),
  (7, 'Financial Controller', 3),
  (8, 'Principal UI/UX Designer', 4),
  (9, 'Enterprise Sales Director', 5),
  (10, 'Operations & CS Lead', 6);

-- ---------------------------------------------------------------------
-- 2. WORKING SCHEDULES & SHIFT MATRICES
-- ---------------------------------------------------------------------
INSERT INTO working_schedules (id, name, schedule_type, total_weekly_hours, status) VALUES
  (1, 'Standard 40 Hours Full-Time', 'full_time', 40.00, 'active'),
  (2, 'Engineering Early Shift', 'full_time', 40.00, 'active'),
  (3, 'Flexible Part-Time Schedule', 'part_time', 22.00, 'active');

INSERT INTO schedule_lines (schedule_id, day_of_week, start_time, end_time, break_minutes) VALUES
  -- Schedule 1: 09:00 - 18:00 (1h break = 8h/day x 5 = 40h)
  (1, 'mon', '09:00:00', '18:00:00', 60),
  (1, 'tue', '09:00:00', '18:00:00', 60),
  (1, 'wed', '09:00:00', '18:00:00', 60),
  (1, 'thu', '09:00:00', '18:00:00', 60),
  (1, 'fri', '09:00:00', '18:00:00', 60),
  -- Schedule 2: 08:00 - 17:00 (1h break = 8h/day x 5 = 40h)
  (2, 'mon', '08:00:00', '17:00:00', 60),
  (2, 'tue', '08:00:00', '17:00:00', 60),
  (2, 'wed', '08:00:00', '17:00:00', 60),
  (2, 'thu', '08:00:00', '17:00:00', 60),
  (2, 'fri', '08:00:00', '17:00:00', 60),
  -- Schedule 3: 10:00 - 16:00 (30m break = 5.5h/day x 4 = 22h)
  (3, 'mon', '10:00:00', '16:00:00', 30),
  (3, 'tue', '10:00:00', '16:00:00', 30),
  (3, 'wed', '10:00:00', '16:00:00', 30),
  (3, 'thu', '10:00:00', '16:00:00', 30);

-- ---------------------------------------------------------------------
-- 3. EMPLOYEES (10 realistic profiles across all departments)
-- ---------------------------------------------------------------------
INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, department_id, job_position_id, working_schedule_id, status, date_joined) VALUES
  (1, 'EMP001', 'Alice', 'Smith', 'alice.smith@peoplepay360.com', '+1-555-0101', 1, 1, 1, 'active', '2023-06-01'),
  (2, 'EMP002', 'Bob', 'Miller', 'bob.miller@peoplepay360.com', '+1-555-0102', 1, 2, 1, 'active', '2023-09-15'),
  (3, 'EMP003', 'Clara', 'Davis', 'clara.davis@peoplepay360.com', '+1-555-0103', 2, 4, 1, 'active', '2023-01-10'),
  (4, 'EMP004', 'Daniel', 'Wilson', 'daniel.wilson@peoplepay360.com', '+1-555-0104', 3, 6, 1, 'active', '2023-03-01'),
  (5, 'EMP005', 'Elena', 'Rostova', 'elena.rostova@peoplepay360.com', '+1-555-0105', 4, 8, 1, 'active', '2024-01-15'),
  (6, 'EMP006', 'Frank', 'Zhang', 'frank.zhang@peoplepay360.com', '+1-555-0106', 5, 9, 2, 'active', '2023-11-01'),
  (7, 'EMP007', 'Grace', 'Hopper', 'grace.hopper@peoplepay360.com', '+1-555-0107', 1, 3, 2, 'active', '2024-02-01'),
  (8, 'EMP008', 'Henry', 'Cavill', 'henry.cavill@peoplepay360.com', '+1-555-0108', 3, 7, 1, 'active', '2024-03-10'),
  (9, 'EMP009', 'Isabella', 'Taylor', 'isabella.taylor@peoplepay360.com', '+1-555-0109', 2, 5, 3, 'active', '2024-04-01'),
  (10, 'EMP010', 'Jack', 'Ryan', 'jack.ryan@peoplepay360.com', '+1-555-0110', 6, 10, 1, 'active', '2024-02-15');

-- Assign department managers
UPDATE departments SET manager_id = 1 WHERE id = 1;
UPDATE departments SET manager_id = 3 WHERE id = 2;
UPDATE departments SET manager_id = 4 WHERE id = 3;
UPDATE departments SET manager_id = 5 WHERE id = 4;
UPDATE departments SET manager_id = 6 WHERE id = 5;
UPDATE departments SET manager_id = 10 WHERE id = 6;

-- ---------------------------------------------------------------------
-- 4. USER AUTHENTICATION ACCOUNTS
-- Standard passwords:
--   Admin:         admin@peoplepay360.com       / Admin@123
--   HR Manager:    hrmanager@peoplepay360.com   / HR@123
--   HR Payroll:    hrpayroll@peoplepay360.com   / HRPayroll@123
--   Payroll Mgr:   payrollmgr@peoplepay360.com  / Payroll@123
--   Employee:      employee@peoplepay360.com    / Emp@123
--   Alice:         alice.smith@peoplepay360.com / Emp@123
--   Elena:         elena.rostova@peoplepay360.com / Emp@123
--   Frank:         frank.zhang@peoplepay360.com   / Emp@123
-- ---------------------------------------------------------------------
INSERT INTO users (id, employee_id, email, password_hash, role_id, status) VALUES
  (1, NULL, 'admin@peoplepay360.com', '$2b$10$n0WCUuk.rOrJTewDoVKo.ORCUDKYKJFjArxxpPN3.Hnr7Xgcs/HAK', 1, 'active'),
  (2, 3, 'hrmanager@peoplepay360.com', '$2b$10$.4y2Ja64AbxCpkE4l0l.PemMHIN141QGFIp8nH.72gkaLCgXQgClu', 2, 'active'),
  (8, 8, 'hrpayroll@peoplepay360.com', '$2b$10$6kLWDwB4JqypS9CiFe4fcejiDrSaxUgvSYI1daElOtrOjb.cPcMTS', 3, 'active'),
  (3, 4, 'payrollmgr@peoplepay360.com', '$2b$10$xOlwKJgmOOl4wzF2nvkqHusr6DwLU85Ws2U4WkWQIXfAI4TFIYTU2', 4, 'active'),
  (4, 2, 'employee@peoplepay360.com', '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (5, 1, 'alice.smith@peoplepay360.com', '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (6, 5, 'elena.rostova@peoplepay360.com', '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active'),
  (7, 6, 'frank.zhang@peoplepay360.com', '$2b$10$v9EF1/mXOHrHvYTxomHfWOmd8xkQlphMTjAee87dgIWXV187/CAhe', 5, 'active');

-- ---------------------------------------------------------------------
-- 5. SALARY STRUCTURES & RULES ENGINE
-- ---------------------------------------------------------------------
INSERT INTO salary_structures (id, name, description, status) VALUES
  (1, 'Standard Professional Structure', 'Standard salary breakdown for permanent staff and engineers', 'active'),
  (2, 'Executive & Leadership Structure', 'High-bracket executive compensation with leadership allowances', 'active');

INSERT INTO salary_rules (id, name, code, category, computation_method, fixed_amount, percentage_value, percentage_basis_code, formula, active) VALUES
  (1, 'Basic Contract Wage', 'BASIC', 'basic', 'fixed', NULL, NULL, NULL, NULL, TRUE),
  (2, 'House Rent Allowance (HRA)', 'HRA', 'allowance', 'percentage', NULL, 0.400, 'BASIC', NULL, TRUE),
  (3, 'Special Allowance', 'SPECIAL', 'allowance', 'fixed', 500.00, NULL, NULL, NULL, TRUE),
  (4, 'Commuter & Transport Allowance', 'TRANSPORT', 'allowance', 'fixed', 300.00, NULL, NULL, NULL, TRUE),
  (5, 'Provident Fund (PF)', 'PF', 'deduction', 'percentage', NULL, 0.120, 'BASIC', NULL, TRUE),
  (6, 'Professional Tax', 'TAX', 'deduction', 'percentage', NULL, 0.100, 'BASIC', NULL, TRUE),
  (7, 'Medical & Health Insurance', 'HEALTH_INS', 'deduction', 'fixed', 150.00, NULL, NULL, NULL, TRUE),
  (8, 'Executive Leadership Allowance', 'EXEC_ALLOWANCE', 'allowance', 'fixed', 1200.00, NULL, NULL, NULL, TRUE),
  (9, 'Executive Tier Tax', 'EXEC_TAX', 'deduction', 'percentage', NULL, 0.150, 'BASIC', NULL, TRUE);

-- Map rules to structure 1 (Standard)
INSERT INTO structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES
  (1, 1, 10),  -- BASIC
  (1, 2, 20),  -- HRA (40%)
  (1, 3, 30),  -- SPECIAL ($500)
  (1, 4, 40),  -- TRANSPORT ($300)
  (1, 5, 50),  -- PF (12%)
  (1, 6, 60),  -- TAX (10%)
  (1, 7, 70);  -- HEALTH_INS ($150)

-- Map rules to structure 2 (Executive)
INSERT INTO structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES
  (2, 1, 10),  -- BASIC
  (2, 2, 20),  -- HRA (40%)
  (2, 8, 30),  -- EXEC_ALLOWANCE ($1200)
  (2, 4, 40),  -- TRANSPORT ($300)
  (2, 5, 50),  -- PF (12%)
  (2, 9, 60),  -- EXEC_TAX (15%)
  (2, 7, 70);  -- HEALTH_INS ($150)

-- ---------------------------------------------------------------------
-- 6. EMPLOYMENT CONTRACTS
-- ---------------------------------------------------------------------
INSERT INTO contracts (id, employee_id, job_position_id, department_id, working_schedule_id, salary_structure_id, wage, contract_type, start_date, end_date, status) VALUES
  (1, 1, 1, 1, 1, 2, 9500.00, 'permanent', '2023-06-01', NULL, 'running'),
  (2, 2, 2, 1, 1, 1, 7200.00, 'permanent', '2023-09-15', NULL, 'running'),
  (3, 3, 4, 2, 1, 2, 7800.00, 'permanent', '2023-01-10', NULL, 'running'),
  (4, 4, 6, 3, 1, 1, 6800.00, 'permanent', '2023-03-01', NULL, 'running'),
  (5, 5, 8, 4, 1, 1, 6500.00, 'permanent', '2024-01-15', NULL, 'running'),
  (6, 6, 9, 5, 2, 2, 8200.00, 'permanent', '2023-11-01', NULL, 'running'),
  (7, 7, 3, 1, 2, 1, 7000.00, 'permanent', '2024-02-01', NULL, 'running'),
  (8, 8, 7, 3, 1, 1, 7500.00, 'permanent', '2024-03-10', NULL, 'running'),
  (9, 9, 5, 2, 3, 1, 4800.00, 'permanent', '2024-04-01', NULL, 'running'),
  (10, 10, 10, 6, 1, 1, 5400.00, 'permanent', '2024-02-15', NULL, 'running');

-- ---------------------------------------------------------------------
-- 7. TIME OFF TYPES & ANNUAL ALLOCATIONS
-- ---------------------------------------------------------------------
INSERT INTO time_off_types (id, name, unit, requires_allocation, approval_type, affects_payroll, color, active) VALUES
  (1, 'Paid Time Off (PTO)', 'day', TRUE, 'single', FALSE, '#4f46e5', TRUE),
  (2, 'Sick Leave', 'day', TRUE, 'single', FALSE, '#ef4444', TRUE),
  (3, 'Casual / Personal Leave', 'day', TRUE, 'single', FALSE, '#10b981', TRUE),
  (4, 'Unpaid Leave', 'day', FALSE, 'single', TRUE, '#f59e0b', TRUE);

-- Allocations for 2026
INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated_amount, taken_amount, valid_from, valid_to, status, approved_by) VALUES
  (1, 1, 1, 22.00, 3.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (2, 2, 1, 20.00, 2.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (3, 3, 1, 22.00, 4.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (4, 4, 1, 18.00, 1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (5, 5, 1, 20.00, 2.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (6, 6, 1, 22.00, 5.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (7, 7, 1, 18.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (8, 8, 1, 20.00, 1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (9, 9, 1, 15.00, 2.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (10, 10, 1, 18.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  -- Sick Leave Allocations
  (11, 1, 2, 10.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (12, 2, 2, 10.00, 1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (13, 3, 2, 10.00, 1.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (14, 4, 2, 10.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (15, 5, 2, 10.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (16, 6, 2, 10.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (17, 7, 2, 10.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (18, 8, 2, 10.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (19, 9, 2, 10.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (20, 10, 2, 10.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1);

-- ---------------------------------------------------------------------
-- 8. TIME OFF REQUESTS (Approved, Pending Approvals & Refused)
-- ---------------------------------------------------------------------
INSERT INTO time_off_requests (id, employee_id, time_off_type_id, allocation_id, start_date, end_date, duration, status, reason, approver_id) VALUES
  (1, 1, 1, 1, '2026-06-15', '2026-06-17', 3.00, 'approved', 'Summer family vacation', 2),
  (2, 2, 1, 2, '2026-07-20', '2026-07-21', 2.00, 'approved', 'Personal travel', 2),
  (3, 3, 2, 13, '2026-08-04', '2026-08-04', 1.00, 'approved', 'Medical appointment and recovery', 1),
  (4, 6, 1, 6, '2026-08-10', '2026-08-14', 5.00, 'approved', 'Annual leave', 2),
  (5, 5, 1, 5, '2026-09-15', '2026-09-17', 3.00, 'submitted', 'Design conference attendance', NULL),
  (6, 9, 3, NULL, '2026-09-18', '2026-09-19', 2.00, 'submitted', 'Personal errands and relocation', NULL),
  (7, 7, 1, 7, '2026-08-25', '2026-08-29', 5.00, 'refused', 'Overlap with critical cloud migration sprint', 2);

-- ---------------------------------------------------------------------
-- 9. ATTENDANCE LOGS (Realistic week activity producing 93% health)
-- ---------------------------------------------------------------------
INSERT INTO attendances (id, employee_id, check_in, check_out, worked_hours, status) VALUES
  -- 2026-09-01 (Tuesday)
  (1, 1, '2026-09-01 08:55:00', '2026-09-01 18:05:00', 8.16, 'present'),
  (2, 2, '2026-09-01 08:58:00', '2026-09-01 18:00:00', 8.03, 'present'),
  (3, 3, '2026-09-01 08:50:00', '2026-09-01 18:15:00', 8.41, 'present'),
  (4, 4, '2026-09-01 09:02:00', '2026-09-01 18:00:00', 7.96, 'present'),
  (5, 5, '2026-09-01 09:35:00', '2026-09-01 18:30:00', 7.91, 'late'),
  (6, 6, '2026-09-01 07:55:00', '2026-09-01 17:05:00', 8.16, 'present'),
  (7, 7, '2026-09-01 07:58:00', '2026-09-01 17:00:00', 8.03, 'present'),
  (8, 8, '2026-09-01 08:52:00', '2026-09-01 18:10:00', 8.30, 'present'),
  (9, 9, '2026-09-01 10:00:00', '2026-09-01 16:00:00', 5.50, 'present'),
  (10, 10, '2026-09-01 08:45:00', '2026-09-01 18:00:00', 8.25, 'present'),
  -- 2026-09-02 (Wednesday)
  (11, 1, '2026-09-02 08:50:00', '2026-09-02 18:00:00', 8.16, 'present'),
  (12, 2, '2026-09-02 09:00:00', '2026-09-02 18:00:00', 8.00, 'present'),
  (13, 3, '2026-09-02 08:55:00', '2026-09-02 18:05:00', 8.16, 'present'),
  (14, 4, '2026-09-02 08:58:00', '2026-09-02 18:00:00', 8.03, 'present'),
  (15, 5, '2026-09-02 08:50:00', '2026-09-02 18:10:00', 8.33, 'present'),
  (16, 6, '2026-09-02 08:00:00', '2026-09-02 17:00:00', 8.00, 'present'),
  (17, 7, '2026-09-02 07:55:00', '2026-09-02 17:15:00', 8.33, 'present'),
  (18, 8, '2026-09-02 08:55:00', '2026-09-02 18:00:00', 8.08, 'present'),
  (19, 9, '2026-09-02 10:05:00', '2026-09-02 16:00:00', 5.41, 'present'),
  (20, 10, '2026-09-02 09:40:00', '2026-09-02 18:30:00', 7.83, 'late'),
  -- 2026-09-03 (Thursday)
  (21, 1, '2026-09-03 08:52:00', '2026-09-03 18:10:00', 8.30, 'present'),
  (22, 2, '2026-09-03 08:56:00', '2026-09-03 18:00:00', 8.06, 'present'),
  (23, 3, '2026-09-03 08:48:00', '2026-09-03 18:00:00', 8.20, 'present'),
  (24, 4, '2026-09-03 08:59:00', '2026-09-03 18:05:00', 8.10, 'present'),
  (25, 5, '2026-09-03 08:50:00', '2026-09-03 18:00:00', 8.16, 'present'),
  (26, 6, '2026-09-03 07:50:00', '2026-09-03 17:00:00', 8.16, 'present'),
  (27, 7, '2026-09-03 08:00:00', '2026-09-03 17:00:00', 8.00, 'present'),
  (28, 8, '2026-09-03 08:55:00', '2026-09-03 18:00:00', 8.08, 'present'),
  (29, 9, '2026-09-03 10:00:00', '2026-09-03 16:00:00', 5.50, 'present'),
  (30, 10, '2026-09-03 08:50:00', '2026-09-03 18:00:00', 8.16, 'present'),
  -- 2026-09-04 (Friday)
  (31, 1, '2026-09-04 08:55:00', '2026-09-04 18:00:00', 8.08, 'present'),
  (32, 2, '2026-09-04 09:30:00', '2026-09-04 18:15:00', 7.75, 'late'),
  (33, 3, '2026-09-04 08:50:00', '2026-09-04 18:00:00', 8.16, 'present'),
  (34, 4, '2026-09-04 08:55:00', '2026-09-04 18:05:00', 8.16, 'present'),
  (35, 5, '2026-09-04 08:52:00', '2026-09-04 18:00:00', 8.13, 'present'),
  (36, 6, '2026-09-04 07:58:00', '2026-09-04 17:00:00', 8.03, 'present'),
  (37, 7, '2026-09-04 08:00:00', '2026-09-04 17:00:00', 8.00, 'present'),
  (38, 8, '2026-09-04 08:50:00', '2026-09-04 18:00:00', 8.16, 'present'),
  (39, 9, '2026-09-04 09:00:00', '2026-09-04 15:00:00', 5.00, 'present'),
  (40, 10, '2026-09-04 08:45:00', '2026-09-04 18:00:00', 8.25, 'present'),
  -- Recorded absence & exceptions
  (41, 2, '2026-08-28 09:00:00', NULL, 0.00, 'absent'),
  (42, 5, '2026-08-29 09:00:00', NULL, 0.00, 'absent');

-- ---------------------------------------------------------------------
-- 10. PAYRUNS & HISTORICAL PAYSLIPS (July, August & September 2026)
-- ---------------------------------------------------------------------
INSERT INTO payruns (id, name, salary_structure_id, period_start, period_end, status, paid_at, created_by) VALUES
  (1, 'July 2026 Regular Payroll', 1, '2026-07-01', '2026-07-31', 'paid', '2026-07-31 17:00:00', 1),
  (2, 'August 2026 Regular Payroll', 1, '2026-08-01', '2026-08-31', 'paid', '2026-08-31 17:00:00', 1),
  (3, 'September 2026 Regular Payroll', 1, '2026-09-01', '2026-09-30', 'draft', NULL, 1);

-- Map employees to payruns
INSERT INTO payrun_employees (payrun_id, employee_id, contract_id) VALUES
  -- Payrun 1
  (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5), (1, 6, 6), (1, 7, 7), (1, 8, 8), (1, 9, 9), (1, 10, 10),
  -- Payrun 2
  (2, 1, 1), (2, 2, 2), (2, 3, 3), (2, 4, 4), (2, 5, 5), (2, 6, 6), (2, 7, 7), (2, 8, 8), (2, 9, 9), (2, 10, 10),
  -- Payrun 3
  (3, 1, 1), (3, 2, 2), (3, 3, 3), (3, 4, 4), (3, 5, 5), (3, 6, 6), (3, 7, 7), (3, 8, 8), (3, 9, 9), (3, 10, 10);

-- July Payslips (All 10 Paid)
INSERT INTO payslips (id, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, worked_days, basic_wage, gross_amount, net_amount, status, has_warning, warning_notes) VALUES
  (1, 1, 1, 1, 2, '2026-07-01', '2026-07-31', 22.00, 9500.00, 14800.00, 12085.00, 'paid', FALSE, NULL),
  (2, 1, 2, 2, 1, '2026-07-01', '2026-07-31', 22.00, 7200.00, 10880.00, 9146.00, 'paid', FALSE, NULL),
  (3, 1, 3, 3, 2, '2026-07-01', '2026-07-31', 22.00, 7800.00, 12420.00, 10164.00, 'paid', FALSE, NULL),
  (4, 1, 4, 4, 1, '2026-07-01', '2026-07-31', 22.00, 6800.00, 10320.00, 8674.00, 'paid', FALSE, NULL),
  (5, 1, 5, 5, 1, '2026-07-01', '2026-07-31', 22.00, 6500.00, 9900.00, 8320.00, 'paid', FALSE, NULL),
  (6, 1, 6, 6, 2, '2026-07-01', '2026-07-31', 22.00, 8200.00, 12980.00, 10616.00, 'paid', FALSE, NULL),
  (7, 1, 7, 7, 1, '2026-07-01', '2026-07-31', 22.00, 7000.00, 10600.00, 8910.00, 'paid', FALSE, NULL),
  (8, 1, 8, 8, 1, '2026-07-01', '2026-07-31', 22.00, 7500.00, 11300.00, 9500.00, 'paid', FALSE, NULL),
  (9, 1, 9, 9, 1, '2026-07-01', '2026-07-31', 18.00, 4800.00, 7520.00, 6314.00, 'paid', FALSE, NULL),
  (10, 1, 10, 10, 1, '2026-07-01', '2026-07-31', 22.00, 5400.00, 8360.00, 7022.00, 'paid', FALSE, NULL);

-- August Payslips (All 10 Paid)
INSERT INTO payslips (id, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, worked_days, basic_wage, gross_amount, net_amount, status, has_warning, warning_notes) VALUES
  (11, 2, 1, 1, 2, '2026-08-01', '2026-08-31', 21.00, 9500.00, 14800.00, 12085.00, 'paid', FALSE, NULL),
  (12, 2, 2, 2, 1, '2026-08-01', '2026-08-31', 21.00, 7200.00, 10880.00, 9146.00, 'paid', FALSE, NULL),
  (13, 2, 3, 3, 2, '2026-08-01', '2026-08-31', 21.00, 7800.00, 12420.00, 10164.00, 'paid', FALSE, NULL),
  (14, 2, 4, 4, 1, '2026-08-01', '2026-08-31', 21.00, 6800.00, 10320.00, 8674.00, 'paid', FALSE, NULL),
  (15, 2, 5, 5, 1, '2026-08-01', '2026-08-31', 21.00, 6500.00, 9900.00, 8320.00, 'paid', FALSE, NULL),
  (16, 2, 6, 6, 2, '2026-08-01', '2026-08-31', 21.00, 8200.00, 12980.00, 10616.00, 'paid', FALSE, NULL),
  (17, 2, 7, 7, 1, '2026-08-01', '2026-08-31', 21.00, 7000.00, 10600.00, 8910.00, 'paid', FALSE, NULL),
  (18, 2, 8, 8, 1, '2026-08-01', '2026-08-31', 21.00, 7500.00, 11300.00, 9500.00, 'paid', FALSE, NULL),
  (19, 2, 9, 9, 1, '2026-08-01', '2026-08-31', 17.00, 4800.00, 7520.00, 6314.00, 'paid', FALSE, NULL),
  (20, 2, 10, 10, 1, '2026-08-01', '2026-08-31', 21.00, 5400.00, 8360.00, 7022.00, 'paid', TRUE, 'Annual statutory tax reconciliation advisory notice');

-- September Payslips (Draft & Computed)
INSERT INTO payslips (id, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, worked_days, basic_wage, gross_amount, net_amount, status, has_warning, warning_notes) VALUES
  (21, 3, 1, 1, 2, '2026-09-01', '2026-09-30', 22.00, 9500.00, 14800.00, 12085.00, 'computed', FALSE, NULL),
  (22, 3, 2, 2, 1, '2026-09-01', '2026-09-30', 22.00, 7200.00, 10880.00, 9146.00, 'computed', FALSE, NULL),
  (23, 3, 3, 3, 2, '2026-09-01', '2026-09-30', 22.00, 7800.00, 12420.00, 10164.00, 'computed', FALSE, NULL),
  (24, 3, 4, 4, 1, '2026-09-01', '2026-09-30', 22.00, 6800.00, 10320.00, 8674.00, 'computed', FALSE, NULL),
  (25, 3, 5, 5, 1, '2026-09-01', '2026-09-30', 22.00, 6500.00, 9900.00, 8320.00, 'draft', FALSE, NULL),
  (26, 3, 6, 6, 2, '2026-09-01', '2026-09-30', 22.00, 8200.00, 12980.00, 10616.00, 'draft', FALSE, NULL),
  (27, 3, 7, 7, 1, '2026-09-01', '2026-09-30', 22.00, 7000.00, 10600.00, 8910.00, 'draft', FALSE, NULL),
  (28, 3, 8, 8, 1, '2026-09-01', '2026-09-30', 22.00, 7500.00, 11300.00, 9500.00, 'draft', FALSE, NULL),
  (29, 3, 9, 9, 1, '2026-09-01', '2026-09-30', 18.00, 4800.00, 7520.00, 6314.00, 'draft', FALSE, NULL),
  (30, 3, 10, 10, 1, '2026-09-01', '2026-09-30', 22.00, 5400.00, 8360.00, 7022.00, 'draft', FALSE, NULL);

-- Detailed Payslip Lines (Sample for Payslip 1 - Alice Smith)
INSERT INTO payslip_lines (payslip_id, salary_rule_id, code, name, category, sequence, amount) VALUES
  (1, 1, 'BASIC', 'Basic Contract Wage', 'basic', 10, 9500.00),
  (1, 2, 'HRA', 'House Rent Allowance (HRA)', 'allowance', 20, 3800.00),
  (1, 8, 'EXEC_ALLOWANCE', 'Executive Leadership Allowance', 'allowance', 30, 1200.00),
  (1, 4, 'TRANSPORT', 'Commuter & Transport Allowance', 'allowance', 40, 300.00),
  (1, 5, 'PF', 'Provident Fund (PF)', 'deduction', 50, -1140.00),
  (1, 9, 'EXEC_TAX', 'Executive Tier Tax', 'deduction', 60, -1425.00),
  (1, 7, 'HEALTH_INS', 'Medical & Health Insurance', 'deduction', 70, -150.00),
  -- Payslip 2 - Bob Miller
  (2, 1, 'BASIC', 'Basic Contract Wage', 'basic', 10, 7200.00),
  (2, 2, 'HRA', 'House Rent Allowance (HRA)', 'allowance', 20, 2880.00),
  (2, 3, 'SPECIAL', 'Special Allowance', 'allowance', 30, 500.00),
  (2, 4, 'TRANSPORT', 'Commuter & Transport Allowance', 'allowance', 40, 300.00),
  (2, 5, 'PF', 'Provident Fund (PF)', 'deduction', 50, -864.00),
  (2, 6, 'TAX', 'Professional Tax', 'deduction', 60, -720.00),
  (2, 7, 'HEALTH_INS', 'Medical & Health Insurance', 'deduction', 70, -150.00);

-- ---------------------------------------------------------------------
-- 11. REFRESH LIVE DASHBOARD VIEWS
-- ---------------------------------------------------------------------
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
