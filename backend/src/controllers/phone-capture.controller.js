const jwt = require('jsonwebtoken');
const { uploadFile, generateKey } = require('../utils/storageHelper');
const { successResponse, errorResponse } = require('../utils/response');
const db = require('../config/database');

/**
 * Generate QR code token for phone camera capture
 * POST /api/phone-capture/generate-qr
 */
const generateQRToken = async (req, res, next) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return errorResponse(res, 'Session ID is required', 400);
    }

    // Verify session belongs to this faculty
    const [sessions] = await db.query(
      'SELECT session_id, faculty_id, status FROM sessions WHERE session_id = ?',
      [session_id]
    );

    if (sessions.length === 0) {
      return errorResponse(res, 'Session not found', 404);
    }

    if (sessions[0].faculty_id !== req.user.id) {
      return errorResponse(res, 'You can only generate QR for your own sessions', 403);
    }

    if (sessions[0].status !== 'active') {
      return errorResponse(res, 'Session must be active to capture attendance', 400);
    }

    // Create temporary token (expires in 10 minutes)
    const tempToken = jwt.sign(
      {
        session_id,
        faculty_id: req.user.id,
        type: 'phone_capture',
        timestamp: Date.now()
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Generate QR URL (will open phone capture page)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/capture/${tempToken}`;

    console.log(`QR token generated for session ${session_id}, expires in 10 minutes`);

    return successResponse(res, {
      qr_url: qrUrl,
      temp_token: tempToken,
      expires_in: 600 // seconds
    }, 'QR token generated successfully');

  } catch (error) {
    console.error('Generate QR token error:', error);
    next(error);
  }
};

/**
 * Upload image from phone (no auth required, uses temp token)
 * POST /api/phone-capture/upload/:token
 */
const uploadFromPhone = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!req.file) {
      return errorResponse(res, 'No image uploaded', 400);
    }

    // Verify temporary token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, 'QR code expired. Please generate a new one.', 401);
      }
      return errorResponse(res, 'Invalid QR code', 401);
    }

    if (decoded.type !== 'phone_capture') {
      return errorResponse(res, 'Invalid token type', 403);
    }

    console.log(`Image upload from phone for session ${decoded.session_id}`);

    // Store image temporarily
    const imageKey = generateKey(`phone_capture_${decoded.session_id}_${Date.now()}.jpg`, 'temp');
    const imageUrl = await uploadFile(req.file.buffer, imageKey, req.file.mimetype);

    // Store reference in a temporary table or in-memory cache
    // For simplicity, we'll emit via WebSocket and let frontend handle it
    const imageData = {
      session_id: decoded.session_id,
      faculty_id: decoded.faculty_id,
      image_url: imageUrl,
      timestamp: Date.now(),
      file_size: req.file.size,
      uploaded_from: 'phone'
    };

    // Emit to WebSocket room (if socket is available on req)
    if (global.io) {
      global.io.to(`session-${decoded.session_id}`).emit('image-received', imageData);
      console.log(`Image broadcast to session room: session-${decoded.session_id}`);
    }

    return successResponse(res, {
      image_url: imageUrl,
      session_id: decoded.session_id,
      uploaded: true
    }, 'Image uploaded successfully');

  } catch (error) {
    console.error('Phone upload error:', error);
    next(error);
  }
};

/**
 * Verify token validity (for phone page to check before showing camera)
 * GET /api/phone-capture/verify/:token
 */
const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, 'QR code expired', 401);
      }
      return errorResponse(res, 'Invalid QR code', 401);
    }

    if (decoded.type !== 'phone_capture') {
      return errorResponse(res, 'Invalid token type', 403);
    }

    // Calculate remaining time
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    const remainingTime = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

    return successResponse(res, {
      valid: true,
      session_id: decoded.session_id,
      remaining_seconds: remainingTime
    }, 'Token is valid');

  } catch (error) {
    console.error('Token verification error:', error);
    next(error);
  }
};

module.exports = {
  generateQRToken,
  uploadFromPhone,
  verifyToken
};
