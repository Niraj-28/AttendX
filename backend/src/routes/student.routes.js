const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticateToken, isFaculty } = require('../middleware/auth.middleware');
const { 
  createStudentValidation, 
  updateStudentValidation, 
  studentIdValidation 
} = require('../validators/student.validator');
const validate = require('../middleware/validation.middleware');
const upload = require('../middleware/upload.middleware');

// All student routes require authentication and faculty role
router.use(authenticateToken, isFaculty);

/**
 * @route   GET /api/students
 * @desc    Get all students with optional filters
 * @access  Faculty only
 * @query   class, department, semester, search
 */
router.get('/', studentController.getAllStudents);

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Faculty only
 */
router.get('/:id', studentIdValidation, validate, studentController.getStudentById);

/**
 * @route   POST /api/students
 * @desc    Create new student
 * @access  Faculty only
 */
router.post('/', upload.single('photo'), studentController.createStudent);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student
 * @access  Faculty only
 */
router.put('/:id', upload.single('photo'), studentController.updateStudent);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student
 * @access  Faculty only
 */
router.delete('/:id', studentIdValidation, validate, studentController.deleteStudent);

/**
 * @route   POST /api/students/:id/photo
 * @desc    Upload student photo (with face detection)
 * @access  Faculty only
 */
router.post(
  '/:id/photo',
  studentIdValidation,
  validate,
  upload.single('photo'),
  studentController.uploadPhoto
);

/**
 * @route   GET /api/students/class/:className
 * @desc    Get all students in a specific class
 * @access  Faculty only
 */
router.get('/class/:className', studentController.getStudentsByClass);

module.exports = router;
