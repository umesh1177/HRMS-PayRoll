/**
 * Executive Dashboard Analytics Routes
 * 
 * RESPONSIBILITY:
 * Routes incoming GET requests for unified dashboard analytics to dashboardController.
 * Enforces JWT authentication middleware.
 * 
 * NOT RESPONSIBLE FOR:
 * Database query execution or view aggregation logic.
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

/**
 * @route GET /api/v1/dashboard/summary
 * @desc Get consolidated KPI metrics, department payroll, monthly trend, attendance, time off & warnings
 * @access Private (Authenticated)
 */
router.get('/summary', requirePermission('employee.view_all'), dashboardController.getSummary);

module.exports = router;
