const expenseService = require('../services/expense.service');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getExpenses = async (req, res, next) => {
  try {
    const result = await expenseService.getExpenses(req.query, req.scopedBaseId);
    sendPaginated(res, {
      message: 'Expenses retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id, req.scopedBaseId);
    sendSuccess(res, { message: 'Expense retrieved', data: expense });
  } catch (err) {
    next(err);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.body, req.user.userId);
    sendSuccess(res, { statusCode: 201, message: 'Expense recorded successfully', data: expense });
  } catch (err) {
    next(err);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body, req.scopedBaseId);
    sendSuccess(res, { message: 'Expense updated successfully', data: expense });
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id, req.scopedBaseId);
    sendSuccess(res, { message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense };
