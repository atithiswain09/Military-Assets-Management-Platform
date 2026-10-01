const assignmentService = require('../services/assignment.service');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getAssignments = async (req, res, next) => {
  try {
    const result = await assignmentService.getAssignments(req.query, req.scopedBaseId);
    sendPaginated(res, {
      message: 'Assignments retrieved',
      data: result.rows,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id, req.scopedBaseId);
    sendSuccess(res, { message: 'Assignment retrieved', data: assignment });
  } catch (err) {
    next(err);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.assignAsset(req.body, req.user.userId);
    sendSuccess(res, { statusCode: 201, message: 'Asset assigned successfully', data: assignment });
  } catch (err) {
    next(err);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.updateAssignment(req.params.id, req.body, req.scopedBaseId);
    sendSuccess(res, { message: 'Assignment updated successfully', data: assignment });
  } catch (err) {
    next(err);
  }
};

const returnAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.returnAsset(req.params.id, req.user.userId, req.scopedBaseId);
    sendSuccess(res, { message: 'Asset returned successfully', data: assignment });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAssignments, getAssignmentById, createAssignment, updateAssignment, returnAssignment };
