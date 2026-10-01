const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { loginSchema } = require('../validators/auth.validator');

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/v1/auth/me (authenticated)
router.get('/me', authenticate, authController.getMe);

// POST /api/v1/auth/logout (authenticated)
router.post('/logout', authenticate, authController.logout);

// Settings & Security routes (authenticated)
router.get('/settings', authenticate, authController.getSettings);
router.put('/settings', authenticate, authController.updateSettings);
router.put('/change-password', authenticate, authController.changePassword);
router.post('/2fa/toggle', authenticate, authController.toggle2FA);
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:id', authenticate, authController.revokeSession);
router.get('/export-data', authenticate, authController.exportUserData);

module.exports = router;
