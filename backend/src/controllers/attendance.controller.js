const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { uploadFile, generateKey } = require('../utils/storageHelper');
const { detectFaces } = require('../utils/faceRecognition');
const { sendAttendanceNotification } = require('../utils/snsHelper');
const Student = require('../models/Student.model');
const Session = require('../models/Session.model');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Process captured image and mark attendance
 * POST /api/attendance/capture
 */
const captureAndMarkAttendance = async (req, res, next) => {
  let tempFilePath = null;
  const connection = await db.getConnection();

  try {
    const { session_id } = req.body;

    if (!req.file) {
      return errorResponse(res, 'No image uploaded', 400);
    }

    if (!session_id) {
      return errorResponse(res, 'Session ID is required', 400);
    }

    await connection.beginTransaction();

    // Verify session exists and is active
    const session = await Session.findById(session_id);
    if (!session) {
      await connection.rollback();
      return errorResponse(res, 'Session not found', 404);
    }

    if (session.status !== 'active') {
      await connection.rollback();
      return errorResponse(res, 'Session is not active', 400);
    }

    // Verify faculty owns this session
    if (session.faculty_id !== req.user.id) {
      await connection.rollback();
      return errorResponse(res, 'You can only mark attendance for your own sessions', 403);
    }

    // Save image temporarily for face detection
    tempFilePath = path.join(os.tmpdir(), `attendance_${session_id}_${Date.now()}.jpg`);
    await fs.writeFile(tempFilePath, req.file.buffer);

    console.log('Detecting faces in captured image...');
    
    // Detect faces in the captured image (multi-face mode for attendance)
    const faceResult = await detectFaces(tempFilePath, false); // false = multi-face mode

    if (!faceResult.success) {
      await connection.rollback();
      return errorResponse(res, 'Face detection failed: ' + faceResult.error, 400);
    }

    console.log(`Detected ${faceResult.face_count} faces`);

    if (faceResult.face_count === 0) {
      await connection.rollback();
      return errorResponse(res, 'No faces detected in the image', 400);
    }

    // Upload image using unified storage (local or S3)
    const imageKey = generateKey(`session_${session_id}_${Date.now()}.jpg`, 'attendance');
    const imageUrl = await uploadFile(req.file.buffer, imageKey, req.file.mimetype);

    // Update session with captured image URL
    await connection.query(
      'UPDATE sessions SET captured_image_url = ? WHERE session_id = ?',
      [imageUrl, session_id]
    );

    // Get all students in the class with face embeddings
    const studentsWithEmbeddings = await Student.getAllWithEmbeddings(session.class, session.stream, session.semester);

    if (studentsWithEmbeddings.length === 0) {
      await connection.rollback();
      return errorResponse(res, 'No students with face embeddings found in this class', 400);
    }

    console.log(`Matching against ${studentsWithEmbeddings.length} enrolled students`);
    console.log('Students with embeddings:', studentsWithEmbeddings.map(s => `${s.roll_no} (${s.name})`).join(', '));

    // Match each detected face against known students
    const matchedStudents = [];
    const matchedStudentIds = new Set(); // Track IDs to avoid duplicates
    const detectedEncodings = faceResult.face_encodings;

    console.log(`Processing ${detectedEncodings.length} detected faces...`);

    for (let i = 0; i < detectedEncodings.length; i++) {
      console.log(`\nProcessing face ${i + 1}/${detectedEncodings.length}...`);
      const unknownEncoding = detectedEncodings[i];
      const knownEncodings = studentsWithEmbeddings.map(s => s.face_embedding);

      // Find best match - now Python returns the best_match_index
      const { matchFaces } = require('../utils/faceRecognition');
      const matchResult = await matchFaces(unknownEncoding, knownEncodings, 0.5); // Lowered from 0.6 to 0.5

      console.log(`Match result for face ${i + 1}:`, JSON.stringify({
        success: matchResult.success,
        matched: matchResult.matched,
        confidence: matchResult.confidence,
        best_match_index: matchResult.best_match_index,
        all_similarities: matchResult.all_similarities
      }, null, 2));

      let bestMatch = null;
      let bestConfidence = 0;
      let selectedIndex = -1;

      if (matchResult.success && matchResult.all_similarities && matchResult.all_similarities.length > 0) {
        // Sort similarities with their indices
        const sortedMatches = matchResult.all_similarities
          .map((similarity, index) => ({ similarity, index }))
          .sort((a, b) => b.similarity - a.similarity);

        console.log('Sorted matches:', sortedMatches.map(m => 
          `[${m.index}] ${studentsWithEmbeddings[m.index].roll_no}: ${m.similarity.toFixed(4)}`
        ).join(', '));

        // Find the best match that hasn't been matched yet
        const threshold = 0.5;
        for (const match of sortedMatches) {
          const student = studentsWithEmbeddings[match.index];
          if (match.similarity >= threshold && !matchedStudentIds.has(student.student_id)) {
            bestMatch = student;
            bestConfidence = match.similarity;
            selectedIndex = match.index;
            console.log(`Selected match: ${bestMatch.name} (${bestMatch.roll_no}) at index ${selectedIndex} with confidence ${bestConfidence.toFixed(4)}`);
            break;
          } else if (matchedStudentIds.has(student.student_id)) {
            console.log(`Skipping ${student.roll_no} (already matched)`);
          } else {
            console.log(`Skipping ${student.roll_no} (confidence ${match.similarity.toFixed(4)} below threshold ${threshold})`);
          }
        }
      }

      if (bestMatch && !matchedStudentIds.has(bestMatch.student_id)) {
        console.log(`✓ Face ${i + 1} matched: ${bestMatch.name} (${bestMatch.roll_no}) - confidence: ${bestConfidence.toFixed(4)}`);
        
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
          [bestConfidence, session_id, bestMatch.student_id]
        );

        console.log(`Marked ${bestMatch.name} (${bestMatch.roll_no}) as present with confidence ${bestConfidence.toFixed(4)}`);
      } else if (bestMatch) {
        console.log(`⚠ Face ${i + 1} matched ${bestMatch.name} but already marked present (skipping duplicate)`);
      } else {
        console.log(`✗ Face ${i + 1} no match found (best confidence: ${bestConfidence.toFixed(4)})`);
      }
    }

    console.log(`\nTotal students marked present: ${matchedStudents.length}`);

    // Update session statistics within the same transaction
    await connection.query(
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
      [session_id, session_id, session_id]
    );

    await connection.commit();

    // Clean up temp file
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }

    // Get updated session stats
    const updatedSession = await Session.findById(session_id);

    // Send notification (async, don't wait)
    sendAttendanceNotification({
      facultyName: updatedSession.faculty_name,
      subjectName: updatedSession.subject_name,
      className: updatedSession.class,
      presentCount: updatedSession.present_count,
      totalStudents: updatedSession.total_students,
      sessionDate: updatedSession.session_date
    }).catch(err => console.error('Notification error:', err));

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'faculty', 'MARK_ATTENDANCE', 'sessions', session_id, JSON.stringify({
        faces_detected: faceResult.face_count,
        students_marked: matchedStudents.length
      })]
    );

    return successResponse(res, {
      session_id: session_id,
      image_url: imageUrl,
      faces_detected: faceResult.face_count,
      students_matched: matchedStudents.length,
      matched_students: matchedStudents,
      present_count: updatedSession.present_count,
      absent_count: updatedSession.absent_count,
      total_students: updatedSession.total_students,
      attendance_percentage: ((updatedSession.present_count / updatedSession.total_students) * 100).toFixed(2)
    }, 'Attendance marked successfully');

  } catch (error) {
    await connection.rollback();
    
    // Clean up temp file on error
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }
    
    console.error('Capture attendance error:', error);
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Get attendance records with filters
 * GET /api/attendance
 */
const getAttendance = async (req, res, next) => {
  try {
    const { 
      session_id, 
      student_id, 
      class: className, 
      start_date, 
      end_date, 
      status 
    } = req.query;

    let query = `
      SELECT 
        a.attendance_id,
        a.status,
        a.marked_at,
        a.confidence_score,
        a.face_detected,
        s.student_id,
        s.roll_no,
        s.name as student_name,
        s.class,
        ses.session_id,
        ses.session_date,
        ses.start_time,
        sub.subject_name
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      JOIN sessions ses ON a.session_id = ses.session_id
      LEFT JOIN subjects sub ON ses.subject_id = sub.subject_id
      WHERE ses.faculty_id = ?
    `;
    const params = [req.user.id];

    if (session_id) {
      query += ' AND a.session_id = ?';
      params.push(session_id);
    }

    if (student_id) {
      query += ' AND a.student_id = ?';
      params.push(student_id);
    }

    if (className) {
      query += ' AND s.class = ?';
      params.push(className);
    }

    if (start_date) {
      query += ' AND ses.session_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND ses.session_date <= ?';
      params.push(end_date);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ses.session_date DESC, s.roll_no ASC';

    const [attendance] = await db.query(query, params);

    return successResponse(res, attendance, 'Attendance records retrieved successfully');

  } catch (error) {
    console.error('Get attendance error:', error);
    next(error);
  }
};

/**
 * Get attendance by session
 * GET /api/attendance/session/:sessionId
 */
const getAttendanceBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const [attendance] = await db.query(
      `SELECT 
        a.*,
        s.roll_no,
        s.name as student_name,
        s.photo_url
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      WHERE a.session_id = ?
      ORDER BY s.roll_no`,
      [sessionId]
    );

    return successResponse(res, attendance, 'Attendance retrieved successfully');

  } catch (error) {
    console.error('Get attendance by session error:', error);
    next(error);
  }
};

/**
 * Get attendance by student
 * GET /api/attendance/student/:studentId
 */
const getAttendanceByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // If student, can only view own records
    if (req.user.role === 'student' && parseInt(studentId) !== req.user.id) {
      return errorResponse(res, 'You can only view your own attendance', 403);
    }

    const [attendance] = await db.query(
      `SELECT 
        a.*,
        ses.session_date,
        ses.start_time,
        sub.subject_name,
        sub.subject_code
      FROM attendance a
      JOIN sessions ses ON a.session_id = ses.session_id
      LEFT JOIN subjects sub ON ses.subject_id = sub.subject_id
      WHERE a.student_id = ?
      ORDER BY ses.session_date DESC`,
      [studentId]
    );

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = total - present;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    return successResponse(res, {
      attendance,
      statistics: {
        total_classes: total,
        present: present,
        absent: absent,
        attendance_percentage: percentage
      }
    }, 'Attendance retrieved successfully');

  } catch (error) {
    console.error('Get attendance by student error:', error);
    next(error);
  }
};

/**
 * Generate attendance report
 * GET /api/attendance/report
 */
const generateReport = async (req, res, next) => {
  try {
    const { start_date, end_date, class: className, subject_id } = req.query;

    if (!start_date || !end_date) {
      return errorResponse(res, 'Start date and end date are required', 400);
    }

    let query = `
      SELECT 
        s.student_id,
        s.roll_no,
        s.name,
        s.class,
        COUNT(a.attendance_id) as total_classes,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        ROUND(
          (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0) / COUNT(a.attendance_id),
          2
        ) as attendance_percentage
      FROM students s
      LEFT JOIN attendance a ON s.student_id = a.student_id
      LEFT JOIN sessions ses ON a.session_id = ses.session_id
      WHERE ses.faculty_id = ?
        AND ses.session_date BETWEEN ? AND ?
    `;
    const params = [req.user.id, start_date, end_date];

    if (className) {
      query += ' AND s.class = ?';
      params.push(className);
    }

    if (subject_id) {
      query += ' AND ses.subject_id = ?';
      params.push(subject_id);
    }

    query += ' GROUP BY s.student_id ORDER BY s.roll_no';

    const [report] = await db.query(query, params);

    return successResponse(res, {
      report,
      period: {
        start_date,
        end_date
      }
    }, 'Report generated successfully');

  } catch (error) {
    console.error('Generate report error:', error);
    next(error);
  }
};

/**
 * Manually update attendance
 * PUT /api/attendance/:id
 */
const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status || !['present', 'absent'].includes(status)) {
      return errorResponse(res, 'Invalid status. Must be "present" or "absent"', 400);
    }

    // Check if attendance record exists
    const [records] = await db.query(
      'SELECT a.*, ses.faculty_id FROM attendance a JOIN sessions ses ON a.session_id = ses.session_id WHERE a.attendance_id = ?',
      [id]
    );

    if (records.length === 0) {
      return errorResponse(res, 'Attendance record not found', 404);
    }

    // Verify faculty owns this session
    if (records[0].faculty_id !== req.user.id) {
      return errorResponse(res, 'You can only update attendance for your own sessions', 403);
    }

    // Update attendance
    await db.query(
      'UPDATE attendance SET status = ?, remarks = ?, updated_at = NOW() WHERE attendance_id = ?',
      [status, remarks || null, id]
    );

    // Update session statistics
    await Session.updateStatistics(records[0].session_id);

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'faculty', 'UPDATE_ATTENDANCE', 'attendance', id, JSON.stringify({ status, remarks })]
    );

    return successResponse(res, null, 'Attendance updated successfully');

  } catch (error) {
    console.error('Update attendance error:', error);
    next(error);
  }
};

/**
 * Get attendance summary statistics
 * GET /api/attendance/stats/summary
 */
const getAttendanceSummary = async (req, res, next) => {
  try {
    const facultyId = req.user.id;

    // Overall statistics
    const [overall] = await db.query(
      `SELECT 
        COUNT(DISTINCT ses.session_id) as total_sessions,
        COUNT(a.attendance_id) as total_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as total_absent
      FROM sessions ses
      LEFT JOIN attendance a ON ses.session_id = a.session_id
      WHERE ses.faculty_id = ? AND ses.status = 'completed'`,
      [facultyId]
    );

    // Today's sessions
    const [today] = await db.query(
      `SELECT COUNT(*) as count FROM sessions 
      WHERE faculty_id = ? AND session_date = CURDATE()`,
      [facultyId]
    );

    // Active session
    const [active] = await db.query(
      `SELECT COUNT(*) as count FROM sessions 
      WHERE faculty_id = ? AND status = 'active'`,
      [facultyId]
    );

    return successResponse(res, {
      overall: overall[0],
      today_sessions: today[0].count,
      active_sessions: active[0].count
    }, 'Summary retrieved successfully');

  } catch (error) {
    console.error('Get summary error:', error);
    next(error);
  }
};

module.exports = {
  captureAndMarkAttendance,
  getAttendance,
  getAttendanceBySession,
  getAttendanceByStudent,
  generateReport,
  updateAttendance,
  getAttendanceSummary
};
