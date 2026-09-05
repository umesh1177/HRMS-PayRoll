/**
 * Contract Types Controller
 * 
 * RESPONSIBILITY:
 * Provides CRUD operations for contract type categories (Permanent, Fixed-Term, Contractor, etc.)
 * with live contract counts and validation.
 */

const pool = require('../config/db');

/**
 * Lists all contract types with active and total contracts count.
 */
async function listContractTypes(req, res, next) {
  try {
    const query = `
      SELECT 
        ct.id,
        ct.code,
        ct.name,
        ct.description,
        ct.default_duration,
        ct.default_terms,
        ct.status,
        ct.created_at,
        COUNT(c.id) AS total_contracts_count,
        SUM(CASE WHEN c.status = 'running' THEN 1 ELSE 0 END) AS active_contracts_count
      FROM contract_types ct
      LEFT JOIN contracts c ON c.contract_type = ct.code
      GROUP BY ct.id
      ORDER BY ct.id ASC
    `;

    const [rows] = await pool.query(query);
    res.status(200).json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets a single contract type by ID.
 */
async function getContractTypeById(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM contract_types WHERE id = ?', [id]);
    if (rows.length === 0) {
      const error = new Error(`Contract type with ID ${id} not found`);
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
 * Creates a new contract type.
 */
async function createContractType(req, res, next) {
  try {
    const { code, name, description, default_duration, default_terms, status } = req.body;

    if (!name || !name.trim()) {
      const error = new Error('Contract type name is required');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    // Generate code from name if not provided
    const generatedCode = (code && code.trim())
      ? code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const [result] = await pool.query(
      `INSERT INTO contract_types (code, name, description, default_duration, default_terms, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        generatedCode,
        name.trim(),
        description || null,
        default_duration || null,
        default_terms || null,
        status || 'active'
      ]
    );

    res.status(201).json({
      message: 'Contract type created successfully',
      data: {
        id: result.insertId,
        code: generatedCode,
        name: name.trim(),
        description,
        default_duration,
        default_terms,
        status: status || 'active'
      }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error('A contract type with this code or name already exists. Please choose a unique name.');
      error.status = 409;
      error.code = 'DUPLICATE_ENTRY';
      return next(error);
    }
    next(err);
  }
}

/**
 * Updates an existing contract type.
 */
async function updateContractType(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, default_duration, default_terms, status } = req.body;

    const [result] = await pool.query(
      `UPDATE contract_types 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           default_duration = COALESCE(?, default_duration),
           default_terms = COALESCE(?, default_terms),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, description, default_duration, default_terms, status, id]
    );

    if (result.affectedRows === 0) {
      const error = new Error(`Contract type with ID ${id} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    res.status(200).json({ message: 'Contract type updated successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a contract type.
 */
async function deleteContractType(req, res, next) {
  try {
    const { id } = req.params;

    // Check if contract type has contracts linked
    const [typeRows] = await pool.query('SELECT code FROM contract_types WHERE id = ?', [id]);
    if (typeRows.length === 0) {
      return res.status(200).json({ message: 'Contract type already deleted' });
    }

    const code = typeRows[0].code;
    const [[{ contractCount }]] = await pool.query(
      'SELECT COUNT(*) as contractCount FROM contracts WHERE contract_type = ?',
      [code]
    );

    if (contractCount > 0) {
      const error = new Error(`Cannot delete contract type "${code}" because ${contractCount} active or historical contracts are assigned to it. You can set its status to inactive instead.`);
      error.status = 400;
      error.code = 'CONSTRAINT_VIOLATION';
      return next(error);
    }

    await pool.query('DELETE FROM contract_types WHERE id = ?', [id]);
    res.status(200).json({ message: 'Contract type deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listContractTypes,
  getContractTypeById,
  createContractType,
  updateContractType,
  deleteContractType
};
