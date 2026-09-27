const { body, param } = require('express-validator');

// Start session validation
const startSessionValidation = [
  body('subject_id')
    .isInt()
    .withMessage('Subject ID must be a valid integer'),
  body('class')
    .notEmpty()
    .withMessage('Class is required')
    .isLength({ max: 50 })
    .withMessage('Class name must be at most 50 characters')
];

// Session ID validation
const sessionIdValidation = [
  param('id')
    .isInt()
    .withMessage('Invalid session ID')
];

module.exports = {
  startSessionValidation,
  sessionIdValidation
};
