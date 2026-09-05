/**
 * Departments and Job Positions Controller
 * 
 * RESPONSIBILITY:
 * Manages organization hierarchy: CRUD operations for departments and their associated job positions.
 * 
 * NOT RESPONSIBLE FOR:
 * Employee contract generation or payroll computation.
 */

const pool = require('../config/db');

/**
 * Lists departments with optional pagination and manager names.
 * 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
async function listDepartments(req, res, next) {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

    let baseQuery = `
      SELECT 
        d.id, 
        d.name, 
        d.manager_id, 
        d.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS manager_name,
        COUNT(emp.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON d.manager_id = e.id
      LEFT JOIN employees emp ON emp.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `;

    if (page && limit) {
      const offset = (page - 1) * limit;
      const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM departments');
      const [rows] = await pool.query(`${baseQuery} LIMIT ? OFFSET ?`, [limit, offset]);
      return res.status(200).json({
        data: rows,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
      });
    }

    const [rows] = await pool.query(baseQuery);
    res.status(200).json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets single department by ID with associated job positions.
 */
async function getDepartmentById(req, res, next) {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        d.id, 
        d.name, 
        d.manager_id, 
        d.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS manager_name
      FROM departments d
      LEFT JOIN employees e ON d.manager_id = e.id
      WHERE d.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) {
      const error = new Error(`Department with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const [positions] = await pool.query(
      'SELECT id, title FROM job_positions WHERE department_id = ? ORDER BY title ASC',
      [id]
    );

    res.status(200).json({
      data: {
        ...rows[0],
        positions
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new department.
 */
async function createDepartment(req, res, next) {
  try {
    const { name, manager_id } = req.body;
    if (!name) {
      const error = new Error('Department name is required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const [result] = await pool.query(
      'INSERT INTO departments (name, manager_id) VALUES (?, ?)',
      [name, manager_id || null]
    );

    res.status(201).json({
      message: 'Department created successfully',
      data: { id: result.insertId, name, manager_id: manager_id || null }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error(`Department '${req.body.name}' already exists`);
      error.status = 409;
      error.code = 'DUPLICATE_NAME';
      return next(error);
    }
    next(err);
  }
}

/**
 * Updates an existing department.
 */
async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, manager_id } = req.body;

    const [result] = await pool.query(
      'UPDATE departments SET name = COALESCE(?, name), manager_id = COALESCE(?, manager_id) WHERE id = ?',
      [name, manager_id, id]
    );

    if (result.affectedRows === 0) {
      const error = new Error(`Department with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ message: 'Department updated successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a department.
 */
async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM departments WHERE id = ?', [id]);
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      const error = new Error('Cannot delete department with active job positions or assigned employees');
      error.status = 400;
      error.code = 'CONSTRAINT_VIOLATION';
      return next(error);
    }
    next(err);
  }
}

/**
 * Lists all job positions with joined department name.
 */
async function listJobPositions(req, res, next) {
  try {
    const { department_id } = req.query;
    let query = `
      SELECT 
        jp.id, 
        jp.title, 
        jp.department_id, 
        d.name AS department_name,
        COUNT(emp.id) AS employee_count
      FROM job_positions jp
      JOIN departments d ON jp.department_id = d.id
      LEFT JOIN employees emp ON emp.job_position_id = jp.id
    `;
    const params = [];

    if (department_id) {
      query += ' WHERE jp.department_id = ?';
      params.push(department_id);
    }
    query += ' GROUP BY jp.id ORDER BY jp.title ASC';

    const [rows] = await pool.query(query, params);
    res.status(200).json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a job position.
 */
async function createJobPosition(req, res, next) {
  try {
    const { title, department_id } = req.body;
    if (!title || !department_id) {
      const error = new Error('Position title and department_id are required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const [result] = await pool.query(
      'INSERT INTO job_positions (title, department_id) VALUES (?, ?)',
      [title, department_id]
    );

    res.status(201).json({
      message: 'Job position created successfully',
      data: { id: result.insertId, title, department_id }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates a job position.
 */
async function updateJobPosition(req, res, next) {
  try {
    const { id } = req.params;
    const { title, department_id } = req.body;

    const [result] = await pool.query(
      'UPDATE job_positions SET title = COALESCE(?, title), department_id = COALESCE(?, department_id) WHERE id = ?',
      [title, department_id, id]
    );

    if (result.affectedRows === 0) {
      const error = new Error(`Job position with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ message: 'Job position updated successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a job position.
 */
async function deleteJobPosition(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM job_positions WHERE id = ?', [id]);
    res.status(200).json({ message: 'Job position deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      const error = new Error('Cannot delete position assigned to active employees or contracts');
      error.status = 400;
      error.code = 'CONSTRAINT_VIOLATION';
      return next(error);
    }
    next(err);
  }
}

module.exports = {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listJobPositions,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition
};
