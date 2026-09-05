/**
 * Department & Job Position Routes
 * 
 * RESPONSIBILITY:
 * Maps HTTP requests for organizational structure (departments and job positions)
 * to departmentController handlers with authentication and RBAC checks.
 * 
 * NOT RESPONSIBLE FOR:
 * Database query execution or payroll scheduling.
 */

const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

// Department endpoints
router.get('/', departmentController.listDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', requirePermission('employee.manage'), departmentController.createDepartment);
router.put('/:id', requirePermission('employee.manage'), departmentController.updateDepartment);
router.delete('/:id', requirePermission('employee.manage'), departmentController.deleteDepartment);

// Job Position endpoints
router.get('/positions/all', departmentController.listJobPositions);
router.post('/positions', requirePermission('employee.manage'), departmentController.createJobPosition);
router.put('/positions/:id', requirePermission('employee.manage'), departmentController.updateJobPosition);
router.delete('/positions/:id', requirePermission('employee.manage'), departmentController.deleteJobPosition);

module.exports = router;
