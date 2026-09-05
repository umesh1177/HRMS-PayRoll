/**
 * Employee Profile Routes
 * 
 * RESPONSIBILITY:
 * Maps HTTP routing for employee directory operations to employeeController.
 * 
 * NOT RESPONSIBLE FOR:
 * Database transactions or salary payslip lines.
 */

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authenticateToken = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', employeeController.listEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', requirePermission('employee.manage'), employeeController.createEmployee);
router.put('/:id', requireAnyPermission(['employee.manage', 'employee.view_own']), employeeController.updateEmployee);
router.delete('/:id', requirePermission('employee.manage'), employeeController.deleteEmployee);

module.exports = router;
