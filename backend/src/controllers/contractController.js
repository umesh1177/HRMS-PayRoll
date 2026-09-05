/**
 * Employment Contracts Controller
 * 
 * RESPONSIBILITY:
 * Manages employee contract lifecycles (draft -> running -> expired / cancelled),
 * wage configurations, salary structure assignments, and enforces running contract overlap constraints.
 * 
 * NOT RESPONSIBLE FOR:
 * Direct payslip line generation (handled by payrollEngine.js).
 */

const pool = require('../config/db');
const { checkRunningContractOverlap } = require('../services/contractService');
const {
  isValidNumber,
  isValidDate,
  isValidDateRange,
  isValidEnum,
  createValidationError
} = require('../utils/validators');

/**
 * Lists contracts with pagination and joined relation names.
 */
async function listContracts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { employee_id, status, department_id } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (employee_id) {
      whereConditions.push('c.employee_id = ?');
      queryParams.push(employee_id);
    }

    if (status) {
      whereConditions.push('c.status = ?');
      queryParams.push(status);
    }

    if (department_id) {
      whereConditions.push('c.department_id = ?');
      queryParams.push(department_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM contracts c ${whereClause}`;
    const [[{ total }]] = await pool.query(countSql, queryParams);

    const listSql = `
      SELECT 
        c.id,
        c.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        c.job_position_id,
        jp.title AS job_title,
        c.department_id,
        d.name AS department_name,
        c.working_schedule_id,
        ws.name AS working_schedule_name,
        c.salary_structure_id,
        ss.name AS structure_name,
        c.wage,
        c.contract_type,
        c.start_date,
        c.end_date,
        c.status,
        c.created_at,
        c.updated_at
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN job_positions jp ON c.job_position_id = jp.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
      JOIN salary_structures ss ON c.salary_structure_id = ss.id
      ${whereClause}
      ORDER BY c.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(listSql, [...queryParams, limit, offset]);

    res.status(200).json({
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets a single contract by ID.
 */
async function getContractById(req, res, next) {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        c.id,
        c.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.employee_code,
        c.job_position_id,
        jp.title AS job_title,
        c.department_id,
        d.name AS department_name,
        c.working_schedule_id,
        ws.name AS working_schedule_name,
        c.salary_structure_id,
        ss.name AS structure_name,
        c.wage,
        c.contract_type,
        c.start_date,
        c.end_date,
        c.status,
        c.created_at,
        c.updated_at
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN job_positions jp ON c.job_position_id = jp.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN working_schedules ws ON c.working_schedule_id = ws.id
      JOIN salary_structures ss ON c.salary_structure_id = ss.id
      WHERE c.id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) {
      const error = new Error(`Contract with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new contract with overlap validation for running contracts.
 */
async function createContract(req, res, next) {
  try {
    const {
      employee_id,
      job_position_id,
      department_id,
      working_schedule_id,
      salary_structure_id,
      wage,
      contract_type,
      start_date,
      end_date,
      status
    } = req.body;

    if (!employee_id || !salary_structure_id || wage === undefined || !start_date) {
      return next(createValidationError('employee_id, salary_structure_id, wage, and start_date are required'));
    }

    if (!isValidNumber(wage, 0.01)) {
      return next(createValidationError('Contract wage must be a positive number greater than 0', 'wage'));
    }

    if (!isValidDate(start_date)) {
      return next(createValidationError('Invalid start_date format', 'start_date'));
    }

    if (end_date && (!isValidDate(end_date) || !isValidDateRange(start_date, end_date))) {
      return next(createValidationError('end_date must be a valid date on or after start_date', 'end_date'));
    }

    if (contract_type && !isValidEnum(contract_type, ['permanent', 'temporary', 'contractor', 'intern'])) {
      return next(createValidationError('Invalid contract_type. Allowed: permanent, temporary, contractor, intern', 'contract_type'));
    }

    if (status && !isValidEnum(status, ['draft', 'running', 'expired', 'cancelled'])) {
      return next(createValidationError('Invalid status. Allowed: draft, running, expired, cancelled', 'status'));
    }

    const contractStatus = status || 'draft';

    // Enforce "no two overlapping running contracts per employee"
    // Reference schema.sql lines 274-276
    if (contractStatus === 'running') {
      const overlapCheck = await checkRunningContractOverlap(employee_id, start_date, end_date || null);
      if (overlapCheck.hasOverlap) {
        const error = new Error(
          `Cannot create running contract: employee already has an active running contract (ID #${overlapCheck.conflictingContract.id}) overlapping this date period`
        );
        error.status = 409;
        error.code = 'CONTRACT_OVERLAP_CONFLICT';
        return next(error);
      }
    }

    const insertSql = `
      INSERT INTO contracts (
        employee_id, job_position_id, department_id, working_schedule_id,
        salary_structure_id, wage, contract_type, start_date, end_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertSql, [
      employee_id,
      job_position_id || null,
      department_id || null,
      working_schedule_id || null,
      salary_structure_id,
      wage,
      contract_type || 'permanent',
      start_date,
      end_date || null,
      contractStatus
    ]);

    res.status(201).json({
      message: 'Contract created successfully',
      data: {
        id: result.insertId,
        employee_id,
        salary_structure_id,
        wage,
        status: contractStatus
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an existing contract with overlap validation.
 */
async function updateContract(req, res, next) {
  try {
    const { id } = req.params;
    const {
      job_position_id,
      department_id,
      working_schedule_id,
      salary_structure_id,
      wage,
      contract_type,
      start_date,
      end_date,
      status
    } = req.body;

    const [existingRows] = await pool.query('SELECT * FROM contracts WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      const error = new Error(`Contract with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const existing = existingRows[0];
    const newStatus = status !== undefined ? status : existing.status;
    const newStartDate = start_date !== undefined ? start_date : existing.start_date;
    const newEndDate = end_date !== undefined ? end_date : existing.end_date;

    // Enforce overlap rule if status is running
    if (newStatus === 'running') {
      const overlapCheck = await checkRunningContractOverlap(
        existing.employee_id,
        newStartDate,
        newEndDate || null,
        id
      );
      if (overlapCheck.hasOverlap) {
        const error = new Error(
          `Cannot update contract to running: employee already has an active running contract (ID #${overlapCheck.conflictingContract.id}) overlapping this date period`
        );
        error.status = 409;
        error.code = 'CONTRACT_OVERLAP_CONFLICT';
        return next(error);
      }
    }

    const updateSql = `
      UPDATE contracts SET
        job_position_id = COALESCE(?, job_position_id),
        department_id = COALESCE(?, department_id),
        working_schedule_id = COALESCE(?, working_schedule_id),
        salary_structure_id = COALESCE(?, salary_structure_id),
        wage = COALESCE(?, wage),
        contract_type = COALESCE(?, contract_type),
        start_date = COALESCE(?, start_date),
        end_date = ?,
        status = COALESCE(?, status)
      WHERE id = ?
    `;

    await pool.query(updateSql, [
      job_position_id,
      department_id,
      working_schedule_id,
      salary_structure_id,
      wage,
      contract_type,
      start_date,
      end_date !== undefined ? end_date : existing.end_date,
      status,
      id
    ]);

    res.status(200).json({ message: 'Contract updated successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancels or deletes a contract (preserves history per design note 2).
 */
async function deleteContract(req, res, next) {
  try {
    const { id } = req.params;
    // Per Design Note 2 in schema.sql: "Nothing is hard-deleted from Contracts / Payruns / Payslips — status flags preserve history"
    const [result] = await pool.query('UPDATE contracts SET status = "cancelled" WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      const error = new Error(`Contract with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ message: 'Contract status set to cancelled' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract
};
