const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { scopeToBase } = require('../middleware/role.middleware');

router.use(authenticate);

// GET /api/v1/transactions
router.get('/', scopeToBase, transactionController.getTransactions);

// GET /api/v1/transactions/:id
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
