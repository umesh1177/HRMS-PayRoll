/**
 * Attendance Tracking & Clock-in Routes
 * 
 * RESPONSIBILITY:
 * Maps HTTP routes for employee check-in/out punch clocks, attendance query logs,
 * and HR manual corrections.
 * 
 * NOT RESPONSIBLE FOR:
 * Database query execution or payroll computation.
 */

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

// Self-service punch clock
router.post('/check-in', requirePermission('attendance.create_own'), attendanceController.checkIn);
router.post('/check-out', requirePermission('attendance.create_own'), attendanceController.checkOut);
router.get('/current', requirePermission('attendance.view_own'), attendanceController.getCurrentStatus);
router.get('/summary', requirePermission('attendance.view_own'), attendanceController.getSummary);
router.post('/mark', requirePermission('attendance.manage_all'), attendanceController.markAttendance);

// History listing (scoped internally to own records unless user has attendance.manage_all)
router.get('/', attendanceController.listAttendance);

// HR manual correction endpoint (strictly restricted to attendance.manage_all)
router.put('/:id', requirePermission('attendance.manage_all'), attendanceController.manualEdit);

// Delete attendance record (strictly restricted to attendance.manage_all)
router.delete('/:id', requirePermission('attendance.manage_all'), attendanceController.deleteAttendance);

module.exports = router;
