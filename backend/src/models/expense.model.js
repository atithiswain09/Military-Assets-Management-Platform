const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { findWithPagination } = require('./base.model');

const expenseSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    expense_number: { type: String, required: true, unique: true, uppercase: true, trim: true },
    asset_id: { type: String, ref: 'Asset', required: true },
    base_id: { type: String, ref: 'Base', required: true },
    expense_type: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    amount: { type: Number, required: true, min: 0 },
    expense_date: { type: Date, required: true },
    recorded_by: { type: String, ref: 'User', required: true },
    status: { type: String, enum: ['RECORDED', 'APPROVED', 'CANCELLED'], default: 'RECORDED' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

expenseSchema.virtual('id').get(function () {
  return this._id;
});

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

const formatExpense = (doc) => {
  if (!doc) return null;
  const e = doc.toObject ? doc.toObject() : doc;
  const asset = e.asset_id && typeof e.asset_id === 'object' ? e.asset_id : null;
  const base = e.base_id && typeof e.base_id === 'object' ? e.base_id : null;
  const user = e.recorded_by && typeof e.recorded_by === 'object' ? e.recorded_by : null;

  return {
    ...e,
    id: e._id || e.id,
    asset_id: asset ? asset._id || asset.id : e.asset_id,
    asset_name: asset ? asset.name : e.asset_name || null,
    asset_code: asset ? asset.asset_code : e.asset_code || null,
    base_id: base ? base._id || base.id : e.base_id,
    base_name: base ? base.name : e.base_name || null,
    base_code: base ? base.code : e.base_code || null,
    recorded_by: user ? user._id || user.id : e.recorded_by,
    recorded_by_name: user ? user.name : e.recorded_by_name || null,
  };
};

const findAll = async ({ page = 1, limit = 20, search, assetId, baseId, expenseType, scopedBaseId, startDate, endDate, status } = {}) => {
  if (db.isMongoAvailable) {
    const queryCond = {};
    if (scopedBaseId) queryCond.base_id = scopedBaseId;
    if (baseId && !scopedBaseId) queryCond.base_id = baseId;
    if (assetId) queryCond.asset_id = assetId;
    if (expenseType) queryCond.expense_type = expenseType;
    if (status) queryCond.status = status;

    if (startDate || endDate) {
      queryCond.expense_date = {};
      if (startDate) queryCond.expense_date.$gte = new Date(startDate);
      if (endDate) queryCond.expense_date.$lte = new Date(endDate);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      queryCond.$or = [{ expense_number: regex }, { description: regex }];
    }

    const total = await Expense.countDocuments(queryCond);
    const expenses = await Expense.find(queryCond)
      .populate('asset_id')
      .populate('base_id')
      .populate('recorded_by')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      rows: expenses.map(formatExpense),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const JOINS = `LEFT JOIN assets a ON e.asset_id = a.id
    LEFT JOIN bases b ON e.base_id = b.id
    LEFT JOIN users u ON e.recorded_by = u.id`;

  const COLUMNS = `e.*, 
    a.name as asset_name, a.asset_code,
    b.name as base_name, b.code as base_code,
    u.name as recorded_by_name`;

  const conditions = [];
  if (scopedBaseId) conditions.push({ column: 'e.base_id', value: scopedBaseId });
  if (baseId && !scopedBaseId) conditions.push({ column: 'e.base_id', value: baseId });
  if (assetId) conditions.push({ column: 'e.asset_id', value: assetId });
  if (expenseType) conditions.push({ column: 'e.expense_type', value: expenseType });
  if (status) conditions.push({ column: 'e.status', value: status });
  if (startDate) conditions.push({ column: 'e.expense_date', value: startDate, operator: '>=' });
  if (endDate) conditions.push({ column: 'e.expense_date', value: endDate, operator: '<=' });

  return findWithPagination({
    table: 'expenses e',
    joins: JOINS,
    conditions,
    search,
    searchColumns: ['e.expense_number', 'e.description', 'a.name', 'a.asset_code'],
    selectColumns: COLUMNS,
    orderBy: 'e.created_at DESC',
    page,
    limit,
  });
};

const findById = async (id) => {
  if (db.isMongoAvailable) {
    const expense = await Expense.findById(id)
      .populate('asset_id')
      .populate('base_id')
      .populate('recorded_by');
    return expense ? formatExpense(expense) : null;
  }

  const JOINS = `LEFT JOIN assets a ON e.asset_id = a.id
    LEFT JOIN bases b ON e.base_id = b.id
    LEFT JOIN users u ON e.recorded_by = u.id`;

  const COLUMNS = `e.*, 
    a.name as asset_name, a.asset_code,
    b.name as base_name, b.code as base_code,
    u.name as recorded_by_name`;

  const result = await db.query(`SELECT ${COLUMNS} FROM expenses e ${JOINS} WHERE e.id = $1`, [id]);
  return result.rows[0] || null;
};

const create = async (data, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session } : {};
    const docs = await Expense.create(
      [
        {
          expense_number: data.expenseNumber,
          asset_id: data.assetId,
          base_id: data.baseId,
          expense_type: data.expenseType,
          description: data.description || null,
          amount: data.amount,
          expense_date: data.expenseDate,
          recorded_by: data.recordedBy,
          status: data.status || 'RECORDED',
        },
      ],
      options
    );
    return findById(docs[0]._id);
  }

  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  const result = await queryFn(
    `INSERT INTO expenses (expense_number, asset_id, base_id, expense_type, description, amount, expense_date, recorded_by, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      data.expenseNumber,
      data.assetId,
      data.baseId,
      data.expenseType,
      data.description || null,
      data.amount,
      data.expenseDate,
      data.recordedBy,
      data.status || 'RECORDED',
    ]
  );
  return result.rows[0];
};

const update = async (id, fields) => {
  if (db.isMongoAvailable) {
    const updateData = { ...fields, updated_at: new Date() };
    await Expense.findByIdAndUpdate(id, { $set: updateData });
    return findById(id);
  }

  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = ['expense_type', 'description', 'amount', 'expense_date', 'status'];
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

  await db.query(`UPDATE expenses SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, params);
  return findById(id);
};

const deleteById = async (id) => {
  if (db.isMongoAvailable) {
    const res = await Expense.findByIdAndDelete(id);
    return !!res;
  }
  const result = await db.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
};

const findByAssetId = async (assetId, { page = 1, limit = 20 } = {}) => {
  return findAll({ assetId, page, limit });
};

module.exports = { Expense, findAll, findById, create, update, deleteById, findByAssetId };
