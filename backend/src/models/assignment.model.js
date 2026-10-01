const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { findWithPagination } = require('./base.model');

const assignmentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    asset_id: { type: String, ref: 'Asset', required: true },
    user_id: { type: String, ref: 'User', required: true },
    base_id: { type: String, ref: 'Base', required: true },
    assigned_by: { type: String, ref: 'User', required: true },
    assigned_at: { type: Date, default: Date.now },
    expected_return_at: { type: Date, default: null },
    returned_at: { type: Date, default: null },
    status: { type: String, enum: ['ACTIVE', 'RETURNED', 'CANCELLED'], default: 'ACTIVE' },
    notes: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

assignmentSchema.virtual('id').get(function () {
  return this._id;
});

const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);

const formatAssignment = (doc) => {
  if (!doc) return null;
  const a = doc.toObject ? doc.toObject() : doc;
  const asset = a.asset_id && typeof a.asset_id === 'object' ? a.asset_id : null;
  const user = a.user_id && typeof a.user_id === 'object' ? a.user_id : null;
  const base = a.base_id && typeof a.base_id === 'object' ? a.base_id : null;
  const assignUser = a.assigned_by && typeof a.assigned_by === 'object' ? a.assigned_by : null;

  return {
    ...a,
    id: a._id || a.id,
    asset_id: asset ? asset._id || asset.id : a.asset_id,
    asset_name: asset ? asset.name : a.asset_name || null,
    asset_code: asset ? asset.asset_code : a.asset_code || null,
    user_id: user ? user._id || user.id : a.user_id,
    user_name: user ? user.name : a.user_name || null,
    user_employee_id: user ? user.employee_id : a.user_employee_id || null,
    base_id: base ? base._id || base.id : a.base_id,
    base_name: base ? base.name : a.base_name || null,
    base_code: base ? base.code : a.base_code || null,
    assigned_by: assignUser ? assignUser._id || assignUser.id : a.assigned_by,
    assigned_by_name: assignUser ? assignUser.name : a.assigned_by_name || null,
  };
};

const findAll = async ({ page = 1, limit = 20, search, status, assetId, userId, baseId, scopedBaseId } = {}) => {
  if (db.isMongoAvailable) {
    const queryCond = {};
    if (scopedBaseId) queryCond.base_id = scopedBaseId;
    if (baseId && !scopedBaseId) queryCond.base_id = baseId;
    if (status) queryCond.status = status;
    if (assetId) queryCond.asset_id = assetId;
    if (userId) queryCond.user_id = userId;

    const total = await Assignment.countDocuments(queryCond);
    const assignments = await Assignment.find(queryCond)
      .populate('asset_id')
      .populate('user_id')
      .populate('base_id')
      .populate('assigned_by')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      rows: assignments.map(formatAssignment),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const JOINS = `LEFT JOIN assets a ON asg.asset_id = a.id
    LEFT JOIN users u ON asg.user_id = u.id
    LEFT JOIN bases b ON asg.base_id = b.id
    LEFT JOIN users ab ON asg.assigned_by = ab.id`;

  const COLUMNS = `asg.*,
    a.name as asset_name, a.asset_code,
    u.name as user_name, u.employee_id as user_employee_id,
    b.name as base_name, b.code as base_code,
    ab.name as assigned_by_name`;

  const conditions = [];
  if (scopedBaseId) conditions.push({ column: 'asg.base_id', value: scopedBaseId });
  if (baseId && !scopedBaseId) conditions.push({ column: 'asg.base_id', value: baseId });
  if (status) conditions.push({ column: 'asg.status', value: status });
  if (assetId) conditions.push({ column: 'asg.asset_id', value: assetId });
  if (userId) conditions.push({ column: 'asg.user_id', value: userId });

  return findWithPagination({
    table: 'assignments asg',
    joins: JOINS,
    conditions,
    search,
    searchColumns: ['a.name', 'a.asset_code', 'u.name'],
    selectColumns: COLUMNS,
    orderBy: 'asg.created_at DESC',
    page,
    limit,
  });
};

const findById = async (id) => {
  if (db.isMongoAvailable) {
    const assignment = await Assignment.findById(id)
      .populate('asset_id')
      .populate('user_id')
      .populate('base_id')
      .populate('assigned_by');
    return assignment ? formatAssignment(assignment) : null;
  }

  const JOINS = `LEFT JOIN assets a ON asg.asset_id = a.id
    LEFT JOIN users u ON asg.user_id = u.id
    LEFT JOIN bases b ON asg.base_id = b.id
    LEFT JOIN users ab ON asg.assigned_by = ab.id`;

  const COLUMNS = `asg.*,
    a.name as asset_name, a.asset_code,
    u.name as user_name, u.employee_id as user_employee_id,
    b.name as base_name, b.code as base_code,
    ab.name as assigned_by_name`;

  const result = await db.query(`SELECT ${COLUMNS} FROM assignments asg ${JOINS} WHERE asg.id = $1`, [id]);
  return result.rows[0] || null;
};

const findActiveByAssetId = async (assetId) => {
  if (db.isMongoAvailable) {
    const assignment = await Assignment.findOne({ asset_id: assetId, status: 'ACTIVE' });
    return assignment ? formatAssignment(assignment) : null;
  }
  const result = await db.query(
    `SELECT * FROM assignments WHERE asset_id = $1 AND status = 'ACTIVE'`,
    [assetId]
  );
  return result.rows[0] || null;
};

const create = async (data, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session } : {};
    const docs = await Assignment.create(
      [
        {
          asset_id: data.assetId,
          user_id: data.userId,
          base_id: data.baseId,
          assigned_by: data.assignedBy,
          assigned_at: data.assignedAt || new Date(),
          expected_return_at: data.expectedReturnAt || null,
          notes: data.notes || null,
          status: data.status || 'ACTIVE',
        },
      ],
      options
    );
    return findById(docs[0]._id);
  }

  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  const result = await queryFn(
    `INSERT INTO assignments (asset_id, user_id, base_id, assigned_by, assigned_at, expected_return_at, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      data.assetId,
      data.userId,
      data.baseId,
      data.assignedBy,
      data.assignedAt || new Date(),
      data.expectedReturnAt || null,
      data.notes || null,
      data.status || 'ACTIVE',
    ]
  );
  return result.rows[0];
};

const update = async (id, fields, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session } : {};
    const updateData = { ...fields, updated_at: new Date() };
    await Assignment.findByIdAndUpdate(id, { $set: updateData }, options);
    return findById(id);
  }

  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = ['user_id', 'expected_return_at', 'notes', 'status', 'returned_at'];
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

  await queryFn(`UPDATE assignments SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, params);
  return findById(id);
};

const findByAssetId = async (assetId, { page = 1, limit = 20 } = {}) => {
  return findAll({ assetId, page, limit });
};

module.exports = { Assignment, findAll, findById, findActiveByAssetId, create, update, findByAssetId };
