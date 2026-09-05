/**
 * Working Schedule Routes
 * 
 * RESPONSIBILITY:
 * Maps HTTP requests for working schedule templates and daily shifts to scheduleController.
 * 
 * NOT RESPONSIBLE FOR:
 * Real-time punch clock attendance processing.
 */

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', scheduleController.listSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', requirePermission('schedule.manage'), scheduleController.createSchedule);
router.put('/:id', requirePermission('schedule.manage'), scheduleController.updateSchedule);
router.delete('/:id', requirePermission('schedule.manage'), scheduleController.deleteSchedule);

module.exports = router;
