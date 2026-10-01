const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, scopeToBase } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createAssignmentSchema, updateAssignmentSchema, querySchema } = require('../validators/assignment.validator');

router.use(authenticate);

// GET /api/v1/assignments
router.get('/', scopeToBase, validate(querySchema, 'query'), assignmentController.getAssignments);

// POST /api/v1/assignments
router.post('/', authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), validate(createAssignmentSchema), assignmentController.createAssignment);

// GET /api/v1/assignments/:id
router.get('/:id', scopeToBase, assignmentController.getAssignmentById);

// PUT /api/v1/assignments/:id
router.put('/:id', authorize('ADMIN', 'BASE_COMMANDER'), scopeToBase, validate(updateAssignmentSchema), assignmentController.updateAssignment);

// PATCH /api/v1/assignments/:id/return
router.patch('/:id/return', authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), scopeToBase, assignmentController.returnAssignment);

module.exports = router;
