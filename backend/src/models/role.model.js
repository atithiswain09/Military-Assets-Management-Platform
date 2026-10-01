const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { queryMemoryDb } = require('../config/memoryDb');

const roleSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    name: { type: String, required: true, unique: true, uppercase: true, trim: true },
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

roleSchema.virtual('id').get(function () {
  return this._id;
});

const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

const findAll = async () => {
  if (db.isMongoAvailable) {
    const roles = await Role.find().sort({ name: 1 }).lean();
    return roles.map((r) => ({ ...r, id: r._id }));
  }
  const result = await db.query('SELECT * FROM roles ORDER BY name');
  return result.rows;
};

const findById = async (id) => {
  if (db.isMongoAvailable) {
    const role = await Role.findById(id).lean();
    return role ? { ...role, id: role._id } : null;
  }
  const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const findByName = async (name) => {
  if (db.isMongoAvailable) {
    const role = await Role.findOne({ name }).lean();
    return role ? { ...role, id: role._id } : null;
  }
  const result = await db.query('SELECT * FROM roles WHERE name = $1', [name]);
  return result.rows[0] || null;
};

const create = async (data) => {
  if (db.isMongoAvailable) {
    const role = new Role(data);
    await role.save();
    return { ...role.toObject(), id: role._id };
  }
  return null;
};

module.exports = { Role, findAll, findById, findByName, create };
