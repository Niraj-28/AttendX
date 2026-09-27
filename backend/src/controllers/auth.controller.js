const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Faculty/Student Login
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Determine which table to query based on role
    const table = role === 'faculty' ? 'faculty' : 'students';
    const idColumn = role === 'faculty' ? 'faculty_id' : 'student_id';

    // Find user by email
    const [users] = await db.query(
      `SELECT * FROM ${table} WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const user = users[0];

    // Check if student is active
    if (role === 'student' && !user.is_active) {
      return errorResponse(res, 'Account is inactive. Please contact administrator.', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user[idColumn],
        email: user.email,
        role: role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remove password from response
    delete user.password_hash;

    // Log successful login
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, details) VALUES (?, ?, ?, ?)',
      [user[idColumn], role, 'LOGIN', JSON.stringify({ email, timestamp: new Date() })]
    );

    return successResponse(res, {
      token,
      user: {
        id: user[idColumn],
        name: user.name,
        email: user.email,
        role: role,
        ...(role === 'faculty' ? { department: user.department } : { class: user.class, roll_no: user.roll_no })
      }
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Log logout action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, details) VALUES (?, ?, ?, ?)',
      [req.user.id, req.user.role, 'LOGOUT', JSON.stringify({ timestamp: new Date() })]
    );

    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    // Determine which table to query
    const table = role === 'faculty' ? 'faculty' : 'students';
    const idColumn = role === 'faculty' ? 'faculty_id' : 'student_id';

    // Fetch user details
    const [users] = await db.query(
      `SELECT * FROM ${table} WHERE ${idColumn} = ?`,
      [id]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = users[0];
    delete user.password_hash;

    return successResponse(res, {
      id: user[idColumn],
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: role,
      ...(role === 'faculty' ? {
        department: user.department,
        faculty_id: user.faculty_id
      } : {
        roll_no: user.roll_no,
        class: user.class,
        department: user.department,
        semester: user.semester,
        photo_url: user.photo_url,
        is_active: user.is_active
      })
    });

  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
};

/**
 * Change Password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters', 400);
    }

    // Determine table
    const table = role === 'faculty' ? 'faculty' : 'students';
    const idColumn = role === 'faculty' ? 'faculty_id' : 'student_id';

    // Get current password hash
    const [users] = await db.query(
      `SELECT password_hash FROM ${table} WHERE ${idColumn} = ?`,
      [id]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isPasswordValid) {
      return errorResponse(res, 'Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      `UPDATE ${table} SET password_hash = ?, updated_at = NOW() WHERE ${idColumn} = ?`,
      [newPasswordHash, id]
    );

    // Log password change
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, details) VALUES (?, ?, ?, ?)',
      [id, role, 'PASSWORD_CHANGE', JSON.stringify({ timestamp: new Date() })]
    );

    return successResponse(res, null, 'Password changed successfully');

  } catch (error) {
    console.error('Change password error:', error);
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getProfile,
  changePassword
};
