# AttendX Database

MySQL database schema and management files for AttendX.

---

## Quick Start

### Import Complete Database

```bash
# Local MySQL
mysql -u root -p < ../attendx_complete_database.sql

# AWS RDS
mysql -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com -u admin -p < ../attendx_complete_database.sql
```

This imports:
- ✅ Complete database structure
- ✅ 58 MCA students
- ✅ 5 faculty members
- ✅ 20 subjects
- ✅ Historical attendance data
- ✅ Face recognition embeddings

### Verify Import

```sql
USE attendx;
SELECT COUNT(*) FROM students;   -- Should show 58
SELECT COUNT(*) FROM faculty;    -- Should show 5
SELECT COUNT(*) FROM subjects;   -- Should show 20
```

---

## Database Schema

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| **faculty** | Faculty/teacher accounts | faculty_id, name, email, password_hash, phone, department |
| **students** | Student accounts & face data | student_id, roll_no, name, email, face_embedding, photo_url |
| **subjects** | Courses/subjects | subject_id, subject_code, subject_name, faculty_id |
| **sessions** | Attendance sessions | session_id, faculty_id, subject_id, start_time, end_time, status |
| **attendance** | Individual attendance records | attendance_id, session_id, student_id, status, confidence_score |
| **notifications** | SNS notification log | notification_id, session_id, message, sent_at, status |
| **audit_log** | System activity log | log_id, user_id, action, table_name, ip_address, created_at |

### Relationships
- `faculty` 1:N `subjects` (one faculty teaches many subjects)
- `faculty` 1:N `sessions` (one faculty creates many sessions)
- `subjects` 1:N `sessions` (one subject has many sessions)
- `sessions` 1:N `attendance` (one session has many attendance records)
- `students` 1:N `attendance` (one student has many attendance records)

### Entity Relationship Diagram
See `ERD.md` for visual representation.

---

## Available Files

| File | Purpose |
|------|---------|
| `schema.sql` | Database structure (tables, indexes, constraints) |
| `seed.sql` | Sample data for testing |
| `queries.sql` | Useful SQL queries for reports |
| `ERD.md` | Entity relationship diagram |
| `migrations/` | Database migration scripts |
| `add_*.sql` | Scripts to add specific data |

---

## Production Credentials

### Faculty Accounts
Password: `f123`
- lata.gohil@nirmauni.ac.in
- saurin.parikh@nirmauni.ac.in
- devendra.vashi@nirmauni.ac.in

Password: `admin123`
- john.doe@university.edu
- jane.smith@university.edu

### Student Accounts
Password: `student123`
- All 58 students: `[roll_no]@nirmauni.ac.in`
- Examples: 25mca001@nirmauni.ac.in, 25mca006@nirmauni.ac.in

**Note:** All passwords are hashed with bcrypt in the database.

---

## Common Queries

### View All Students with Attendance %
```sql
SELECT 
    s.roll_no,
    s.name,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
    COUNT(*) as total,
    ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) / COUNT(*)) * 100, 2) as attendance_pct
FROM students s
LEFT JOIN attendance a ON s.student_id = a.student_id
GROUP BY s.student_id
ORDER BY s.roll_no;
```

### View Session History for Faculty
```sql
SELECT 
    sess.session_id,
    sub.subject_name,
    sess.session_date,
    sess.present_count,
    sess.total_students,
    ROUND((sess.present_count / sess.total_students) * 100, 2) as attendance_pct
FROM sessions sess
JOIN subjects sub ON sess.subject_id = sub.subject_id
WHERE sess.faculty_id = 1
ORDER BY sess.session_date DESC;
```

More queries in `queries.sql`

---

## Database Migrations

Migration scripts in `migrations/` directory apply schema changes incrementally.

**To run a migration:**
```bash
mysql -u root -p attendx < migrations/001_add_column.sql
```

**Best practices:**
- Test locally first
- Backup before running: `mysqldump attendx > backup.sql`
- Use descriptive filenames: `001_description.sql`
- Include rollback instructions in comments

---

## Backup & Restore

### Backup Database
```bash
# Local
mysqldump -u root -p attendx > backup_$(date +%Y%m%d).sql

# RDS
mysqldump -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com -u admin -p attendx > backup.sql
```

### Restore Database
```bash
# Local
mysql -u root -p attendx < backup.sql

# RDS
mysql -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com -u admin -p attendx < backup.sql
```

---

## Troubleshooting

**Cannot connect to database:**
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials
- Check port 3306 is open

**Import fails:**
- Check SQL syntax
- Verify MySQL version compatibility (8.0+)
- Check file encoding (UTF-8)
- Look for errors: `mysql -u root -p < file.sql 2> errors.log`

**Slow queries:**
- Check indexes: `SHOW INDEXES FROM students;`
- Analyze queries: `EXPLAIN SELECT ...`
- Optimize tables: `OPTIMIZE TABLE students;`

---

For complete project documentation, see: `../README.md`
