# Bulk Student Photo Enrollment Guide

This guide explains how to enroll multiple students at once using their photos.

## Prerequisites

1. All students must already exist in the database
2. Student photos should be individual headshots (one face per photo)
3. Photos should be named with the student's roll number

## Photo Requirements

### File Naming Convention
Photos must be named with the student's roll number:
- ✅ `25MCA001.jpg`
- ✅ `25MCA026.png`
- ✅ `25mca043.jpeg` (case insensitive)
- ❌ `student1.jpg` (no roll number)
- ❌ `John_Doe.jpg` (name instead of roll number)

### Photo Quality Guidelines
- **Format**: JPG, JPEG, or PNG
- **Face visibility**: Face should be clearly visible and well-lit
- **Single face**: Only one face per photo (student enrollment mode)
- **Size**: Face should occupy at least 20% of the image
- **Resolution**: Minimum 300x300 pixels recommended
- **Frontal view**: Student should face the camera directly

## Step-by-Step Process

### 1. Organize Your Photos

Create a folder with all student photos:
```
student-photos/
├── 25MCA001.jpg
├── 25MCA002.jpg
├── 25MCA003.jpg
├── ...
└── 25MCA058.jpg
```

### 2. Run the Enrollment Script

From the backend directory, run:

```bash
node scripts/bulk-enroll-students.js ./path/to/student-photos
```

Example:
```bash
node scripts/bulk-enroll-students.js D:/student-photos
```

### 3. Review the Results

The script will output:
- ✅ Successfully enrolled students
- ❌ Failed enrollments (with reasons)
- ⊗ Skipped files (invalid naming)
- 📊 Enrollment statistics

Example output:
```
🚀 AttendX Bulk Student Enrollment
=====================================

📁 Photos directory: D:/student-photos

📋 Found 58 image file(s)

📸 Processing 25MCA001...
   Found: John Doe (A - MCA Sem 3)
   Detecting face...
   ✓ Face detected with 4825 features
   ✓ Successfully enrolled John Doe

...

📊 Enrollment Summary
=====================================
✓ Successfully enrolled: 55
✗ Failed: 3
⊗ Skipped: 0
📁 Total processed: 58

📈 Success Rate: 94.8%

📊 Class Enrollment Status (A - MCA Sem 3):
   Total Students: 58
   Enrolled: 55 (94.8%)
   ✅ Class is ready for attendance capture (≥80% enrolled)
```

## Troubleshooting

### Common Issues

#### "Student not found in database"
**Cause**: The roll number in the filename doesn't match any student in the database.

**Solution**: 
- Check if the student exists in the database
- Verify the roll number is correct
- Ensure the filename matches exactly

#### "No face detected in image"
**Cause**: The image quality is poor, face is too small, or face is not visible.

**Solution**:
- Use a better quality photo
- Ensure the face is clearly visible
- Make sure the face occupies at least 20% of the image
- Check lighting conditions

#### "Multiple faces detected"
**Cause**: The photo contains more than one person.

**Solution**:
- Use individual student photos
- Crop the image to show only one student
- The script will use the first detected face but this may not be accurate

### Checking Enrollment Status

To check how many students are enrolled for a specific class:

```sql
SELECT 
  class, stream, semester,
  COUNT(*) as total_students,
  SUM(CASE WHEN face_embedding IS NOT NULL THEN 1 ELSE 0 END) as enrolled_students,
  ROUND((SUM(CASE WHEN face_embedding IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as enrollment_percentage
FROM students
WHERE class = 'A' AND stream = 'MCA' AND semester = 3
GROUP BY class, stream, semester;
```

### Re-enrolling a Student

If you need to update a student's face embedding:
1. Simply run the script again with the new photo
2. The script will overwrite the existing embedding

## Best Practices

1. **Test with a few photos first**: Process 2-3 photos to verify everything works
2. **Consistent lighting**: Use photos taken in similar lighting conditions
3. **Standard poses**: Use passport-style photos (front-facing, neutral expression)
4. **Backup database**: Before bulk operations, backup your database
5. **Verify results**: Check the enrollment summary to ensure high success rate
6. **Minimum 80% enrollment**: Aim to enroll at least 80% of students before taking attendance

## Attendance Capture Requirements

The system requires **at least 80% of students** to be enrolled with face embeddings before allowing attendance capture. This prevents:
- False positive matches
- Incorrect identifications
- Low accuracy results

Example:
- Class size: 58 students
- Minimum enrolled: 47 students (80%)
- Current enrolled: 55 students (94.8%) ✅ Ready

## Next Steps

After enrolling students:
1. Verify enrollment percentage is ≥80%
2. Create a session in the faculty dashboard
3. Capture classroom photo for attendance
4. Review marked attendance and adjust if needed

## Support

If you encounter issues:
1. Check the console output for error details
2. Verify photo quality and naming
3. Ensure students exist in database
4. Check Python face detection service is running
