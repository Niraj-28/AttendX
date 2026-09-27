const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const { authenticateToken, isFaculty } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects for logged-in faculty
 * @access  Faculty only
 */
router.get(
  '/',
  authenticateToken,
  isFaculty,
  subjectController.getSubjects
);

/**
 * @route   GET /api/subjects/:id
 * @desc    Get subject by ID
 * @access  Faculty only
 */
router.get(
  '/:id',
  authenticateToken,
  isFaculty,
  subjectController.getSubjectById
);

module.exports = router;
