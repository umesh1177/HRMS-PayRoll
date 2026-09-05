/**
 * Salary Rules Controller
 * 
 * RESPONSIBILITY:
 * Manages atomic salary rule definitions (basic, allowances, deductions, contributions),
 * their computation methods (fixed, percentage, formula), and percentage basis linkages.
 * 
 * NOT RESPONSIBLE FOR:
 * Computing individual payslip lines (handled by services/payrollEngine.js).
 */

const pool = require('../config/db');

/**
 * Lists all salary rules.
 */
async function listRules(req, res, next) {
  try {
    const [rules] = await pool.query('SELECT * FROM salary_rules ORDER BY id ASC');
    res.status(200).json({ data: rules });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets a single salary rule by ID.
 */
async function getRuleById(req, res, next) {
  try {
    const { id } = req.params;
    const [rules] = await pool.query('SELECT * FROM salary_rules WHERE id = ?', [id]);
    if (rules.length === 0) {
      const error = new Error(`Salary rule #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }
    res.status(200).json({ data: rules[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new salary rule.
 */
async function createRule(req, res, next) {
  try {
    const {
      name,
      code,
      category,
      computation_method,
      fixed_amount,
      percentage_value,
      percentage_basis_code,
      formula,
      active
    } = req.body;

    if (!name || !code || !category || !computation_method) {
      const error = new Error('name, code, category, and computation_method are required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    const insertSql = `
      INSERT INTO salary_rules (
        name, code, category, computation_method, fixed_amount,
        percentage_value, percentage_basis_code, formula, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertSql, [
      name,
      code.toUpperCase().trim(),
      category,
      computation_method,
      fixed_amount || null,
      percentage_value || null,
      percentage_basis_code ? percentage_basis_code.toUpperCase().trim() : null,
      formula || null,
      active !== undefined ? active : true
    ]);

    res.status(201).json({
      message: 'Salary rule created successfully',
      data: { id: result.insertId, name, code: code.toUpperCase() }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error(`Salary rule code '${req.body.code}' already exists`);
      error.status = 409;
      error.code = 'DUPLICATE_CODE';
      return next(error);
    }
    next(err);
  }
}

/**
 * Updates a salary rule.
 */
async function updateRule(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      category,
      computation_method,
      fixed_amount,
      percentage_value,
      percentage_basis_code,
      formula,
      active
    } = req.body;

    const updateSql = `
      UPDATE salary_rules SET
        name = COALESCE(?, name),
        code = COALESCE(?, code),
        category = COALESCE(?, category),
        computation_method = COALESCE(?, computation_method),
        fixed_amount = ?,
        percentage_value = ?,
        percentage_basis_code = ?,
        formula = ?,
        active = COALESCE(?, active)
      WHERE id = ?
    `;

    const [result] = await pool.query(updateSql, [
      name,
      code ? code.toUpperCase().trim() : undefined,
      category,
      computation_method,
      fixed_amount !== undefined ? fixed_amount : null,
      percentage_value !== undefined ? percentage_value : null,
      percentage_basis_code !== undefined ? (percentage_basis_code ? percentage_basis_code.toUpperCase().trim() : null) : null,
      formula !== undefined ? formula : null,
      active,
      id
    ]);

    if (result.affectedRows === 0) {
      const error = new Error(`Salary rule #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ message: 'Salary rule updated successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a salary rule.
 */
async function deleteRule(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM salary_rules WHERE id = ?', [id]);
    res.status(200).json({ message: 'Salary rule deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      const error = new Error('Cannot delete rule currently attached to salary structures or payslip lines');
      error.status = 400;
      error.code = 'CONSTRAINT_VIOLATION';
      return next(error);
    }
    next(err);
  }
}

module.exports = {
  listRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule
};
