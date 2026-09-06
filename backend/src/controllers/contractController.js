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
const { getDataScope } = require('../utils/accessScope');

/**
 * Lists contracts with pagination and joined relation names.
 * Automatically scopes to own employee profile if user is an Employee.
 */
async function listContracts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { employee_id, status, department_id } = req.query;
    const dataScope = await getDataScope(req.user);

    let whereConditions = [];
    let queryParams = [];

    // Check if user has permission to manage all contracts or view only their own
    const userRole = req.user.role_id;
    const [permRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ? AND (p.code = 'contract.manage' OR p.code = 'system.admin')`,
      [userRole]
    );
    const canManage = permRows.length > 0;

    if (!canManage) {
      if (!req.user.employee_id) {
        return res.status(200).json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
      whereConditions.push('c.employee_id = ?');
      queryParams.push(req.user.employee_id);
    } else if (employee_id) {
      whereConditions.push('c.employee_id = ?');
      queryParams.push(employee_id);
    }

    if (canManage && !dataScope.isAdmin) {
      if (!dataScope.departmentId) {
        return res.status(200).json({ data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
      whereConditions.push('c.department_id = ?');
      queryParams.push(dataScope.departmentId);
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
        c.name,
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

    const userRole = req.user.role_id;
    const [permRows] = await pool.query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ? AND (p.code = 'contract.manage' OR p.code = 'system.admin')`,
      [userRole]
    );
    const canManage = permRows.length > 0;

    let query = `
      SELECT 
        c.id,
        c.name,
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
    `;

    const params = [id];
    if (!canManage) {
      query += ' AND c.employee_id = ?';
      params.push(req.user.employee_id);
    }
    query += ' LIMIT 1';

    const [rows] = await pool.query(query, params);
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
 * Creates a new contract (or batch creates contracts for multiple employees).
 */
async function createContract(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      name,
      employee_id,
      employee_ids,
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

    // Support both single employee_id and multiple employee_ids
    let targetEmployeeIds = [];
    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      targetEmployeeIds = employee_ids.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0);
    } else if (employee_id) {
      targetEmployeeIds = [Number(employee_id)];
    }

    if (targetEmployeeIds.length === 0) {
      return next(createValidationError('At least one employee must be selected for the contract.', 'employee_ids'));
    }

    if (!salary_structure_id || wage === undefined || !start_date) {
      return next(createValidationError('Salary structure, wage, and start_date are required.'));
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

    const contractStatus = status || 'draft';
    const contractName = (name && name.trim()) ? name.trim() : null;

    // Check for running contract overlaps
    if (contractStatus === 'running') {
      for (const empId of targetEmployeeIds) {
        const overlapCheck = await checkRunningContractOverlap(empId, start_date, end_date || null);
        if (overlapCheck.hasOverlap) {
          const [emp] = await connection.query('SELECT first_name, last_name, employee_code FROM employees WHERE id = ?', [empId]);
          const empName = emp.length > 0 ? `${emp[0].first_name} ${emp[0].last_name} (${emp[0].employee_code})` : `Employee #${empId}`;
          const error = new Error(
            `Cannot create running contract: ${empName} already has an active running contract overlapping this date period.`
          );
          error.status = 409;
          error.code = 'CONTRACT_OVERLAP_CONFLICT';
          return next(error);
        }
      }
    }

    await connection.beginTransaction();

    const insertSql = `
      INSERT INTO contracts (
        name, employee_id, job_position_id, department_id, working_schedule_id,
        salary_structure_id, wage, contract_type, start_date, end_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const createdIds = [];
    for (const empId of targetEmployeeIds) {
      let finalName = contractName;
      if (!finalName) {
        const [emp] = await connection.query('SELECT first_name, last_name FROM employees WHERE id = ?', [empId]);
        const nameSuffix = emp.length > 0 ? ` (${emp[0].first_name} ${emp[0].last_name})` : '';
        finalName = `${(contract_type || 'Standard').toUpperCase()} Contract${nameSuffix}`;
      }

      const [result] = await connection.query(insertSql, [
        finalName,
        empId,
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
      createdIds.push(result.insertId);
    }

    await connection.commit();

    res.status(201).json({
      message: targetEmployeeIds.length > 1
        ? `Successfully created ${targetEmployeeIds.length} contracts for selected employees.`
        : 'Contract created successfully',
      data: {
        ids: createdIds,
        id: createdIds[0],
        count: createdIds.length,
        name: contractName,
        status: contractStatus
      }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Updates an existing contract with overlap validation.
 */
async function updateContract(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
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
        name = COALESCE(?, name),
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
      name !== undefined ? name : existing.name,
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
 * Completely removes a contract and associated payslip references from the database.
 */
async function deleteContract(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    
    // Check if contract exists
    const [existing] = await connection.query('SELECT id FROM contracts WHERE id = ?', [id]);
    if (existing.length === 0) {
      const error = new Error(`Contract with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    await connection.beginTransaction();

    // 1. Delete payslip lines linked to payslips of this contract
    await connection.query(
      `DELETE pl FROM payslip_lines pl 
       JOIN payslips p ON pl.payslip_id = p.id 
       WHERE p.contract_id = ?`,
      [id]
    );

    // 2. Delete payslips for this contract
    await connection.query('DELETE FROM payslips WHERE contract_id = ?', [id]);

    // 3. Delete payrun_employees entries for this contract
    await connection.query('DELETE FROM payrun_employees WHERE contract_id = ?', [id]);

    // 4. Delete the contract record
    await connection.query('DELETE FROM contracts WHERE id = ?', [id]);

    await connection.commit();
    res.status(200).json({ message: 'Contract and associated records permanently deleted from database' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract
};
