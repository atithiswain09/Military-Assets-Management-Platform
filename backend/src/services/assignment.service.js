const assignmentModel = require('../models/assignment.model');
const assetModel = require('../models/asset.model');
const userModel = require('../models/user.model');
const transactionModel = require('../models/transaction.model');
const { AppError } = require('../middleware/error.middleware');
const db = require('../config/db');

const getAssignments = async (query, scopedBaseId) => {
  return assignmentModel.findAll({
    page: query.page,
    limit: query.limit,
    search: query.search,
    status: query.status,
    assetId: query.asset_id,
    userId: query.user_id,
    baseId: query.base_id,
    scopedBaseId,
  });
};

const getAssignmentById = async (id, scopedBaseId) => {
  const assignment = await assignmentModel.findById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }
  if (scopedBaseId && assignment.base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to access this assignment', 403, 'FORBIDDEN');
  }
  return assignment;
};

const assignAsset = async (data, assignedBy) => {
  return db.transaction(async (client) => {
    // Lock the asset row for concurrency control
    const asset = await assetModel.findByIdForUpdate(data.asset_id, client);
    if (!asset) {
      throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
    }

    // Check asset availability
    if (asset.status === 'RETIRED') {
      throw new AppError('Retired assets cannot be assigned', 422, 'ASSET_NOT_AVAILABLE');
    }
    if (asset.status === 'ASSIGNED') {
      throw new AppError('Asset is already assigned', 409, 'ASSET_ALREADY_ASSIGNED');
    }
    if (asset.status === 'IN_TRANSIT') {
      throw new AppError('Asset is in transit and cannot be assigned', 422, 'ASSET_NOT_AVAILABLE');
    }

    // Check for active assignments (belt and suspenders with the status check)
    const activeAssignment = await assignmentModel.findActiveByAssetId(data.asset_id);
    if (activeAssignment) {
      throw new AppError('Asset already has an active assignment', 409, 'ASSET_ALREADY_ASSIGNED');
    }

    // Check user exists
    const user = await userModel.findById(data.user_id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Create assignment
    const assignment = await assignmentModel.create({
      assetId: data.asset_id,
      userId: data.user_id,
      baseId: data.base_id,
      assignedBy,
      assignedAt: data.assigned_at,
      expectedReturnAt: data.expected_return_at,
      notes: data.notes,
    }, client);

    // Update asset status
    await assetModel.updateStatus(data.asset_id, 'ASSIGNED', client);

    // Create audit transaction
    await transactionModel.create({
      transactionType: 'ASSET_ASSIGNED',
      assetId: data.asset_id,
      userId: data.user_id,
      baseId: data.base_id,
      referenceId: assignment.id,
      referenceType: 'ASSIGNMENT',
      previousState: { status: asset.status },
      newState: { status: 'ASSIGNED', assigned_to: data.user_id },
      description: `Asset ${asset.asset_code} assigned to ${user.name}`,
    }, client);

    return assignmentModel.findById(assignment.id);
  });
};

const updateAssignment = async (id, data, scopedBaseId) => {
  const assignment = await assignmentModel.findById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }
  if (scopedBaseId && assignment.base_id !== scopedBaseId) {
    throw new AppError('You do not have permission to modify this assignment', 403, 'FORBIDDEN');
  }
  if (assignment.status !== 'ACTIVE') {
    throw new AppError('Can only update active assignments', 422, 'ASSIGNMENT_ALREADY_RETURNED');
  }

  const fields = {};
  if (data.expected_return_at !== undefined) fields.expected_return_at = data.expected_return_at;
  if (data.notes !== undefined) fields.notes = data.notes;

  return assignmentModel.update(id, fields);
};

const returnAsset = async (id, userId, scopedBaseId) => {
  return db.transaction(async (client) => {
    const assignment = await assignmentModel.findById(id);
    if (!assignment) {
      throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
    }
    if (scopedBaseId && assignment.base_id !== scopedBaseId) {
      throw new AppError('You do not have permission to return this assignment', 403, 'FORBIDDEN');
    }
    if (assignment.status === 'RETURNED') {
      throw new AppError('Assignment has already been returned', 422, 'ASSIGNMENT_ALREADY_RETURNED');
    }
    if (assignment.status === 'CANCELLED') {
      throw new AppError('Cannot return a cancelled assignment', 422, 'ASSIGNMENT_ALREADY_RETURNED');
    }

    // Lock asset
    const asset = await assetModel.findByIdForUpdate(assignment.asset_id, client);

    // Update assignment
    await assignmentModel.update(id, {
      status: 'RETURNED',
      returned_at: new Date(),
    }, client);

    // Update asset status
    await assetModel.updateStatus(assignment.asset_id, 'IN_STORAGE', client);

    // Create audit transaction
    await transactionModel.create({
      transactionType: 'ASSET_RETURNED',
      assetId: assignment.asset_id,
      userId,
      baseId: assignment.base_id,
      referenceId: id,
      referenceType: 'ASSIGNMENT',
      previousState: { status: 'ASSIGNED', assigned_to: assignment.user_id },
      newState: { status: 'IN_STORAGE' },
      description: `Asset ${assignment.asset_code} returned`,
    }, client);

    return assignmentModel.findById(id);
  });
};

module.exports = { getAssignments, getAssignmentById, assignAsset, updateAssignment, returnAsset };
