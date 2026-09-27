# AttendX - Entity Relationship Diagram

## Database Schema Overview

### Tables
1. **faculty** - Faculty/Teacher information
2. **subjects** - Courses/Subjects taught
3. **students** - Student information with face embeddings
4. **sessions** - Attendance sessions
5. **attendance** - Individual attendance records
6. **notifications** - SNS notification tracking
7. **audit_log** - System activity logs

---

## Entity Relationships

```
faculty (1) ----< (N) subjects
   |
   |
   +---------< (N) sessions
   |
   +---------< (N) notifications

subjects (1) ----< (N) sessions

students (N) ----< (N) attendance >---- (N) sessions
   
sessions (1) ----< (N) attendance
   |
   +---------< (N) notifications
```

---

## Table Definitions

### 1. faculty
**Description**: Stores faculty/teacher information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| faculty_id | INT | PK, AUTO_INCREMENT | Unique faculty identifier |
| name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| phone | VARCHAR(15) | | Contact number |
| department | VARCHAR(100) | | Department name |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes**: idx_email

---

### 2. subjects
**Description**: Stores subject/course information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| subject_id | INT | PK, AUTO_INCREMENT | Unique subject identifier |
| subject_code | VARCHAR(20) | UNIQUE, NOT NULL | Subject code (e.g., CS601) |
| subject_name | VARCHAR(100) | NOT NULL | Subject name |
| faculty_id | INT | FK → faculty | Faculty teaching the subject |
| department | VARCHAR(100) | | Department name |
| semester | INT | | Semester number |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Foreign Keys**: 
- faculty_id → faculty(faculty_id) ON DELETE SET NULL

**Indexes**: idx_subject_code, idx_faculty

---

### 3. students
**Description**: Stores student information and face embeddings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| student_id | INT | PK, AUTO_INCREMENT | Unique student identifier |
| roll_no | VARCHAR(50) | UNIQUE, NOT NULL | Student roll number |
| name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| phone | VARCHAR(15) | | Contact number |
| class | VARCHAR(50) | | Class name (e.g., 6-CS-A) |
| department | VARCHAR(100) | | Department name |
| semester | INT | | Semester number |
| face_embedding | TEXT | | JSON array of face encoding |
| photo_url | VARCHAR(255) | | S3 URL of student photo |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes**: idx_roll_no, idx_email, idx_class

---

### 4. sessions
**Description**: Stores attendance session information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| session_id | INT | PK, AUTO_INCREMENT | Unique session identifier |
| faculty_id | INT | FK → faculty, NOT NULL | Faculty conducting session |
| subject_id | INT | FK → subjects | Subject for the session |
| class | VARCHAR(50) | | Class name |
| session_date | DATE | NOT NULL | Date of session |
| start_time | DATETIME | NOT NULL | Session start time |
| end_time | DATETIME | | Session end time |
| status | ENUM | 'active', 'completed', 'cancelled' | Session status |
| captured_image_url | VARCHAR(255) | | S3 URL of captured image |
| total_students | INT | DEFAULT 0 | Total students in class |
| present_count | INT | DEFAULT 0 | Number of present students |
| absent_count | INT | DEFAULT 0 | Number of absent students |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Foreign Keys**:
- faculty_id → faculty(faculty_id) ON DELETE CASCADE
- subject_id → subjects(subject_id) ON DELETE SET NULL

**Indexes**: idx_faculty, idx_date, idx_status

---

### 5. attendance
**Description**: Individual student attendance records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| attendance_id | INT | PK, AUTO_INCREMENT | Unique attendance record ID |
| session_id | INT | FK → sessions, NOT NULL | Session reference |
| student_id | INT | FK → students, NOT NULL | Student reference |
| status | ENUM | 'present', 'absent' | Attendance status |
| marked_at | DATETIME | | Timestamp when marked present |
| confidence_score | DECIMAL(5,4) | | Face match confidence (0-1) |
| face_detected | BOOLEAN | DEFAULT FALSE | Whether face was detected |
| remarks | TEXT | | Additional notes |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Foreign Keys**:
- session_id → sessions(session_id) ON DELETE CASCADE
- student_id → students(student_id) ON DELETE CASCADE

**Unique Constraints**: unique_session_student (session_id, student_id)

**Indexes**: idx_session, idx_student, idx_status

---

### 6. notifications
**Description**: Tracks SNS notifications sent

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| notification_id | INT | PK, AUTO_INCREMENT | Unique notification ID |
| session_id | INT | FK → sessions | Related session |
| faculty_id | INT | FK → faculty | Recipient faculty |
| notification_type | VARCHAR(50) | | Type of notification |
| message | TEXT | | Notification message |
| sent_at | DATETIME | | Time notification was sent |
| status | ENUM | 'pending', 'sent', 'failed' | Notification status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Foreign Keys**:
- session_id → sessions(session_id) ON DELETE CASCADE
- faculty_id → faculty(faculty_id) ON DELETE CASCADE

**Indexes**: idx_session, idx_faculty

---

### 7. audit_log
**Description**: System activity audit trail

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| log_id | INT | PK, AUTO_INCREMENT | Unique log entry ID |
| user_id | INT | | User who performed action |
| user_type | ENUM | 'faculty', 'student', 'system' | Type of user |
| action | VARCHAR(100) | | Action performed |
| table_name | VARCHAR(50) | | Table affected |
| record_id | INT | | ID of affected record |
| details | TEXT | | Additional details (JSON) |
| ip_address | VARCHAR(45) | | IP address of user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Action timestamp |

**Indexes**: idx_user, idx_action, idx_created_at

---

## Relationships Summary

### One-to-Many (1:N)
- `faculty → subjects` (One faculty teaches many subjects)
- `faculty → sessions` (One faculty conducts many sessions)
- `subjects → sessions` (One subject has many sessions)
- `sessions → attendance` (One session has many attendance records)
- `students → attendance` (One student has many attendance records)
- `sessions → notifications` (One session generates notifications)
- `faculty → notifications` (One faculty receives many notifications)

### Cascade Rules
- Deleting a **faculty** deletes their **sessions**
- Deleting a **session** deletes related **attendance** and **notifications**
- Deleting a **student** deletes their **attendance** records
- Deleting a **subject** sets **subject_id** to NULL in sessions

---

## Indexes for Performance

### Primary Indexes (Primary Keys)
All tables have primary key indexes on their ID columns

### Secondary Indexes
- **faculty**: email (for login queries)
- **subjects**: subject_code, faculty_id
- **students**: roll_no, email, class
- **sessions**: faculty_id, session_date, status
- **attendance**: session_id, student_id, status
- **notifications**: session_id, faculty_id
- **audit_log**: user_id + user_type, action, created_at

---

## Data Integrity Constraints

### Foreign Key Constraints
- Enforces referential integrity
- Prevents orphaned records
- Cascade deletes where appropriate

### Unique Constraints
- email (faculty, students)
- roll_no (students)
- subject_code (subjects)
- (session_id, student_id) in attendance

### Check Constraints (Enforced by ENUM)
- status in sessions: 'active', 'completed', 'cancelled'
- status in attendance: 'present', 'absent'
- user_type in audit_log: 'faculty', 'student', 'system'
- status in notifications: 'pending', 'sent', 'failed'
