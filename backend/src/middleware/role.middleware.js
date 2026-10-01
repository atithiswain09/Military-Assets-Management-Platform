const { sendError } = require('../utils/response');

/**
 * Role-based access control middleware factory.
 * Accepts one or more allowed roles.
 * Must be used AFTER authenticate middleware.
 *
 * @param  {...string} allowedRoles - e.g. 'ADMIN', 'BASE_COMMANDER'
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, { statusCode: 401, message: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, { statusCode: 403, message: 'You do not have permission to perform this action', code: 'FORBIDDEN' });
    }

    next();
  };
};

/**
 * Middleware to scope data access to the user's base.
 * Admins bypass the base restriction.
 * For non-admin users, attaches scopedBaseId to the request.
 */
const scopeToBase = (req, res, next) => {
  if (!req.user) {
    return sendError(res, { statusCode: 401, message: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  if (req.user.role === 'ADMIN') {
    // Admin can access all bases; no scoping
    req.scopedBaseId = null;
  } else {
    // Non-admin users are scoped to their assigned base
    req.scopedBaseId = req.user.baseId;
  }

  next();
};

module.exports = { authorize, scopeToBase };
