const { body, param } = require('express-validator');

// Create student validation
const createStudentValidation = [
  body('roll_no')
    .notEmpty()
    .withMessage('Roll number is required')
    .isLength({ max: 50 })
    .withMessage('Roll number must be at most 50 characters'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('class')
    .notEmpty()
    .withMessage('Class is required'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
  body('semester')
    .isInt({ min: 1, max: 10 })
    .withMessage('Semester must be between 1 and 10')
];

// Update student validation
const updateStudentValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid student ID'),
  body('roll_no')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Roll number must be at most 50 characters'),
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('class')
    .optional()
    .notEmpty()
    .withMessage('Class cannot be empty'),
  body('department')
    .optional()
    .notEmpty()
    .withMessage('Department cannot be empty'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Semester must be between 1 and 10')
];

// Student ID param validation
const studentIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid student ID')
];

module.exports = {
  createStudentValidation,
  updateStudentValidation,
  studentIdValidation
};
