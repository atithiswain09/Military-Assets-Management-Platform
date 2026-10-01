const Joi = require('joi');

const createTransferSchema = Joi.object({
  asset_id: Joi.string().uuid().required().messages({
    'any.required': 'Asset is required',
    'string.guid': 'Invalid asset ID',
  }),
  source_base_id: Joi.string().uuid().required().messages({
    'any.required': 'Source base is required',
    'string.guid': 'Invalid source base ID',
  }),
  destination_base_id: Joi.string().uuid().required().messages({
    'any.required': 'Destination base is required',
    'string.guid': 'Invalid destination base ID',
  }),
  reason: Joi.string().trim().required().messages({ 'any.required': 'Reason is required' }),
  transfer_date: Joi.date().allow(null),
}).custom((value, helpers) => {
  if (value.source_base_id === value.destination_base_id) {
    return helpers.error('any.invalid', { message: 'Source and destination bases cannot be the same' });
  }
  return value;
}).messages({ 'any.invalid': 'Source and destination bases cannot be the same' });

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  status: Joi.string().valid('PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'),
  asset_id: Joi.string().uuid(),
  source_base_id: Joi.string().uuid(),
  destination_base_id: Joi.string().uuid(),
});

module.exports = { createTransferSchema, querySchema };
