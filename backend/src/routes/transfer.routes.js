const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfer.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, scopeToBase } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createTransferSchema, querySchema } = require('../validators/transfer.validator');

router.use(authenticate);

// GET /api/v1/transfers
router.get('/', scopeToBase, validate(querySchema, 'query'), transferController.getTransfers);

// POST /api/v1/transfers
router.post('/', authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), validate(createTransferSchema), transferController.createTransfer);

// GET /api/v1/transfers/:id
router.get('/:id', scopeToBase, transferController.getTransferById);

// PATCH /api/v1/transfers/:id/approve (Admin & Base Commander)
router.patch('/:id/approve', authorize('ADMIN', 'BASE_COMMANDER'), transferController.approveTransfer);

// PATCH /api/v1/transfers/:id/complete (Admin & Base Commander & Logistics Officer)
router.patch('/:id/complete', authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), transferController.completeTransfer);

// PATCH /api/v1/transfers/:id/cancel (Admin & Base Commander)
router.patch('/:id/cancel', authorize('ADMIN', 'BASE_COMMANDER'), transferController.cancelTransfer);

module.exports = router;
