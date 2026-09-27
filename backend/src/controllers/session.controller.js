const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const Student = require('../models/Student.model');
const Session = require('../models/Session.model');

/**
 * Start new attendance session with immediate face recognition
 * POST /api/sessions/start
 */
const startSession = async (req, res, next) => {
  let tempFilePath = null;
  const connection = await db.getConnection();
  
  try {
    console.log('=== START SESSION REQUEST ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file ? { 
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'NO FILE');
    
    const { subject_id, class: className, stream, semester, session_type, session_date, start_time, end_time } = req.body;
    const facultyId = req.user.id;

    console.log('Extracted fields:', {
      subject_id,
      className,
      stream,
      semester,
      session_type,
      session_date,
      start_time,
      end_time,
      facultyId
    });

    // Validate required fields
    if (!subject_id || !className || !stream || !semester || !session_type || !session_date || !start_time || !end_time) {
      console.log('Validation failed: Missing required fields');
      return errorResponse(res, 'All session fields are required', 400);
    }

    if (!req.file) {
      console.log('Validation failed: No image file');
      return errorResponse(res, 'Classroom image is required', 400);
    }

    // Validate time format and logic
    if (start_time >= end_time) {
      return errorResponse(res, 'Session end time must be after start time', 400);
    }

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

    // Count total students
    // If className is 'ALL', count all students in the stream and semester (for lectures)
    // Otherwise, count students in specific class (for lab/tutorial)
    let studentCountQuery, studentCountParams;
    
    if (className === 'ALL') {
      studentCountQuery = 'SELECT COUNT(*) as count FROM students WHERE stream = ? AND semester = ? AND is_active = TRUE';
      studentCountParams = [stream, semester];
    } else {
      studentCountQuery = 'SELECT COUNT(*) as count FROM students WHERE class = ? AND stream = ? AND semester = ? AND is_active = TRUE';
      studentCountParams = [className, stream, semester];
    }
    
    const [studentCounts] = await connection.query(studentCountQuery, studentCountParams);
    const totalStudents = studentCounts[0].count;

    if (totalStudents === 0) {
      await connection.rollback();
      const classInfo = className === 'ALL' ? 'all classes' : `class ${className}`;
      return errorResponse(res, `No students found in ${classInfo}, stream ${stream}, semester ${semester}`, 400);
    }

    // Combine session_date and start_time for start_time datetime field
    const startDateTime = `${session_date} ${start_time}`;
    const endDateTime = `${session_date} ${end_time}`;

    // Create session
    const [result] = await connection.query(
      `INSERT INTO sessions 
        (faculty_id, subject_id, class, stream, semester, session_type, session_date, start_time, end_time, status, total_students) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [facultyId, subject_id, className, stream, semester, session_type, session_date, startDateTime, endDateTime, totalStudents]
    );

    const sessionId = result.insertId;

    // Create attendance records for all students
    // If className is 'ALL', get all students in stream and semester (for lectures)
    // Otherwise, get students in specific class (for lab/tutorial)
    let studentQuery, studentParams;
    
    if (className === 'ALL') {
      studentQuery = 'SELECT student_id FROM students WHERE stream = ? AND semester = ? AND is_active = TRUE';
      studentParams = [stream, semester];
    } else {
      studentQuery = 'SELECT student_id FROM students WHERE class = ? AND stream = ? AND semester = ? AND is_active = TRUE';
      studentParams = [className, stream, semester];
    }
    
    const [students] = await connection.query(studentQuery, studentParams);

    if (students.length > 0) {
      const attendanceValues = students.map(s => [sessionId, s.student_id, 'absent']);
      await connection.query(
        'INSERT INTO attendance (session_id, student_id, status) VALUES ?',
        [attendanceValues]
      );
    }

    // === Face Recognition Processing ===
    console.log('Processing attendance image for session:', sessionId);

    // Save image temporarily for face detection
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    tempFilePath = path.join(os.tmpdir(), `session_${sessionId}_${Date.now()}.jpg`);
    await fs.writeFile(tempFilePath, req.file.buffer);

    // Detect faces in the captured image (multi-face mode for attendance)
    const { detectFaces } = require('../utils/faceRecognition');
    const faceResult = await detectFaces(tempFilePath, false); // false = multi-face mode

    if (!faceResult.success || faceResult.face_count === 0) {
      await connection.rollback();
      if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
      return errorResponse(res, faceResult.error || 'No faces detected in the image. Please ensure students are clearly visible.', 400);
    }

    console.log(`Detected ${faceResult.face_count} faces`);

    // Upload image using unified storage (local or S3)
    const { uploadFile, generateKey } = require('../utils/storageHelper');
    const imageKey = generateKey(`session_${sessionId}_${Date.now()}.jpg`, 'attendance');
    const imageUrl = await uploadFile(req.file.buffer, imageKey, req.file.mimetype);

    // Update session with captured image URL
    await connection.query(
      'UPDATE sessions SET captured_image_url = ? WHERE session_id = ?',
      [imageUrl, sessionId]
    );

    // Get all students in the class with face embeddings
    const Student = require('../models/Student.model');
    // Pass null for className if it's 'ALL' to get all students in the stream/semester
    const classFilter = className === 'ALL' ? null : className;
    const studentsWithEmbeddings = await Student.getAllWithEmbeddings(classFilter, stream, semester);

    if (studentsWithEmbeddings.length === 0) {
      console.log('Warning: No students with face embeddings found');
      // Continue anyway - session is created, just no automatic attendance marking
    } else {
      console.log(`Matching against ${studentsWithEmbeddings.length} enrolled students`);

      // Match each detected face against known students
      const matchedStudents = [];
      const matchedStudentIds = new Set();
      const detectedEncodings = faceResult.face_encodings;

      for (let i = 0; i < detectedEncodings.length; i++) {
        const unknownEncoding = detectedEncodings[i];
        const knownEncodings = studentsWithEmbeddings.map(s => s.face_embedding);

        const { matchFaces } = require('../utils/faceRecognition');
        const matchResult = await matchFaces(unknownEncoding, knownEncodings, 0.5);

        let bestMatch = null;
        let bestConfidence = 0;

        if (matchResult.success && matchResult.all_similarities && matchResult.all_similarities.length > 0) {
          const sortedMatches = matchResult.all_similarities
            .map((similarity, index) => ({ similarity, index }))
            .sort((a, b) => b.similarity - a.similarity);

          const threshold = 0.5;
          for (const match of sortedMatches) {
            const student = studentsWithEmbeddings[match.index];
            if (match.similarity >= threshold && !matchedStudentIds.has(student.student_id)) {
              bestMatch = student;
              bestConfidence = match.similarity;
              break;
            }
          }
        }

        if (bestMatch && !matchedStudentIds.has(bestMatch.student_id)) {
          matchedStudentIds.add(bestMatch.student_id);
          matchedStudents.push({
            student_id: bestMatch.student_id,
            roll_no: bestMatch.roll_no,
            name: bestMatch.name,
            confidence: bestConfidence
          });

          // Mark attendance as present
          await connection.query(
            `UPDATE attendance 
            SET status = 'present', 
                marked_at = NOW(), 
                confidence_score = ?, 
                face_detected = TRUE,
                updated_at = NOW()
            WHERE session_id = ? AND student_id = ?`,
            [bestConfidence, sessionId, bestMatch.student_id]
          );

          console.log(`Marked ${bestMatch.name} (${bestMatch.roll_no}) as present`);
        }
      }

      console.log(`Total students marked present: ${matchedStudents.length}`);
    }

    // Update session statistics
    await connection.query(
      `UPDATE sessions s
      SET 
        s.present_count = (SELECT COUNT(*) FROM attendance WHERE session_id = ? AND status = 'present'),
        s.absent_count = (SELECT COUNT(*) FROM attendance WHERE session_id = ? AND status = 'absent'),
        s.updated_at = NOW()
      WHERE s.session_id = ?`,
      [sessionId, sessionId, sessionId]
    );

    await connection.commit();

    // Clean up temp file
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [facultyId, 'faculty', 'START_SESSION', 'sessions', sessionId, JSON.stringify({ 
        class: className, 
        stream, 
        semester, 
        subject_id,
        session_type,
        faces_detected: faceResult.face_count 
      })]
    );

    // Fetch created session with details
    const session = await Session.findById(sessionId);

    return successResponse(res, {
      session_id: sessionId,
      class: className,
      stream: stream,
      semester: semester,
      subject_id: subject_id,
      session_type: session_type,
      session_date: session_date,
      start_time: start_time,
      end_time: end_time,
      total_students: totalStudents,
      present_count: session.present_count,
      absent_count: session.absent_count,
      faces_detected: faceResult.face_count,
      image_url: imageUrl,
      status: 'active',
      subject_name: session.subject_name,
      faculty_name: session.faculty_name
    }, 'Session started and attendance captured successfully', 201);

  } catch (error) {
    await connection.rollback();
    
    // Clean up temp file on error
    if (tempFilePath) {
      const fs = require('fs').promises;
      await fs.unlink(tempFilePath).catch(() => {});
    }
    
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
