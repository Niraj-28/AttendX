# AttendX - AWS Deployment Quick Start Checklist

Use this checklist to track your deployment progress.

---

## 📋 Pre-Deployment Checklist

- [Y] AWS account created and verified
- [Y] Credit/debit card added to AWS account
- [Y] AWS Free Tier limits understood
- [Y] Billing alerts configured
- [Y] AttendX code downloaded/cloned locally
- [Y] MySQL Workbench or MySQL CLI installed locally
- [Y] SSH client ready (Terminal/PowerShell)
- [Y] AWS CLI installed (optional but recommended)

---

## 🔐 Phase 1: IAM Setup (10 mins)

- [Y] Created IAM user: `attendx-deployer`
- [Y] Attached required policies (EC2, RDS, S3, SNS, CloudFront)
- [Y] Saved Access Key ID: `AKIA________________`
- [Y] Saved Secret Access Key: `____________________`
- [Y] Saved Console Login URL: `https://____________.signin.aws.amazon.com`
- [Y] Enabled MFA on root account (optional but recommended)

**✅ Checkpoint**: Can login to AWS Console with IAM user

---

## 💾 Phase 2: RDS Database (20 mins)

- [Y] Created RDS MySQL instance: `attendx-db`
- [Y] Instance class: `db.t2.micro` (Free Tier)
- [Y] Storage: `20 GB` (Free Tier limit)
- [Y] Public access: `Yes` (for initial setup)
- [Y] Security group created: `attendx-db-sg`
- [Y] Master username: `admin`
- [Y] Master password saved securely: `________________`
- [Y] Initial database name: `attendx`
- [Y] RDS Endpoint copied: `attendx-db.______________.us-east-1.rds.amazonaws.com`
- [Y] Security group configured: Port 3306, Source: My IP
- [Y] Database status: `Available`
- [Y] Connected to RDS from local machine successfully
- [Y] Imported `attendx_complete_database.sql`
- [Y] Verified data: 59 students, 5 faculty, 20 subjects

**✅ Checkpoint**: Can query database from local machine

**Save These Values:**
```
RDS Endpoint: ________________________________________________
Master Password: _____________________________________________
```

---

## 📦 Phase 3: S3 Buckets (15 mins)

### Images Bucket

- [Y] Created bucket: `attendx-images-____-2026` (fill your initials)
- [Y] Region: `us-east-1`
- [Y] Public access: `Enabled`
- [Y] Bucket policy configured (public read)
- [Y] Created folder: `students/`
- [Y] Created folder: `attendance/`
- [Y] Uploaded existing student photos from `backend/uploads/students/`
- [Y] Verified images are accessible via browser

### Frontend Bucket

- [Y] Created bucket: `attendx-frontend-____-2026` (fill your initials)
- [Y] Region: `us-east-1`
- [Y] Public access: `Enabled`
- [Y] Static website hosting: `Enabled`
- [Y] Index document: `index.html`
- [Y] Error document: `index.html`
- [Y] Bucket policy configured (public read)
- [Y] Website endpoint noted: `http://attendx-frontend-____-2026.s3-website-us-east-1.amazonaws.com`

**✅ Checkpoint**: S3 buckets created and configured

**Save These Values:**
```
Images Bucket: ________________________________________________
Frontend Bucket: ______________________________________________
Frontend URL: _________________________________________________
```

---

## 🖥️ Phase 4: EC2 Instance (30 mins)

- [Y] Launched EC2 instance: `attendx-backend`
- [Y] AMI: `Ubuntu Server 22.04 LTS`
- [Y] Instance type: `t2.micro` (Free Tier)
- [Y] Key pair created: `attendx-backend-key.pem` (SAVED IN SAFE LOCATION!)
- [Y] Security group created: `attendx-backend-sg`
- [Y] Inbound rules configured:
  - [Y] SSH (22): My IP
  - [Y] HTTP (80): 0.0.0.0/0
  - [Y] HTTPS (443): 0.0.0.0/0
  - [Y] Custom TCP (5001): 0.0.0.0/0
- [Y] Storage: `30 GB` gp2
- [Y] Instance state: `Running`
- [Y] Public IP copied: `__________________`
- [Y] Public DNS copied: `ec2-___-___-___-___.compute-1.amazonaws.com`
- [Y] Elastic IP allocated (optional): `__________________`
- [Y] Updated RDS security group: Added rule for EC2 security group
- [Y] Successfully SSH'd into instance

**✅ Checkpoint**: Can SSH into EC2 instance

**Save These Values:**
```
EC2 Public IP: ________________________________________________
EC2 Key Location: _____________________________________________
```

---

## 🛠️ Phase 5: EC2 Software Installation (25 mins)

**All commands run on EC2 via SSH**

- [Y] System updated: `sudo apt update && sudo apt upgrade -y`
- [Y] Node.js 18 installed: `node --version` shows v18.x.x
- [Y] Python 3 installed: `python3 --version` shows 3.10.x+
- [Y] System dependencies installed (OpenCV, dlib, etc.)
- [Y] MySQL client installed
- [Y] Nginx installed and running
- [Y] PM2 installed globally: `pm2 --version`
- [Y] Git installed
- [Y] Swap space created (2GB)
- [Y] Firewall configured (UFW)
- [Y] Application directory created: `/home/ubuntu/backend`

**✅ Checkpoint**: All software installed, versions verified

---

## 🚀 Phase 6: Backend Deployment (20 mins)

- [Y] Backend code transferred to EC2
  - Method used: ☐ SCP  ☐ Git clone  ☐ Other: __________
- [Y] Code location: `/home/ubuntu/backend`
- [Y] Node.js dependencies installed: `npm install`
- [Y] Python dependencies installed: `pip3 install -r python/requirements.txt`
- [Y] Created `.env` file from template
- [Y] Updated `.env` with actual values:
  - [Y] JWT_SECRET (generated random string)
  - [Y] DB_HOST (RDS endpoint)
  - [Y] DB_PASSWORD (RDS password)
  - [Y] S3_BUCKET_NAME (images bucket name)
  - [Y] FRONTEND_URL (S3 frontend URL)
- [Y] Tested database connection successfully
- [Y] Created PM2 ecosystem config: `ecosystem.config.js`
- [Y] Created logs directory: `/home/ubuntu/backend/logs`
- [Y] Started backend with PM2: `pm2 start ecosystem.config.js`
- [Y] Backend status: `online` in `pm2 status`
- [Y] Health check passed: `curl http://localhost:5001/api/health`
- [Y] PM2 saved: `pm2 save`
- [Y] PM2 startup configured

**✅ Checkpoint**: Backend running on PM2, health check passes

---

## 🌐 Phase 7: Nginx Configuration (10 mins)

- [Y] Created Nginx config: `/etc/nginx/sites-available/attendx`
- [Y] Updated config with EC2 public IP
- [Y] Enabled site: `ln -s` to sites-enabled
- [Y] Removed default site
- [Y] Tested Nginx config: `sudo nginx -t` passes
- [Y] Restarted Nginx: `sudo systemctl restart nginx`
- [Y] External health check passed: `http://EC2_IP/api/health`

**✅ Checkpoint**: Backend accessible from internet via Nginx

---

## 🎨 Phase 8: Frontend Deployment (15 mins)

**All commands run on LOCAL machine**

- [Y] Updated `frontend/.env`:
  - [Y] VITE_API_BASE_URL set to `http://EC2_IP/api`
- [Y] Installed dependencies: `npm install`
- [Y] Built frontend: `npm run build`
- [Y] Verified `dist/` folder created
- [Y] AWS CLI installed (if using CLI method)
- [Y] AWS CLI configured: `aws configure`
- [Y] Uploaded to S3:
  - Method: ☐ AWS CLI  ☐ AWS Console  ☐ Script
- [Y] Verified files in S3 bucket
- [Y] Tested frontend URL in browser
- [Y] Login page loads successfully
- [Y] Can make API calls to backend

**✅ Checkpoint**: Frontend accessible and communicating with backend

---

## 🔔 Phase 9: SNS Setup (10 mins) - Optional

- [Y] Created SNS topic: `attendx-notifications`
- [Y] Topic ARN copied: `arn:aws:sns:us-east-1:______:attendx-notifications`
- [Y] Created email subscription (optional)
- [Y] Email confirmed (optional)
- [Y] Updated backend `.env` with SNS_TOPIC_ARN
- [Y] Restarted backend: `pm2 restart attendx-backend`

**✅ Checkpoint**: SNS configured (if enabled)

---

## ☁️ Phase 10: CloudFront Setup (15 mins) - Optional

- [ ] Created CloudFront distribution
- [ ] Origin: S3 frontend bucket
- [ ] Viewer protocol: Redirect HTTP to HTTPS
- [ ] Distribution status: `Deployed`
- [ ] CloudFront URL copied: `https://d____________.cloudfront.net`
- [ ] Custom error pages configured:
  - [ ] 403 → /index.html (200)
  - [ ] 404 → /index.html (200)
- [ ] Tested CloudFront URL
- [ ] Frontend loads via HTTPS
- [ ] Updated frontend `.env` with new URL (if needed)

**✅ Checkpoint**: CloudFront distributing frontend (if enabled)

---

## 🧪 Phase 11: Testing (30 mins)

### Backend Tests

- [ ] Health check: `http://EC2_IP/api/health` → `{"status":"ok"}`
- [ ] CORS working (no errors in browser console)
- [ ] PM2 keeping backend alive
- [ ] Nginx proxying correctly

### Frontend Tests

- [ ] Login page loads
- [ ] Can login as faculty: `lata.gohil@nirmauni.ac.in` / `f123`
- [ ] Dashboard shows real data
- [ ] Students page shows 59 students
- [ ] Can view student details
- [ ] Images loading from S3
- [ ] Sessions page working
- [ ] Can start new session
- [ ] Reports page working
- [ ] Can export Excel
- [ ] Logout working

### Student Portal Tests

- [ ] Can login as student: `25mca006@nirmauni.ac.in` / `student123`
- [ ] Student dashboard loads
- [ ] Can view attendance records
- [ ] Profile photo shows (if uploaded)

### Face Recognition Tests

- [ ] Can upload student photo
- [ ] Photo uploads to S3
- [ ] Can start attendance session
- [ ] Can capture attendance image
- [ ] Face detection works (may be slow on t2.micro)
- [ ] Attendance marked correctly

**✅ Checkpoint**: All core features working

---

## 📊 Phase 12: Monitoring & Security (20 mins)

### Billing Alerts

- [ ] Billing preferences enabled
- [ ] Free tier usage alerts enabled
- [ ] Budget alert created: $5 threshold
- [ ] Budget alert created: $10 threshold
- [ ] Email notifications working

### Security Hardening

- [ ] SSH key stored securely (not in Downloads!)
- [ ] `.env` file permissions: `chmod 600`
- [ ] RDS "My IP" rule removed (only EC2 security group allowed)
- [ ] Changed default faculty passwords
- [ ] Strong JWT secret generated
- [ ] Backup of database created
- [ ] EC2 AMI snapshot created (optional)

### Monitoring Setup

- [ ] CloudWatch alarms configured (optional)
- [ ] Logs retention set (optional)
- [ ] PM2 monitoring reviewed

**✅ Checkpoint**: Monitoring and security configured

---

## 📝 Final Checklist

- [ ] **Documentation saved**:
  - [ ] RDS endpoint and password
  - [ ] S3 bucket names
  - [ ] EC2 IP address
  - [ ] SNS Topic ARN
  - [ ] CloudFront URL (if used)
  - [ ] SSH key location

- [ ] **URLs documented**:
  - [ ] Frontend: `___________________________________________`
  - [ ] Backend API: `___________________________________________`
  - [ ] Health check: `___________________________________________`

- [ ] **Credentials secured**:
  - [ ] AWS IAM access keys backed up
  - [ ] RDS password backed up
  - [ ] JWT secret backed up
  - [ ] EC2 key pair backed up

- [ ] **Team notified**:
  - [ ] Shared frontend URL
  - [ ] Shared login credentials
  - [ ] Shared documentation

---

## 🎉 Deployment Complete!

### Your Live System:

```
Frontend: _____________________________________________________
Backend:  _____________________________________________________
Database: _____________________________________________________
Status:   ☐ Production  ☐ Staging  ☐ Testing
```

### Next Steps:

1. **Monitor costs daily** for first week
2. **Test all features** thoroughly
3. **Train users** on the system
4. **Setup regular backups**
5. **Document any issues** in troubleshooting guide
6. **Plan for scaling** if needed

---

## 📞 Support Resources

- **Deployment Guide**: `01-MANUAL-DEPLOYMENT-GUIDE.md`
- **Troubleshooting**: `02-TROUBLESHOOTING-GUIDE.md`
- **Cost Monitoring**: `04-COST-MONITORING-GUIDE.md`
- **AWS Support**: https://console.aws.amazon.com/support/

---

## ⏱️ Total Time Spent

- IAM Setup: _____ minutes
- RDS Setup: _____ minutes
- S3 Setup: _____ minutes
- EC2 Setup: _____ minutes
- Software Install: _____ minutes
- Backend Deploy: _____ minutes
- Nginx Config: _____ minutes
- Frontend Deploy: _____ minutes
- SNS Setup: _____ minutes (optional)
- CloudFront: _____ minutes (optional)
- Testing: _____ minutes
- Security: _____ minutes

**Total: _____ minutes / _____ hours**

---

**Congratulations on completing your AWS deployment! 🚀**

Print this checklist and mark items as you complete them. Keep it with your project documentation for future reference.
