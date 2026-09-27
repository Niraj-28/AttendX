-- ================================================================
-- ADD 4 STANDARD SUBJECTS TO ALL FACULTY MEMBERS
-- ================================================================
-- This script adds the 4 common subjects to all existing faculty
-- Subjects: Cloud Computing, Data Structures, Database Management, Operating Systems
-- ================================================================

-- First, let's see current faculty
SELECT '=== Current Faculty ===' as info;
SELECT faculty_id, name, email FROM faculty ORDER BY faculty_id;

-- Current subjects
SELECT '=== Current Subjects ===' as info;
SELECT subject_id, subject_code, subject_name, faculty_id FROM subjects ORDER BY subject_id;

-- Delete existing subjects (to avoid duplicates and start fresh)
-- WARNING: This will delete all subjects and recreate them
-- Comment out this line if you want to keep existing subjects
DELETE FROM subjects;

-- Reset auto-increment
ALTER TABLE subjects AUTO_INCREMENT = 1;

-- Add 4 subjects for each faculty member
-- Faculty 1: Dr. John Doe (faculty_id = 1)
INSERT INTO subjects (subject_code, subject_name, faculty_id, department, semester) VALUES
  ('CS101', 'Cloud Computing', 1, 'Computer Science', 6),
  ('CS102', 'Data Structures', 1, 'Computer Science', 6),
  ('CS103', 'Database Management', 1, 'Computer Science', 6),
  ('CS104', 'Operating Systems', 1, 'Computer Science', 6);

-- Faculty 2: Prof. Jane Smith (faculty_id = 2)
INSERT INTO subjects (subject_code, subject_name, faculty_id, department, semester) VALUES
  ('IT101', 'Cloud Computing', 2, 'Information Technology', 5),
  ('IT102', 'Data Structures', 2, 'Information Technology', 5),
  ('IT103', 'Database Management', 2, 'Information Technology', 5),
  ('IT104', 'Operating Systems', 2, 'Information Technology', 5);

-- Faculty 6: Dr. Saurin Parikh (faculty_id = 6)
INSERT INTO subjects (subject_code, subject_name, faculty_id, department, semester) VALUES
  ('MCA101', 'Cloud Computing', 6, 'Computer Science', 3),
  ('MCA102', 'Data Structures', 6, 'Computer Science', 3),
  ('MCA103', 'Database Management', 6, 'Computer Science', 3),
  ('MCA104', 'Operating Systems', 6, 'Computer Science', 3);

-- Faculty 7: Dr. Lata Gohil (faculty_id = 7)
INSERT INTO subjects (subject_code, subject_name, faculty_id, department, semester) VALUES
  ('MCA201', 'Cloud Computing', 7, 'Computer Science', 3),
  ('MCA202', 'Data Structures', 7, 'Computer Science', 3),
  ('MCA203', 'Database Management', 7, 'Computer Science', 3),
  ('MCA204', 'Operating Systems', 7, 'Computer Science', 3);

-- Faculty 8: Dr. Devendra Vashi (faculty_id = 8)
INSERT INTO subjects (subject_code, subject_name, faculty_id, department, semester) VALUES
  ('MCA301', 'Cloud Computing', 8, 'Computer Science', 3),
  ('MCA302', 'Data Structures', 8, 'Computer Science', 3),
  ('MCA303', 'Database Management', 8, 'Computer Science', 3),
  ('MCA304', 'Operating Systems', 8, 'Computer Science', 3);

-- Add subjects for any additional faculty (if faculty_id 3, 4, 5, 9, 10 exist)
-- Check if they exist and add subjects conditionally
INSERT INTO subjects (subject_code, subject_name, faculty_id, department, semester)
SELECT 'GEN101', 'Cloud Computing', faculty_id, department, 3 FROM faculty WHERE faculty_id = 3
UNION ALL
SELECT 'GEN102', 'Data Structures', faculty_id, department, 3 FROM faculty WHERE faculty_id = 3
UNION ALL
SELECT 'GEN103', 'Database Management', faculty_id, department, 3 FROM faculty WHERE faculty_id = 3
UNION ALL
SELECT 'GEN104', 'Operating Systems', faculty_id, department, 3 FROM faculty WHERE faculty_id = 3
UNION ALL
SELECT 'GEN201', 'Cloud Computing', faculty_id, department, 3 FROM faculty WHERE faculty_id = 4
UNION ALL
SELECT 'GEN202', 'Data Structures', faculty_id, department, 3 FROM faculty WHERE faculty_id = 4
UNION ALL
SELECT 'GEN203', 'Database Management', faculty_id, department, 3 FROM faculty WHERE faculty_id = 4
UNION ALL
SELECT 'GEN204', 'Operating Systems', faculty_id, department, 3 FROM faculty WHERE faculty_id = 4
UNION ALL
SELECT 'GEN301', 'Cloud Computing', faculty_id, department, 3 FROM faculty WHERE faculty_id = 5
UNION ALL
SELECT 'GEN302', 'Data Structures', faculty_id, department, 3 FROM faculty WHERE faculty_id = 5
UNION ALL
SELECT 'GEN303', 'Database Management', faculty_id, department, 3 FROM faculty WHERE faculty_id = 5
UNION ALL
SELECT 'GEN304', 'Operating Systems', faculty_id, department, 3 FROM faculty WHERE faculty_id = 5
UNION ALL
SELECT 'GEN401', 'Cloud Computing', faculty_id, department, 3 FROM faculty WHERE faculty_id = 9
UNION ALL
SELECT 'GEN402', 'Data Structures', faculty_id, department, 3 FROM faculty WHERE faculty_id = 9
UNION ALL
SELECT 'GEN403', 'Database Management', faculty_id, department, 3 FROM faculty WHERE faculty_id = 9
UNION ALL
SELECT 'GEN404', 'Operating Systems', faculty_id, department, 3 FROM faculty WHERE faculty_id = 9
UNION ALL
SELECT 'GEN501', 'Cloud Computing', faculty_id, department, 3 FROM faculty WHERE faculty_id = 10
UNION ALL
SELECT 'GEN502', 'Data Structures', faculty_id, department, 3 FROM faculty WHERE faculty_id = 10
UNION ALL
SELECT 'GEN503', 'Database Management', faculty_id, department, 3 FROM faculty WHERE faculty_id = 10
UNION ALL
SELECT 'GEN504', 'Operating Systems', faculty_id, department, 3 FROM faculty WHERE faculty_id = 10;

-- Show final results
SELECT '=== Subjects Added Successfully ===' as info;
SELECT 
  s.subject_id,
  s.subject_code,
  s.subject_name,
  s.faculty_id,
  f.name as faculty_name,
  s.department,
  s.semester
FROM subjects s
JOIN faculty f ON s.faculty_id = f.faculty_id
ORDER BY s.faculty_id, s.subject_id;

-- Count subjects per faculty
SELECT '=== Subjects Per Faculty ===' as info;
SELECT 
  f.faculty_id,
  f.name as faculty_name,
  COUNT(s.subject_id) as subject_count
FROM faculty f
LEFT JOIN subjects s ON f.faculty_id = s.faculty_id
GROUP BY f.faculty_id, f.name
ORDER BY f.faculty_id;

-- ================================================================
-- INSTRUCTIONS:
-- Run: mysql -u root attendx < database/add_subjects_to_all_faculty.sql
-- ================================================================
