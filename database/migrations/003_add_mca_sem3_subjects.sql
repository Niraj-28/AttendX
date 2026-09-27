-- Migration: Add MCA Semester 3 subjects
-- Date: 2026-09-27
-- Description: Add stream column to subjects table and insert MCA Semester 3 subjects

-- Step 1: Add stream column (ignore error if already exists)
ALTER TABLE subjects ADD COLUMN stream VARCHAR(100) DEFAULT NULL AFTER subject_name;

-- Step 2: Insert subjects for MCA Semester 3 (using faculty_id = 7 as default, can be changed)
INSERT INTO subjects (subject_code, subject_name, stream, semester, faculty_id, department, created_at) VALUES
('MCA301', 'Artificial Intelligence', 'MCA', 3, 7, 'Computer Science', NOW()),
('MCA302', 'Big Data Analysis', 'MCA', 3, 7, 'Computer Science', NOW()),
('MCA303', 'Cloud Computing', 'MCA', 3, 7, 'Computer Science', NOW()),
('MCA304', 'Deep Learning', 'MCA', 3, 7, 'Computer Science', NOW()),
('MCA305', 'Machine Learning', 'MCA', 3, 7, 'Computer Science', NOW()),
('MCA306', 'Mobile App Development Technology', 'MCA', 3, 7, 'Computer Science', NOW())
ON DUPLICATE KEY UPDATE 
  subject_name = VALUES(subject_name),
  stream = VALUES(stream);

-- Step 3: Verify insertion
SELECT subject_id, subject_code, subject_name, stream, semester, faculty_id 
FROM subjects 
WHERE stream = 'MCA' AND semester = 3 
ORDER BY subject_name;
