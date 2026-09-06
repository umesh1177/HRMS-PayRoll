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
const profilePhotoUpload = require('../middleware/profileUpload');

// Public route: Login
router.post('/login', authController.login);

// Protected routes
router.use(authenticateToken);

// Current user profile & available roles
router.get('/me', authController.getMe);
router.put('/profile', authController.updateMyProfile);
router.post('/profile/photo', profilePhotoUpload, authController.uploadProfilePhoto);
router.get('/roles', authController.listRoles);

// Admin user management (requires 'user.manage' permission)
router.post('/users', requirePermission('user.manage'), authController.createUser);
router.get('/users', requirePermission('user.manage'), authController.listUsers);
router.put('/users/:id', requirePermission('user.manage'), authController.updateUser);
router.delete('/users/:id', requirePermission('user.manage'), authController.deleteUser);

module.exports = router;
