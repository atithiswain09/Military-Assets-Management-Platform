const assetService = require('../services/asset.service');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getAssets = async (req, res, next) => {
  try {
    const result = await assetService.getAssets(req.query, req.scopedBaseId);
    sendPaginated(res, {
      message: 'Assets retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getAssetById = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id, req.scopedBaseId);
    sendSuccess(res, { message: 'Asset retrieved', data: asset });
  } catch (err) {
    next(err);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const asset = await assetService.createAsset(req.body, req.user.userId);
    sendSuccess(res, { statusCode: 201, message: 'Asset created successfully', data: asset });
  } catch (err) {
    next(err);
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body, req.user.userId, req.scopedBaseId);
    sendSuccess(res, { message: 'Asset updated successfully', data: asset });
  } catch (err) {
    next(err);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    await assetService.deleteAsset(req.params.id, req.scopedBaseId);
    sendSuccess(res, { message: 'Asset deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const getAssetHistory = async (req, res, next) => {
  try {
    const result = await assetService.getAssetHistory(req.params.id, req.query);
    sendPaginated(res, {
      message: 'Asset history retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getAssetAssignments = async (req, res, next) => {
  try {
    const result = await assetService.getAssetAssignments(req.params.id, req.query);
    sendPaginated(res, {
      message: 'Asset assignments retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getAssetTransfers = async (req, res, next) => {
  try {
    const result = await assetService.getAssetTransfers(req.params.id, req.query);
    sendPaginated(res, {
      message: 'Asset transfers retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getAssetExpenses = async (req, res, next) => {
  try {
    const result = await assetService.getAssetExpenses(req.params.id, req.query);
    sendPaginated(res, {
      message: 'Asset expenses retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAssets, getAssetById, createAsset, updateAsset, deleteAsset,
  getAssetHistory, getAssetAssignments, getAssetTransfers, getAssetExpenses,
};
