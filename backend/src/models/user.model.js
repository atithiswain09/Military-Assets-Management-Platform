const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { findWithPagination } = require('./base.model');

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    role_id: { type: String, ref: 'Role', required: true },
    base_id: { type: String, ref: 'Base', default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    employee_id: { type: String, required: true, unique: true, uppercase: true, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    is_2fa_enabled: { type: Boolean, default: false },
    sessions: { type: Array, default: [] },
    last_login_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('id').get(function () {
  return this._id;
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const SAFE_COLUMNS = `u.id, u.role_id, u.base_id, u.name, u.email, u.employee_id,
  u.status, u.settings, u.is_2fa_enabled, u.sessions, u.last_login_at, u.created_at, u.updated_at,
  r.name as role_name, b.name as base_name, b.code as base_code`;

const formatUser = (userDoc) => {
  if (!userDoc) return null;
  const doc = userDoc.toObject ? userDoc.toObject() : userDoc;
  const role = doc.role_id && typeof doc.role_id === 'object' ? doc.role_id : null;
  const base = doc.base_id && typeof doc.base_id === 'object' ? doc.base_id : null;

  return {
    ...doc,
    id: doc._id || doc.id,
    role_id: role ? role._id || role.id : doc.role_id,
    base_id: base ? base._id || base.id : doc.base_id,
    role_name: role ? role.name : doc.role_name || null,
    base_name: base ? base.name : doc.base_name || null,
    base_code: base ? base.code : doc.base_code || null,
  };
};

const findAll = async ({ page = 1, limit = 20, search, status, roleId, baseId, scopedBaseId } = {}) => {
  if (db.isMongoAvailable) {
    const queryCond = {};
    if (scopedBaseId) queryCond.base_id = scopedBaseId;
    if (status) queryCond.status = status;
    if (roleId) queryCond.role_id = roleId;
    if (baseId) queryCond.base_id = baseId;

    if (search) {
      const regex = new RegExp(search, 'i');
      queryCond.$or = [{ name: regex }, { email: regex }, { employee_id: regex }];
    }

    const total = await User.countDocuments(queryCond);
    const users = await User.find(queryCond)
      .populate('role_id')
      .populate('base_id')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const rows = users.map(formatUser).map((u) => {
      const { password_hash, ...safe } = u;
      return safe;
    });

    return {
      rows,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  const conditions = [];
  if (scopedBaseId) conditions.push({ column: 'u.base_id', value: scopedBaseId });
  if (status) conditions.push({ column: 'u.status', value: status });
  if (roleId) conditions.push({ column: 'u.role_id', value: roleId });
  if (baseId) conditions.push({ column: 'u.base_id', value: baseId });

  return findWithPagination({
    table: 'users u',
    joins: 'LEFT JOIN roles r ON u.role_id = r.id LEFT JOIN bases b ON u.base_id = b.id',
    conditions,
    search,
    searchColumns: ['u.name', 'u.email', 'u.employee_id'],
    selectColumns: SAFE_COLUMNS,
    orderBy: 'u.created_at DESC',
    page,
    limit,
  });
};

const findById = async (id) => {
  if (db.isMongoAvailable) {
    const user = await User.findById(id).populate('role_id').populate('base_id');
    if (!user) return null;
    const formatted = formatUser(user);
    delete formatted.password_hash;
    return formatted;
  }
  const result = await db.query(
    `SELECT ${SAFE_COLUMNS} FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     LEFT JOIN bases b ON u.base_id = b.id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const findWithPassword = async (id) => {
  if (db.isMongoAvailable) {
    const user = await User.findById(id).populate('role_id').populate('base_id');
    return user ? formatUser(user) : null;
  }
  const result = await db.query(
    `SELECT u.*, r.name as role_name, b.name as base_name, b.code as base_code
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     LEFT JOIN bases b ON u.base_id = b.id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const findByEmail = async (email) => {
  if (db.isMongoAvailable) {
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('role_id')
      .populate('base_id');
    return user ? formatUser(user) : null;
  }
  const result = await db.query(
    `SELECT u.*, r.name as role_name, b.name as base_name, b.code as base_code
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     LEFT JOIN bases b ON u.base_id = b.id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

const findByEmployeeId = async (employeeId) => {
  if (db.isMongoAvailable) {
    const user = await User.findOne({ employee_id: employeeId.toUpperCase() });
    return user ? { id: user._id } : null;
  }
  const result = await db.query('SELECT id FROM users WHERE employee_id = $1', [employeeId]);
  return result.rows[0] || null;
};

const create = async ({ roleId, baseId, name, email, passwordHash, employeeId, status = 'ACTIVE' }) => {
  if (db.isMongoAvailable) {
    const user = new User({
      role_id: roleId,
      base_id: baseId || null,
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      employee_id: employeeId.toUpperCase(),
      status,
    });
    await user.save();
    return findById(user._id);
  }
  const result = await db.query(
    `INSERT INTO users (role_id, base_id, name, email, password_hash, employee_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [roleId, baseId, name, email, passwordHash, employeeId, status]
  );
  return findById(result.rows[0].id);
};

const update = async (id, fields) => {
  if (db.isMongoAvailable) {
    const updateData = { ...fields, updated_at: new Date() };
    if (fields.roleId) updateData.role_id = fields.roleId;
    if (fields.baseId) updateData.base_id = fields.baseId;
    if (fields.passwordHash) updateData.password_hash = fields.passwordHash;
    if (fields.employeeId) updateData.employee_id = fields.employeeId;

    await User.findByIdAndUpdate(id, { $set: updateData });
    return findById(id);
  }

  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  const allowedFields = ['role_id', 'base_id', 'name', 'email', 'employee_id', 'status', 'password_hash', 'settings', 'is_2fa_enabled', 'sessions'];
  for (const [key, value] of Object.entries(fields)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return findById(id);

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  await db.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    params
  );

  return findById(id);
};

const updateLastLogin = async (id) => {
  if (db.isMongoAvailable) {
    await User.findByIdAndUpdate(id, { $set: { last_login_at: new Date() } });
    return;
  }
  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
};

const updateStatus = async (id, status) => {
  if (db.isMongoAvailable) {
    await User.findByIdAndUpdate(id, { $set: { status, updated_at: new Date() } });
    return findById(id);
  }
  await db.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  return findById(id);
};

const deleteById = async (id) => {
  if (db.isMongoAvailable) {
    const res = await User.findByIdAndDelete(id);
    return !!res;
  }
  const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
};

module.exports = {
  User,
  findAll,
  findById,
  findWithPassword,
  findByEmail,
  findByEmployeeId,
  create,
  update,
  updateLastLogin,
  updateStatus,
  deleteById,
};
