const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticateToken, isFaculty, isStudent } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const validate = require('../middleware/validation.middleware');
const { sessionIdValidation } = require('../validators/session.validator');

/**
 * @route   POST /api/attendance/capture
 * @desc    Process captured image and mark attendance
 * @access  Faculty only (or ESP32-CAM with API key)
 */
router.post(
  '/capture',
  authenticateToken,
  isFaculty,
  upload.single('image'),
  attendanceController.captureAndMarkAttendance
);

/**
 * @route   GET /api/attendance
 * @desc    Get attendance records with filters
 * @access  Faculty only
 */
router.get(
  '/',
  authenticateToken,
  isFaculty,
  attendanceController.getAttendance
);

/**
 * @route   GET /api/attendance/session/:sessionId
 * @desc    Get attendance for a specific session
 * @access  Faculty only
 */
router.get(
  '/session/:sessionId',
  authenticateToken,
  isFaculty,
  sessionIdValidation,
  validate,
  attendanceController.getAttendanceBySession
);

/**
 * @route   GET /api/attendance/student/:studentId
 * @desc    Get attendance for a specific student
 * @access  Faculty or Student (own records only)
 */
router.get(
  '/student/:studentId',
  authenticateToken,
  attendanceController.getAttendanceByStudent
);

/**
 * @route   GET /api/attendance/report
 * @desc    Generate attendance report
 * @access  Faculty only
 */
router.get(
  '/report',
  authenticateToken,
  isFaculty,
  attendanceController.generateReport
);

/**
 * @route   PUT /api/attendance/:id
 * @desc    Manually update attendance record
 * @access  Faculty only
 */
router.put(
  '/:id',
  authenticateToken,
  isFaculty,
  attendanceController.updateAttendance
);

/**
 * @route   GET /api/attendance/stats/summary
 * @desc    Get attendance statistics summary
 * @access  Faculty only
 */
router.get(
  '/stats/summary',
  authenticateToken,
  isFaculty,
  attendanceController.getAttendanceSummary
);

module.exports = router;
