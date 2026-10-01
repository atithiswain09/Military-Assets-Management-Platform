const { sendError } = require('../utils/response');

/**
 * Validation middleware factory using Joi schemas.
 * Validates req.body, req.query, or req.params.
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema
 * @param {'body'|'query'|'params'} source - Request property to validate
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return sendError(res, {
        statusCode: 400,
        message: messages,
        code: 'VALIDATION_ERROR',
        details: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    // Replace with sanitized/validated values
    req[source] = value;
    next();
  };
};

module.exports = { validate };
