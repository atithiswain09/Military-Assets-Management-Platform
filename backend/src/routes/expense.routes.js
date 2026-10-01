const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, scopeToBase } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createExpenseSchema, updateExpenseSchema, querySchema } = require('../validators/expense.validator');

router.use(authenticate);

// GET /api/v1/expenses
router.get('/', scopeToBase, validate(querySchema, 'query'), expenseController.getExpenses);

// POST /api/v1/expenses
router.post('/', authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), validate(createExpenseSchema), expenseController.createExpense);

// GET /api/v1/expenses/:id
router.get('/:id', scopeToBase, expenseController.getExpenseById);

// PUT /api/v1/expenses/:id
router.put('/:id', authorize('ADMIN', 'BASE_COMMANDER'), scopeToBase, validate(updateExpenseSchema), expenseController.updateExpense);

// DELETE /api/v1/expenses/:id (Admin only)
router.delete('/:id', authorize('ADMIN'), scopeToBase, expenseController.deleteExpense);

module.exports = router;
