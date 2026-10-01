const Joi = require('joi');

const createExpenseSchema = Joi.object({
  asset_id: Joi.string().uuid().required().messages({
    'any.required': 'Asset is required',
    'string.guid': 'Invalid asset ID',
  }),
  base_id: Joi.string().uuid().required().messages({
    'any.required': 'Base is required',
    'string.guid': 'Invalid base ID',
  }),
  expense_type: Joi.string().trim().required().messages({ 'any.required': 'Expense type is required' }),
  description: Joi.string().trim().allow('', null),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be greater than 0',
    'any.required': 'Amount is required',
  }),
  expense_date: Joi.date().required().messages({ 'any.required': 'Expense date is required' }),
});

const updateExpenseSchema = Joi.object({
  expense_type: Joi.string().trim(),
  description: Joi.string().trim().allow('', null),
  amount: Joi.number().positive(),
  expense_date: Joi.date(),
  status: Joi.string().valid('RECORDED', 'APPROVED', 'CANCELLED'),
}).min(1);

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow(''),
  asset_id: Joi.string().uuid(),
  base_id: Joi.string().uuid(),
  expense_type: Joi.string().trim(),
  status: Joi.string().valid('RECORDED', 'APPROVED', 'CANCELLED'),
  start_date: Joi.date(),
  end_date: Joi.date(),
});

module.exports = { createExpenseSchema, updateExpenseSchema, querySchema };
