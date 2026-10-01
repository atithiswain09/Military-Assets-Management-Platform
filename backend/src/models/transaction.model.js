const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { findWithPagination } = require('./base.model');

const transactionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    transaction_type: {
      type: String,
      required: true,
      enum: [
        'ASSET_CREATED',
        'ASSET_UPDATED',
        'ASSET_PURCHASED',
        'ASSET_TRANSFER_REQUESTED',
        'ASSET_TRANSFERRED',
        'ASSET_ASSIGNED',
        'ASSET_RETURNED',
        'EXPENSE_ADDED',
        'ASSET_RETIRED',
      ],
    },
    asset_id: { type: String, ref: 'Asset', default: null },
    user_id: { type: String, ref: 'User', default: null },
    base_id: { type: String, ref: 'Base', default: null },
    reference_id: { type: String, default: null },
    reference_type: { type: String, default: null },
    previous_state: { type: mongoose.Schema.Types.Mixed, default: null },
    new_state: { type: mongoose.Schema.Types.Mixed, default: null },
    description: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transactionSchema.virtual('id').get(function () {
  return this._id;
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

const formatTransaction = (doc) => {
  if (!doc) return null;
  const tx = doc.toObject ? doc.toObject() : doc;
  const asset = tx.asset_id && typeof tx.asset_id === 'object' ? tx.asset_id : null;
  const user = tx.user_id && typeof tx.user_id === 'object' ? tx.user_id : null;
  const base = tx.base_id && typeof tx.base_id === 'object' ? tx.base_id : null;

  return {
    ...tx,
    id: tx._id || tx.id,
    asset_id: asset ? asset._id || asset.id : tx.asset_id,
    asset_name: asset ? asset.name : tx.asset_name || null,
    asset_code: asset ? asset.asset_code : tx.asset_code || null,
    user_id: user ? user._id || user.id : tx.user_id,
    user_name: user ? user.name : tx.user_name || null,
    base_id: base ? base._id || base.id : tx.base_id,
    base_name: base ? base.name : tx.base_name || null,
    base_code: base ? base.code : tx.base_code || null,
  };
};

const findAll = async ({ page = 1, limit = 20, transactionType, assetId, userId, baseId, scopedBaseId, startDate, endDate } = {}) => {
  if (db.isMongoAvailable) {
    const queryCond = {};
    if (scopedBaseId) queryCond.base_id = scopedBaseId;
    if (baseId && !scopedBaseId) queryCond.base_id = baseId;
    if (transactionType) queryCond.transaction_type = transactionType;
    if (assetId) queryCond.asset_id = assetId;
    if (userId) queryCond.user_id = userId;

    if (startDate || endDate) {
      queryCond.created_at = {};
      if (startDate) queryCond.created_at.$gte = new Date(startDate);
      if (endDate) queryCond.created_at.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(queryCond);
    const transactions = await Transaction.find(queryCond)
      .populate('asset_id')
      .populate('user_id')
      .populate('base_id')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      rows: transactions.map(formatTransaction),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const JOINS = `LEFT JOIN assets a ON t.asset_id = a.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN bases b ON t.base_id = b.id`;

  const COLUMNS = `t.*,
    a.name as asset_name, a.asset_code,
    u.name as user_name,
    b.name as base_name, b.code as base_code`;

  const conditions = [];
  if (scopedBaseId) conditions.push({ column: 't.base_id', value: scopedBaseId });
  if (baseId && !scopedBaseId) conditions.push({ column: 't.base_id', value: baseId });
  if (transactionType) conditions.push({ column: 't.transaction_type', value: transactionType });
  if (assetId) conditions.push({ column: 't.asset_id', value: assetId });
  if (userId) conditions.push({ column: 't.user_id', value: userId });
  if (startDate) conditions.push({ column: 't.created_at', value: startDate, operator: '>=' });
  if (endDate) conditions.push({ column: 't.created_at', value: endDate, operator: '<=' });

  return findWithPagination({
    table: 'transactions t',
    joins: JOINS,
    conditions,
    selectColumns: COLUMNS,
    orderBy: 't.created_at DESC',
    page,
    limit,
  });
};

const findById = async (id) => {
  if (db.isMongoAvailable) {
    const tx = await Transaction.findById(id)
      .populate('asset_id')
      .populate('user_id')
      .populate('base_id');
    return tx ? formatTransaction(tx) : null;
  }

  const JOINS = `LEFT JOIN assets a ON t.asset_id = a.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN bases b ON t.base_id = b.id`;

  const COLUMNS = `t.*,
    a.name as asset_name, a.asset_code,
    u.name as user_name,
    b.name as base_name, b.code as base_code`;

  const result = await db.query(`SELECT ${COLUMNS} FROM transactions t ${JOINS} WHERE t.id = $1`, [id]);
  return result.rows[0] || null;
};

const findByAssetId = async (assetId, { page = 1, limit = 20 } = {}) => {
  return findAll({ assetId, page, limit });
};

const create = async (data, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session } : {};
    const docs = await Transaction.create(
      [
        {
          transaction_type: data.transactionType,
          asset_id: data.assetId || null,
          user_id: data.userId || null,
          base_id: data.baseId || null,
          reference_id: data.referenceId || null,
          reference_type: data.referenceType || null,
          previous_state: data.previousState || null,
          new_state: data.newState || null,
          description: data.description || null,
        },
      ],
      options
    );
    return findById(docs[0]._id);
  }

  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  const result = await queryFn(
    `INSERT INTO transactions (transaction_type, asset_id, user_id, base_id, reference_id, reference_type, previous_state, new_state, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      data.transactionType,
      data.assetId || null,
      data.userId || null,
      data.baseId || null,
      data.referenceId || null,
      data.referenceType || null,
      data.previousState ? JSON.stringify(data.previousState) : null,
      data.newState ? JSON.stringify(data.newState) : null,
      data.description || null,
    ]
  );
  return result.rows[0];
};

module.exports = { Transaction, findAll, findById, findByAssetId, create };
