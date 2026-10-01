const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Authentication middleware.
 * Extracts and verifies JWT from the Authorization header.
 * Attaches decoded user info to req.user.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, { statusCode: 401, message: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, { statusCode: 401, message: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      baseId: decoded.baseId,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, { statusCode: 401, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, { statusCode: 401, message: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    logger.error('Auth middleware error', err);
    return sendError(res, { statusCode: 401, message: 'Authentication failed', code: 'AUTH_REQUIRED' });
  }
};

module.exports = { authenticate };
