/**
 * Employment Contract Routes
 * 
 * RESPONSIBILITY:
 * Maps HTTP requests for employee contracts to contractController handlers.
 * 
 * NOT RESPONSIBLE FOR:
 * Express server listening or JWT payload generation.
 */

const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', contractController.listContracts);
router.get('/:id', contractController.getContractById);
router.post('/', requirePermission('contract.manage'), contractController.createContract);
router.put('/:id', requirePermission('contract.manage'), contractController.updateContract);
router.delete('/:id', requirePermission('contract.manage'), contractController.deleteContract);

module.exports = router;
