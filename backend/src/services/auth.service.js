const userModel = require('../models/user.model');
const roleModel = require('../models/role.model');
const assetModel = require('../models/asset.model');
const assignmentModel = require('../models/assignment.model');
const transferModel = require('../models/transfer.model');
const purchaseModel = require('../models/purchase.model');
const transactionModel = require('../models/transaction.model');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { AppError } = require('../middleware/error.middleware');

const login = async (email, password) => {
  // Find user including password_hash for comparison
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check account status
  if (user.status !== 'ACTIVE') {
    throw new AppError('Account is disabled', 403, 'ACCOUNT_DISABLED');
  }

  // Compare password
  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Update last login
  await userModel.updateLastLogin(user.id);

  // Generate JWT
  const token = generateToken({
    userId: user.id,
    role: user.role_name,
    baseId: user.base_id,
  });

  // Return safe user info (no password_hash)
  const { password_hash, ...safeUser } = user;

  return { token, user: safeUser };
};

const getCurrentUser = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return user;
};

const getUserSettings = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const defaultSettings = {
    theme: 'light',
    notifications: {
      transfers: true,
      purchases: true,
      assignments: true,
      system: false,
    },
    is2faEnabled: false,
  };

  const userSettings = user.settings || {};
  const themeSetting = userSettings.theme === 'dark' ? 'dark' : 'light';
  return {
    theme: themeSetting,
    notifications: {
      ...defaultSettings.notifications,
      ...(userSettings.notifications || {}),
    },
    is2faEnabled: Boolean(user.is_2fa_enabled || userSettings.is_2fa_enabled),
  };
};

const updateUserSettings = async (userId, { theme, notifications }) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const currentSettings = user.settings || {
    theme: 'light',
    notifications: { transfers: true, purchases: true, assignments: true, system: false },
  };

  const newTheme = theme && ['light', 'dark'].includes(theme) ? theme : (currentSettings.theme === 'dark' ? 'dark' : 'light');
  const newNotifications = notifications ? { ...currentSettings.notifications, ...notifications } : currentSettings.notifications;

  const updatedSettings = {
    ...currentSettings,
    theme: newTheme,
    notifications: newNotifications,
  };

  await userModel.update(userId, { settings: updatedSettings });

  return {
    theme: newTheme,
    notifications: newNotifications,
    is2faEnabled: Boolean(user.is_2fa_enabled || currentSettings.is_2fa_enabled),
  };
};

const changePassword = async (userId, { currentPassword, newPassword, confirmPassword }) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError('Current password, new password, and confirm password are required', 400, 'VALIDATION_ERROR');
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('New password and confirm password do not match', 400, 'PASSWORD_MISMATCH');
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400, 'WEAK_PASSWORD');
  }

  const user = await userModel.findWithPassword(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const isMatch = await comparePassword(currentPassword, user.password_hash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }

  const newHash = await hashPassword(newPassword);
  await userModel.update(userId, { password_hash: newHash });

  return { message: 'Password updated successfully' };
};

const toggle2FA = async (userId, enabled) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const nextState = enabled !== undefined ? Boolean(enabled) : !Boolean(user.is_2fa_enabled);
  const currentSettings = user.settings || {};
  const updatedSettings = {
    ...currentSettings,
    is_2fa_enabled: nextState,
  };

  await userModel.update(userId, {
    is_2fa_enabled: nextState,
    settings: updatedSettings,
  });

  return {
    is2faEnabled: nextState,
    message: nextState ? 'Two-Factor Authentication enabled' : 'Two-Factor Authentication disabled',
  };
};

const getUserSessions = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const defaultSessions = [
    {
      id: 'sess-current',
      device: 'Windows Workstation (Dell XPS)',
      browser: 'Chrome 128.0',
      os: 'Windows 11 Enterprise',
      ip: '192.168.1.104',
      location: 'Fort Sentinel Command HQ',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
    {
      id: 'sess-mobile',
      device: 'Field Tactical Tablet',
      browser: 'Safari iOS 17.5',
      os: 'iOS 17.5',
      ip: '10.240.12.88',
      location: 'Camp Ironclad Outpost',
      lastActive: new Date(Date.now() - 3600000 * 3).toISOString(),
      isCurrent: false,
    },
  ];

  return user.sessions || defaultSessions;
};

const revokeUserSession = async (userId, sessionId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const defaultSessions = [
    {
      id: 'sess-current',
      device: 'Windows Workstation (Dell XPS)',
      browser: 'Chrome 128.0',
      os: 'Windows 11 Enterprise',
      ip: '192.168.1.104',
      location: 'Fort Sentinel Command HQ',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
    {
      id: 'sess-mobile',
      device: 'Field Tactical Tablet',
      browser: 'Safari iOS 17.5',
      os: 'iOS 17.5',
      ip: '10.240.12.88',
      location: 'Camp Ironclad Outpost',
      lastActive: new Date(Date.now() - 3600000 * 3).toISOString(),
      isCurrent: false,
    },
  ];

  const sessions = user.sessions || defaultSessions;
  const updatedSessions = sessions.filter(s => s.id !== sessionId || s.isCurrent);

  await userModel.update(userId, { sessions: updatedSessions });
  return updatedSessions;
};

const exportUserData = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const [assignmentsRes, transfersRes, purchasesRes, transactionsRes] = await Promise.all([
    assignmentModel.findAll({ limit: 100 }).catch(() => []),
    transferModel.findAll({ limit: 100 }).catch(() => []),
    purchaseModel.findAll({ limit: 100 }).catch(() => []),
    transactionModel.findAll({ limit: 100 }).catch(() => []),
  ]);

  const assignmentsList = Array.isArray(assignmentsRes) ? assignmentsRes : (assignmentsRes?.rows || []);
  const transfersList = Array.isArray(transfersRes) ? transfersRes : (transfersRes?.rows || []);
  const purchasesList = Array.isArray(purchasesRes) ? purchasesRes : (purchasesRes?.rows || []);
  const transactionsList = Array.isArray(transactionsRes) ? transactionsRes : (transactionsRes?.rows || []);

  return {
    export_metadata: {
      generated_at: new Date().toISOString(),
      system: 'AssetFlow Military Asset Management System v1.0',
      user_id: user.id,
    },
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      employee_id: user.employee_id,
      role: user.role_name,
      base: user.base_name,
      status: user.status,
      created_at: user.created_at,
    },
    settings: user.settings || { theme: 'light', notifications: {} },
    is_2fa_enabled: Boolean(user.is_2fa_enabled),
    assignments: assignmentsList.filter(a => a.user_id === userId || a.user_id === user.id || a.assigned_by === userId),
    transfers: transfersList.filter(t => t.requested_by === userId || t.approved_by === userId),
    purchases: purchasesList.filter(p => p.created_by === userId),
    activity_transactions: transactionsList.filter(t => t.user_id === userId || t.performed_by === userId),
  };
};

module.exports = {
  login,
  getCurrentUser,
  getUserSettings,
  updateUserSettings,
  changePassword,
  toggle2FA,
  getUserSessions,
  revokeUserSession,
  exportUserData,
};
