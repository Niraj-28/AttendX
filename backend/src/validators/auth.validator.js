const { body } = require('express-validator');

// Login validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('role')
    .isIn(['faculty', 'student'])
    .withMessage('Role must be either faculty or student')
];

module.exports = {
  loginValidation
};
