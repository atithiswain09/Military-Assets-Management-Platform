const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { findWithPagination } = require('./base.model');

const assetSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    asset_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    asset_type: { type: String, required: true, trim: true },
    serial_number: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'IN_STORAGE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE', 'RETIRED'],
      default: 'IN_STORAGE',
    },
    current_base_id: { type: String, ref: 'Base', required: true },
    purchase_id: { type: String, ref: 'Purchase', default: null },
    purchase_date: { type: Date, default: null },
    purchase_value: { type: Number, default: 0 },
    description: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

assetSchema.virtual('id').get(function () {
  return this._id;
});

const Asset = mongoose.models.Asset || mongoose.model('Asset', assetSchema);

const formatAsset = (doc) => {
  if (!doc) return null;
  const item = doc.toObject ? doc.toObject() : doc;
  const base = item.current_base_id && typeof item.current_base_id === 'object' ? item.current_base_id : null;

  return {
    ...item,
    id: item._id || item.id,
    current_base_id: base ? base._id || base.id : item.current_base_id,
    base_name: base ? base.name : item.base_name || null,
    base_code: base ? base.code : item.base_code || null,
  };
};

const findAll = async ({ page = 1, limit = 20, search, status, category, assetType, baseId, scopedBaseId, startDate, endDate } = {}) => {
  if (db.isMongoAvailable) {
    const queryCond = {};
    if (scopedBaseId) queryCond.current_base_id = scopedBaseId;
    if (baseId && !scopedBaseId) queryCond.current_base_id = baseId;
    if (status) queryCond.status = status;
    if (category) queryCond.category = category;
    if (assetType) queryCond.asset_type = assetType;

    if (startDate || endDate) {
      queryCond.created_at = {};
      if (startDate) queryCond.created_at.$gte = new Date(startDate);
      if (endDate) queryCond.created_at.$lte = new Date(endDate);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      queryCond.$or = [
        { asset_code: regex },
        { name: regex },
        { serial_number: regex },
        { description: regex },
      ];
    }

    const total = await Asset.countDocuments(queryCond);
    const assets = await Asset.find(queryCond)
      .populate('current_base_id')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      rows: assets.map(formatAsset),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const conditions = [];
  if (scopedBaseId) conditions.push({ column: 'a.current_base_id', value: scopedBaseId });
  if (baseId && !scopedBaseId) conditions.push({ column: 'a.current_base_id', value: baseId });
  if (status) conditions.push({ column: 'a.status', value: status });
  if (category) conditions.push({ column: 'a.category', value: category });
  if (assetType) conditions.push({ column: 'a.asset_type', value: assetType });
  if (startDate) conditions.push({ column: 'a.created_at', value: startDate, operator: '>=' });
  if (endDate) conditions.push({ column: 'a.created_at', value: endDate, operator: '<=' });

  return findWithPagination({
    table: 'assets a',
    joins: 'LEFT JOIN bases b ON a.current_base_id = b.id',
    conditions,
    search,
    searchColumns: ['a.asset_code', 'a.name', 'a.serial_number', 'a.description'],
    selectColumns: 'a.*, b.name as base_name, b.code as base_code',
    orderBy: 'a.created_at DESC',
    page,
    limit,
  });
};

const findById = async (id) => {
  if (db.isMongoAvailable) {
    const asset = await Asset.findById(id).populate('current_base_id');
    return asset ? formatAsset(asset) : null;
  }
  const result = await db.query(
    'SELECT a.*, b.name as base_name, b.code as base_code FROM assets a LEFT JOIN bases b ON a.current_base_id = b.id WHERE a.id = $1',
    [id]
  );
  return result.rows[0] || null;
};

const findByAssetCode = async (assetCode) => {
  if (db.isMongoAvailable) {
    const asset = await Asset.findOne({ asset_code: assetCode.toUpperCase() });
    return asset ? { id: asset._id } : null;
  }
  const result = await db.query('SELECT id FROM assets WHERE asset_code = $1', [assetCode]);
  return result.rows[0] || null;
};

const findBySerialNumber = async (serialNumber) => {
  if (db.isMongoAvailable) {
    const asset = await Asset.findOne({ serial_number: serialNumber });
    return asset ? { id: asset._id } : null;
  }
  const result = await db.query('SELECT id FROM assets WHERE serial_number = $1', [serialNumber]);
  return result.rows[0] || null;
};

const create = async (data, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session } : {};
    const docs = await Asset.create([
      {
        asset_code: data.assetCode,
        name: data.name,
        category: data.category,
        asset_type: data.assetType,
        serial_number: data.serialNumber,
        status: data.status || 'IN_STORAGE',
        current_base_id: data.currentBaseId,
        purchase_id: data.purchaseId || null,
        purchase_date: data.purchaseDate || null,
        purchase_value: data.purchaseValue || null,
        description: data.description || null,
      },
    ], options);
    return findById(docs[0]._id);
  }

  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  const result = await queryFn(
    `INSERT INTO assets (asset_code, name, category, asset_type, serial_number, status, current_base_id, purchase_id, purchase_date, purchase_value, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [data.assetCode, data.name, data.category, data.assetType, data.serialNumber,
     data.status || 'IN_STORAGE', data.currentBaseId, data.purchaseId || null,
     data.purchaseDate || null, data.purchaseValue || null, data.description || null]
  );
  return result.rows[0];
};

const update = async (id, fields, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session, new: true } : { new: true };
    const updateData = { ...fields, updated_at: new Date() };
    await Asset.findByIdAndUpdate(id, { $set: updateData }, options);
    return findById(id);
  }

  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = {
    name: 'name', category: 'category', asset_type: 'asset_type',
    status: 'status', current_base_id: 'current_base_id', purchase_id: 'purchase_id',
    purchase_date: 'purchase_date', purchase_value: 'purchase_value', description: 'description',
  };

  for (const [key, value] of Object.entries(fields)) {
    if (allowedFields[key] !== undefined && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return findById(id);

  setClauses.push('updated_at = NOW()');
  params.push(id);

  await queryFn(`UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, params);
  return findById(id);
};

const updateStatus = async (id, status, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session } : {};
    await Asset.findByIdAndUpdate(id, { $set: { status, updated_at: new Date() } }, options);
    return;
  }
  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  await queryFn('UPDATE assets SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
};

const deleteById = async (id) => {
  if (db.isMongoAvailable) {
    const res = await Asset.findByIdAndDelete(id);
    return !!res;
  }
  const result = await db.query('DELETE FROM assets WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
};

const findByIdForUpdate = async (id, session = null) => {
  return findById(id);
};

module.exports = {
  Asset,
  findAll,
  findById,
  findByAssetCode,
  findBySerialNumber,
  create,
  update,
  updateStatus,
  deleteById,
  findByIdForUpdate,
};
