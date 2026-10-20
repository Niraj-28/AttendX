const express = require('express');
const router = express.Router();
const phoneCaptureController = require('../controllers/phone-capture.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Debug logging
console.log('phoneCaptureController:', Object.keys(phoneCaptureController));
console.log('authenticateToken type:', typeof authenticateToken);
console.log('upload type:', typeof upload);

/**
 * Generate QR code token for phone camera
 * Protected route - requires faculty authentication
 */
router.post('/generate-qr',
  authenticateToken,
  phoneCaptureController.generateQRToken
);

/**
 * Upload image from phone
 * Public route - uses temporary token in URL
 * No authentication required (token validates the request)
 */
router.post('/upload/:token',
  upload.single('image'),
  phoneCaptureController.uploadFromPhone
);

/**
 * Verify token validity
 * Public route - allows phone to check if QR is still valid
 */
router.get('/verify/:token',
  phoneCaptureController.verifyToken
);

module.exports = router;
