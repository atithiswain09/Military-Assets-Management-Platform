const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const militaryBaseSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    location: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

militaryBaseSchema.virtual('id').get(function () {
  return this._id;
});

const Base = mongoose.models.Base || mongoose.model('Base', militaryBaseSchema);

/**
 * Build a paginated SELECT query / Mongoose query.
 */
const findWithPagination = async ({
  table,
  conditions = [],
  orderBy = 'created_at DESC',
  page = 1,
  limit = 20,
  search = '',
  searchColumns = [],
  selectColumns = '*',
  joins = '',
}) => {
  const params = [];
  const whereClauses = [];
  let paramIndex = 1;

  for (const cond of conditions) {
    if (cond.value !== undefined && cond.value !== null && cond.value !== '') {
      const op = cond.operator || '=';
      whereClauses.push(`${cond.column} ${op} $${paramIndex}`);
      params.push(cond.value);
      paramIndex++;
    }
  }

  if (search && searchColumns.length > 0) {
    const searchClauses = searchColumns.map((col) => {
      params.push(`%${search}%`);
      return `${col} ILIKE $${paramIndex++}`;
    });
    whereClauses.push(`(${searchClauses.join(' OR ')})`);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) as total FROM ${table} ${joins} ${whereStr}`;
  const countResult = await db.query(countQuery, params);
  const total = parseInt(countResult.rows[0]?.total || 0, 10);

  const offset = (page - 1) * limit;
  const dataParams = [...params, limit, offset];
  const dataQuery = `SELECT ${selectColumns} FROM ${table} ${joins} ${whereStr} ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  const dataResult = await db.query(dataQuery, dataParams);

  return {
    rows: dataResult.rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const findAllBases = async () => {
  if (db.isMongoAvailable) {
    const bases = await Base.find({ status: 'ACTIVE' }).sort({ name: 1 }).lean();
    return bases.map((b) => ({ ...b, id: b._id }));
  }
  const result = await db.query("SELECT * FROM bases WHERE status = 'ACTIVE' ORDER BY name");
  return result.rows;
};

const findBaseById = async (id) => {
  if (db.isMongoAvailable) {
    const base = await Base.findById(id).lean();
    return base ? { ...base, id: base._id } : null;
  }
  const result = await db.query('SELECT * FROM bases WHERE id = $1', [id]);
  return result.rows[0] || null;
};

module.exports = {
  Base,
  findWithPagination,
  findAllBases,
  findBaseById,
};
