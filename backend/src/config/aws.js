const { S3Client } = require('@aws-sdk/client-s3');
const { SNSClient } = require('@aws-sdk/client-sns');
const dotenv = require('dotenv');

dotenv.config();

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
};

// S3 Client
const s3Client = new S3Client(awsConfig);

// SNS Client
const snsClient = new SNSClient(awsConfig);

module.exports = {
  s3Client,
  snsClient,
  bucketName: process.env.S3_BUCKET_NAME,
  studentPhotosPrefix: process.env.S3_STUDENT_PHOTOS_PREFIX || 'students/',
  attendanceImagesPrefix: process.env.S3_ATTENDANCE_IMAGES_PREFIX || 'attendance/',
  snsTopicArn: process.env.SNS_TOPIC_ARN
};
