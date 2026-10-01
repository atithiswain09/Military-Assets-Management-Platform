const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize, scopeToBase } = require('../middleware/role.middleware');

router.use(authenticate);

// GET /api/v1/users
router.get('/', authorize('ADMIN', 'BASE_COMMANDER'), scopeToBase, userController.getUsers);

// POST /api/v1/users (Admin only)
router.post('/', authorize('ADMIN'), userController.createUser);

// GET /api/v1/users/:id
router.get('/:id', authorize('ADMIN', 'BASE_COMMANDER'), userController.getUserById);

// PUT /api/v1/users/:id (Admin only)
router.put('/:id', authorize('ADMIN'), userController.updateUser);

// PATCH /api/v1/users/:id/status (Admin only)
router.patch('/:id/status', authorize('ADMIN'), userController.updateUserStatus);

// DELETE /api/v1/users/:id (Admin only)
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);

module.exports = router;
