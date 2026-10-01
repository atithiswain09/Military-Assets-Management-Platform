const transactionService = require('../services/transaction.service');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactions(req.query, req.scopedBaseId);
    sendPaginated(res, {
      message: 'Transactions retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    sendSuccess(res, { message: 'Transaction retrieved', data: transaction });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransactions, getTransactionById };
