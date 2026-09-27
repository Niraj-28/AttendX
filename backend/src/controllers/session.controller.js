const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const Student = require('../models/Student.model');
const Session = require('../models/Session.model');

/**
 * Start new attendance session
 * POST /api/sessions/start
 */
const startSession = async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    const { subject_id, class: className, stream, semester } = req.body;
    const facultyId = req.user.id;

    await connection.beginTransaction();

    // Check if faculty already has an active session
    const canStart = await Session.canStartSession(facultyId);
    if (!canStart) {
      await connection.rollback();
      return errorResponse(res, 'You already have an active session. Please stop it before starting a new one.', 400);
    }

    // Check if subject exists and belongs to this faculty
    const [subjects] = await connection.query(
      'SELECT subject_id FROM subjects WHERE subject_id = ? AND faculty_id = ?',
      [subject_id, facultyId]
    );

    if (subjects.length === 0) {
      await connection.rollback();
      return errorResponse(res, 'Subject not found or does not belong to you', 404);
    }

    // Count total students in the class, stream, and semester
    const [studentCounts] = await connection.query(
      'SELECT COUNT(*) as count FROM students WHERE class = ? AND stream = ? AND semester = ? AND is_active = TRUE',
      [className, stream, semester]
    );

    const totalStudents = studentCounts[0].count;

    if (totalStudents === 0) {
      await connection.rollback();
      return errorResponse(res, `No students found in class ${className}, stream ${stream}, semester ${semester}`, 400);
    }

    // Create session
    const [result] = await connection.query(
      `INSERT INTO sessions 
        (faculty_id, subject_id, class, stream, semester, session_date, start_time, status, total_students) 
      VALUES (?, ?, ?, ?, ?, CURDATE(), NOW(), 'active', ?)`,
      [facultyId, subject_id, className, stream, semester, totalStudents]
    );

    const sessionId = result.insertId;

    // Create attendance records for all students in the class, stream, and semester (default: absent)
    const [students] = await connection.query(
      'SELECT student_id FROM students WHERE class = ? AND stream = ? AND semester = ? AND is_active = TRUE',
      [className, stream, semester]
    );

    if (students.length > 0) {
      const attendanceValues = students.map(s => [sessionId, s.student_id, 'absent']);
      await connection.query(
        'INSERT INTO attendance (session_id, student_id, status) VALUES ?',
        [attendanceValues]
      );
    }

    await connection.commit();

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [facultyId, 'faculty', 'START_SESSION', 'sessions', sessionId, JSON.stringify({ class: className, stream, semester, subject_id })]
    );

    // Fetch created session with details
    const session = await Session.findById(sessionId);

    return successResponse(res, {
      session_id: sessionId,
      class: className,
      stream: stream,
      semester: semester,
      subject_id: subject_id,
      total_students: totalStudents,
      start_time: session.start_time,
      status: 'active',
      subject_name: session.subject_name,
      faculty_name: session.faculty_name
    }, 'Session started successfully', 201);

  } catch (error) {
    await connection.rollback();
    console.error('Start session error:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Stop active session
 * POST /api/sessions/:id/stop
 */
const stopSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facultyId = req.user.id;

    // Check if session exists and belongs to this faculty
    const session = await Session.findById(id);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    if (session.faculty_id !== facultyId) {
      return errorResponse(res, 'You can only stop your own sessions', 403);
    }

    if (session.status !== 'active') {
      return errorResponse(res, 'Session is not active', 400);
    }

    // Update session statistics
    await Session.updateStatistics(id);

    // Stop session
    await db.query(
      'UPDATE sessions SET status = ?, end_time = NOW(), updated_at = NOW() WHERE session_id = ?',
      ['completed', id]
    );

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [facultyId, 'faculty', 'STOP_SESSION', 'sessions', id, JSON.stringify({ session_id: id })]
    );

    // Get updated session
    const updatedSession = await Session.findById(id);

    return successResponse(res, {
      session_id: id,
      status: updatedSession.status,
      end_time: updatedSession.end_time,
      present_count: updatedSession.present_count,
      absent_count: updatedSession.absent_count,
      total_students: updatedSession.total_students,
      attendance_percentage: updatedSession.total_students > 0 
        ? ((updatedSession.present_count / updatedSession.total_students) * 100).toFixed(2)
        : 0
    }, 'Session stopped successfully');

  } catch (error) {
    console.error('Stop session error:', error);
    next(error);
  }
};

/**
 * Get all sessions with filters
 * GET /api/sessions
 */
const getAllSessions = async (req, res, next) => {
  try {
    const { class: className, stream, semester, start_date, end_date, status, limit } = req.query;
    const facultyId = req.user.id;

    const filters = {
      facultyId,
      className,
      stream,
      semester,
      startDate: start_date,
      endDate: end_date,
      limit: limit ? parseInt(limit) : 20
    };

    let sessions = await Session.getRecent(filters);

    // Filter by status if provided
    if (status) {
      sessions = sessions.filter(s => s.status === status);
    }

    return successResponse(res, sessions, 'Sessions retrieved successfully');

  } catch (error) {
    console.error('Get sessions error:', error);
    next(error);
  }
};

/**
 * Get session by ID with details
 * GET /api/sessions/:id
 */
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    // Get attendance statistics
    const stats = await Session.getStatistics(id);

    // Get attendance details
    const [attendance] = await db.query(
      `SELECT 
        a.attendance_id,
        a.status,
        a.marked_at,
        a.confidence_score,
        a.face_detected,
        s.student_id,
        s.roll_no,
        s.name,
        s.photo_url
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      WHERE a.session_id = ?
      ORDER BY s.roll_no`,
      [id]
    );

    return successResponse(res, {
      ...session,
      statistics: stats,
      attendance: attendance
    }, 'Session retrieved successfully');

  } catch (error) {
    console.error('Get session error:', error);
    next(error);
  }
};

/**
 * Get all active sessions
 * GET /api/sessions/status/active
 */
const getActiveSessions = async (req, res, next) => {
  try {
    const facultyId = req.user.id;
    
    // Get active sessions for this faculty only
    const [sessions] = await db.query(
      `SELECT 
        s.*,
        sub.subject_name,
        sub.subject_code,
        f.name as faculty_name
      FROM sessions s
      LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
      LEFT JOIN faculty f ON s.faculty_id = f.faculty_id
      WHERE s.faculty_id = ? AND s.status = 'active'
      ORDER BY s.session_date DESC, s.start_time DESC`,
      [facultyId]
    );
    
    return successResponse(res, sessions, 'Active sessions retrieved successfully');
  } catch (error) {
    console.error('Get active sessions error:', error);
    next(error);
  }
};

/**
 * Get sessions by faculty
 * GET /api/sessions/faculty/:facultyId
 */
const getSessionsByFaculty = async (req, res, next) => {
  try {
    const { facultyId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    // Ensure faculty can only view their own sessions
    if (parseInt(facultyId) !== req.user.id) {
      return errorResponse(res, 'You can only view your own sessions', 403);
    }

    const sessions = await Session.getByFaculty(facultyId, limit);
    return successResponse(res, sessions, 'Sessions retrieved successfully');

  } catch (error) {
    console.error('Get sessions by faculty error:', error);
    next(error);
  }
};

/**
 * Delete/Cancel session
 * DELETE /api/sessions/:id
 */
const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facultyId = req.user.id;

    // Check if session exists and belongs to this faculty
    const session = await Session.findById(id);

    if (!session) {
      return errorResponse(res, 'Session not found', 404);
    }

    if (session.faculty_id !== facultyId) {
      return errorResponse(res, 'You can only delete your own sessions', 403);
    }

    // Can only delete/cancel active or recent sessions
    if (session.status === 'completed') {
      const sessionDate = new Date(session.session_date);
      const daysSince = Math.floor((new Date() - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysSince > 7) {
        return errorResponse(res, 'Cannot delete sessions older than 7 days', 400);
      }
    }

    // Mark as cancelled instead of deleting (preserves audit trail)
    await db.query(
      'UPDATE sessions SET status = ?, updated_at = NOW() WHERE session_id = ?',
      ['cancelled', id]
    );

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [facultyId, 'faculty', 'CANCEL_SESSION', 'sessions', id, JSON.stringify({ session_id: id })]
    );

    return successResponse(res, null, 'Session cancelled successfully');

  } catch (error) {
    console.error('Delete session error:', error);
    next(error);
  }
};

module.exports = {
  startSession,
  stopSession,
  getAllSessions,
  getSessionById,
  getActiveSessions,
  getSessionsByFaculty,
  deleteSession
};
