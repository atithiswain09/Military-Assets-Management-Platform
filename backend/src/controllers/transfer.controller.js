const transferService = require('../services/transfer.service');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getTransfers = async (req, res, next) => {
  try {
    const result = await transferService.getTransfers(req.query, req.scopedBaseId);
    sendPaginated(res, {
      message: 'Transfers retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getTransferById = async (req, res, next) => {
  try {
    const transfer = await transferService.getTransferById(req.params.id, req.scopedBaseId);
    sendSuccess(res, { message: 'Transfer retrieved', data: transfer });
  } catch (err) {
    next(err);
  }
};

const createTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.createTransfer(req.body, req.user.userId);
    sendSuccess(res, { statusCode: 201, message: 'Transfer request created successfully', data: transfer });
  } catch (err) {
    next(err);
  }
};

const approveTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.approveTransfer(req.params.id, req.user.userId);
    sendSuccess(res, { message: 'Transfer approved successfully', data: transfer });
  } catch (err) {
    next(err);
  }
};

const completeTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.completeTransfer(req.params.id, req.user.userId);
    sendSuccess(res, { message: 'Transfer completed successfully', data: transfer });
  } catch (err) {
    next(err);
  }
};

const cancelTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.cancelTransfer(req.params.id, req.user.userId);
    sendSuccess(res, { message: 'Transfer cancelled successfully', data: transfer });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransfers, getTransferById, createTransfer, approveTransfer, completeTransfer, cancelTransfer };
