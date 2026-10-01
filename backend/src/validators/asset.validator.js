const Joi = require('joi');

const createAssetSchema = Joi.object({
  asset_code: Joi.string().trim().required().messages({ 'any.required': 'Asset code is required' }),
  name: Joi.string().trim().required().messages({ 'any.required': 'Asset name is required' }),
  category: Joi.string().trim().allow('', null),
  asset_type: Joi.string().trim().required().messages({ 'any.required': 'Asset type is required' }),
  serial_number: Joi.string().trim().required().messages({ 'any.required': 'Serial number is required' }),
  current_base_id: Joi.string().uuid().required().messages({ 'any.required': 'Base is required', 'string.guid': 'Invalid base ID' }),
  purchase_date: Joi.date().allow(null),
  purchase_value: Joi.number().min(0).allow(null).messages({ 'number.min': 'Purchase value cannot be negative' }),
  description: Joi.string().trim().allow('', null),
  status: Joi.string().valid('ACTIVE', 'IN_STORAGE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE', 'RETIRED').default('IN_STORAGE'),
});

const updateAssetSchema = Joi.object({
  name: Joi.string().trim(),
  category: Joi.string().trim().allow('', null),
  asset_type: Joi.string().trim(),
  status: Joi.string().valid('ACTIVE', 'IN_STORAGE', 'MAINTENANCE', 'RETIRED'),
  current_base_id: Joi.string().uuid().messages({ 'string.guid': 'Invalid base ID' }),
  purchase_date: Joi.date().allow(null),
  purchase_value: Joi.number().min(0).allow(null),
  description: Joi.string().trim().allow('', null),
}).min(1).messages({ 'object.min': 'At least one field is required to update' });

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  status: Joi.string().valid('ACTIVE', 'IN_STORAGE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE', 'RETIRED'),
  category: Joi.string().trim(),
  asset_type: Joi.string().trim(),
  base_id: Joi.string().uuid(),
  start_date: Joi.date(),
  end_date: Joi.date(),
});

module.exports = { createAssetSchema, updateAssetSchema, querySchema };
