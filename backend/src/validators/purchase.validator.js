const Joi = require('joi');

const createPurchaseSchema = Joi.object({
  asset_code: Joi.string().trim().allow('', null),
  asset_name: Joi.string().trim().allow('', null),
  asset_type: Joi.string().trim().allow('', null),
  serial_number: Joi.string().trim().allow('', null),
  asset_category: Joi.string().trim().allow('', null),
  asset_description: Joi.string().trim().allow('', null),
  asset_id: Joi.string().uuid().allow(null),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
  vendor: Joi.string().trim().required().messages({ 'any.required': 'Vendor is required' }),
  purchase_date: Joi.date().required().messages({ 'any.required': 'Purchase date is required' }),
  unit_price: Joi.number().min(0).required().messages({
    'number.min': 'Unit price cannot be negative',
    'any.required': 'Unit price is required',
  }),
  base_id: Joi.string().uuid().required().messages({
    'any.required': 'Base is required',
    'string.guid': 'Invalid base ID',
  }),
  reference_number: Joi.string().trim().allow('', null),
  notes: Joi.string().trim().allow('', null),
});

const updatePurchaseSchema = Joi.object({
  quantity: Joi.number().integer().min(1),
  vendor: Joi.string().trim(),
  purchase_date: Joi.date(),
  unit_price: Joi.number().min(0),
  base_id: Joi.string().uuid(),
  reference_number: Joi.string().trim().allow('', null),
  notes: Joi.string().trim().allow('', null),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'CANCELLED'),
}).min(1);

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'CANCELLED'),
  vendor: Joi.string().trim(),
  base_id: Joi.string().uuid(),
  start_date: Joi.date(),
  end_date: Joi.date(),
});

module.exports = { createPurchaseSchema, updatePurchaseSchema, querySchema };
