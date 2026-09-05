/**
 * Payroll Operations & Configuration Routes
 * 
 * RESPONSIBILITY:
 * Maps HTTP endpoints for Salary Structures, Salary Rules, Payruns lifecycle,
 * and Employee Payslips/PDFs to their respective controllers with strict RBAC gating.
 * 
 * NOT RESPONSIBLE FOR:
 * Express server binding or direct SQL execution.
 */

const express = require('express');
const router = express.Router();

const salaryStructureController = require('../controllers/salaryStructureController');
const salaryRuleController = require('../controllers/salaryRuleController');
const payrunController = require('../controllers/payrunController');
const payslipController = require('../controllers/payslipController');

const authenticateToken = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticateToken);

// ---------------------------------------------------------------------
// 1. SALARY STRUCTURES
// ---------------------------------------------------------------------
router.get('/structures', requirePermission('payroll.structure.view'), salaryStructureController.listStructures);
router.get('/structures/:id', requirePermission('payroll.structure.view'), salaryStructureController.getStructureById);
router.post('/structures', requirePermission('payroll.structure.manage'), salaryStructureController.createStructure);
router.put('/structures/:id', requirePermission('payroll.structure.manage'), salaryStructureController.updateStructure);
router.delete('/structures/:id', requirePermission('payroll.structure.manage'), salaryStructureController.deleteStructure);

// ---------------------------------------------------------------------
// 2. SALARY RULES
// ---------------------------------------------------------------------
router.get('/rules', requirePermission('payroll.structure.view'), salaryRuleController.listRules);
router.get('/rules/:id', requirePermission('payroll.structure.view'), salaryRuleController.getRuleById);
router.post('/rules', requirePermission('payroll.structure.manage'), salaryRuleController.createRule);
router.put('/rules/:id', requirePermission('payroll.structure.manage'), salaryRuleController.updateRule);
router.delete('/rules/:id', requirePermission('payroll.structure.manage'), salaryRuleController.deleteRule);

// ---------------------------------------------------------------------
// 3. PAYRUNS & LIFECYCLE (draft -> computed -> validated -> paid)
// ---------------------------------------------------------------------
router.get('/payruns/eligible-employees', requirePermission('payroll.payrun.manage'), payrunController.getEligibleEmployees);
router.get('/payruns', requirePermission('payroll.payrun.manage'), payrunController.listPayruns);
router.get('/payruns/:id', requirePermission('payroll.payrun.manage'), payrunController.getPayrunById);
router.post('/payruns', requirePermission('payroll.payrun.manage'), payrunController.createPayrun);
router.post('/payruns/:id/compute', requirePermission('payroll.payrun.manage'), payrunController.computePayrun);
router.post('/payruns/:id/validate', requirePermission('payroll.payrun.manage'), payrunController.validatePayrun);
router.post('/payruns/:id/mark-paid', requirePermission('payroll.payrun.manage'), payrunController.markPaid);

// ---------------------------------------------------------------------
// 4. PAYSLIPS & PDF EXPORT
// ---------------------------------------------------------------------
router.get('/payslips', requirePermission('payroll.payslip.view'), payslipController.listPayslips);
router.get('/payslips/:id', requirePermission('payroll.payslip.view'), payslipController.getPayslipById);
router.get('/payslips/:id/pdf', requirePermission('payroll.payslip.view'), payslipController.getPayslipPdf);

module.exports = router;
