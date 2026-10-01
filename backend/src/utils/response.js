/**
 * Standardized API response helpers.
 */

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
  const body = { success: true, message };
  if (data !== null && data !== undefined) {
    body.data = data;
  }
  return res.status(statusCode).json(body);
};

const sendPaginated = (res, { message = 'Success', data = [], pagination = {} } = {}) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

const sendError = (res, { statusCode = 500, message = 'Internal server error', code = 'INTERNAL_ERROR', details = null } = {}) => {
  const body = {
    success: false,
    message,
    error: { code },
  };
  if (details) {
    body.error.details = details;
  }
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendPaginated, sendError };
