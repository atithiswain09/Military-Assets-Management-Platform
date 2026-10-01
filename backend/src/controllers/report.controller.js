const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const data = await reportService.getDashboardStats(req.scopedBaseId);
    sendSuccess(res, { message: 'Dashboard stats retrieved', data });
  } catch (err) {
    next(err);
  }
};

const getAssetReport = async (req, res, next) => {
  try {
    const data = await reportService.getAssetReport(req.scopedBaseId);
    sendSuccess(res, { message: 'Asset report retrieved', data });
  } catch (err) {
    next(err);
  }
};

const getPurchaseReport = async (req, res, next) => {
  try {
    const data = await reportService.getPurchaseReport(req.scopedBaseId);
    sendSuccess(res, { message: 'Purchase report retrieved', data });
  } catch (err) {
    next(err);
  }
};

const getTransferReport = async (req, res, next) => {
  try {
    const data = await reportService.getTransferReport(req.scopedBaseId);
    sendSuccess(res, { message: 'Transfer report retrieved', data });
  } catch (err) {
    next(err);
  }
};

const getAssignmentReport = async (req, res, next) => {
  try {
    const data = await reportService.getAssignmentReport(req.scopedBaseId);
    sendSuccess(res, { message: 'Assignment report retrieved', data });
  } catch (err) {
    next(err);
  }
};

const getExpenseReport = async (req, res, next) => {
  try {
    const data = await reportService.getExpenseReport(req.scopedBaseId);
    sendSuccess(res, { message: 'Expense report retrieved', data });
  } catch (err) {
    next(err);
  }
};

const getMovementReport = async (req, res, next) => {
  try {
    const data = await reportService.getMovementReport(req.scopedBaseId);
    sendSuccess(res, { message: 'Movement report retrieved', data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard, getAssetReport, getPurchaseReport, getTransferReport,
  getAssignmentReport, getExpenseReport, getMovementReport,
};
