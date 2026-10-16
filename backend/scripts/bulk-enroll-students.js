#!/usr/bin/env node
/**
 * Bulk Student Photo Enrollment Script
 * 
 * This script processes student photos from a directory and enrolls them
 * by extracting face embeddings and storing them in the database.
 * 
 * Usage:
 *   node scripts/bulk-enroll-students.js <photos_directory>
 * 
 * Photo naming convention:
 *   - Files should be named with roll numbers: 25MCA001.jpg, 25MCA002.jpg, etc.
 *   - Supported formats: .jpg, .jpeg, .png
 * 
 * Example:
 *   node scripts/bulk-enroll-students.js ./student-photos
 */

const fs = require('fs').promises;
const path = require('path');
const db = require('../src/config/database');
const { detectFaces } = require('../src/utils/faceRecognition');

// Supported image formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png'];

/**
 * Extract roll number from filename
 * @param {string} filename - Image filename
 * @returns {string|null} - Roll number or null if not found
 */
function extractRollNumber(filename) {
  // Remove extension
  const nameWithoutExt = path.parse(filename).name;
  
  // Match patterns like: 25MCA001, 25mca001, etc.
  const match = nameWithoutExt.match(/(\d{2}[A-Za-z]{3}\d{3})/i);
  
  if (match) {
    return match[1].toUpperCase();
  }
  
  return null;
}

/**
 * Process a single student photo
 * @param {string} photoPath - Path to photo file
 * @param {string} rollNo - Student roll number
 * @returns {Object} - Result object
 */
async function processStudentPhoto(photoPath, rollNo) {
  try {
    console.log(`\n📸 Processing ${rollNo}...`);
    
    // Check if student exists in database
    const [students] = await db.query(
      'SELECT student_id, name, class, stream, semester FROM students WHERE roll_no = ?',
      [rollNo]
    );
    
    if (students.length === 0) {
      return {
        success: false,
        rollNo,
        error: 'Student not found in database'
      };
    }
    
    const student = students[0];
    console.log(`   Found: ${student.name} (${student.class} - ${student.stream} Sem ${student.semester})`);
    
    // Detect face in image (single-face mode for student enrollment)
    console.log('   Detecting face...');
    const faceResult = await detectFaces(photoPath, true); // true = single-face mode
    
    if (!faceResult.success) {
      return {
        success: false,
        rollNo,
        studentName: student.name,
        error: `Face detection failed: ${faceResult.error}`
      };
    }
    
    if (faceResult.face_count === 0) {
      return {
        success: false,
        rollNo,
        studentName: student.name,
        error: 'No face detected in image'
      };
    }
    
    if (faceResult.face_count > 1) {
      console.log(`   ⚠ Warning: Multiple faces detected (${faceResult.face_count}), using the first one`);
    }
    
    // Get the first face encoding
    const faceEncoding = faceResult.face_encodings[0];
    
    if (!faceEncoding || faceEncoding.length === 0) {
      return {
        success: false,
        rollNo,
        studentName: student.name,
        error: 'Failed to extract face encoding'
      };
    }
    
    console.log(`   ✓ Face detected with ${faceEncoding.length} features`);
    
    // Store face embedding in database
    await db.query(
      'UPDATE students SET face_embedding = ?, updated_at = NOW() WHERE student_id = ?',
      [JSON.stringify(faceEncoding), student.student_id]
    );
    
    console.log(`   ✓ Successfully enrolled ${student.name}`);
    
    return {
      success: true,
      rollNo,
      studentName: student.name,
      studentId: student.student_id,
      featureCount: faceEncoding.length
    };
    
  } catch (error) {
    return {
      success: false,
      rollNo,
      error: error.message
    };
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Get photos directory from command line
    const photosDir = process.argv[2];
    
    if (!photosDir) {
      console.error('❌ Error: Please provide the photos directory path');
      console.log('\nUsage:');
      console.log('  node scripts/bulk-enroll-students.js <photos_directory>');
      console.log('\nExample:');
      console.log('  node scripts/bulk-enroll-students.js ./student-photos');
      console.log('\nPhoto naming convention:');
      console.log('  - Files should be named with roll numbers: 25MCA001.jpg, 25MCA002.jpg, etc.');
      console.log('  - Supported formats: .jpg, .jpeg, .png');
      process.exit(1);
    }
    
    // Check if directory exists
    try {
      const stats = await fs.stat(photosDir);
      if (!stats.isDirectory()) {
        console.error(`❌ Error: ${photosDir} is not a directory`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error: Directory not found: ${photosDir}`);
      process.exit(1);
    }
    
    console.log('🚀 AttendX Bulk Student Enrollment');
    console.log('=====================================\n');
    console.log(`📁 Photos directory: ${photosDir}`);
    
    // Read all files in directory
    const files = await fs.readdir(photosDir);
    
    // Filter image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_FORMATS.includes(ext);
    });
    
    if (imageFiles.length === 0) {
      console.error('\n❌ No image files found in the directory');
      console.log('Supported formats:', SUPPORTED_FORMATS.join(', '));
      process.exit(1);
    }
    
    console.log(`\n📋 Found ${imageFiles.length} image file(s)\n`);
    
    // Process each image
    const results = {
      success: [],
      failed: [],
      skipped: []
    };
    
    for (const file of imageFiles) {
      const rollNo = extractRollNumber(file);
      
      if (!rollNo) {
        console.log(`⊗ Skipping ${file} (cannot extract roll number)`);
        results.skipped.push({ file, reason: 'Invalid filename format' });
        continue;
      }
      
      const photoPath = path.join(photosDir, file);
      const result = await processStudentPhoto(photoPath, rollNo);
      
      if (result.success) {
        results.success.push(result);
      } else {
        results.failed.push(result);
      }
    }
    
    // Print summary
    console.log('\n\n📊 Enrollment Summary');
    console.log('=====================================');
    console.log(`✓ Successfully enrolled: ${results.success.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);
    console.log(`⊗ Skipped: ${results.skipped.length}`);
    console.log(`📁 Total processed: ${imageFiles.length}`);
    
    if (results.success.length > 0) {
      console.log('\n✅ Successfully Enrolled Students:');
      results.success.forEach(r => {
        console.log(`   • ${r.rollNo} - ${r.studentName}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed Enrollments:');
      results.failed.forEach(r => {
        console.log(`   • ${r.rollNo} - ${r.error}`);
      });
    }
    
    if (results.skipped.length > 0) {
      console.log('\n⊗ Skipped Files:');
      results.skipped.forEach(r => {
        console.log(`   • ${r.file} - ${r.reason}`);
      });
    }
    
    // Calculate success rate
    const successRate = imageFiles.length > 0 
      ? ((results.success.length / imageFiles.length) * 100).toFixed(1)
      : 0;
    
    console.log(`\n📈 Success Rate: ${successRate}%`);
    
    // Check enrollment status for a specific class (optional)
    if (results.success.length > 0) {
      const firstStudent = results.success[0];
      const [classStats] = await db.query(
        `SELECT 
          class, stream, semester,
          COUNT(*) as total_students,
          SUM(CASE WHEN face_embedding IS NOT NULL THEN 1 ELSE 0 END) as enrolled_students
        FROM students
        WHERE student_id = ?
          OR (class = (SELECT class FROM students WHERE student_id = ?)
              AND stream = (SELECT stream FROM students WHERE student_id = ?)
              AND semester = (SELECT semester FROM students WHERE student_id = ?))
        GROUP BY class, stream, semester`,
        [firstStudent.studentId, firstStudent.studentId, firstStudent.studentId, firstStudent.studentId]
      );
      
      if (classStats.length > 0) {
        const stats = classStats[0];
        const enrollmentPercentage = (stats.enrolled_students / stats.total_students * 100).toFixed(1);
        console.log(`\n📊 Class Enrollment Status (${stats.class} - ${stats.stream} Sem ${stats.semester}):`);
        console.log(`   Total Students: ${stats.total_students}`);
        console.log(`   Enrolled: ${stats.enrolled_students} (${enrollmentPercentage}%)`);
        
        if (enrollmentPercentage >= 80) {
          console.log('   ✅ Class is ready for attendance capture (≥80% enrolled)');
        } else {
          console.log(`   ⚠ Warning: Need ${Math.ceil(stats.total_students * 0.8) - stats.enrolled_students} more students enrolled for attendance`);
        }
      }
    }
    
    console.log('\n✨ Enrollment process completed!\n');
    
    process.exit(results.failed.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
