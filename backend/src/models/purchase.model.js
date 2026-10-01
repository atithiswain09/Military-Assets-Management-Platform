const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { findWithPagination } = require('./base.model');

const purchaseSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    purchase_number: { type: String, required: true, unique: true, uppercase: true, trim: true },
    asset_id: { type: String, ref: 'Asset', default: null },
    quantity: { type: Number, required: true, min: 1 },
    vendor: { type: String, required: true, trim: true },
    purchase_date: { type: Date, required: true },
    unit_price: { type: Number, required: true, min: 0 },
    total_amount: { type: Number, required: true, min: 0 },
    base_id: { type: String, ref: 'Base', required: true },
    reference_number: { type: String, default: null },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'COMPLETED' },
    notes: { type: String, default: null },
    created_by: { type: String, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

purchaseSchema.virtual('id').get(function () {
  return this._id;
});

const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);

const formatPurchase = (doc) => {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : doc;
  const base = p.base_id && typeof p.base_id === 'object' ? p.base_id : null;
  const user = p.created_by && typeof p.created_by === 'object' ? p.created_by : null;
  const asset = p.asset_id && typeof p.asset_id === 'object' ? p.asset_id : null;

  return {
    ...p,
    id: p._id || p.id,
    base_id: base ? base._id || base.id : p.base_id,
    base_name: base ? base.name : p.base_name || null,
    base_code: base ? base.code : p.base_code || null,
    created_by: user ? user._id || user.id : p.created_by,
    created_by_name: user ? user.name : p.created_by_name || null,
    asset_id: asset ? asset._id || asset.id : p.asset_id,
    asset_name: asset ? asset.name : p.asset_name || null,
    asset_code: asset ? asset.asset_code : p.asset_code || null,
  };
};

const findAll = async ({ page = 1, limit = 20, search, status, vendor, baseId, scopedBaseId, startDate, endDate } = {}) => {
  if (db.isMongoAvailable) {
    const queryCond = {};
    if (scopedBaseId) queryCond.base_id = scopedBaseId;
    if (baseId && !scopedBaseId) queryCond.base_id = baseId;
    if (status) queryCond.status = status;
    if (vendor) queryCond.vendor = new RegExp(vendor, 'i');

    if (startDate || endDate) {
      queryCond.purchase_date = {};
      if (startDate) queryCond.purchase_date.$gte = new Date(startDate);
      if (endDate) queryCond.purchase_date.$lte = new Date(endDate);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      queryCond.$or = [{ purchase_number: regex }, { vendor: regex }, { reference_number: regex }];
    }

    const total = await Purchase.countDocuments(queryCond);
    const purchases = await Purchase.find(queryCond)
      .populate('base_id')
      .populate('created_by')
      .populate('asset_id')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      rows: purchases.map(formatPurchase),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const conditions = [];
  if (scopedBaseId) conditions.push({ column: 'p.base_id', value: scopedBaseId });
  if (baseId && !scopedBaseId) conditions.push({ column: 'p.base_id', value: baseId });
  if (status) conditions.push({ column: 'p.status', value: status });
  if (vendor) conditions.push({ column: 'p.vendor', value: `%${vendor}%`, operator: 'ILIKE' });
  if (startDate) conditions.push({ column: 'p.purchase_date', value: startDate, operator: '>=' });
  if (endDate) conditions.push({ column: 'p.purchase_date', value: endDate, operator: '<=' });

  return findWithPagination({
    table: 'purchases p',
    joins: `LEFT JOIN bases b ON p.base_id = b.id 
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN assets a ON p.asset_id = a.id`,
    conditions,
    search,
    searchColumns: ['p.purchase_number', 'p.vendor', 'p.reference_number'],
    selectColumns: `p.*, b.name as base_name, b.code as base_code, 
      u.name as created_by_name, a.name as asset_name, a.asset_code`,
    orderBy: 'p.created_at DESC',
    page,
    limit,
  });
};

const findById = async (id) => {
  if (db.isMongoAvailable) {
    const purchase = await Purchase.findById(id)
      .populate('base_id')
      .populate('created_by')
      .populate('asset_id');
    return purchase ? formatPurchase(purchase) : null;
  }

  const result = await db.query(
    `SELECT p.*, b.name as base_name, b.code as base_code, 
       u.name as created_by_name, a.name as asset_name, a.asset_code
     FROM purchases p
     LEFT JOIN bases b ON p.base_id = b.id
     LEFT JOIN users u ON p.created_by = u.id
     LEFT JOIN assets a ON p.asset_id = a.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const create = async (data, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session } : {};
    const docs = await Purchase.create(
      [
        {
          purchase_number: data.purchaseNumber,
          asset_id: data.assetId || null,
          quantity: data.quantity,
          vendor: data.vendor,
          purchase_date: data.purchaseDate,
          unit_price: data.unitPrice,
          total_amount: data.totalAmount,
          base_id: data.baseId,
          reference_number: data.referenceNumber || null,
          status: data.status || 'COMPLETED',
          notes: data.notes || null,
          created_by: data.createdBy,
        },
      ],
      options
    );
    return findById(docs[0]._id);
  }

  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  const result = await queryFn(
    `INSERT INTO purchases (purchase_number, asset_id, quantity, vendor, purchase_date, unit_price, total_amount, base_id, reference_number, status, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      data.purchaseNumber,
      data.assetId || null,
      data.quantity,
      data.vendor,
      data.purchaseDate,
      data.unitPrice,
      data.totalAmount,
      data.baseId,
      data.referenceNumber || null,
      data.status || 'COMPLETED',
      data.notes || null,
      data.createdBy,
    ]
  );
  return result.rows[0];
};

const update = async (id, fields) => {
  if (db.isMongoAvailable) {
    const updateData = { ...fields, updated_at: new Date() };
    await Purchase.findByIdAndUpdate(id, { $set: updateData });
    return findById(id);
  }

  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = ['asset_id', 'quantity', 'vendor', 'purchase_date', 'unit_price', 'total_amount', 'base_id', 'reference_number', 'status', 'notes'];
  for (const [key, value] of Object.entries(fields)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return findById(id);

  setClauses.push('updated_at = NOW()');
  params.push(id);

  await db.query(`UPDATE purchases SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, params);
  return findById(id);
};

const deleteById = async (id) => {
  if (db.isMongoAvailable) {
    const res = await Purchase.findByIdAndDelete(id);
    return !!res;
  }
  const result = await db.query('DELETE FROM purchases WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
};

module.exports = { Purchase, findAll, findById, create, update, deleteById };
