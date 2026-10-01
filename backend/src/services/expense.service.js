const expenseModel = require('../models/expense.model');
const assetModel = require('../models/asset.model');
const transactionModel = require('../models/transaction.model');
const { AppError } = require('../middleware/error.middleware');
const db = require('../config/db');

const generateExpenseNumber = () => {
  const date = new Date();
  const prefix = 'EXP';
  const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const getExpenses = async (query, scopedBaseId) => {
  return expenseModel.findAll({
    page: query.page,
    limit: query.limit,
    search: query.search,
    assetId: query.asset_id,
    baseId: query.base_id,
    expenseType: query.expense_type,
    scopedBaseId,
    startDate: query.start_date,
    endDate: query.end_date,
    status: query.status,
  });
};

const getExpenseById = async (id, scopedBaseId) => {
  const expense = await expenseModel.findById(id);
  if (!expense) {
    throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
  }
  if (scopedBaseId && expense.base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to access this expense', 403, 'FORBIDDEN');
  }
  return expense;
};

const createExpense = async (data, userId) => {
  // Validate asset exists
  const asset = await assetModel.findById(data.asset_id);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }

  return db.transaction(async (client) => {
    const expenseNumber = generateExpenseNumber();

    const expense = await expenseModel.create({
      expenseNumber,
      assetId: data.asset_id,
      baseId: data.base_id,
      expenseType: data.expense_type,
      description: data.description,
      amount: data.amount,
      expenseDate: data.expense_date,
      recordedBy: userId,
    }, client);

    // Create audit transaction
    await transactionModel.create({
      transactionType: 'EXPENSE_ADDED',
      assetId: data.asset_id,
      userId,
      baseId: data.base_id,
      referenceId: expense.id,
      referenceType: 'EXPENSE',
      newState: { expense_number: expenseNumber, amount: data.amount, expense_type: data.expense_type },
      description: `Expense ${expenseNumber} — ${data.expense_type} — $${data.amount} recorded for asset ${asset.asset_code}`,
    }, client);

    return expenseModel.findById(expense.id);
  });
};

const updateExpense = async (id, data, scopedBaseId) => {
  const expense = await expenseModel.findById(id);
  if (!expense) {
    throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
  }
  if (scopedBaseId && expense.base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to modify this expense', 403, 'FORBIDDEN');
  }

  const fields = {};
  if (data.expense_type !== undefined) fields.expense_type = data.expense_type;
  if (data.description !== undefined) fields.description = data.description;
  if (data.amount !== undefined) fields.amount = data.amount;
  if (data.expense_date !== undefined) fields.expense_date = data.expense_date;
  if (data.status !== undefined) fields.status = data.status;

  return expenseModel.update(id, fields);
};

const deleteExpense = async (id, scopedBaseId) => {
  const expense = await expenseModel.findById(id);
  if (!expense) {
    throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
  }
  if (scopedBaseId && expense.base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to delete this expense', 403, 'FORBIDDEN');
  }
  return expenseModel.deleteById(id);
};

module.exports = { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense };
