const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, { message: 'Login successful', data: result });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.userId);
    sendSuccess(res, { message: 'User profile retrieved', data: user });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await authService.getUserSettings(req.user.userId);
    sendSuccess(res, { message: 'Settings retrieved', data: settings });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { theme, notifications } = req.body;
    const settings = await authService.updateUserSettings(req.user.userId, { theme, notifications });
    sendSuccess(res, { message: 'Settings updated successfully', data: settings });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const result = await authService.changePassword(req.user.userId, { currentPassword, newPassword, confirmPassword });
    sendSuccess(res, { message: result.message });
  } catch (err) {
    next(err);
  }
};

const toggle2FA = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    const result = await authService.toggle2FA(req.user.userId, enabled);
    sendSuccess(res, { message: result.message, data: result });
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await authService.getUserSessions(req.user.userId);
    sendSuccess(res, { message: 'Sessions retrieved', data: sessions });
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const sessions = await authService.revokeUserSession(req.user.userId, req.params.id);
    sendSuccess(res, { message: 'Session revoked successfully', data: sessions });
  } catch (err) {
    next(err);
  }
};

const exportUserData = async (req, res, next) => {
  try {
    const exportData = await authService.exportUserData(req.user.userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="assetflow_account_data_${Date.now()}.json"`);
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  getMe,
  logout,
  getSettings,
  updateSettings,
  changePassword,
  toggle2FA,
  getSessions,
  revokeSession,
  exportUserData,
};
