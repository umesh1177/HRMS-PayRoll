/**
 * Time Off & Leaves Routes
 * 
 * RESPONSIBILITY:
 * Maps HTTP routes for leave types, employee allocations, and approval request workflows.
 * 
 * NOT RESPONSIBLE FOR:
 * Database transactions or attendance check-ins.
 */

const express = require('express');
const router = express.Router();
const timeoffController = require('../controllers/timeoffController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

// Types
router.get('/types', timeoffController.listTypes);
router.post('/types', requirePermission('timeoff.manage_config'), timeoffController.createType);
router.put('/types/:id', requirePermission('timeoff.manage_config'), timeoffController.updateType);

// Allocations
router.get('/allocations', timeoffController.listAllocations);
router.post('/allocations', requirePermission('timeoff.manage_config'), timeoffController.createAllocation);

// Requests & Workflow
router.get('/requests', timeoffController.listRequests);
router.post('/requests', timeoffController.createRequest);
router.put('/requests/:id/submit', timeoffController.submitRequest);
router.put('/requests/:id/approve', requirePermission('timeoff.approve'), timeoffController.approveRequest);
router.put('/requests/:id/refuse', requirePermission('timeoff.approve'), timeoffController.refuseRequest);

module.exports = router;
