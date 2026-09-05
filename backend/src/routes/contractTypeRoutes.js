/**
 * Contract Types Routes
 */

const express = require('express');
const router = express.Router();
const contractTypeController = require('../controllers/contractTypeController');
const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get('/', contractTypeController.listContractTypes);
router.get('/:id', contractTypeController.getContractTypeById);
router.post('/', requirePermission('contract.manage'), contractTypeController.createContractType);
router.put('/:id', requirePermission('contract.manage'), contractTypeController.updateContractType);
router.delete('/:id', requirePermission('contract.manage'), contractTypeController.deleteContractType);

module.exports = router;
