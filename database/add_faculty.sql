-- Add New Faculty Records
-- Run this script: mysql -u root attendx < database/add_faculty.sql

-- Template: Copy and modify as needed
-- INSERT INTO faculty (name, email, department, phone, password_hash)
-- VALUES ('Name', 'email@university.edu', 'Department', 'Phone', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F');

-- Example: Add a new faculty member
INSERT INTO faculty (name, email, department, phone, password_hash)
VALUES 
  ('Dr. Amit Patel', 'amit.patel@nirmauni.ac.in', 'Computer Science', '9876543212', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F');

-- Add more faculty members below (uncomment and modify as needed):

-- INSERT INTO faculty (name, email, department, phone, password_hash)
-- VALUES 
--   ('Dr. Priya Shah', 'priya.shah@nirmauni.ac.in', 'Information Technology', '9876543213', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F'),
--   ('Prof. Rajesh Kumar', 'rajesh.kumar@nirmauni.ac.in', 'Computer Science', '9876543214', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F'),
--   ('Dr. Neha Desai', 'neha.desai@nirmauni.ac.in', 'AI & Machine Learning', '9876543215', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F');

-- Password for all faculty: admin123
-- Password hash: $2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F

-- To verify the inserted records:
SELECT faculty_id, name, email, department, phone, created_at 
FROM faculty 
ORDER BY faculty_id DESC 
LIMIT 5;
