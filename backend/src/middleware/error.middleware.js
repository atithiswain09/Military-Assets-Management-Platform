const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

/**
 * Custom application error with HTTP status code and error code.
 */
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Global error-handling middleware.
 * Must be registered AFTER all routes.
 */
const errorHandler = (err, req, res, _next) => {
  // Log the error
  if (err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, { code: err.code, statusCode: err.statusCode });
  } else {
    logger.error('Unexpected error', err);
  }

  // Joi validation errors
  if (err.isJoi) {
    return sendError(res, {
      statusCode: 400,
      message: err.details ? err.details.map((d) => d.message).join(', ') : 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.details,
    });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const detail = err.detail || '';
    return sendError(res, {
      statusCode: 409,
      message: `Duplicate value: ${detail}`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return sendError(res, {
      statusCode: 400,
      message: 'Referenced record does not exist',
      code: 'FOREIGN_KEY_VIOLATION',
    });
  }

  // Our custom AppError
  if (err instanceof AppError) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, { statusCode: 401, message: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, { statusCode: 401, message: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  // PostgreSQL connection errors (fallbacks are handled by db.js)
  if (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000' || err.message?.includes('connect ECONNREFUSED')) {
    logger.warn('Uncaught database error reaching middleware:', err.message);
    return sendError(res, {
      statusCode: 500,
      message: 'Database query failed. System operating in memory fallback mode.',
      code: 'DATABASE_ERROR',
    });
  }

  // Fallback — never expose internals in production
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return sendError(res, { statusCode: 500, message, code: 'INTERNAL_ERROR' });
};

/**
 * 404 handler for unknown routes.
 */
const notFoundHandler = (req, res) => {
  return sendError(res, { statusCode: 404, message: `Route ${req.originalUrl} not found`, code: 'ROUTE_NOT_FOUND' });
};

module.exports = { AppError, errorHandler, notFoundHandler };
