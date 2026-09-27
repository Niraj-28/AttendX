const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { authenticateToken, isFaculty } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { 
  startSessionValidation, 
  sessionIdValidation 
} = require('../validators/session.validator');
const validate = require('../middleware/validation.middleware');

// All session routes require authentication and faculty role
router.use(authenticateToken, isFaculty);

/**
 * @route   POST /api/sessions/start
 * @desc    Start a new attendance session with image upload
 * @access  Faculty only
 */
router.post('/start', upload.single('image'), startSessionValidation, validate, sessionController.startSession);

/**
 * @route   POST /api/sessions/:id/stop
 * @desc    Stop an active session
 * @access  Faculty only
 */
router.post('/:id/stop', sessionIdValidation, validate, sessionController.stopSession);

/**
 * @route   GET /api/sessions
 * @desc    Get all sessions (with optional filters)
 * @access  Faculty only
 */
router.get('/', sessionController.getAllSessions);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get session by ID with details
 * @access  Faculty only
 */
router.get('/:id', sessionIdValidation, validate, sessionController.getSessionById);

/**
 * @route   GET /api/sessions/active
 * @desc    Get all active sessions
 * @access  Faculty only
 */
router.get('/status/active', sessionController.getActiveSessions);

/**
 * @route   GET /api/sessions/faculty/:facultyId
 * @desc    Get sessions by faculty
 * @access  Faculty only
 */
router.get('/faculty/:facultyId', sessionController.getSessionsByFaculty);

/**
 * @route   DELETE /api/sessions/:id
 * @desc    Cancel/Delete a session
 * @access  Faculty only
 */
router.delete('/:id', sessionIdValidation, validate, sessionController.deleteSession);

module.exports = router;
