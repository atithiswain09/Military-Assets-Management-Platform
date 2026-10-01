const userModel = require('../models/user.model');
const roleModel = require('../models/role.model');
const { hashPassword } = require('../utils/password');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../middleware/error.middleware');

const getUsers = async (req, res, next) => {
  try {
    const result = await userModel.findAll({
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
      search: req.query.search,
      status: req.query.status,
      roleId: req.query.role_id,
      baseId: req.query.base_id,
      scopedBaseId: req.scopedBaseId,
    });
    sendPaginated(res, {
      message: 'Users retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    sendSuccess(res, { message: 'User retrieved', data: user });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, employee_id, role_id, base_id, status } = req.body;

    if (!name || !email || !password || !employee_id || !role_id) {
      throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    // Check email uniqueness
    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      throw new AppError('Email already exists', 409, 'DUPLICATE_ENTRY');
    }

    // Check employee ID uniqueness
    const existingEmpId = await userModel.findByEmployeeId(employee_id);
    if (existingEmpId) {
      throw new AppError('Employee ID already exists', 409, 'DUPLICATE_ENTRY');
    }

    // Verify role exists
    const role = await roleModel.findById(role_id);
    if (!role) {
      throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');
    }

    const passwordHash = await hashPassword(password);

    const user = await userModel.create({
      roleId: role_id,
      baseId: base_id || null,
      name,
      email,
      passwordHash,
      employeeId: employee_id,
      status: status || 'ACTIVE',
    });

    sendSuccess(res, { statusCode: 201, message: 'User created successfully', data: user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const existing = await userModel.findById(req.params.id);
    if (!existing) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const fields = {};
    if (req.body.name !== undefined) fields.name = req.body.name;
    if (req.body.email !== undefined) fields.email = req.body.email;
    if (req.body.employee_id !== undefined) fields.employee_id = req.body.employee_id;
    if (req.body.role_id !== undefined) fields.role_id = req.body.role_id;
    if (req.body.base_id !== undefined) fields.base_id = req.body.base_id;
    if (req.body.status !== undefined) fields.status = req.body.status;
    if (req.body.password) {
      fields.password_hash = await hashPassword(req.body.password);
    }

    const user = await userModel.update(req.params.id, fields);
    sendSuccess(res, { message: 'User updated successfully', data: user });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
    }

    const existing = await userModel.findById(req.params.id);
    if (!existing) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = await userModel.updateStatus(req.params.id, status);
    sendSuccess(res, { message: 'User status updated successfully', data: user });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const existing = await userModel.findById(req.params.id);
    if (!existing) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    await userModel.deleteById(req.params.id);
    sendSuccess(res, { message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser };
