const transferModel = require('../models/transfer.model');
const assetModel = require('../models/asset.model');
const transactionModel = require('../models/transaction.model');
const { AppError } = require('../middleware/error.middleware');
const db = require('../config/db');

const generateTransferNumber = () => {
  const date = new Date();
  const prefix = 'TRF';
  const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const VALID_TRANSITIONS = {
  'PENDING': ['APPROVED', 'CANCELLED'],
  'APPROVED': ['IN_TRANSIT', 'CANCELLED'],
  'IN_TRANSIT': ['COMPLETED', 'CANCELLED'],
  'COMPLETED': [],
  'CANCELLED': [],
};

const getTransfers = async (query, scopedBaseId) => {
  return transferModel.findAll({
    page: query.page,
    limit: query.limit,
    search: query.search,
    status: query.status,
    assetId: query.asset_id,
    sourceBaseId: query.source_base_id,
    destinationBaseId: query.destination_base_id,
    scopedBaseId,
  });
};

const getTransferById = async (id, scopedBaseId) => {
  const transfer = await transferModel.findById(id);
  if (!transfer) {
    throw new AppError('Transfer not found', 404, 'TRANSFER_NOT_FOUND');
  }
  if (scopedBaseId && transfer.source_base_id !== scopedBaseId && transfer.destination_base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to access this transfer', 403, 'FORBIDDEN');
  }
  return transfer;
};

const createTransfer = async (data, userId) => {
  if (data.source_base_id === data.destination_base_id) {
    throw new AppError('Source and destination bases cannot be the same', 400, 'INVALID_DESTINATION_BASE');
  }

  return db.transaction(async (client) => {
    // Lock the asset row to prevent concurrent modifications
    const asset = await assetModel.findByIdForUpdate(data.asset_id, client);
    if (!asset) {
      throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
    }
    if (asset.status === 'RETIRED') {
      throw new AppError('Retired assets cannot be transferred', 422, 'ASSET_NOT_AVAILABLE');
    }
    if (asset.status === 'IN_TRANSIT') {
      throw new AppError('Asset is already in transit', 409, 'ASSET_ALREADY_TRANSFERRED');
    }
    if (asset.status === 'ASSIGNED') {
      throw new AppError('Asset is currently assigned. Return it before transferring.', 422, 'ASSET_ALREADY_ASSIGNED');
    }
    if (asset.current_base_id !== data.source_base_id) {
      throw new AppError('Asset does not belong to the source base', 400, 'INVALID_SOURCE_BASE');
    }

    // Check for conflicting active transfers
    const activeTransfers = await transferModel.findActiveByAssetId(data.asset_id);
    if (activeTransfers.length > 0) {
      throw new AppError('Asset has an active transfer request', 409, 'ASSET_ALREADY_TRANSFERRED');
    }

    const transferNumber = generateTransferNumber();

    const transfer = await transferModel.create({
      transferNumber,
      assetId: data.asset_id,
      sourceBaseId: data.source_base_id,
      destinationBaseId: data.destination_base_id,
      requestedBy: userId,
      reason: data.reason,
      transferDate: data.transfer_date,
    }, client);

    // Create audit transaction
    await transactionModel.create({
      transactionType: 'ASSET_TRANSFER_REQUESTED',
      assetId: data.asset_id,
      userId,
      baseId: data.source_base_id,
      referenceId: transfer.id,
      referenceType: 'TRANSFER',
      previousState: { status: asset.status, base_id: asset.current_base_id },
      newState: { transfer_status: 'PENDING', destination_base_id: data.destination_base_id },
      description: `Transfer ${transferNumber} requested`,
    }, client);

    return transferModel.findById(transfer.id);
  });
};

const approveTransfer = async (id, userId) => {
  return db.transaction(async (client) => {
    const transfer = await transferModel.findById(id);
    if (!transfer) {
      throw new AppError('Transfer not found', 404, 'TRANSFER_NOT_FOUND');
    }
    if (!VALID_TRANSITIONS[transfer.status]?.includes('APPROVED')) {
      throw new AppError(`Cannot approve a transfer with status ${transfer.status}`, 422, 'INVALID_TRANSFER_STATUS');
    }

    await transferModel.updateStatus(id, { status: 'APPROVED', approvedBy: userId }, client);

    await transactionModel.create({
      transactionType: 'ASSET_TRANSFER_REQUESTED',
      assetId: transfer.asset_id,
      userId,
      baseId: transfer.source_base_id,
      referenceId: id,
      referenceType: 'TRANSFER',
      previousState: { transfer_status: 'PENDING' },
      newState: { transfer_status: 'APPROVED' },
      description: `Transfer ${transfer.transfer_number} approved`,
    }, client);

    return transferModel.findById(id);
  });
};

const completeTransfer = async (id, userId) => {
  return db.transaction(async (client) => {
    const transfer = await transferModel.findById(id);
    if (!transfer) {
      throw new AppError('Transfer not found', 404, 'TRANSFER_NOT_FOUND');
    }

    // Allow transition from APPROVED or IN_TRANSIT
    if (!['APPROVED', 'IN_TRANSIT'].includes(transfer.status)) {
      throw new AppError(`Cannot complete a transfer with status ${transfer.status}`, 422, 'INVALID_TRANSFER_STATUS');
    }

    // Lock asset
    const asset = await assetModel.findByIdForUpdate(transfer.asset_id, client);

    // Update transfer status
    await transferModel.updateStatus(id, {
      status: 'COMPLETED',
      completedAt: new Date(),
    }, client);

    // Update asset — move to destination base
    await assetModel.update(transfer.asset_id, {
      current_base_id: transfer.destination_base_id,
      status: 'IN_STORAGE',
    }, client);

    await transactionModel.create({
      transactionType: 'ASSET_TRANSFERRED',
      assetId: transfer.asset_id,
      userId,
      baseId: transfer.destination_base_id,
      referenceId: id,
      referenceType: 'TRANSFER',
      previousState: { status: asset.status, base_id: transfer.source_base_id },
      newState: { status: 'IN_STORAGE', base_id: transfer.destination_base_id },
      description: `Transfer ${transfer.transfer_number} completed. Asset moved to destination base.`,
    }, client);

    return transferModel.findById(id);
  });
};

const cancelTransfer = async (id, userId) => {
  return db.transaction(async (client) => {
    const transfer = await transferModel.findById(id);
    if (!transfer) {
      throw new AppError('Transfer not found', 404, 'TRANSFER_NOT_FOUND');
    }
    if (!VALID_TRANSITIONS[transfer.status]?.includes('CANCELLED')) {
      throw new AppError(`Cannot cancel a transfer with status ${transfer.status}`, 422, 'INVALID_TRANSFER_STATUS');
    }

    // If asset was in transit, revert to previous status
    if (transfer.status === 'IN_TRANSIT') {
      const asset = await assetModel.findByIdForUpdate(transfer.asset_id, client);
      await assetModel.updateStatus(transfer.asset_id, 'IN_STORAGE', client);
    }

    await transferModel.updateStatus(id, { status: 'CANCELLED' }, client);

    await transactionModel.create({
      transactionType: 'ASSET_TRANSFER_REQUESTED',
      assetId: transfer.asset_id,
      userId,
      baseId: transfer.source_base_id,
      referenceId: id,
      referenceType: 'TRANSFER',
      previousState: { transfer_status: transfer.status },
      newState: { transfer_status: 'CANCELLED' },
      description: `Transfer ${transfer.transfer_number} cancelled`,
    }, client);

    return transferModel.findById(id);
  });
};

module.exports = { getTransfers, getTransferById, createTransfer, approveTransfer, completeTransfer, cancelTransfer };
