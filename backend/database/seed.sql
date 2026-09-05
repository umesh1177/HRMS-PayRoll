-- =====================================================================
-- PeoplePay360: Demo Seed Data
-- =====================================================================
USE peoplepay360;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Org Structure
INSERT INTO departments (id, name) VALUES
  (1, 'Engineering'),
  (2, 'Human Resources'),
  (3, 'Finance & Payroll')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO job_positions (id, title, department_id) VALUES
  (1, 'Lead Architect', 1),
  (2, 'Senior Frontend Engineer', 1),
  (3, 'HR Manager', 2),
  (4, 'Payroll Officer', 3)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 2. Working Schedules
INSERT INTO working_schedules (id, name, schedule_type, total_weekly_hours, status) VALUES
  (1, 'Standard 40 Hours', 'full_time', 40.00, 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO schedule_lines (schedule_id, day_of_week, start_time, end_time, break_minutes) VALUES
  (1, 'mon', '09:00:00', '18:00:00', 60),
  (1, 'tue', '09:00:00', '18:00:00', 60),
  (1, 'wed', '09:00:00', '18:00:00', 60),
  (1, 'thu', '09:00:00', '18:00:00', 60),
  (1, 'fri', '09:00:00', '18:00:00', 60)
ON DUPLICATE KEY UPDATE break_minutes=VALUES(break_minutes);

-- 3. Employees
INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, department_id, job_position_id, working_schedule_id, status, date_joined) VALUES
  (1, 'EMP001', 'Alice', 'Smith', 'alice.smith@peoplepay360.com', '+1-555-0101', 1, 1, 1, 'active', '2024-01-15'),
  (2, 'EMP002', 'Bob', 'Miller', 'bob.miller@peoplepay360.com', '+1-555-0102', 1, 2, 1, 'active', '2024-03-01'),
  (3, 'EMP003', 'Clara', 'Davis', 'clara.davis@peoplepay360.com', '+1-555-0103', 2, 3, 1, 'active', '2023-11-10')
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name);

-- Link Department Managers
UPDATE departments SET manager_id = 1 WHERE id = 1;
UPDATE departments SET manager_id = 3 WHERE id = 2;

-- 4. User Accounts (Password hashes for demo credentials)
-- Passwords:
-- admin@peoplepay360.com       -> Admin@123
-- hrmanager@peoplepay360.com   -> HR@123
-- payrollmgr@peoplepay360.com  -> Payroll@123
-- employee@peoplepay360.com    -> Emp@123
INSERT INTO users (id, employee_id, email, password_hash, role_id, status) VALUES
  (1, NULL, 'admin@peoplepay360.com', '$2b$10$RGw8APgrh6D0ejyKIvcbwuEkedG1R8XOpPhZySa1d76zqhYirUKDu', 1, 'active'),
  (2, 3, 'hrmanager@peoplepay360.com', '$2b$10$Ep8xHHpsA.jw2rdoGpImHehbUljUl7SUkMISvTLXl/PctT0q9EW1O', 2, 'active'),
  (3, NULL, 'payrollmgr@peoplepay360.com', '$2b$10$efbI9qteDNOlgvcWfnU8CuIQgCiNaNDM6IAuz5uvlAiquSIKjhq.K', 4, 'active'),
  (4, 2, 'employee@peoplepay360.com', '$2b$10$y4kFxOQ2.ex3HSyTza5Gh.12JwpO8QoRLE3Pb8/G5Rvd4p3tAAy5.', 5, 'active')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- 5. Salary Structure & Rules
INSERT INTO salary_structures (id, name, description, status) VALUES
  (1, 'Regular Salary Structure', 'Standard permanent employee salary breakdown', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO salary_rules (id, name, code, category, computation_method, fixed_amount, percentage_value, percentage_basis_code, active) VALUES
  (1, 'Basic Wage', 'BASIC', 'basic', 'fixed', 5000.00, NULL, NULL, TRUE),
  (2, 'House Rent Allowance (HRA)', 'HRA', 'allowance', 'percentage', NULL, 0.400, 'BASIC', TRUE),
  (3, 'Special Allowance', 'SPECIAL', 'allowance', 'fixed', 800.00, NULL, NULL, TRUE),
  (4, 'Provident Fund (PF)', 'PF', 'deduction', 'percentage', NULL, 0.120, 'BASIC', TRUE),
  (5, 'Professional Tax', 'PT', 'deduction', 'fixed', 200.00, NULL, NULL, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES
  (1, 1, 10),
  (1, 2, 20),
  (1, 3, 30),
  (1, 4, 40),
  (1, 5, 50)
ON DUPLICATE KEY UPDATE sequence=VALUES(sequence);

-- 6. Contracts
INSERT INTO contracts (id, employee_id, job_position_id, department_id, working_schedule_id, salary_structure_id, wage, contract_type, start_date, status) VALUES
  (1, 1, 1, 1, 1, 1, 9500.00, 'permanent', '2024-01-15', 'running'),
  (2, 2, 2, 1, 1, 1, 7200.00, 'permanent', '2024-03-01', 'running'),
  (3, 3, 3, 2, 1, 1, 6800.00, 'permanent', '2023-11-10', 'running')
ON DUPLICATE KEY UPDATE wage=VALUES(wage);

-- 7. Time Off Configuration & Allocations
INSERT INTO time_off_types (id, name, unit, requires_allocation, approval_type, affects_payroll, color, active) VALUES
  (1, 'Paid Time Off (PTO)', 'day', TRUE, 'single', FALSE, '#4f46e5', TRUE),
  (2, 'Sick Leave', 'day', TRUE, 'single', FALSE, '#ef4444', TRUE),
  (3, 'Unpaid Leave', 'day', FALSE, 'single', TRUE, '#f59e0b', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated_amount, taken_amount, valid_from, valid_to, status, approved_by) VALUES
  (1, 1, 1, 20.00, 5.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (2, 2, 1, 15.00, 0.00, '2026-01-01', '2026-12-31', 'approved', 1),
  (3, 3, 1, 15.00, 2.00, '2026-01-01', '2026-12-31', 'approved', 1)
ON DUPLICATE KEY UPDATE allocated_amount=VALUES(allocated_amount);

SET FOREIGN_KEY_CHECKS = 1;
