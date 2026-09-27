const db = require('../config/database');

/**
 * Student Model
 * Handles database operations for students
 */

class Student {
  /**
   * Find student by ID
   * @param {number} id - Student ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const [students] = await db.query(
      'SELECT * FROM students WHERE student_id = ?',
      [id]
    );
    return students.length > 0 ? students[0] : null;
  }

  /**
   * Find student by email
   * @param {string} email - Student email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const [students] = await db.query(
      'SELECT * FROM students WHERE email = ?',
      [email]
    );
    return students.length > 0 ? students[0] : null;
  }

  /**
   * Find student by roll number
   * @param {string} rollNo - Student roll number
   * @returns {Promise<Object|null>}
   */
  static async findByRollNo(rollNo) {
    const [students] = await db.query(
      'SELECT * FROM students WHERE roll_no = ?',
      [rollNo]
    );
    return students.length > 0 ? students[0] : null;
  }

  /**
   * Get all students with face embeddings
   * @param {string} className - Optional class filter
   * @param {string} stream - Optional stream filter
   * @param {number} semester - Optional semester filter
   * @returns {Promise<Array>}
   */
  static async getAllWithEmbeddings(className = null, stream = null, semester = null) {
    let query = `
      SELECT student_id, roll_no, name, face_embedding 
      FROM students 
      WHERE face_embedding IS NOT NULL 
      AND is_active = TRUE
    `;
    const params = [];

    if (className) {
      query += ' AND class = ?';
      params.push(className);
    }

    if (stream) {
      query += ' AND stream = ?';
      params.push(stream);
    }

    if (semester) {
      query += ' AND semester = ?';
      params.push(semester);
    }

    const [students] = await db.query(query, params);
    return students.map(student => ({
      ...student,
      face_embedding: JSON.parse(student.face_embedding)
    }));
  }

  /**
   * Count students by class
   * @param {string} className - Class name
   * @returns {Promise<number>}
   */
  static async countByClass(className) {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM students WHERE class = ? AND is_active = TRUE',
      [className]
    );
    return result[0].count;
  }

  /**
   * Get students without photos
   * @returns {Promise<Array>}
   */
  static async getWithoutPhotos() {
    const [students] = await db.query(
      `SELECT student_id, roll_no, name, email, class 
      FROM students 
      WHERE photo_url IS NULL OR face_embedding IS NULL`
    );
    return students;
  }

  /**
   * Update student's active status
   * @param {number} id - Student ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<void>}
   */
  static async updateActiveStatus(id, isActive) {
    await db.query(
      'UPDATE students SET is_active = ?, updated_at = NOW() WHERE student_id = ?',
      [isActive, id]
    );
  }

  /**
   * Get students statistics
   * @returns {Promise<Object>}
   */
  static async getStatistics() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_students,
        COUNT(CASE WHEN photo_url IS NOT NULL THEN 1 END) as students_with_photos,
        COUNT(DISTINCT class) as total_classes,
        COUNT(DISTINCT department) as total_departments
      FROM students
    `);
    return stats[0];
  }
}

module.exports = Student;
