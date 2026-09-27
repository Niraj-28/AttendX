const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get all subjects for the logged-in faculty
 * GET /api/subjects
 */
const getSubjects = async (req, res, next) => {
  try {
    const facultyId = req.user.id;

    const [subjects] = await db.query(
      `SELECT 
        subject_id,
        subject_code,
        subject_name,
        department,
        semester
      FROM subjects 
      WHERE faculty_id = ?
      ORDER BY subject_name`,
      [facultyId]
    );

    return successResponse(res, subjects, 'Subjects retrieved successfully');

  } catch (error) {
    console.error('Get subjects error:', error);
    next(error);
  }
};

/**
 * Get subject by ID
 * GET /api/subjects/:id
 */
const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facultyId = req.user.id;

    const [subjects] = await db.query(
      `SELECT 
        subject_id,
        subject_code,
        subject_name,
        faculty_id,
        department,
        semester
      FROM subjects 
      WHERE subject_id = ? AND faculty_id = ?`,
      [id, facultyId]
    );

    if (subjects.length === 0) {
      return errorResponse(res, 'Subject not found', 404);
    }

    return successResponse(res, subjects[0], 'Subject retrieved successfully');

  } catch (error) {
    console.error('Get subject error:', error);
    next(error);
  }
};

module.exports = {
  getSubjects,
  getSubjectById
};
