const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { loginValidation } = require('../validators/auth.validator');
const validate = require('../middleware/validation.middleware');
const rateLimiter = require('../middleware/rateLimiter.middleware');

/**
 * @route   POST /api/auth/login
 * @desc    Login for faculty or student
 * @access  Public
 */
router.post('/login', 
  // rateLimiter({ max: 5, windowMs: 15 * 60 * 1000 }), // Temporarily disabled for testing
  loginValidation, 
  validate, 
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current user
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
