/**
 * Salary Structures Controller
 * 
 * RESPONSIBILITY:
 * Manages salary structure definitions and the many-to-many `structure_rules` junction
 * specifying the sequence order of salary rules within a structure.
 * 
 * NOT RESPONSIBLE FOR:
 * Evaluating rule math (handled by services/payrollEngine.js).
 */

const pool = require('../config/db');

/**
 * Lists all salary structures with rule counts.
 */
async function listStructures(req, res, next) {
  try {
    const query = `
      SELECT 
        ss.id,
        ss.name,
        ss.description,
        ss.status,
        ss.created_at,
        COUNT(sr.id) AS rules_count
      FROM salary_structures ss
      LEFT JOIN structure_rules sr ON ss.id = sr.salary_structure_id
      GROUP BY ss.id
      ORDER BY ss.id ASC
    `;

    const [rows] = await pool.query(query);
    res.status(200).json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets a single salary structure with its ordered rules list.
 */
async function getStructureById(req, res, next) {
  try {
    const { id } = req.params;

    const [structures] = await pool.query('SELECT * FROM salary_structures WHERE id = ?', [id]);
    if (structures.length === 0) {
      const error = new Error(`Salary structure #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    const rulesQuery = `
      SELECT 
        sr.id AS structure_rule_id,
        sr.sequence,
        r.id AS salary_rule_id,
        r.name,
        r.code,
        r.category,
        r.computation_method,
        r.fixed_amount,
        r.percentage_value,
        r.percentage_basis_code,
        r.formula,
        r.active
      FROM structure_rules sr
      JOIN salary_rules r ON sr.salary_rule_id = r.id
      WHERE sr.salary_structure_id = ?
      ORDER BY sr.sequence ASC
    `;

    const [rules] = await pool.query(rulesQuery, [id]);

    res.status(200).json({
      data: {
        ...structures[0],
        rules
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new salary structure along with its assigned rules in a single transaction.
 */
async function createStructure(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { name, description, status, rules } = req.body;

    if (!name) {
      const error = new Error('Structure name is required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    await connection.beginTransaction();

    const [structResult] = await connection.query(
      'INSERT INTO salary_structures (name, description, status) VALUES (?, ?, ?)',
      [name, description || null, status || 'active']
    );

    const structureId = structResult.insertId;

    if (Array.isArray(rules) && rules.length > 0) {
      const ruleValues = rules.map((r, idx) => [
        structureId,
        r.salary_rule_id,
        r.sequence !== undefined ? r.sequence : (idx + 1) * 10
      ]);

      await connection.query(
        'INSERT INTO structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES ?',
        [ruleValues]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Salary structure created successfully',
      data: { id: structureId, name, description }
    });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error(`Salary structure '${req.body.name}' already exists`);
      error.status = 409;
      error.code = 'DUPLICATE_NAME';
      return next(error);
    }
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Updates a salary structure and replaces its structure_rules.
 */
async function updateStructure(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { name, description, status, rules } = req.body;

    await connection.beginTransaction();

    const [structResult] = await connection.query(
      'UPDATE salary_structures SET name = COALESCE(?, name), description = COALESCE(?, description), status = COALESCE(?, status) WHERE id = ?',
      [name, description, status, id]
    );

    if (structResult.affectedRows === 0) {
      const error = new Error(`Salary structure #${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    if (Array.isArray(rules)) {
      await connection.query('DELETE FROM structure_rules WHERE salary_structure_id = ?', [id]);
      if (rules.length > 0) {
        const ruleValues = rules.map((r, idx) => [
          id,
          r.salary_rule_id,
          r.sequence !== undefined ? r.sequence : (idx + 1) * 10
        ]);
        await connection.query(
          'INSERT INTO structure_rules (salary_structure_id, salary_rule_id, sequence) VALUES ?',
          [ruleValues]
        );
      }
    }

    await connection.commit();
    res.status(200).json({ message: 'Salary structure updated successfully' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * Deletes a salary structure.
 */
async function deleteStructure(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM salary_structures WHERE id = ?', [id]);
    res.status(200).json({ message: 'Salary structure deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      const error = new Error('Cannot delete structure currently assigned to active contracts or payruns');
      error.status = 400;
      error.code = 'CONSTRAINT_VIOLATION';
      return next(error);
    }
    next(err);
  }
}

module.exports = {
  listStructures,
  getStructureById,
  createStructure,
  updateStructure,
  deleteStructure
};
