/**
 * Authentication & Access Routing
 * 
 * RESPONSIBILITY:
 * Maps HTTP routes for user authentication, profile resolution, and user account management.
 * 
 * NOT RESPONSIBLE FOR:
 * Express server binding or direct SQL database interactions.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// Public route: Login
router.post('/login', authController.login);

// Protected routes
router.use(authenticateToken);

// Current user profile & available roles
router.get('/me', authController.getMe);
router.get('/roles', authController.listRoles);
router.put('/change-password', authController.changePassword);

// Admin user management (requires 'user.manage' permission)
router.post('/users', requirePermission('user.manage'), authController.createUser);
router.get('/users', requirePermission('user.manage'), authController.listUsers);

module.exports = router;
