# AttendX - Production Deployment Details

**Status:** ✅ Successfully Deployed on AWS  
**Deployment Date:** September 26, 2026  
**Deployed By:** Niraj

---

## 🌐 Live Application URLs

| Service | URL |
|---------|-----|
| **Frontend Application** | http://32.195.60.167 |
| **Backend API** | http://32.195.60.167/api |
| **Health Check** | http://32.195.60.167/health |

---

## 🔐 Login Credentials

### Faculty Account
- **Email:** lata.gohil@nirmauni.ac.in
- **Password:** f123
- **Role:** Faculty

### Database
- **Host:** attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com
- **Port:** 3306
- **Username:** admin
- **Password:** Niraj#2804
- **Database:** attendx

---

## 🏗️ Infrastructure Details

### EC2 Instance
- **Type:** t2.micro (Free Tier)
- **Public IP:** 32.195.60.167
- **Region:** us-east-1 (N. Virginia)
- **OS:** Ubuntu 24.04 LTS
- **Key Pair:** attendx-backend-key.pem

### RDS Database
- **Instance:** db.t2.micro (Free Tier)
- **Engine:** MySQL 8.4.9
- **Storage:** 20 GB SSD
- **Multi-AZ:** No
- **Backup:** 7 days retention

### S3 Bucket (Configured)
- **Bucket Name:** (To be configured)
- **Region:** us-east-1
- **Purpose:** Student photos, attendance images

---

## 📦 Installed Software

### On EC2 Instance
- **Node.js:** v20.20.2
- **npm:** 10.8.2
- **Python:** 3.12.x
- **MySQL Client:** 8.0.46
- **Nginx:** 1.24.0
- **PM2:** 7.0.4

### Python Packages
- **OpenCV:** 4.10.0.84 (Downgraded for Caffe support)
- **face_recognition:** Latest
- **dlib:** Latest
- **NumPy:** Latest

### Node.js Dependencies
- **Express:** Backend framework
- **MySQL2:** Database driver
- **AWS SDK v3:** S3 and SNS integration
- **JWT:** Authentication
- **bcrypt:** Password hashing

---

## 🗂️ Directory Structure on EC2

```
/home/ubuntu/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── server.js
│   ├── python/
│   │   ├── models/
│   │   │   ├── deploy.prototxt
│   │   │   └── res10_300x300_ssd_iter_140000.caffemodel
│   │   ├── face_detector_opencv.py
│   │   └── face_recognition_service.py
│   ├── logs/
│   ├── .env (Production config)
│   ├── package.json
│   └── ecosystem.config.js
│
└── frontend/
    ├── index.html
    └── assets/
```

---

## ⚙️ Configuration Files

### Backend .env (Production)
```env
PORT=5001
NODE_ENV=production
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=24h

AWS_REGION=us-east-1
S3_BUCKET_NAME=<your-bucket-name>

DB_HOST=attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=Niraj#2804
DB_NAME=attendx

PYTHON_EXECUTABLE=python3
FACE_RECOGNITION_SCRIPT=./python/face_detector_opencv.py
FRONTEND_URL=http://32.195.60.167
USE_AWS=true
USE_LOCAL_STORAGE=false
```

### Nginx Configuration
**Location:** `/etc/nginx/sites-available/attendx`

### PM2 Configuration
**Location:** `/home/ubuntu/backend/ecosystem.config.js`

---

## 🔄 Maintenance Commands

### Check Application Status
```bash
ssh -i "attendx-backend-key.pem" ubuntu@32.195.60.167
pm2 status
sudo systemctl status nginx
```

### View Logs
```bash
pm2 logs attendx-backend --lines 50
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart attendx-backend
sudo systemctl restart nginx
```

### Update Backend Code
```bash
cd /home/ubuntu/backend
# Transfer new files via SCP
pm2 restart attendx-backend
```

### Update Frontend
```bash
# Build locally, then:
scp -r dist/* ubuntu@32.195.60.167:/home/ubuntu/frontend/
sudo systemctl restart nginx
```

### Database Backup
```bash
mysqldump -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com \
  -u admin -p attendx > backup_$(date +%Y%m%d).sql
```

---

## 📊 Resource Usage

### Current Status (As of deployment)
- **Disk Usage:** 30% (8.7GB used / 29GB available)
- **Memory Usage:** 45-48% (450MB / 950MB)
- **CPU Usage:** Typically <5%, spikes to 50-70% during face recognition
- **PM2 Restarts:** 34 (during setup, now stable)

### Expected Monthly Costs
- **EC2 t2.micro:** $0 (Free Tier)
- **RDS db.t2.micro:** $0 (Free Tier)
- **S3 Storage:** $0-1 (if under 5GB)
- **Data Transfer:** $0 (if under 1GB/month out)
- **Total:** $0-2/month

---

## 🚀 Performance Notes

### Face Recognition Speed
- **Single face:** 5-10 seconds on t2.micro
- **Multiple faces:** 30-90 seconds depending on count
- **Recommendation:** For production with heavy usage, upgrade to t3.medium

### Database Performance
- **Query response:** <50ms average
- **Connection pool:** 10 connections
- **Current load:** Very light (test environment)

### Frontend Load Time
- **Initial load:** 1-2 seconds
- **API calls:** 100-300ms
- **Static assets:** Served from EC2 via Nginx

---

## 🔒 Security Configuration

### EC2 Security Group (attendx-backend-sg)
| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP | Admin access |
| HTTP | 80 | 0.0.0.0/0 | Public web access |
| HTTPS | 443 | 0.0.0.0/0 | SSL (if configured) |

### RDS Security Group (attendx-db-sg)
| Type | Port | Source | Description |
|------|------|--------|-------------|
| MySQL | 3306 | EC2 SG | Backend database access |

### Recommendations
- ✅ SSH restricted to your IP
- ✅ Database only accessible from EC2
- ⚠️ Add HTTPS/SSL certificate (Let's Encrypt)
- ⚠️ Enable AWS CloudWatch monitoring
- ⚠️ Set up automated backups

---

## 📈 Monitoring & Alerts

### Set Up (Recommended)
1. **AWS CloudWatch Alarms**
   - CPU > 80% for 5 minutes
   - Disk space > 85%
   - RDS connections > 40

2. **PM2 Monitoring**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   ```

3. **Uptime Monitoring**
   - Use UptimeRobot or similar
   - Monitor: http://32.195.60.167/health

---

## 🐛 Known Issues & Fixes

### Issue: Face detection fails
**Cause:** OpenCV 5.0 doesn't support Caffe models  
**Fix:** Downgrade to OpenCV 4.10.0.84
```bash
pip3 uninstall opencv-python
pip3 install --break-system-packages opencv-python==4.10.0.84
pm2 restart attendx-backend
```

### Issue: Backend crashes on restart
**Cause:** Database connection timeout  
**Fix:** Check RDS security group and .env configuration

### Issue: Frontend 500 error
**Cause:** File permissions  
**Fix:**
```bash
sudo chmod +x /home/ubuntu
sudo chmod -R 755 /home/ubuntu/frontend/
sudo systemctl restart nginx
```

---

## 📞 Support & Contacts

### AWS Support
- **Account ID:** (Your AWS Account ID)
- **Support Plan:** Free Tier / Basic
- **Documentation:** https://docs.aws.amazon.com

### Technical Stack Documentation
- **Node.js:** https://nodejs.org/docs
- **React:** https://react.dev
- **Express:** https://expressjs.com
- **MySQL:** https://dev.mysql.com/doc
- **OpenCV:** https://docs.opencv.org
- **face_recognition:** https://github.com/ageitgey/face_recognition

---

## ✅ Deployment Checklist

- [x] EC2 instance launched and configured
- [x] RDS database created and populated
- [x] Backend deployed with PM2
- [x] Nginx configured as reverse proxy
- [x] Frontend built and deployed
- [x] Face recognition working (OpenCV 4.x)
- [x] Database connection established
- [x] Authentication tested
- [x] Health checks passing
- [ ] S3 bucket fully configured (optional)
- [ ] SNS notifications configured (optional)
- [ ] HTTPS/SSL certificate (recommended)
- [ ] CloudWatch monitoring (recommended)
- [ ] Automated backups (recommended)

---

## 🎓 Academic Project Information

**Institution:** Nirma University  
**Program:** MCA (Master of Computer Applications)  
**Semester:** 3  
**Course:** Cloud Computing  
**Project:** AttendX - Automated Attendance System using Face Recognition  
**Features:** Facial recognition, real-time attendance, AWS cloud deployment

---

**Last Updated:** September 27, 2026  
**Maintained By:** Niraj  
**Version:** 1.0.0 (Production)
