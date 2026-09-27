const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { s3Client, bucketName } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - S3 object key
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - S3 URL
 */
const uploadToS3 = async (fileBuffer, key, contentType) => {
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      },
    });

    await upload.done();
    
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Generate unique S3 key/path
 * @param {string} originalName - Original file name
 * @param {string} type - Type of file ('students' or 'attendance')
 * @returns {string} - Unique key with proper S3 prefix
 */
const generateS3Key = (originalName, type = 'students') => {
  const extension = originalName.split('.').pop();
  const uniqueName = `${uuidv4()}.${extension}`;
  
  // Map type to S3 prefix (from environment or default)
  const prefixMap = {
    'students': process.env.S3_STUDENT_PHOTOS_PREFIX || 'students/',
    'attendance': process.env.S3_ATTENDANCE_IMAGES_PREFIX || 'attendance/'
  };
  
  const prefix = prefixMap[type] || 'students/';
  return `${prefix}${uniqueName}`;
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  generateS3Key
};
