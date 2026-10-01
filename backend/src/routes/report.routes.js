const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { scopeToBase } = require('../middleware/role.middleware');

router.use(authenticate, scopeToBase);

// GET /api/v1/reports/dashboard
router.get('/dashboard', reportController.getDashboard);

// GET /api/v1/reports/assets
router.get('/assets', reportController.getAssetReport);

// GET /api/v1/reports/purchases
router.get('/purchases', reportController.getPurchaseReport);

// GET /api/v1/reports/transfers
router.get('/transfers', reportController.getTransferReport);

// GET /api/v1/reports/assignments
router.get('/assignments', reportController.getAssignmentReport);

// GET /api/v1/reports/expenses
router.get('/expenses', reportController.getExpenseReport);

// GET /api/v1/reports/movement
router.get('/movement', reportController.getMovementReport);

module.exports = router;
