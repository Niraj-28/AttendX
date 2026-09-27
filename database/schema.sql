-- AttendX Database Schema
-- MySQL Database for Automated Attendance System

-- Create database
CREATE DATABASE IF NOT EXISTS attendx;
USE attendx;

-- Faculty table
CREATE TABLE IF NOT EXISTS faculty (
    faculty_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INT PRIMARY KEY AUTO_INCREMENT,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    faculty_id INT,
    department VARCHAR(100),
    semester INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE SET NULL,
    INDEX idx_subject_code (subject_code),
    INDEX idx_faculty (faculty_id)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    stream VARCHAR(100),
    class VARCHAR(50),
    department VARCHAR(100),
    semester INT,
    face_embedding TEXT,
    photo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_roll_no (roll_no),
    INDEX idx_email (email),
    INDEX idx_class (class),
    INDEX idx_stream (stream)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_id INT NOT NULL,
    subject_id INT,
    class VARCHAR(50),
    session_date DATE NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    captured_image_url VARCHAR(255),
    total_students INT DEFAULT 0,
    present_count INT DEFAULT 0,
    absent_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL,
    INDEX idx_faculty (faculty_id),
    INDEX idx_date (session_date),
    INDEX idx_status (status)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'absent') DEFAULT 'absent',
    marked_at DATETIME,
    confidence_score DECIMAL(5,4),
    face_detected BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_student (session_id, student_id),
    INDEX idx_session (session_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
);

-- Notifications table (for SNS tracking)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT,
    faculty_id INT,
    notification_type VARCHAR(50),
    message TEXT,
    sent_at DATETIME,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_faculty (faculty_id)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    user_type ENUM('faculty', 'student', 'system'),
    action VARCHAR(100),
    table_name VARCHAR(50),
    record_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id, user_type),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Insert sample faculty (password: 'admin123', hashed with bcrypt)
INSERT INTO faculty (name, email, password_hash, phone, department) VALUES
('Dr. John Doe', 'john.doe@university.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543210', 'Computer Science'),
('Prof. Jane Smith', 'jane.smith@university.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543211', 'Information Technology');

-- Insert sample subjects
INSERT INTO subjects (subject_code, subject_name, faculty_id, department, semester) VALUES
('CS101', 'Cloud Computing', 1, 'Computer Science', 6),
('CS102', 'Machine Learning', 1, 'Computer Science', 6),
('IT101', 'Web Development', 2, 'Information Technology', 5);

-- Insert sample students (password: 'student123')
INSERT INTO students (roll_no, name, email, password_hash, phone, class, department, semester) VALUES
('21CS001', 'Alice Johnson', 'alice@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543220', '6-CS-A', 'Computer Science', 6),
('21CS002', 'Bob Williams', 'bob@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543221', '6-CS-A', 'Computer Science', 6),
('21CS003', 'Charlie Brown', 'charlie@student.edu', '$2a$10$rP5qV5E5xRQYJ5F5E5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', '9876543222', '6-CS-A', 'Computer Science', 6);
