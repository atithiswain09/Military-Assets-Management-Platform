const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, scopeToBase } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createAssetSchema, updateAssetSchema, querySchema } = require('../validators/asset.validator');

// All routes require authentication
router.use(authenticate);

// GET /api/v1/assets
router.get('/', scopeToBase, validate(querySchema, 'query'), assetController.getAssets);

// POST /api/v1/assets (Admin & Base Commander)
router.post('/', authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), validate(createAssetSchema), assetController.createAsset);

// GET /api/v1/assets/:id
router.get('/:id', scopeToBase, assetController.getAssetById);

// PUT /api/v1/assets/:id (Admin & Base Commander)
router.put('/:id', authorize('ADMIN', 'BASE_COMMANDER'), scopeToBase, validate(updateAssetSchema), assetController.updateAsset);

// DELETE /api/v1/assets/:id (Admin only)
router.delete('/:id', authorize('ADMIN'), scopeToBase, assetController.deleteAsset);

// Sub-resource routes
router.get('/:id/history', scopeToBase, assetController.getAssetHistory);
router.get('/:id/assignments', scopeToBase, assetController.getAssetAssignments);
router.get('/:id/transfers', scopeToBase, assetController.getAssetTransfers);
router.get('/:id/expenses', scopeToBase, assetController.getAssetExpenses);

module.exports = router;
