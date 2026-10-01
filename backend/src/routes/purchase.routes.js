const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, scopeToBase } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createPurchaseSchema, updatePurchaseSchema, querySchema } = require('../validators/purchase.validator');

router.use(authenticate);

// GET /api/v1/purchases
router.get('/', scopeToBase, validate(querySchema, 'query'), purchaseController.getPurchases);

// POST /api/v1/purchases (Admin, Base Commander, Logistics Officer)
router.post('/', authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), scopeToBase, validate(createPurchaseSchema), purchaseController.createPurchase);

// GET /api/v1/purchases/:id
router.get('/:id', scopeToBase, purchaseController.getPurchaseById);

// PUT /api/v1/purchases/:id
router.put('/:id', authorize('ADMIN', 'BASE_COMMANDER'), scopeToBase, validate(updatePurchaseSchema), purchaseController.updatePurchase);

// DELETE /api/v1/purchases/:id (Admin only)
router.delete('/:id', authorize('ADMIN'), scopeToBase, purchaseController.deletePurchase);

module.exports = router;
