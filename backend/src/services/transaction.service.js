const transactionModel = require('../models/transaction.model');

const getTransactions = async (query, scopedBaseId) => {
  return transactionModel.findAll({
    page: query.page,
    limit: query.limit,
    transactionType: query.transaction_type,
    assetId: query.asset_id,
    userId: query.user_id,
    baseId: query.base_id,
    scopedBaseId,
    startDate: query.start_date,
    endDate: query.end_date,
  });
};

const getTransactionById = async (id) => {
  const transaction = await transactionModel.findById(id);
  if (!transaction) {
    const { AppError } = require('../middleware/error.middleware');
    throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
  }
  return transaction;
};

const getAssetHistory = async (assetId, query) => {
  return transactionModel.findByAssetId(assetId, { page: query.page || 1, limit: query.limit || 20 });
};

module.exports = { getTransactions, getTransactionById, getAssetHistory };
