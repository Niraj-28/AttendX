# Configuration Files

This directory contains configuration files for the AttendX backend.

## Files

### aws.js
AWS SDK v3 configuration for S3 and SNS services.

**Exports:**
- `s3Client` - S3 client instance
- `snsClient` - SNS client instance
- `bucketName` - S3 bucket name from env
- `studentPhotosPrefix` - Folder prefix for student photos
- `attendanceImagesPrefix` - Folder prefix for attendance images
- `snsTopicArn` - SNS topic ARN for notifications

**Environment Variables Required:**
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `SNS_TOPIC_ARN`

### database.js
MySQL database connection pool configuration.

**Exports:**
- `promisePool` - Promise-based connection pool

**Environment Variables Required:**
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Usage

```javascript
// Using AWS S3
const { s3Client, bucketName } = require('./config/aws');

// Using Database
const db = require('./config/database');
const [rows] = await db.query('SELECT * FROM students');
```

## Notes

- All sensitive configuration should be in `.env` file
- Never commit `.env` file to version control
- Use `.env.example` as a template
