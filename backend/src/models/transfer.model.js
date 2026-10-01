const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { findWithPagination } = require('./base.model');

const transferSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    transfer_number: { type: String, required: true, unique: true, uppercase: true, trim: true },
    asset_id: { type: String, ref: 'Asset', required: true },
    source_base_id: { type: String, ref: 'Base', required: true },
    destination_base_id: { type: String, ref: 'Base', required: true },
    requested_by: { type: String, ref: 'User', required: true },
    approved_by: { type: String, ref: 'User', default: null },
    reason: { type: String, required: true },
    transfer_date: { type: Date, default: Date.now },
    completed_at: { type: Date, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transferSchema.virtual('id').get(function () {
  return this._id;
});

const Transfer = mongoose.models.Transfer || mongoose.model('Transfer', transferSchema);

const formatTransfer = (doc) => {
  if (!doc) return null;
  const t = doc.toObject ? doc.toObject() : doc;
  const asset = t.asset_id && typeof t.asset_id === 'object' ? t.asset_id : null;
  const sBase = t.source_base_id && typeof t.source_base_id === 'object' ? t.source_base_id : null;
  const dBase = t.destination_base_id && typeof t.destination_base_id === 'object' ? t.destination_base_id : null;
  const reqUser = t.requested_by && typeof t.requested_by === 'object' ? t.requested_by : null;
  const appUser = t.approved_by && typeof t.approved_by === 'object' ? t.approved_by : null;

  return {
    ...t,
    id: t._id || t.id,
    asset_id: asset ? asset._id || asset.id : t.asset_id,
    asset_name: asset ? asset.name : t.asset_name || null,
    asset_code: asset ? asset.asset_code : t.asset_code || null,
    source_base_id: sBase ? sBase._id || sBase.id : t.source_base_id,
    source_base_name: sBase ? sBase.name : t.source_base_name || null,
    source_base_code: sBase ? sBase.code : t.source_base_code || null,
    destination_base_id: dBase ? dBase._id || dBase.id : t.destination_base_id,
    destination_base_name: dBase ? dBase.name : t.destination_base_name || null,
    destination_base_code: dBase ? dBase.code : t.destination_base_code || null,
    requested_by: reqUser ? reqUser._id || reqUser.id : t.requested_by,
    requested_by_name: reqUser ? reqUser.name : t.requested_by_name || null,
    approved_by: appUser ? appUser._id || appUser.id : t.approved_by,
    approved_by_name: appUser ? appUser.name : t.approved_by_name || null,
  };
};

const findAll = async ({ page = 1, limit = 20, search, status, assetId, sourceBaseId, destinationBaseId, scopedBaseId } = {}) => {
  if (db.isMongoAvailable) {
    const queryCond = {};
    if (scopedBaseId) {
      queryCond.$or = [{ source_base_id: scopedBaseId }, { destination_base_id: scopedBaseId }];
    }
    if (status) queryCond.status = status;
    if (assetId) queryCond.asset_id = assetId;
    if (sourceBaseId && !scopedBaseId) queryCond.source_base_id = sourceBaseId;
    if (destinationBaseId && !scopedBaseId) queryCond.destination_base_id = destinationBaseId;

    if (search) {
      const regex = new RegExp(search, 'i');
      if (queryCond.$or) {
        queryCond.$and = [
          { $or: queryCond.$or },
          { $or: [{ transfer_number: regex }] },
        ];
        delete queryCond.$or;
      } else {
        queryCond.$or = [{ transfer_number: regex }];
      }
    }

    const total = await Transfer.countDocuments(queryCond);
    const transfers = await Transfer.find(queryCond)
      .populate('asset_id')
      .populate('source_base_id')
      .populate('destination_base_id')
      .populate('requested_by')
      .populate('approved_by')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return {
      rows: transfers.map(formatTransfer),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const JOINS = `LEFT JOIN assets a ON t.asset_id = a.id
    LEFT JOIN bases sb ON t.source_base_id = sb.id
    LEFT JOIN bases db ON t.destination_base_id = db.id
    LEFT JOIN users req ON t.requested_by = req.id
    LEFT JOIN users app ON t.approved_by = app.id`;

  const COLUMNS = `t.*, 
    a.name as asset_name, a.asset_code,
    sb.name as source_base_name, sb.code as source_base_code,
    db.name as destination_base_name, db.code as destination_base_code,
    req.name as requested_by_name,
    app.name as approved_by_name`;

  if (scopedBaseId) {
    const params = [scopedBaseId];
    const whereClauses = [`(t.source_base_id = $1 OR t.destination_base_id = $1)`];
    let paramIndex = 2;

    if (status) { whereClauses.push(`t.status = $${paramIndex}`); params.push(status); paramIndex++; }
    if (assetId) { whereClauses.push(`t.asset_id = $${paramIndex}`); params.push(assetId); paramIndex++; }
    if (search) {
      whereClauses.push(`(t.transfer_number ILIKE $${paramIndex} OR a.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereStr = `WHERE ${whereClauses.join(' AND ')}`;
    const countResult = await db.query(`SELECT COUNT(*) as total FROM transfers t ${JOINS} ${whereStr}`, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);
    const offset = (page - 1) * limit;
    const dataResult = await db.query(
      `SELECT ${COLUMNS} FROM transfers t ${JOINS} ${whereStr} ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return { rows: dataResult.rows, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) || 1 };
  }

  const conditions = [];
  if (status) conditions.push({ column: 't.status', value: status });
  if (assetId) conditions.push({ column: 't.asset_id', value: assetId });
  if (sourceBaseId) conditions.push({ column: 't.source_base_id', value: sourceBaseId });
  if (destinationBaseId) conditions.push({ column: 't.destination_base_id', value: destinationBaseId });

  return findWithPagination({
    table: 'transfers t',
    joins: JOINS,
    conditions,
    search,
    searchColumns: ['t.transfer_number'],
    selectColumns: COLUMNS,
    orderBy: 't.created_at DESC',
    page,
    limit,
  });
};

const findById = async (id) => {
  if (db.isMongoAvailable) {
    const transfer = await Transfer.findById(id)
      .populate('asset_id')
      .populate('source_base_id')
      .populate('destination_base_id')
      .populate('requested_by')
      .populate('approved_by');
    return transfer ? formatTransfer(transfer) : null;
  }

  const JOINS = `LEFT JOIN assets a ON t.asset_id = a.id
    LEFT JOIN bases sb ON t.source_base_id = sb.id
    LEFT JOIN bases db ON t.destination_base_id = db.id
    LEFT JOIN users req ON t.requested_by = req.id
    LEFT JOIN users app ON t.approved_by = app.id`;

  const COLUMNS = `t.*, 
    a.name as asset_name, a.asset_code,
    sb.name as source_base_name, sb.code as source_base_code,
    db.name as destination_base_name, db.code as destination_base_code,
    req.name as requested_by_name,
    app.name as approved_by_name`;

  const result = await db.query(`SELECT ${COLUMNS} FROM transfers t ${JOINS} WHERE t.id = $1`, [id]);
  return result.rows[0] || null;
};

const findActiveByAssetId = async (assetId) => {
  if (db.isMongoAvailable) {
    const transfers = await Transfer.find({
      asset_id: assetId,
      status: { $in: ['PENDING', 'APPROVED', 'IN_TRANSIT'] },
    }).lean();
    return transfers.map((t) => ({ ...t, id: t._id }));
  }

  const result = await db.query(
    `SELECT * FROM transfers WHERE asset_id = $1 AND status IN ('PENDING', 'APPROVED', 'IN_TRANSIT')`,
    [assetId]
  );
  return result.rows;
};

const create = async (data, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session } : {};
    const docs = await Transfer.create(
      [
        {
          transfer_number: data.transferNumber,
          asset_id: data.assetId,
          source_base_id: data.sourceBaseId,
          destination_base_id: data.destinationBaseId,
          requested_by: data.requestedBy,
          reason: data.reason,
          transfer_date: data.transferDate || new Date(),
          status: data.status || 'PENDING',
        },
      ],
      options
    );
    return findById(docs[0]._id);
  }

  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  const result = await queryFn(
    `INSERT INTO transfers (transfer_number, asset_id, source_base_id, destination_base_id, requested_by, reason, transfer_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      data.transferNumber,
      data.assetId,
      data.sourceBaseId,
      data.destinationBaseId,
      data.requestedBy,
      data.reason,
      data.transferDate || new Date(),
      data.status || 'PENDING',
    ]
  );
  return result.rows[0];
};

const updateStatus = async (id, updates, session = null) => {
  if (db.isMongoAvailable) {
    const options = session ? { session } : {};
    const setFields = { status: updates.status, updated_at: new Date() };
    if (updates.approvedBy) setFields.approved_by = updates.approvedBy;
    if (updates.completedAt) setFields.completed_at = updates.completedAt;

    await Transfer.findByIdAndUpdate(id, { $set: setFields }, options);
    return;
  }

  const queryFn = session && session.query ? session.query.bind(session) : db.query;
  const setClauses = ['status = $1', 'updated_at = NOW()'];
  const params = [updates.status];
  let paramIndex = 2;

  if (updates.approvedBy) {
    setClauses.push(`approved_by = $${paramIndex}`);
    params.push(updates.approvedBy);
    paramIndex++;
  }
  if (updates.completedAt) {
    setClauses.push(`completed_at = $${paramIndex}`);
    params.push(updates.completedAt);
    paramIndex++;
  }

  params.push(id);
  await queryFn(`UPDATE transfers SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, params);
};

const findByAssetId = async (assetId, { page = 1, limit = 20 } = {}) => {
  return findAll({ assetId, page, limit });
};

module.exports = { Transfer, findAll, findById, findActiveByAssetId, create, updateStatus, findByAssetId };
