const db = require('../config/database');

/**
 * Session Model
 * Handles database operations for attendance sessions
 */

class Session {
  /**
   * Find session by ID
   * @param {number} id - Session ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const [sessions] = await db.query(
      `SELECT 
        s.*,
        f.name as faculty_name,
        f.email as faculty_email,
        sub.subject_name,
        sub.subject_code
      FROM sessions s
      LEFT JOIN faculty f ON s.faculty_id = f.faculty_id
      LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
      WHERE s.session_id = ?`,
      [id]
    );
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Get active session for a class
   * @param {string} className - Class name
   * @returns {Promise<Object|null>}
   */
  static async getActiveByClass(className) {
    const [sessions] = await db.query(
      `SELECT * FROM sessions 
      WHERE class = ? AND status = 'active' 
      ORDER BY start_time DESC 
      LIMIT 1`,
      [className]
    );
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Get all active sessions
   * @returns {Promise<Array>}
   */
  static async getAllActive() {
    const [sessions] = await db.query(
      `SELECT 
        s.*,
        f.name as faculty_name,
        sub.subject_name
      FROM sessions s
      LEFT JOIN faculty f ON s.faculty_id = f.faculty_id
      LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
      WHERE s.status = 'active'
      ORDER BY s.start_time DESC`
    );
    return sessions;
  }

  /**
   * Get sessions by faculty
   * @param {number} facultyId - Faculty ID
   * @param {number} limit - Number of sessions to return
   * @returns {Promise<Array>}
   */
  static async getByFaculty(facultyId, limit = 10) {
    const [sessions] = await db.query(
      `SELECT 
        s.*,
        sub.subject_name,
        sub.subject_code
      FROM sessions s
      LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
      WHERE s.faculty_id = ?
      ORDER BY s.session_date DESC, s.start_time DESC
      LIMIT ?`,
      [facultyId, limit]
    );
    return sessions;
  }

  /**
   * Get session statistics
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object>}
   */
  static async getStatistics(sessionId) {
    const [stats] = await db.query(
      `SELECT 
        s.total_students,
        s.present_count,
        s.absent_count,
        COUNT(a.attendance_id) as recorded_count,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_verified,
        SUM(CASE WHEN a.face_detected = TRUE THEN 1 ELSE 0 END) as face_detected_count
      FROM sessions s
      LEFT JOIN attendance a ON s.session_id = a.session_id
      WHERE s.session_id = ?
      GROUP BY s.session_id`,
      [sessionId]
    );
    return stats[0] || null;
  }

  /**
   * Update session statistics
   * @param {number} sessionId - Session ID
   * @returns {Promise<void>}
   */
  static async updateStatistics(sessionId) {
    await db.query(
      `UPDATE sessions s
      SET 
        s.present_count = (
          SELECT COUNT(*) FROM attendance 
          WHERE session_id = ? AND status = 'present'
        ),
        s.absent_count = (
          SELECT COUNT(*) FROM attendance 
          WHERE session_id = ? AND status = 'absent'
        ),
        s.updated_at = NOW()
      WHERE s.session_id = ?`,
      [sessionId, sessionId, sessionId]
    );
  }

  /**
   * Check if faculty can start session
   * @param {number} facultyId - Faculty ID
   * @returns {Promise<boolean>}
   */
  static async canStartSession(facultyId) {
    const [active] = await db.query(
      'SELECT COUNT(*) as count FROM sessions WHERE faculty_id = ? AND status = "active"',
      [facultyId]
    );
    return active[0].count === 0;
  }

  /**
   * Get recent sessions with stats
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>}
   */
  static async getRecent(filters = {}) {
    const { facultyId, className, stream, semester, startDate, endDate, limit = 20 } = filters;
    
    let query = `
      SELECT 
        s.*,
        f.name as faculty_name,
        sub.subject_name,
        sub.subject_code
      FROM sessions s
      LEFT JOIN faculty f ON s.faculty_id = f.faculty_id
      LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
      WHERE 1=1
    `;
    const params = [];

    if (facultyId) {
      query += ' AND s.faculty_id = ?';
      params.push(facultyId);
    }

    if (stream) {
      query += ' AND s.stream = ?';
      params.push(stream);
    }

    if (semester) {
      query += ' AND s.semester = ?';
      params.push(parseInt(semester));
    }

    if (className) {
      query += ' AND s.class = ?';
      params.push(className);
    }

    if (startDate) {
      query += ' AND s.session_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND s.session_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY s.session_date DESC, s.start_time DESC LIMIT ?';
    params.push(limit);

    const [sessions] = await db.query(query, params);
    return sessions;
  }
}

module.exports = Session;
