-- AttendX - Useful Database Queries
-- Common queries for development and testing

USE attendx;

-- ========================================
-- ATTENDANCE QUERIES
-- ========================================

-- Get attendance for a specific session
SELECT 
    s.roll_no,
    s.name,
    a.status,
    a.marked_at,
    a.confidence_score,
    a.face_detected
FROM attendance a
JOIN students s ON a.student_id = s.student_id
WHERE a.session_id = 1
ORDER BY s.roll_no;

-- Get attendance summary for a student
SELECT 
    st.roll_no,
    st.name,
    sub.subject_name,
    ses.session_date,
    a.status
FROM attendance a
JOIN students st ON a.student_id = st.student_id
JOIN sessions ses ON a.session_id = ses.session_id
JOIN subjects sub ON ses.subject_id = sub.subject_id
WHERE st.student_id = 1
ORDER BY ses.session_date DESC;

-- Get attendance percentage by student
SELECT 
    s.roll_no,
    s.name,
    s.class,
    COUNT(a.attendance_id) as total_classes,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
    ROUND(
        (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0) / COUNT(a.attendance_id),
        2
    ) as attendance_percentage
FROM students s
LEFT JOIN attendance a ON s.student_id = a.student_id
WHERE s.class = '6-CS-A'
GROUP BY s.student_id, s.roll_no, s.name, s.class
ORDER BY s.roll_no;

-- Get attendance report by subject
SELECT 
    sub.subject_name,
    ses.session_date,
    ses.class,
    ses.total_students,
    ses.present_count,
    ses.absent_count,
    ROUND((ses.present_count * 100.0) / ses.total_students, 2) as attendance_percentage
FROM sessions ses
JOIN subjects sub ON ses.subject_id = sub.subject_id
WHERE sub.subject_id = 1
ORDER BY ses.session_date DESC;

-- Get students with low attendance (< 75%)
SELECT 
    s.roll_no,
    s.name,
    s.class,
    COUNT(a.attendance_id) as total_classes,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
    ROUND(
        (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0) / COUNT(a.attendance_id),
        2
    ) as attendance_percentage
FROM students s
LEFT JOIN attendance a ON s.student_id = a.student_id
GROUP BY s.student_id
HAVING attendance_percentage < 75.0
ORDER BY attendance_percentage ASC;

-- Get attendance for date range
SELECT 
    s.roll_no,
    s.name,
    COUNT(a.attendance_id) as total_classes,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
    ROUND(
        (SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100.0) / COUNT(a.attendance_id),
        2
    ) as attendance_percentage
FROM students s
JOIN attendance a ON s.student_id = a.student_id
JOIN sessions ses ON a.session_id = ses.session_id
WHERE ses.session_date BETWEEN '2024-01-01' AND '2024-01-31'
    AND s.class = '6-CS-A'
GROUP BY s.student_id, s.roll_no, s.name
ORDER BY s.roll_no;

-- ========================================
-- SESSION QUERIES
-- ========================================

-- Get all active sessions
SELECT 
    ses.session_id,
    f.name as faculty_name,
    sub.subject_name,
    ses.class,
    ses.start_time,
    ses.status
FROM sessions ses
JOIN faculty f ON ses.faculty_id = f.faculty_id
JOIN subjects sub ON ses.subject_id = sub.subject_id
WHERE ses.status = 'active';

-- Get session details with statistics
SELECT 
    ses.session_id,
    f.name as faculty_name,
    sub.subject_name,
    ses.class,
    ses.session_date,
    ses.start_time,
    ses.end_time,
    ses.total_students,
    ses.present_count,
    ses.absent_count,
    ROUND((ses.present_count * 100.0) / ses.total_students, 2) as attendance_percentage
FROM sessions ses
JOIN faculty f ON ses.faculty_id = f.faculty_id
JOIN subjects sub ON ses.subject_id = sub.subject_id
WHERE ses.status = 'completed'
ORDER BY ses.session_date DESC
LIMIT 10;

-- ========================================
-- STUDENT QUERIES
-- ========================================

-- Get all students by class
SELECT 
    roll_no,
    name,
    email,
    phone,
    department,
    semester,
    is_active
FROM students
WHERE class = '6-CS-A'
ORDER BY roll_no;

-- Get students without photos
SELECT 
    student_id,
    roll_no,
    name,
    email,
    class
FROM students
WHERE photo_url IS NULL OR face_embedding IS NULL;

-- ========================================
-- FACULTY QUERIES
-- ========================================

-- Get faculty with subjects
SELECT 
    f.faculty_id,
    f.name as faculty_name,
    f.department,
    GROUP_CONCAT(sub.subject_name SEPARATOR ', ') as subjects
FROM faculty f
LEFT JOIN subjects sub ON f.faculty_id = sub.faculty_id
GROUP BY f.faculty_id, f.name, f.department;

-- ========================================
-- ANALYTICS QUERIES
-- ========================================

-- Daily attendance summary
SELECT 
    ses.session_date,
    COUNT(DISTINCT ses.session_id) as total_sessions,
    SUM(ses.total_students) as total_student_slots,
    SUM(ses.present_count) as total_present,
    ROUND((SUM(ses.present_count) * 100.0) / SUM(ses.total_students), 2) as overall_attendance_percentage
FROM sessions ses
WHERE ses.status = 'completed'
GROUP BY ses.session_date
ORDER BY ses.session_date DESC;

-- Subject-wise attendance analysis
SELECT 
    sub.subject_name,
    COUNT(ses.session_id) as total_sessions,
    AVG(ses.present_count) as avg_present,
    AVG((ses.present_count * 100.0) / ses.total_students) as avg_attendance_percentage
FROM sessions ses
JOIN subjects sub ON ses.subject_id = sub.subject_id
WHERE ses.status = 'completed'
GROUP BY sub.subject_id, sub.subject_name
ORDER BY avg_attendance_percentage DESC;

-- Class-wise attendance statistics
SELECT 
    ses.class,
    COUNT(DISTINCT ses.session_id) as total_sessions,
    AVG(ses.present_count) as avg_present,
    ROUND(AVG((ses.present_count * 100.0) / ses.total_students), 2) as avg_attendance_percentage
FROM sessions ses
WHERE ses.status = 'completed'
GROUP BY ses.class
ORDER BY ses.class;

-- ========================================
-- AUDIT & MONITORING
-- ========================================

-- Recent activities
SELECT 
    user_type,
    action,
    table_name,
    created_at
FROM audit_log
ORDER BY created_at DESC
LIMIT 20;

-- Notification status
SELECT 
    notification_type,
    status,
    COUNT(*) as count
FROM notifications
GROUP BY notification_type, status;

-- ========================================
-- DATA CLEANUP QUERIES
-- ========================================

-- Delete old audit logs (older than 90 days)
-- DELETE FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Archive old sessions (older than 1 year)
-- UPDATE sessions SET status = 'archived' WHERE session_date < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);
