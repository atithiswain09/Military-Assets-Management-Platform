const Joi = require('joi');

const createAssignmentSchema = Joi.object({
  asset_id: Joi.string().uuid().required().messages({
    'any.required': 'Asset is required',
    'string.guid': 'Invalid asset ID',
  }),
  user_id: Joi.string().uuid().required().messages({
    'any.required': 'User is required',
    'string.guid': 'Invalid user ID',
  }),
  base_id: Joi.string().uuid().required().messages({
    'any.required': 'Base is required',
    'string.guid': 'Invalid base ID',
  }),
  assigned_at: Joi.date().required().messages({ 'any.required': 'Assignment date is required' }),
  expected_return_at: Joi.date().allow(null),
  notes: Joi.string().trim().allow('', null),
});

const updateAssignmentSchema = Joi.object({
  expected_return_at: Joi.date().allow(null),
  notes: Joi.string().trim().allow('', null),
}).min(1);

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  status: Joi.string().valid('ACTIVE', 'RETURNED', 'CANCELLED'),
  asset_id: Joi.string().uuid(),
  user_id: Joi.string().uuid(),
  base_id: Joi.string().uuid(),
});

module.exports = { createAssignmentSchema, updateAssignmentSchema, querySchema };
