const assetModel = require('../models/asset.model');
const transactionModel = require('../models/transaction.model');
const { AppError } = require('../middleware/error.middleware');
const db = require('../config/db');

const getAssets = async (query, scopedBaseId) => {
  return assetModel.findAll({
    page: query.page,
    limit: query.limit,
    search: query.search,
    status: query.status,
    category: query.category,
    assetType: query.asset_type,
    baseId: query.base_id,
    scopedBaseId,
    startDate: query.start_date,
    endDate: query.end_date,
  });
};

const getAssetById = async (id, scopedBaseId) => {
  const asset = await assetModel.findById(id);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }
  if (scopedBaseId && asset.current_base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to access this asset', 403, 'FORBIDDEN');
  }
  return asset;
};

const createAsset = async (data, userId) => {
  // Check uniqueness
  const existingCode = await assetModel.findByAssetCode(data.asset_code);
  if (existingCode) {
    throw new AppError('Asset code already exists', 409, 'DUPLICATE_ENTRY');
  }
  const existingSerial = await assetModel.findBySerialNumber(data.serial_number);
  if (existingSerial) {
    throw new AppError('Serial number already exists', 409, 'DUPLICATE_ENTRY');
  }

  return db.transaction(async (client) => {
    const asset = await assetModel.create({
      assetCode: data.asset_code,
      name: data.name,
      category: data.category,
      assetType: data.asset_type,
      serialNumber: data.serial_number,
      status: data.status || 'IN_STORAGE',
      currentBaseId: data.current_base_id,
      purchaseDate: data.purchase_date,
      purchaseValue: data.purchase_value,
      description: data.description,
    }, client);

    // Create audit transaction
    await transactionModel.create({
      transactionType: 'ASSET_CREATED',
      assetId: asset.id,
      userId,
      baseId: data.current_base_id,
      referenceId: asset.id,
      referenceType: 'ASSET',
      newState: { status: asset.status, base_id: data.current_base_id },
      description: `Asset ${data.asset_code} created`,
    }, client);

    return assetModel.findById(asset.id);
  });
};

const updateAsset = async (id, data, userId, scopedBaseId) => {
  const asset = await assetModel.findById(id);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }
  if (scopedBaseId && asset.current_base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to modify this asset', 403, 'FORBIDDEN');
  }

  // Validate status transitions
  if (data.status) {
    validateStatusTransition(asset.status, data.status);
  }

  const previousState = {
    name: asset.name, category: asset.category, asset_type: asset.asset_type,
    status: asset.status, current_base_id: asset.current_base_id,
  };

  const fields = {};
  if (data.name !== undefined) fields.name = data.name;
  if (data.category !== undefined) fields.category = data.category;
  if (data.asset_type !== undefined) fields.asset_type = data.asset_type;
  if (data.status !== undefined) fields.status = data.status;
  if (data.current_base_id !== undefined) fields.current_base_id = data.current_base_id;
  if (data.purchase_date !== undefined) fields.purchase_date = data.purchase_date;
  if (data.purchase_value !== undefined) fields.purchase_value = data.purchase_value;
  if (data.description !== undefined) fields.description = data.description;

  const updated = await assetModel.update(id, fields);

  // Create audit transaction
  await transactionModel.create({
    transactionType: data.status === 'RETIRED' ? 'ASSET_RETIRED' : 'ASSET_UPDATED',
    assetId: id,
    userId,
    baseId: asset.current_base_id,
    referenceId: id,
    referenceType: 'ASSET',
    previousState,
    newState: fields,
    description: `Asset ${asset.asset_code} updated`,
  });

  return updated;
};

const deleteAsset = async (id, scopedBaseId) => {
  const asset = await assetModel.findById(id);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }
  if (scopedBaseId && asset.current_base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to delete this asset', 403, 'FORBIDDEN');
  }
  if (asset.status === 'ASSIGNED' || asset.status === 'IN_TRANSIT') {
    throw new AppError('Cannot delete an asset that is assigned or in transit', 422, 'ASSET_NOT_AVAILABLE');
  }

  return assetModel.deleteById(id);
};

const getAssetHistory = async (id, query) => {
  const asset = await assetModel.findById(id);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }
  return transactionModel.findByAssetId(id, { page: query.page, limit: query.limit });
};

const getAssetAssignments = async (id, query) => {
  const asset = await assetModel.findById(id);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }
  const assignmentModel = require('../models/assignment.model');
  return assignmentModel.findByAssetId(id, { page: query.page || 1, limit: query.limit || 20 });
};

const getAssetTransfers = async (id, query) => {
  const asset = await assetModel.findById(id);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }
  const transferModel = require('../models/transfer.model');
  return transferModel.findByAssetId(id, { page: query.page || 1, limit: query.limit || 20 });
};

const getAssetExpenses = async (id, query) => {
  const asset = await assetModel.findById(id);
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }
  const expenseModel = require('../models/expense.model');
  return expenseModel.findByAssetId(id, { page: query.page || 1, limit: query.limit || 20 });
};

function validateStatusTransition(currentStatus, newStatus) {
  const allowed = {
    'IN_STORAGE': ['ACTIVE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'],
    'ACTIVE': ['IN_STORAGE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE', 'RETIRED'],
    'ASSIGNED': ['ACTIVE', 'IN_STORAGE', 'MAINTENANCE'],
    'IN_TRANSIT': ['ACTIVE', 'IN_STORAGE'],
    'MAINTENANCE': ['ACTIVE', 'IN_STORAGE', 'RETIRED'],
    'RETIRED': [],
  };

  if (!allowed[currentStatus] || !allowed[currentStatus].includes(newStatus)) {
    throw new AppError(
      `Cannot transition from ${currentStatus} to ${newStatus}`,
      422,
      'INVALID_STATUS_TRANSITION'
    );
  }
}

module.exports = {
  getAssets, getAssetById, createAsset, updateAsset, deleteAsset,
  getAssetHistory, getAssetAssignments, getAssetTransfers, getAssetExpenses,
};
