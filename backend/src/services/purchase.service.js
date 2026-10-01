const purchaseModel = require('../models/purchase.model');
const assetModel = require('../models/asset.model');
const transactionModel = require('../models/transaction.model');
const { AppError } = require('../middleware/error.middleware');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const generatePurchaseNumber = () => {
  const date = new Date();
  const prefix = 'PUR';
  const timestamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const getPurchases = async (query, scopedBaseId) => {
  return purchaseModel.findAll({
    page: query.page,
    limit: query.limit,
    search: query.search,
    status: query.status,
    vendor: query.vendor,
    baseId: query.base_id,
    scopedBaseId,
    startDate: query.start_date,
    endDate: query.end_date,
  });
};

const getPurchaseById = async (id, scopedBaseId) => {
  const purchase = await purchaseModel.findById(id);
  if (!purchase) {
    throw new AppError('Purchase not found', 404, 'PURCHASE_NOT_FOUND');
  }
  if (scopedBaseId && purchase.base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to access this purchase', 403, 'FORBIDDEN');
  }
  return purchase;
};

const createPurchase = async (data, userId, scopedBaseId) => {
  const totalAmount = data.quantity * data.unit_price;

  return db.transaction(async (client) => {
    let assetId = data.asset_id || null;

    // If asset details are provided, create a new asset
    if (data.asset_code && data.asset_name && data.serial_number && data.asset_type) {
      const asset = await assetModel.create({
        assetCode: data.asset_code,
        name: data.asset_name,
        category: data.asset_category || null,
        assetType: data.asset_type,
        serialNumber: data.serial_number,
        status: 'IN_STORAGE',
        currentBaseId: data.base_id,
        purchaseDate: data.purchase_date,
        purchaseValue: totalAmount,
        description: data.asset_description || null,
      }, client);
      assetId = asset.id;
    } else if (assetId) {
      // Update existing asset purchase info
      await assetModel.update(assetId, {
        purchase_date: data.purchase_date,
        purchase_value: totalAmount,
      }, client);
    }

    const purchaseNumber = generatePurchaseNumber();

    const purchase = await purchaseModel.create({
      purchaseNumber,
      assetId,
      quantity: data.quantity,
      vendor: data.vendor,
      purchaseDate: data.purchase_date,
      unitPrice: data.unit_price,
      totalAmount,
      baseId: data.base_id,
      referenceNumber: data.reference_number,
      notes: data.notes,
      createdBy: userId,
    }, client);

    // Link asset to purchase
    if (assetId) {
      await client.query('UPDATE assets SET purchase_id = $1, updated_at = NOW() WHERE id = $2', [purchase.id, assetId]);
    }

    // Create audit transaction
    await transactionModel.create({
      transactionType: 'ASSET_PURCHASED',
      assetId,
      userId,
      baseId: data.base_id,
      referenceId: purchase.id,
      referenceType: 'PURCHASE',
      newState: { purchase_number: purchaseNumber, total_amount: totalAmount, vendor: data.vendor },
      description: `Purchase ${purchaseNumber} created — ${data.vendor} — $${totalAmount}`,
    }, client);

    return purchaseModel.findById(purchase.id);
  });
};

const updatePurchase = async (id, data, scopedBaseId) => {
  const purchase = await purchaseModel.findById(id);
  if (!purchase) {
    throw new AppError('Purchase not found', 404, 'PURCHASE_NOT_FOUND');
  }
  if (scopedBaseId && purchase.base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to modify this purchase', 403, 'FORBIDDEN');
  }

  const fields = {};
  if (data.quantity !== undefined) fields.quantity = data.quantity;
  if (data.vendor !== undefined) fields.vendor = data.vendor;
  if (data.purchase_date !== undefined) fields.purchase_date = data.purchase_date;
  if (data.unit_price !== undefined) fields.unit_price = data.unit_price;
  if (data.base_id !== undefined) fields.base_id = data.base_id;
  if (data.reference_number !== undefined) fields.reference_number = data.reference_number;
  if (data.notes !== undefined) fields.notes = data.notes;
  if (data.status !== undefined) fields.status = data.status;

  // Recalculate total if quantity or unit_price changed
  const qty = data.quantity || purchase.quantity;
  const price = data.unit_price !== undefined ? data.unit_price : purchase.unit_price;
  fields.total_amount = qty * price;

  return purchaseModel.update(id, fields);
};

const deletePurchase = async (id, scopedBaseId) => {
  const purchase = await purchaseModel.findById(id);
  if (!purchase) {
    throw new AppError('Purchase not found', 404, 'PURCHASE_NOT_FOUND');
  }
  if (scopedBaseId && purchase.base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to delete this purchase', 403, 'FORBIDDEN');
  }
  return purchaseModel.deleteById(id);
};

module.exports = { getPurchases, getPurchaseById, createPurchase, updatePurchase, deletePurchase };
