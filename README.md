# AttendX - Automated Attendance System with Face Recognition

**Status:** ✅ Production Ready - Successfully Deployed on AWS  
**Live URL:** http://32.195.60.167  
**Deployment Date:** September 26-27, 2026

---

## 📋 Project Overview

AttendX is a cloud-based automated attendance management system that uses face recognition technology to streamline attendance marking for educational institutions. Built with modern web technologies and deployed on AWS infrastructure.

### Key Features
- 🎯 **Face Recognition:** Automated attendance via facial recognition using OpenCV
- 👥 **Multi-Role Support:** Separate portals for faculty and students
- 📊 **Real-time Analytics:** Live attendance reports and statistics
- 📱 **Responsive Design:** Works on desktop, tablet, and mobile devices
- ☁️ **Cloud-Native:** Deployed on AWS with RDS, EC2, and S3
- 🔒 **Secure:** JWT-based authentication and password hashing

---

## 🏗️ Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **UI Library:** Material-UI (MUI)
- **State Management:** React Context API
- **Routing:** React Router v6
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express.js
- **Authentication:** JWT (jsonwebtoken)
- **File Upload:** Multer
- **Password Hashing:** bcrypt
- **Process Manager:** PM2

### Database
- **DBMS:** MySQL 8.4.9
- **Hosting:** AWS RDS (db.t2.micro)
- **ORM:** mysql2 (direct queries)

### AI/ML
- **Face Detection:** OpenCV 4.10.0.84 (with Caffe models)
- **Face Recognition:** face_recognition library
- **Language:** Python 3.12

### Cloud Infrastructure
- **Compute:** AWS EC2 (t2.micro, Ubuntu 24.04)
- **Database:** AWS RDS MySQL
- **Storage:** AWS S3 (configured) + Local fallback
- **Web Server:** Nginx 1.24.0
- **Region:** us-east-1 (N. Virginia)

---

## 🚀 Quick Start

### Access the Application
```
Production URL: http://32.195.60.167
```

### Login Credentials

**Faculty Account:**
- Email: lata.gohil@nirmauni.ac.in
- Password: f123

**Student Account (Example):**
- Email: 25mca006@nirmauni.ac.in
- Password: student123

### SSH Access to EC2
```powershell
ssh -i "$env:OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem" ubuntu@32.195.60.167
```

---

## 📁 Project Structure

```
AttendX/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/            # Database & AWS configuration
│   │   ├── controllers/       # API route controllers
│   │   ├── middleware/        # Auth, validation, upload
│   │   ├── models/            # Database models
│   │   ├── routes/            # API endpoints
│   │   ├── utils/             # Helper functions
│   │   ├── validators/        # Input validation
│   │   └── server.js          # Main server entry
│   ├── python/                # Face recognition services
│   │   ├── face_detector_opencv.py
│   │   ├── face_recognition_service.py
│   │   ├── models/            # Pre-trained Caffe models
│   │   └── requirements.txt
│   ├── scripts/               # Admin utility scripts
│   ├── uploads/               # Local file storage
│   ├── package.json
│   └── .env                   # Environment variables
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── faculty/       # Faculty portal
│   │   │   └── student/       # Student portal
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API service layer
│   │   ├── context/           # Auth context
│   │   └── App.jsx            # Main app component
│   ├── public/                # Static assets
│   ├── package.json
│   └── .env                   # API base URL
│
├── database/                   # Database files
│   ├── schema.sql             # Database structure
│   ├── seed.sql               # Sample data
│   ├── migrations/            # Schema migrations
│   ├── ERD.md                 # Entity relationship diagram
│   └── queries.sql            # Useful SQL queries
│
├── aws-deployment/             # AWS deployment resources
│   ├── docs/                  # Deployment documentation
│   │   ├── 01-MANUAL-DEPLOYMENT-GUIDE.md
│   │   ├── 02-TROUBLESHOOTING-GUIDE.md
│   │   ├── 03-QUICK-START-CHECKLIST.md
│   │   └── 04-COST-MONITORING-GUIDE.md
│   ├── scripts/               # Deployment scripts
│   ├── configs/               # Production configs
│   ├── README.md              # Deployment overview
│   └── PRODUCTION-DEPLOYED.md # Live system details
│
├── attendx_complete_database.sql  # Complete DB backup
├── AttendX_ProjectProposal.docx   # Project proposal
├── DEPLOYMENT-SUCCESS.md          # Deployment summary
└── README.md                      # This file
```

---

## 🔧 Local Development Setup

### Prerequisites
- Node.js 16+ (20.x recommended)
- Python 3.8+ (3.12 recommended)
- MySQL 8.0+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Install Python dependencies:**
   ```bash
   cd python
   pip install -r requirements.txt
   cd ..
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Import database:**
   ```bash
   mysql -u root -p attendx < ../attendx_complete_database.sql
   ```

6. **Run backend:**
   ```bash
   node src/server.js
   # Server starts on http://localhost:5001
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify configuration:**
   ```bash
   cat .env
   # Should show: VITE_API_BASE_URL=http://localhost:5001/api
   ```

4. **Run frontend:**
   ```bash
   npm run dev
   # App starts on http://localhost:3000
   ```

---

## 📊 Database Information

### Database Structure
- **Students:** 58 records
- **Faculty:** 5 accounts
- **Subjects:** 20 subjects (4 per faculty)
- **Sessions:** Historical attendance sessions
- **Attendance:** Individual attendance records

### Key Tables
- `faculty` - Faculty members
- `students` - Student information & face embeddings
- `subjects` - Courses/subjects
- `sessions` - Attendance sessions
- `attendance` - Individual attendance records
- `notifications` - SNS notifications log
- `audit_log` - System activity log

For complete schema details, see: `database/schema.sql`

---

## 🌐 AWS Deployment

### Infrastructure Details

| Component | Type | Status |
|-----------|------|--------|
| **EC2 Instance** | t2.micro (Ubuntu 24.04) | ✅ Running |
| **RDS Database** | db.t2.micro (MySQL 8.4.9) | ✅ Connected |
| **Web Server** | Nginx 1.24.0 | ✅ Active |
| **Process Manager** | PM2 7.0.4 | ✅ Running |
| **Node.js** | 20.20.2 | ✅ Installed |
| **Python** | 3.12.x | ✅ Installed |

### Production Configuration
- **Public IP:** 32.195.60.167
- **RDS Endpoint:** attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com
- **Backend Port:** 5001 (proxied via Nginx)
- **Frontend:** Served via Nginx on port 80

### Cost Estimate
- **EC2:** $0/month (Free Tier - 750 hours)
- **RDS:** $0/month (Free Tier - 750 hours)
- **S3:** $0-1/month (if <5GB)
- **Total:** $0-2/month

### Deployment Documentation
For complete deployment instructions, see:
- **Quick Overview:** `aws-deployment/README.md`
- **Full Details:** `aws-deployment/PRODUCTION-DEPLOYED.md`
- **Step-by-Step:** `aws-deployment/docs/01-MANUAL-DEPLOYMENT-GUIDE.md`
- **Troubleshooting:** `aws-deployment/docs/02-TROUBLESHOOTING-GUIDE.md`

---

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - Faculty/Student login
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Students (Faculty Only)
- `GET /api/students` - List all students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Add new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/:id/photo` - Upload student photo

### Subjects (Faculty Only)
- `GET /api/subjects` - Get faculty's subjects
- `POST /api/subjects` - Create new subject

### Sessions (Faculty Only)
- `POST /api/sessions/start` - Start attendance session
- `POST /api/sessions/stop` - Stop active session
- `GET /api/sessions` - Get session history
- `GET /api/sessions/active` - Get active session

### Attendance
- `POST /api/attendance/capture` - Process captured image
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/report` - Generate Excel report
- `GET /api/attendance/statistics` - Get attendance stats

For complete API documentation, see: `backend/README.md`

---

## 🔒 Security Features

- **Authentication:** JWT-based with secure token storage
- **Password Security:** bcrypt hashing with salt
- **Rate Limiting:** API rate limiting to prevent abuse
- **Input Validation:** Comprehensive validation on all inputs
- **SQL Injection Protection:** Parameterized queries
- **File Upload Security:** Type and size validation
- **CORS:** Configured for production domain
- **Environment Variables:** Sensitive data in .env files

---

## 🚨 Important Notes

### Face Recognition
- **OpenCV Version:** Must use 4.10.x (NOT 5.x)
- **Reason:** OpenCV 5.0+ removed Caffe model support
- **Models Used:** Caffe-based SSD face detector
- **Performance:** 30-60 seconds on t2.micro instance

### Critical Commands

**On EC2 - Check Status:**
```bash
pm2 status
sudo systemctl status nginx
curl http://localhost/health
```

**On EC2 - View Logs:**
```bash
pm2 logs attendx-backend --lines 50
sudo tail -f /var/log/nginx/error.log
```

**On EC2 - Restart Services:**
```bash
pm2 restart attendx-backend
sudo systemctl restart nginx
```

### Known Limitations
- Face recognition slower on t2.micro (acceptable for prototype)
- No HTTPS/SSL configured (optional enhancement)
- Local storage fallback when S3 not configured
- Single EC2 instance (no load balancing)

---

## 📖 Documentation

### Project Documentation
- **Main README:** This file
- **Backend Docs:** `backend/README.md`
- **Database Docs:** `database/README.md`
- **Python Face Recognition:** `backend/python/README.md`

### AWS Deployment
- **Deployment Guide:** `aws-deployment/docs/01-MANUAL-DEPLOYMENT-GUIDE.md`
- **Troubleshooting:** `aws-deployment/docs/02-TROUBLESHOOTING-GUIDE.md`
- **Quick Start:** `aws-deployment/docs/03-QUICK-START-CHECKLIST.md`
- **Cost Monitoring:** `aws-deployment/docs/04-COST-MONITORING-GUIDE.md`
- **Production Details:** `aws-deployment/PRODUCTION-DEPLOYED.md`

### Database
- **Schema:** `database/schema.sql`
- **ERD:** `database/ERD.md`
- **Queries:** `database/queries.sql`
- **Migration Scripts:** `database/migrations/`

---

## 🎓 Project Context

**Course:** Cloud Computing (MCA Semester 3)  
**Institution:** Nirma University  
**Student:** Niraj  
**Project Type:** Face Recognition Attendance System  
**Deployment:** AWS (EC2, RDS, S3)

### Project Objectives
- ✅ Build a cloud-native attendance system
- ✅ Implement face recognition for automation
- ✅ Deploy on AWS infrastructure
- ✅ Use modern web technologies
- ✅ Optimize for cost (Free Tier)
- ✅ Demonstrate scalability and reliability

---

## 🔄 Maintenance & Updates

### Update Backend Code
```bash
# 1. Make changes locally and test
# 2. Transfer to EC2
scp -i "key.pem" -r backend ubuntu@32.195.60.167:/home/ubuntu/

# 3. SSH to EC2 and restart
ssh -i "key.pem" ubuntu@32.195.60.167
pm2 restart attendx-backend
```

### Update Frontend
```bash
# 1. Build locally
cd frontend
npm run build

# 2. Transfer dist folder
scp -i "key.pem" -r dist ubuntu@32.195.60.167:/home/ubuntu/frontend/

# 3. Restart Nginx
ssh -i "key.pem" ubuntu@32.195.60.167
sudo systemctl restart nginx
```

### Database Migrations
```bash
# 1. Create migration script in database/migrations/
# 2. Test locally first
# 3. Run on RDS
mysql -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com -u admin -p attendx < migration.sql
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue: Face detection fails**
- Check OpenCV version: `python3 -c "import cv2; print(cv2.__version__)"`
- Must be 4.10.x, not 5.x
- Reinstall: `pip3 install --break-system-packages opencv-python==4.10.0.84`

**Issue: Backend not responding**
- Check PM2: `pm2 status`
- View logs: `pm2 logs attendx-backend`
- Restart: `pm2 restart attendx-backend`

**Issue: Database connection fails**
- Verify RDS endpoint and credentials in `.env`
- Check security group allows EC2 IP
- Test connection: `mysql -h [RDS_ENDPOINT] -u admin -p`

**Issue: Frontend shows 500 error**
- Check backend is running: `curl http://localhost:5001/health`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify permissions: `ls -la /home/ubuntu/frontend/`

For complete troubleshooting guide, see: `aws-deployment/docs/02-TROUBLESHOOTING-GUIDE.md`

---

## 🚀 Future Enhancements

### Recommended Improvements
1. **Add HTTPS/SSL** - Use Let's Encrypt for free SSL certificate
2. **Implement S3 Fully** - Move all uploads to S3 for scalability
3. **Add Monitoring** - Set up CloudWatch alarms and metrics
4. **Enable SNS Notifications** - Email/SMS alerts for attendance
5. **Performance Optimization** - Add Redis caching, optimize queries
6. **Load Balancing** - Add multiple EC2 instances behind ALB
7. **CI/CD Pipeline** - Automate deployment with GitHub Actions
8. **Mobile App** - React Native mobile application
9. **ESP32 Integration** - IoT camera for automated capture
10. **Analytics Dashboard** - Advanced reporting and insights

---

## 📞 Support

### Resources
- **Documentation Folder:** `aws-deployment/docs/`
- **Troubleshooting Guide:** `aws-deployment/docs/02-TROUBLESHOOTING-GUIDE.md`
- **Production Details:** `aws-deployment/PRODUCTION-DEPLOYED.md`

### Quick Commands Reference
```bash
# SSH to EC2
ssh -i "$env:OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem" ubuntu@32.195.60.167

# Check services
pm2 status
sudo systemctl status nginx

# View logs
pm2 logs attendx-backend --lines 50

# Restart services
pm2 restart attendx-backend
sudo systemctl restart nginx

# Check system health
df -h                    # Disk usage
free -h                  # Memory usage
top                      # CPU usage
```

---

## ✅ Deployment Verification

### Health Check Checklist
- ✅ EC2 instance running
- ✅ RDS database connected
- ✅ Backend API responding
- ✅ Frontend accessible
- ✅ Nginx serving content
- ✅ PM2 managing process
- ✅ Face recognition working
- ✅ Authentication working
- ✅ Database queries working
- ✅ File uploads working

### Test URLs
- Frontend: http://32.195.60.167
- API Health: http://32.195.60.167/api/health
- Backend Status: http://32.195.60.167/api/auth/me (with token)

---

## 📄 License

This project is developed for educational purposes as part of MCA coursework at Nirma University.

---

## 🎉 Success!

**AttendX is successfully deployed and operational on AWS!**

- 🌐 **Live URL:** http://32.195.60.167
- 📊 **Database:** 58 students, 5 faculty loaded
- 🎯 **Face Recognition:** Working with OpenCV 4.10.x
- 💰 **Cost:** $0-2/month (Free Tier optimized)
- ⚡ **Performance:** Stable with PM2 auto-restart
- 🔒 **Security:** JWT auth, password hashing, input validation

For complete deployment details and maintenance instructions, see the documentation in `aws-deployment/` folder.

---

**Last Updated:** September 27, 2026  
**Status:** ✅ Production Ready  
**Deployed By:** Niraj  
**Course:** Cloud Computing (MCA Sem 3)
