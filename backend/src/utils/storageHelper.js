/**
 * Unified Storage Helper
 * Switches between S3 and local storage based on environment
 */

// Ensure environment variables are loaded
require('dotenv').config();

const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true';

let uploadFile, deleteFile, generateKey;

if (USE_LOCAL_STORAGE) {
  console.log('📁 Using LOCAL storage for file uploads');
  const localStorage = require('./localStorage');
  uploadFile = localStorage.uploadToLocal;
  deleteFile = localStorage.deleteFromLocal;
  generateKey = localStorage.generateLocalKey;
} else {
  console.log('☁️  Using S3 storage for file uploads');
  const s3Helper = require('./s3Helper');
  uploadFile = s3Helper.uploadToS3;
  deleteFile = s3Helper.deleteFromS3;
  generateKey = s3Helper.generateS3Key;
}

module.exports = {
  uploadFile,
  deleteFile,
  generateKey,
  isLocalStorage: USE_LOCAL_STORAGE
};
