const purchaseService = require('../services/purchase.service');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getPurchases = async (req, res, next) => {
  try {
    const result = await purchaseService.getPurchases(req.query, req.scopedBaseId);
    sendPaginated(res, {
      message: 'Purchases retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await purchaseService.getPurchaseById(req.params.id, req.scopedBaseId);
    sendSuccess(res, { message: 'Purchase retrieved', data: purchase });
  } catch (err) {
    next(err);
  }
};

const createPurchase = async (req, res, next) => {
  try {
    const purchase = await purchaseService.createPurchase(req.body, req.user.userId, req.scopedBaseId);
    sendSuccess(res, { statusCode: 201, message: 'Purchase created successfully', data: purchase });
  } catch (err) {
    next(err);
  }
};

const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await purchaseService.updatePurchase(req.params.id, req.body, req.scopedBaseId);
    sendSuccess(res, { message: 'Purchase updated successfully', data: purchase });
  } catch (err) {
    next(err);
  }
};

const deletePurchase = async (req, res, next) => {
  try {
    await purchaseService.deletePurchase(req.params.id, req.scopedBaseId);
    sendSuccess(res, { message: 'Purchase deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPurchases, getPurchaseById, createPurchase, updatePurchase, deletePurchase };
