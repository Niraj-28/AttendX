-- ================================================================
-- INSERT MULTIPLE FACULTY MEMBERS
-- ================================================================
-- Password for all faculty: f123
-- Password Hash: $2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni
--
-- Instructions:
-- 1. Update the name and email fields below
-- 2. Optionally update department and phone
-- 3. Run: mysql -u root attendx < database/insert_multiple_faculty.sql
-- ================================================================

INSERT INTO faculty (name, email, department, phone, password_hash)
VALUES 
  -- Faculty 1 - Update name and email
  ('Dr. Faculty Name 1', 'faculty1@nirmauni.ac.in', 'Computer Science', '9876543220', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni'),
  
  -- Faculty 2 - Update name and email
  ('Prof. Faculty Name 2', 'faculty2@nirmauni.ac.in', 'Information Technology', '9876543221', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni'),
  
  -- Faculty 3 - Update name and email
  ('Dr. Faculty Name 3', 'faculty3@nirmauni.ac.in', 'Computer Science', '9876543222', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni'),
  
  -- Faculty 4 - Update name and email
  ('Dr. Faculty Name 4', 'faculty4@nirmauni.ac.in', 'AI & Machine Learning', '9876543223', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni'),
  
  -- Faculty 5 - Update name and email
  ('Prof. Faculty Name 5', 'faculty5@nirmauni.ac.in', 'Data Science', '9876543224', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni'),
  
  -- Faculty 6 - Update name and email
  ('Dr. Faculty Name 6', 'faculty6@nirmauni.ac.in', 'Cyber Security', '9876543225', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni'),
  
  -- Faculty 7 - Update name and email
  ('Prof. Faculty Name 7', 'faculty7@nirmauni.ac.in', 'Computer Science', '9876543226', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni'),
  
  -- Faculty 8 - Update name and email
  ('Dr. Faculty Name 8', 'faculty8@nirmauni.ac.in', 'Information Technology', '9876543227', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni'),
  
  -- Faculty 9 - Update name and email
  ('Dr. Faculty Name 9', 'faculty9@nirmauni.ac.in', 'Computer Science', '9876543228', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni'),
  
  -- Faculty 10 - Update name and email
  ('Prof. Faculty Name 10', 'faculty10@nirmauni.ac.in', 'AI & Machine Learning', '9876543229', '$2a$10$Pc9pb.Zwal3KBrIszc.U5.vEjNoTsf3AVcfOh40y7H92DMpYwoMni');

-- ================================================================
-- VERIFY THE INSERTED RECORDS
-- ================================================================
SELECT 
  faculty_id, 
  name, 
  email, 
  department, 
  phone,
  DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
FROM faculty 
ORDER BY faculty_id DESC 
LIMIT 15;

-- ================================================================
-- QUICK REFERENCE
-- ================================================================
-- To run this file:
--   mysql -u root attendx < database/insert_multiple_faculty.sql
--
-- To verify after running:
--   mysql -u root attendx -e "SELECT faculty_id, name, email, department FROM faculty;"
--
-- To count total faculty:
--   mysql -u root attendx -e "SELECT COUNT(*) as total_faculty FROM faculty;"
--
-- Login credentials for all new faculty:
--   Email: [email you set]
--   Password: f123
--   Role: Faculty
-- ================================================================
