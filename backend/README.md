# AttendX Backend

Node.js + Express backend with Python face recognition integration.

---

## Quick Start

### Local Development

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   cd python
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database and AWS credentials
   ```

4. **Import database:**
   ```bash
   mysql -u root -p attendx < ../attendx_complete_database.sql
   ```

5. **Run server:**
   ```bash
   node src/server.js
   # Server starts on http://localhost:5001
   ```

---

## Environment Variables

Key variables in `.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendx
DB_PORT=3306

# Server
PORT=5001
NODE_ENV=development

# JWT
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=24h

# Storage
USE_LOCAL_STORAGE=true
UPLOAD_DIR=./uploads

# AWS (optional)
AWS_REGION=us-east-1
AWS_S3_BUCKET=attendx-uploads
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Faculty/Student login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Students (Faculty Only)
- `GET /api/students` - List all students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Add new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/:id/photo` - Upload student photo

### Subjects (Faculty Only)
- `GET /api/subjects` - Get faculty's subjects
- `POST /api/subjects` - Create subject

### Sessions (Faculty Only)
- `POST /api/sessions/start` - Start attendance session
- `POST /api/sessions/stop` - Stop session
- `GET /api/sessions` - Get session history
- `GET /api/sessions/active` - Get active session

### Attendance
- `POST /api/attendance/capture` - Process image for attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/report` - Export Excel report
- `GET /api/attendance/statistics` - Get statistics

---

## Project Structure

```
backend/
├── src/
│   ├── config/          # AWS & Database config
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, validation, upload
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── validators/      # Input validation
│   └── server.js        # Main entry point
├── python/              # Face recognition service
│   ├── face_detector_opencv.py
│   ├── face_recognition_service.py
│   ├── models/          # Pre-trained models
│   └── requirements.txt
├── scripts/             # Admin utilities
├── uploads/             # Local file storage
└── package.json
```

---

## Python Face Recognition

Located in `python/` directory:

- **face_detector_opencv.py** - Detects faces using OpenCV + Caffe
- **face_recognition_service.py** - Matches faces using face_recognition library
- **models/** - Pre-trained Caffe SSD models

### Requirements
```bash
pip install opencv-python==4.10.0.84
pip install face-recognition
pip install numpy
```

**Important:** Use OpenCV 4.10.x (NOT 5.x) for Caffe model support.

---

## Admin Scripts

Located in `scripts/`:

- `create-admin.js` - Create admin/faculty account
- `create-faculty.js` - Batch create faculty
- `reset-password.js` - Reset user password

**Usage:**
```bash
node scripts/create-admin.js
```

---

## Production Deployment

For AWS deployment instructions, see: `../aws-deployment/docs/01-MANUAL-DEPLOYMENT-GUIDE.md`

**Key Production Settings:**
- Set `NODE_ENV=production`
- Use PM2 for process management
- Configure Nginx as reverse proxy
- Use RDS for database
- Enable S3 for file storage

---

## Troubleshooting

**Database connection fails:**
- Check MySQL is running
- Verify credentials in `.env`
- Test: `mysql -u root -p attendx`

**Face detection errors:**
- Verify OpenCV version: `python3 -c "import cv2; print(cv2.__version__)"`
- Should be 4.10.x
- Reinstall: `pip install opencv-python==4.10.0.84`

**Port already in use:**
- Check: `lsof -ti:5001` (Mac/Linux) or `netstat -ano | findstr :5001` (Windows)
- Kill process or change PORT in `.env`

---

For complete project documentation, see: `../README.md`
