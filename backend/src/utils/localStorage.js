const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Local storage directory
const STORAGE_DIR = path.join(__dirname, '../../uploads');
const STUDENTS_DIR = path.join(STORAGE_DIR, 'students');
const ATTENDANCE_DIR = path.join(STORAGE_DIR, 'attendance');

/**
 * Initialize local storage directories
 */
const initializeStorage = async () => {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(STUDENTS_DIR, { recursive: true });
    await fs.mkdir(ATTENDANCE_DIR, { recursive: true });
    console.log('✓ Local storage initialized:', STORAGE_DIR);
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
};

/**
 * Upload file to local storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - File key (path)
 * @param {string} contentType - MIME type (not used for local, kept for compatibility)
 * @returns {Promise<string>} - Local file URL
 */
const uploadToLocal = async (fileBuffer, key, contentType) => {
  try {
    const filePath = path.join(STORAGE_DIR, key);
    const fileDir = path.dirname(filePath);
    
    // Ensure directory exists
    await fs.mkdir(fileDir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, fileBuffer);
    
    // Return URL-style path (for compatibility with S3)
    return `/uploads/${key}`;
  } catch (error) {
    console.error('Local Upload Error:', error);
    throw new Error('Failed to upload file to local storage');
  }
};

/**
 * Delete file from local storage
 * @param {string} key - File key (path)
 * @returns {Promise<void>}
 */
const deleteFromLocal = async (key) => {
  try {
    const filePath = path.join(STORAGE_DIR, key);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Local Delete Error:', error);
    // Don't throw error if file doesn't exist
    if (error.code !== 'ENOENT') {
      throw new Error('Failed to delete file from local storage');
    }
  }
};

/**
 * Generate unique file key/path
 * @param {string} originalName - Original file name
 * @param {string} type - Type of file ('students' or 'attendance')
 * @returns {string} - Unique key with proper path
 */
const generateLocalKey = (originalName, type = 'students') => {
  const extension = originalName.split('.').pop();
  const uniqueName = `${uuidv4()}.${extension}`;
  
  // Map type to directory structure
  const dirMap = {
    'students': 'students/',
    'attendance': 'attendance/'
  };
  
  const prefix = dirMap[type] || 'students/';
  return `${prefix}${uniqueName}`;
};

/**
 * Get absolute file path from key
 * @param {string} key - File key
 * @returns {string} - Absolute file path
 */
const getFilePath = (key) => {
  return path.join(STORAGE_DIR, key);
};

// Initialize on module load
initializeStorage();

module.exports = {
  uploadToLocal,
  deleteFromLocal,
  generateLocalKey,
  getFilePath,
  STORAGE_DIR
};
