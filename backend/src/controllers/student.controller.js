const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { uploadFile, deleteFile, generateKey } = require('../utils/storageHelper');
const { studentPhotosPrefix } = require('../config/aws');
const { detectFaces } = require('../utils/faceRecognition');
const { hashPassword } = require('../utils/hash');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Get all students
 * GET /api/students
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { class: className, department, semester, stream, search } = req.query;

    console.log('=== GET ALL STUDENTS ===');
    console.log('Query params received:', req.query);
    console.log('stream:', stream);
    console.log('className:', className);
    console.log('semester:', semester);

    let query = `
      SELECT 
        student_id, roll_no, name, email, phone, 
        class, department, semester, stream, photo_url, 
        is_active, created_at
      FROM students
      WHERE 1=1
    `;
    const params = [];

    if (stream) {
      query += ' AND stream = ?';
      params.push(stream);
      console.log('Added stream filter');
    }

    if (className) {
      query += ' AND class = ?';
      params.push(className);
      console.log('Added class filter');
    }

    if (department) {
      query += ' AND department = ?';
      params.push(department);
      console.log('Added department filter');
    }

    if (semester) {
      query += ' AND semester = ?';
      params.push(parseInt(semester));
      console.log('Added semester filter');
    }

    if (search) {
      query += ' AND (name LIKE ? OR roll_no LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      console.log('Added search filter');
    }

    query += ' ORDER BY roll_no ASC';

    console.log('Final SQL query:', query);
    console.log('SQL params:', params);

    const [students] = await db.query(query, params);

    console.log('Students found:', students.length);

    return successResponse(res, students, 'Students retrieved successfully');
  } catch (error) {
    console.error('Get students error:', error);
    next(error);
  }
};

/**
 * Get student by ID
 * GET /api/students/:id
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [students] = await db.query(
      `SELECT 
        student_id, roll_no, name, email, phone, 
        class, department, semester, photo_url, 
        is_active, created_at, updated_at
      FROM students 
      WHERE student_id = ?`,
      [id]
    );

    if (students.length === 0) {
      return errorResponse(res, 'Student not found', 404);
    }

    return successResponse(res, students[0], 'Student retrieved successfully');
  } catch (error) {
    console.error('Get student error:', error);
    next(error);
  }
};

/**
 * Create new student
 * POST /api/students
 */
const createStudent = async (req, res, next) => {
  let tempFilePath = null;
  
  try {
    const { roll_no, name, email, password, phone, class: className, department, semester, stream } = req.body;

    console.log('=== CREATE STUDENT ===');
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'YES' : 'NO');

    // Check if email or roll_no already exists
    const [existing] = await db.query(
      'SELECT student_id FROM students WHERE email = ? OR roll_no = ?',
      [email, roll_no]
    );

    if (existing.length > 0) {
      return errorResponse(res, 'Student with this email or roll number already exists', 409);
    }

    // Hash password (default password if not provided)
    const passwordHash = await hashPassword(password || 'student123');

    let photoUrl = null;
    let faceEncoding = null;

    // Handle photo upload if provided
    if (req.file) {
      console.log('Processing photo upload...');
      
      // Save file temporarily for face detection
      tempFilePath = path.join(os.tmpdir(), `student_${Date.now()}.jpg`);
      await fs.writeFile(tempFilePath, req.file.buffer);

      // Detect faces in the image (single-face mode for student photos)
      const faceResult = await detectFaces(tempFilePath, true);

      if (!faceResult.success) {
        await fs.unlink(tempFilePath).catch(() => {});
        return errorResponse(res, 'Face detection failed: ' + faceResult.error, 400);
      }

      if (faceResult.face_count === 0) {
        await fs.unlink(tempFilePath).catch(() => {});
        return errorResponse(res, 'No face detected in the image', 400);
      }

      // If multiple faces detected, use the one with highest confidence
      if (faceResult.face_count > 1) {
        console.log(`Warning: Multiple faces detected (${faceResult.face_count}), using most confident face`);
        const facesWithIndex = faceResult.face_encodings.map((enc, idx) => ({
          encoding: enc,
          confidence: faceResult.confidences[idx],
          location: faceResult.face_locations[idx]
        }));
        facesWithIndex.sort((a, b) => b.confidence - a.confidence);
        
        faceResult.face_encodings = [facesWithIndex[0].encoding];
        faceResult.face_locations = [facesWithIndex[0].location];
        faceResult.confidences = [facesWithIndex[0].confidence];
        faceResult.face_count = 1;
        
        console.log(`Selected face with confidence: ${facesWithIndex[0].confidence.toFixed(4)}`);
      }

      // Get face encoding
      faceEncoding = faceResult.face_encodings[0];
      console.log('Face encoding generated');

      // Generate key and upload to storage
      const fileKey = generateKey(req.file.originalname, studentPhotosPrefix);
      photoUrl = await uploadFile(req.file.buffer, fileKey, req.file.mimetype);
      console.log('Photo uploaded:', photoUrl);

      // Clean up temp file
      await fs.unlink(tempFilePath).catch(() => {});
      tempFilePath = null;
    }

    // Insert student with photo and face embedding
    const [result] = await db.query(
      `INSERT INTO students 
        (roll_no, name, email, password_hash, phone, class, department, semester, stream, photo_url, face_embedding) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [roll_no, name, email, passwordHash, phone, className, department, semester, stream, photoUrl, faceEncoding ? JSON.stringify(faceEncoding) : null]
    );

    console.log('Student created with ID:', result.insertId);

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.role, 'CREATE', 'students', result.insertId, JSON.stringify({ roll_no, name, has_photo: !!photoUrl })]
    );

    return successResponse(res, {
      student_id: result.insertId,
      roll_no,
      name,
      email,
      class: className,
      stream,
      photo_url: photoUrl,
      has_face_embedding: !!faceEncoding
    }, 'Student created successfully', 201);

  } catch (error) {
    // Clean up temp file if exists
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }
    console.error('Create student error:', error);
    next(error);
  }
};

/**
 * Update student
 * PUT /api/students/:id
 */
const updateStudent = async (req, res, next) => {
  let tempFilePath = null;
  
  try {
    const { id } = req.params;
    const { roll_no, name, email, phone, class: className, department, semester, stream, is_active } = req.body;

    console.log('=== UPDATE STUDENT ===');
    console.log('Student ID:', id);
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'YES' : 'NO');

    // Check if student exists
    const [students] = await db.query('SELECT student_id, photo_url FROM students WHERE student_id = ?', [id]);

    if (students.length === 0) {
      return errorResponse(res, 'Student not found', 404);
    }

    const oldPhotoUrl = students[0].photo_url;

    // Check for duplicate email or roll_no (excluding current student)
    if (email || roll_no) {
      const [existing] = await db.query(
        'SELECT student_id FROM students WHERE (email = ? OR roll_no = ?) AND student_id != ?',
        [email || '', roll_no || '', id]
      );

      if (existing.length > 0) {
        return errorResponse(res, 'Student with this email or roll number already exists', 409);
      }
    }

    let photoUrl = oldPhotoUrl;
    let faceEncoding = null;

    // Handle photo upload if provided
    if (req.file) {
      console.log('Processing photo upload...');
      
      // Save file temporarily for face detection
      tempFilePath = path.join(os.tmpdir(), `student_${id}_${Date.now()}.jpg`);
      await fs.writeFile(tempFilePath, req.file.buffer);

      // Detect faces in the image (single-face mode for student photos)
      const faceResult = await detectFaces(tempFilePath, true);

      if (!faceResult.success) {
        await fs.unlink(tempFilePath).catch(() => {});
        return errorResponse(res, 'Face detection failed: ' + faceResult.error, 400);
      }

      if (faceResult.face_count === 0) {
        await fs.unlink(tempFilePath).catch(() => {});
        return errorResponse(res, 'No face detected in the image', 400);
      }

      // If multiple faces detected, use the one with highest confidence
      if (faceResult.face_count > 1) {
        console.log(`Warning: Multiple faces detected (${faceResult.face_count}), using most confident face`);
        const facesWithIndex = faceResult.face_encodings.map((enc, idx) => ({
          encoding: enc,
          confidence: faceResult.confidences[idx],
          location: faceResult.face_locations[idx]
        }));
        facesWithIndex.sort((a, b) => b.confidence - a.confidence);
        
        faceResult.face_encodings = [facesWithIndex[0].encoding];
        faceResult.face_locations = [facesWithIndex[0].location];
        faceResult.confidences = [facesWithIndex[0].confidence];
        faceResult.face_count = 1;
        
        console.log(`Selected face with confidence: ${facesWithIndex[0].confidence.toFixed(4)}`);
      }

      // Get face encoding
      faceEncoding = faceResult.face_encodings[0];
      console.log('Face encoding generated');

      // Generate key and upload to storage
      const fileKey = generateKey(req.file.originalname, studentPhotosPrefix);
      photoUrl = await uploadFile(req.file.buffer, fileKey, req.file.mimetype);
      console.log('Photo uploaded:', photoUrl);

      // Delete old photo from storage if exists
      if (oldPhotoUrl) {
        try {
          const oldKey = oldPhotoUrl.split('/uploads/')[1] || oldPhotoUrl.split('.com/')[1];
          await deleteFile(oldKey);
          console.log('Old photo deleted');
        } catch (storageError) {
          console.error('Old photo delete error:', storageError);
        }
      }

      // Clean up temp file
      await fs.unlink(tempFilePath).catch(() => {});
      tempFilePath = null;
    }

    // Build update query
    const updates = [];
    const params = [];

    if (roll_no !== undefined) { updates.push('roll_no = ?'); params.push(roll_no); }
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (className !== undefined) { updates.push('class = ?'); params.push(className); }
    if (department !== undefined) { updates.push('department = ?'); params.push(department); }
    if (semester !== undefined) { updates.push('semester = ?'); params.push(semester); }
    if (stream !== undefined) { updates.push('stream = ?'); params.push(stream); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
    
    // Update photo_url and face_embedding if new photo was uploaded
    if (req.file) {
      updates.push('photo_url = ?');
      params.push(photoUrl);
      updates.push('face_embedding = ?');
      params.push(JSON.stringify(faceEncoding));
    }

    if (updates.length === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.query(
      `UPDATE students SET ${updates.join(', ')} WHERE student_id = ?`,
      params
    );

    console.log('Student updated successfully');

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.role, 'UPDATE', 'students', id, JSON.stringify({ ...req.body, has_new_photo: !!req.file })]
    );

    return successResponse(res, null, 'Student updated successfully');

  } catch (error) {
    // Clean up temp file if exists
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }
    console.error('Update student error:', error);
    next(error);
  }
};

/**
 * Delete student
 * DELETE /api/students/:id
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const [students] = await db.query('SELECT student_id, photo_url FROM students WHERE student_id = ?', [id]);

    if (students.length === 0) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Delete photo from storage if exists
    if (students[0].photo_url) {
      try {
        const key = students[0].photo_url.split('/uploads/')[1] || students[0].photo_url.split('.com/')[1];
        await deleteFile(key);
      } catch (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue with deletion even if storage fails
      }
    }

    // Delete student (cascade will handle attendance records)
    await db.query('DELETE FROM students WHERE student_id = ?', [id]);

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.role, 'DELETE', 'students', id, JSON.stringify({ student_id: id })]
    );

    return successResponse(res, null, 'Student deleted successfully');

  } catch (error) {
    console.error('Delete student error:', error);
    next(error);
  }
};

/**
 * Upload student photo
 * POST /api/students/:id/photo
 */
const uploadPhoto = async (req, res, next) => {
  let tempFilePath = null;

  try {
    const { id } = req.params;

    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    // Check if student exists
    const [students] = await db.query(
      'SELECT student_id, photo_url FROM students WHERE student_id = ?',
      [id]
    );

    if (students.length === 0) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Save file temporarily for face detection
    tempFilePath = path.join(os.tmpdir(), `student_${id}_${Date.now()}.jpg`);
    await fs.writeFile(tempFilePath, req.file.buffer);

    console.log('Calling detectFaces with single_face_mode=true...');
    
    // Detect faces in the image
    const faceResult = await detectFaces(tempFilePath, true); // Single face mode for student photos
    
    console.log('Face detection result:', JSON.stringify(faceResult, null, 2));

    if (!faceResult.success) {
      return errorResponse(res, 'Face detection failed: ' + faceResult.error, 400);
    }

    if (faceResult.face_count === 0) {
      return errorResponse(res, 'No face detected in the image', 400);
    }

    // If multiple faces detected, use the one with highest confidence
    if (faceResult.face_count > 1) {
      console.log(`Warning: Multiple faces detected (${faceResult.face_count}), using most confident face`);
      // Sort by confidence and take the best one
      const facesWithIndex = faceResult.face_encodings.map((enc, idx) => ({
        encoding: enc,
        confidence: faceResult.confidences[idx],
        location: faceResult.face_locations[idx]
      }));
      facesWithIndex.sort((a, b) => b.confidence - a.confidence);
      
      // Use only the most confident face
      faceResult.face_encodings = [facesWithIndex[0].encoding];
      faceResult.face_locations = [facesWithIndex[0].location];
      faceResult.confidences = [facesWithIndex[0].confidence];
      faceResult.face_count = 1;
      
      console.log(`Selected face with confidence: ${facesWithIndex[0].confidence.toFixed(4)}`);
    }

    // Get face encoding
    const faceEncoding = faceResult.face_encodings[0];

    // Generate key and upload to storage
    const fileKey = generateKey(req.file.originalname, studentPhotosPrefix);
    const photoUrl = await uploadFile(req.file.buffer, fileKey, req.file.mimetype);

    // Delete old photo from storage if exists
    if (students[0].photo_url) {
      try {
        const oldKey = students[0].photo_url.split('/uploads/')[1] || students[0].photo_url.split('.com/')[1];
        await deleteFile(oldKey);
      } catch (storageError) {
        console.error('Old photo delete error:', storageError);
      }
    }

    // Update student record
    await db.query(
      'UPDATE students SET photo_url = ?, face_embedding = ?, updated_at = NOW() WHERE student_id = ?',
      [photoUrl, JSON.stringify(faceEncoding), id]
    );

    // Clean up temp file
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }

    // Log action
    await db.query(
      'INSERT INTO audit_log (user_id, user_type, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.role, 'UPLOAD_PHOTO', 'students', id, JSON.stringify({ photo_url: photoUrl })]
    );

    return successResponse(res, {
      photo_url: photoUrl,
      face_detected: true
    }, 'Photo uploaded successfully');

  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }
    console.error('Upload photo error:', error);
    next(error);
  }
};

/**
 * Get students by class
 * GET /api/students/class/:className
 */
const getStudentsByClass = async (req, res, next) => {
  try {
    const { className } = req.params;

    const [students] = await db.query(
      `SELECT 
        student_id, roll_no, name, email, phone, 
        class, department, semester, photo_url, 
        is_active
      FROM students 
      WHERE class = ?
      ORDER BY roll_no ASC`,
      [className]
    );

    return successResponse(res, students, 'Students retrieved successfully');
  } catch (error) {
    console.error('Get students by class error:', error);
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadPhoto,
  getStudentsByClass
};
