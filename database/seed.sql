-- AttendX Database Seed Data
-- Sample data for testing and development

USE attendx;

-- Clear existing data (optional - uncomment if needed)
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE attendance;
-- TRUNCATE TABLE notifications;
-- TRUNCATE TABLE sessions;
-- TRUNCATE TABLE students;
-- TRUNCATE TABLE subjects;
-- TRUNCATE TABLE faculty;
-- SET FOREIGN_KEY_CHECKS = 1;

-- Insert Faculty Members
INSERT INTO faculty (name, email, password_hash, phone, department) VALUES
('Dr. John Doe', 'john.doe@university.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543210', 'Computer Science'),
('Prof. Jane Smith', 'jane.smith@university.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543211', 'Information Technology'),
('Dr. Michael Brown', 'michael.brown@university.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543212', 'Computer Science'),
('Prof. Sarah Wilson', 'sarah.wilson@university.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543213', 'Information Technology');

-- Insert Subjects
INSERT INTO subjects (subject_code, subject_name, faculty_id, department, semester) VALUES
('CS601', 'Cloud Computing', 1, 'Computer Science', 6),
('CS602', 'Machine Learning', 1, 'Computer Science', 6),
('CS603', 'Data Mining', 3, 'Computer Science', 6),
('IT601', 'Web Development', 2, 'Information Technology', 6),
('IT602', 'Mobile Application Development', 4, 'Information Technology', 6),
('CS501', 'Database Management Systems', 1, 'Computer Science', 5),
('IT501', 'Software Engineering', 2, 'Information Technology', 5);

-- Insert Students - Class 6-CS-A
INSERT INTO students (roll_no, name, email, password_hash, phone, class, department, semester, is_active) VALUES
('21CS001', 'Alice Johnson', 'alice@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543220', '6-CS-A', 'Computer Science', 6, TRUE),
('21CS002', 'Bob Williams', 'bob@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543221', '6-CS-A', 'Computer Science', 6, TRUE),
('21CS003', 'Charlie Brown', 'charlie@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543222', '6-CS-A', 'Computer Science', 6, TRUE),
('21CS004', 'David Lee', 'david@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543223', '6-CS-A', 'Computer Science', 6, TRUE),
('21CS005', 'Emma Davis', 'emma@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543224', '6-CS-A', 'Computer Science', 6, TRUE),
('21CS006', 'Frank Miller', 'frank@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543225', '6-CS-A', 'Computer Science', 6, TRUE),
('21CS007', 'Grace Taylor', 'grace@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543226', '6-CS-A', 'Computer Science', 6, TRUE),
('21CS008', 'Henry Anderson', 'henry@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543227', '6-CS-A', 'Computer Science', 6, TRUE);

-- Insert Students - Class 6-CS-B
INSERT INTO students (roll_no, name, email, password_hash, phone, class, department, semester, is_active) VALUES
('21CS051', 'Isabella Thomas', 'isabella@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543228', '6-CS-B', 'Computer Science', 6, TRUE),
('21CS052', 'Jack Martinez', 'jack@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543229', '6-CS-B', 'Computer Science', 6, TRUE),
('21CS053', 'Kate Robinson', 'kate@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543230', '6-CS-B', 'Computer Science', 6, TRUE),
('21CS054', 'Liam White', 'liam@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543231', '6-CS-B', 'Computer Science', 6, TRUE);

-- Insert Students - Class 6-IT-A
INSERT INTO students (roll_no, name, email, password_hash, phone, class, department, semester, is_active) VALUES
('21IT001', 'Mia Harris', 'mia@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543232', '6-IT-A', 'Information Technology', 6, TRUE),
('21IT002', 'Noah Clark', 'noah@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543233', '6-IT-A', 'Information Technology', 6, TRUE),
('21IT003', 'Olivia Lewis', 'olivia@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543234', '6-IT-A', 'Information Technology', 6, TRUE),
('21IT004', 'Peter Walker', 'peter@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543235', '6-IT-A', 'Information Technology', 6, TRUE);

-- Insert Sample Sessions (Past and Current)
INSERT INTO sessions (faculty_id, subject_id, class, session_date, start_time, end_time, status, total_students, present_count, absent_count) VALUES
(1, 1, '6-CS-A', '2024-01-10', '2024-01-10 10:00:00', '2024-01-10 10:50:00', 'completed', 8, 7, 1),
(1, 1, '6-CS-A', '2024-01-12', '2024-01-12 10:00:00', '2024-01-12 10:50:00', 'completed', 8, 8, 0),
(1, 2, '6-CS-A', '2024-01-11', '2024-01-11 11:00:00', '2024-01-11 11:50:00', 'completed', 8, 6, 2),
(2, 4, '6-IT-A', '2024-01-10', '2024-01-10 14:00:00', '2024-01-10 14:50:00', 'completed', 4, 4, 0),
(3, 3, '6-CS-B', '2024-01-11', '2024-01-11 09:00:00', '2024-01-11 09:50:00', 'completed', 4, 3, 1);

-- Insert Sample Attendance Records for Session 1
INSERT INTO attendance (session_id, student_id, status, marked_at, confidence_score, face_detected) VALUES
(1, 1, 'present', '2024-01-10 10:05:00', 0.9523, TRUE),
(1, 2, 'present', '2024-01-10 10:05:00', 0.9312, TRUE),
(1, 3, 'absent', NULL, NULL, FALSE),
(1, 4, 'present', '2024-01-10 10:05:00', 0.9654, TRUE),
(1, 5, 'present', '2024-01-10 10:05:00', 0.9487, TRUE),
(1, 6, 'present', '2024-01-10 10:05:00', 0.9201, TRUE),
(1, 7, 'present', '2024-01-10 10:05:00', 0.9789, TRUE),
(1, 8, 'present', '2024-01-10 10:05:00', 0.9412, TRUE);

-- Insert Sample Attendance Records for Session 2
INSERT INTO attendance (session_id, student_id, status, marked_at, confidence_score, face_detected) VALUES
(2, 1, 'present', '2024-01-12 10:05:00', 0.9612, TRUE),
(2, 2, 'present', '2024-01-12 10:05:00', 0.9423, TRUE),
(2, 3, 'present', '2024-01-12 10:05:00', 0.9301, TRUE),
(2, 4, 'present', '2024-01-12 10:05:00', 0.9578, TRUE),
(2, 5, 'present', '2024-01-12 10:05:00', 0.9690, TRUE),
(2, 6, 'present', '2024-01-12 10:05:00', 0.9234, TRUE),
(2, 7, 'present', '2024-01-12 10:05:00', 0.9812, TRUE),
(2, 8, 'present', '2024-01-12 10:05:00', 0.9445, TRUE);

-- Insert Sample Notifications
INSERT INTO notifications (session_id, faculty_id, notification_type, message, sent_at, status) VALUES
(1, 1, 'attendance_complete', 'Attendance marked for Cloud Computing - 6-CS-A. Present: 7/8', '2024-01-10 10:06:00', 'sent'),
(2, 1, 'attendance_complete', 'Attendance marked for Cloud Computing - 6-CS-A. Present: 8/8', '2024-01-12 10:06:00', 'sent'),
(3, 1, 'attendance_complete', 'Attendance marked for Machine Learning - 6-CS-A. Present: 6/8', '2024-01-11 11:06:00', 'sent');

-- Verify data insertion
SELECT 'Faculty count:' as Info, COUNT(*) as Count FROM faculty
UNION ALL
SELECT 'Subjects count:', COUNT(*) FROM subjects
UNION ALL
SELECT 'Students count:', COUNT(*) FROM students
UNION ALL
SELECT 'Sessions count:', COUNT(*) FROM sessions
UNION ALL
SELECT 'Attendance records:', COUNT(*) FROM attendance
UNION ALL
SELECT 'Notifications count:', COUNT(*) FROM notifications;

SELECT '✓ Database seeded successfully!' as Status;
