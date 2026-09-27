# AttendX - AWS Deployment Troubleshooting Guide

This guide helps you diagnose and fix common issues during AWS deployment.

---

## 🔍 Quick Diagnostics

### Backend Health Check
```bash
# From anywhere with internet
curl http://YOUR_EC2_IP/api/health

# Should return: {"status":"ok"}
```

### Check PM2 Status
```bash
# On EC2 instance
pm2 status
pm2 logs attendx-backend --lines 50
```

### Check Nginx Status
```bash
# On EC2 instance
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

### Check Database Connection
```bash
# On EC2 instance
mysql -h YOUR_RDS_ENDPOINT -u admin -p attendx -e "SELECT 1"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Cannot SSH into EC2 Instance

**Symptoms:**
```
Connection timed out
Permission denied (publickey)
```

**Solutions:**

**A. Connection Timeout**
```bash
# 1. Check security group allows SSH from your IP
# AWS Console → EC2 → Security Groups → attendx-backend-sg
# Inbound Rules should have: SSH (22) from Your IP

# 2. Verify your current IP
# Visit: https://whatismyip.com

# 3. Update security group if IP changed
```

**B. Permission Denied**
```bash
# Windows PowerShell
icacls attendx-backend-key.pem /inheritance:r
icacls attendx-backend-key.pem /grant:r "$env:USERNAME:R"

# Mac/Linux
chmod 400 attendx-backend-key.pem

# Verify key is correct
ssh -i attendx-backend-key.pem ubuntu@YOUR_EC2_IP
```

**C. Wrong User**
```bash
# Use 'ubuntu' user, not 'ec2-user' or 'root'
ssh -i attendx-backend-key.pem ubuntu@YOUR_EC2_IP
```

---

### Issue 2: Backend Not Starting

**Symptoms:**
```
pm2 status shows "errored" or "stopped"
pm2 logs show connection errors
```

**Solutions:**

**A. Check Logs First**
```bash
pm2 logs attendx-backend --lines 100

# Common errors to look for:
# - Database connection failed
# - Port already in use
# - Missing environment variables
# - Module not found
```

**B. Database Connection Failed**
```bash
# Test database connection manually
mysql -h YOUR_RDS_ENDPOINT -u admin -p

# If fails, check:
# 1. RDS endpoint is correct in .env
# 2. Password is correct
# 3. RDS security group allows EC2 security group
# 4. RDS is running (not stopped)

# Fix: Update .env file
cd /home/ubuntu/backend
nano .env
# Update DB_HOST, DB_PASSWORD
pm2 restart attendx-backend
```

**C. Port Already in Use**
```bash
# Find process using port 5001
sudo lsof -i :5001

# Kill it
sudo kill -9 PID

# Or use a different port
# Edit .env: PORT=5002
pm2 restart attendx-backend
```

**D. Missing Node Modules**
```bash
cd /home/ubuntu/backend
rm -rf node_modules package-lock.json
npm install
pm2 restart attendx-backend
```

**E. Python Face Recognition Errors**
```bash
# Reinstall Python dependencies
cd /home/ubuntu/backend/python
pip3 install --upgrade pip
pip3 install -r requirements.txt --force-reinstall

# If dlib fails (common on t2.micro)
sudo apt install -y libopenblas-dev liblapack-dev
pip3 install dlib --no-cache-dir

# Increase swap if needed
free -h  # Check current swap
```

---

### Issue 3: Frontend Not Loading

**Symptoms:**
```
S3 URL shows 403 Forbidden
CloudFront shows Access Denied
Blank page or 404 errors
```

**Solutions:**

**A. 403 Forbidden on S3**
```bash
# Check bucket policy allows public access

# AWS Console → S3 → Your Bucket → Permissions → Bucket Policy
# Should have:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
  }]
}

# Also check: Block Public Access should be OFF
```

**B. Files Not Uploaded**
```bash
# Check S3 bucket contents
aws s3 ls s3://YOUR-BUCKET-NAME/

# Should see: index.html, assets/, etc.

# Re-upload if missing
cd frontend
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME/ --delete
```

**C. React Router 404 Errors**
```bash
# S3 Static Website Hosting must redirect errors to index.html

# AWS Console → S3 → Properties → Static Website Hosting
# Error document: index.html

# If using CloudFront, add custom error responses:
# Error Code: 403 → Response: /index.html (200 status)
# Error Code: 404 → Response: /index.html (200 status)
```

**D. API Calls Failing (CORS errors)**
```bash
# Check frontend .env has correct API URL
# frontend/.env should have:
VITE_API_BASE_URL=http://YOUR_EC2_IP/api

# Rebuild and redeploy
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME/ --delete
```

---

### Issue 4: Face Recognition Not Working

**Symptoms:**
```
Face detection times out
Returns "No faces detected" even with clear faces
Python script errors
```

**Solutions:**

**A. Timeout Errors**
```bash
# t2.micro is slow for face recognition
# Increase Nginx timeout

sudo nano /etc/nginx/sites-available/attendx

# In location /api block, increase:
proxy_connect_timeout 600;
proxy_send_timeout 600;
proxy_read_timeout 600;

# Restart Nginx
sudo systemctl restart nginx
```

**B. Python Script Not Found**
```bash
# Verify Python script exists
ls -la /home/ubuntu/backend/python/face_recognition_service.py

# Check .env has correct path
cd /home/ubuntu/backend
grep FACE_RECOGNITION_SCRIPT .env

# Should be: ./python/face_recognition_service.py
```

**C. Face Recognition Models Missing**
```bash
# Check models directory
ls -la /home/ubuntu/backend/python/models/

# Should contain:
# - deploy.prototxt
# - res10_300x300_ssd_iter_140000.caffemodel

# If missing, copy from local machine
scp -i attendx-backend-key.pem -r backend/python/models ubuntu@YOUR_EC2_IP:/home/ubuntu/backend/python/
```

**D. Insufficient Memory**
```bash
# Check memory usage
free -h

# If swap is full, increase it
sudo swapoff /swapfile
sudo dd if=/dev/zero of=/swapfile bs=1M count=4096  # 4GB
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verify
free -h
```

**E. OpenCV Errors**
```bash
# Reinstall OpenCV
sudo apt remove -y python3-opencv libopencv-dev
sudo apt install -y libopencv-dev python3-opencv
pip3 install opencv-python --force-reinstall

# Test OpenCV
python3 -c "import cv2; print(cv2.__version__)"
```

---

### Issue 5: RDS Connection Issues

**Symptoms:**
```
ECONNREFUSED
Connection timed out
Access denied for user
```

**Solutions:**

**A. Connection Timeout**
```bash
# Check RDS security group

# AWS Console → RDS → Databases → attendx-db → Connectivity
# Security group inbound rules must have:
# Type: MySQL/Aurora (3306)
# Source: attendx-backend-sg (EC2 security group)

# Add rule if missing:
# EC2 → Security Groups → attendx-db-sg → Inbound Rules → Edit
# Add: MySQL/Aurora, Port 3306, Source: attendx-backend-sg
```

**B. Access Denied**
```bash
# Wrong username or password
cd /home/ubuntu/backend
nano .env

# Verify:
DB_USER=admin  # Should match RDS master username
DB_PASSWORD=YourActualPassword  # Case-sensitive!

# Save and restart
pm2 restart attendx-backend
```

**C. Database Not Found**
```bash
# Database 'attendx' doesn't exist

# Connect to RDS and create it
mysql -h YOUR_RDS_ENDPOINT -u admin -p

# Run:
CREATE DATABASE IF NOT EXISTS attendx;
USE attendx;
exit

# Re-import data
mysql -h YOUR_RDS_ENDPOINT -u admin -p attendx < attendx_complete_database.sql
```

**D. RDS Instance Stopped**
```bash
# Free tier RDS stops automatically after 7 days of inactivity

# AWS Console → RDS → Databases
# If Status = "Stopped", click "Actions" → "Start"
# Wait 5 minutes for it to become Available
```

---

### Issue 6: S3 Upload Failing from Backend

**Symptoms:**
```
S3 upload error: Access Denied
Could not determine the partition endpoint
```

**Solutions:**

**A. AWS Credentials Missing**
```bash
# Option 1: Use IAM Role (Recommended)

# AWS Console → EC2 → Instances → attendx-backend
# Actions → Security → Modify IAM Role
# Create role with policies:
# - AmazonS3FullAccess
# - AmazonSNSFullAccess

# Then restart backend
pm2 restart attendx-backend
```

**B. Using Access Keys**
```bash
# If not using IAM role, add to .env
cd /home/ubuntu/backend
nano .env

AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtn...

# Save and restart
pm2 restart attendx-backend
```

**C. Bucket Name Wrong**
```bash
# Check bucket name in .env
grep S3_BUCKET_NAME .env

# Should match actual bucket name
# Update if wrong
```

**D. Bucket Doesn't Exist**
```bash
# List your S3 buckets
aws s3 ls

# If bucket missing, create it:
aws s3 mb s3://your-bucket-name --region us-east-1
```

---

### Issue 7: Nginx Serving 502 Bad Gateway

**Symptoms:**
```
Nginx error: 502 Bad Gateway
Upstream connect error
```

**Solutions:**

**A. Backend Not Running**
```bash
# Check if Node.js is running
pm2 status

# If not running, start it
cd /home/ubuntu/backend
pm2 start ecosystem.config.js

# Check logs
pm2 logs
```

**B. Wrong Port in Nginx Config**
```bash
# Check Nginx config
sudo nano /etc/nginx/sites-available/attendx

# Should have:
proxy_pass http://localhost:5001;

# Must match PORT in backend .env
grep PORT /home/ubuntu/backend/.env

# If different, update one of them and restart
sudo systemctl restart nginx
pm2 restart attendx-backend
```

**C. Nginx Can't Connect to Backend**
```bash
# Test if backend is listening
curl http://localhost:5001/api/health

# If fails, backend isn't running properly
# Check PM2 logs:
pm2 logs attendx-backend
```

---

### Issue 8: Out of Disk Space

**Symptoms:**
```
ENOSPC: no space left on device
Logs show disk full errors
```

**Solutions:**

**A. Check Disk Usage**
```bash
df -h
# Look at "/" filesystem usage

# Check what's using space
du -sh /home/ubuntu/* | sort -h
```

**B. Clean Up Logs**
```bash
# PM2 logs can grow large
pm2 flush  # Clears all logs

# Limit log size in ecosystem.config.js
nano /home/ubuntu/backend/ecosystem.config.js

# Add:
max_size: '10M',
max_files: 5,
```

**C. Clean Package Caches**
```bash
# Clean npm cache
npm cache clean --force

# Clean pip cache
pip3 cache purge

# Clean apt cache
sudo apt clean
sudo apt autoremove -y
```

**D. Remove Old Node Modules**
```bash
# If you have multiple node_modules
cd /home/ubuntu/backend
rm -rf node_modules
npm install
```

---

### Issue 9: High Memory Usage / Out of Memory

**Symptoms:**
```
Process killed
PM2 restarts frequently
System becoming unresponsive
```

**Solutions:**

**A. Check Memory Usage**
```bash
free -h
htop  # Press q to quit
```

**B. Increase Swap**
```bash
# Current swap
swapon --show

# Increase to 4GB
sudo swapoff /swapfile
sudo rm /swapfile
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verify
free -h
```

**C. Reduce Node.js Memory**
```bash
# In ecosystem.config.js
nano /home/ubuntu/backend/ecosystem.config.js

# Change:
max_memory_restart: '400M',  # Lower limit

pm2 restart attendx-backend
```

**D. Optimize Python Face Recognition**
```bash
# Use HOG model instead of CNN (faster, less memory)
# In .env:
FACE_DETECTION_MODEL=hog

pm2 restart attendx-backend
```

---

### Issue 10: SSL / HTTPS Issues

**Symptoms:**
```
Not secure warning
Certificate errors
Mixed content warnings
```

**Solutions:**

**A. Get Free SSL with Let's Encrypt**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

**B. Mixed Content (HTTP in HTTPS page)**
```javascript
// Frontend making HTTP API calls from HTTPS page

// Solution: Use relative URLs or ensure API is HTTPS too
// In frontend code:
const API_URL = process.env.VITE_API_BASE_URL || '/api';
```

---

## 🔧 Useful Commands

### System Monitoring
```bash
# CPU and memory usage
htop

# Disk usage
df -h
du -sh /home/ubuntu/*

# Network connections
netstat -tlnp

# Process list
ps aux | grep node
ps aux | grep nginx
```

### PM2 Commands
```bash
# Status
pm2 status
pm2 describe attendx-backend

# Logs
pm2 logs attendx-backend
pm2 logs attendx-backend --lines 100
pm2 logs attendx-backend --err  # Errors only

# Control
pm2 restart attendx-backend
pm2 stop attendx-backend
pm2 delete attendx-backend
pm2 start ecosystem.config.js

# Monitoring
pm2 monit
pm2 plus  # Cloud monitoring (optional)
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload without downtime
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/attendx-access.log
sudo tail -f /var/log/nginx/attendx-error.log
```

### AWS CLI Commands
```bash
# S3 operations
aws s3 ls
aws s3 ls s3://your-bucket/
aws s3 sync dist/ s3://your-bucket/ --delete
aws s3 rm s3://your-bucket/ --recursive  # DANGER: Deletes all!

# RDS info
aws rds describe-db-instances --query "DBInstances[*].[DBInstanceIdentifier,Endpoint.Address,DBInstanceStatus]" --output table

# EC2 info
aws ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,PublicIpAddress,State.Name]" --output table
```

---

## 📞 Getting Help

### Check Logs First
1. PM2 logs: `pm2 logs attendx-backend`
2. Nginx error logs: `sudo tail -f /var/log/nginx/attendx-error.log`
3. System logs: `sudo journalctl -xe`

### AWS Support Resources
- **AWS Free Tier FAQ**: https://aws.amazon.com/free/free-tier-faqs/
- **RDS Documentation**: https://docs.aws.amazon.com/rds/
- **EC2 Documentation**: https://docs.aws.amazon.com/ec2/
- **S3 Documentation**: https://docs.aws.amazon.com/s3/

### Community Help
- **AWS Forums**: https://forums.aws.amazon.com/
- **Stack Overflow**: Tag questions with `amazon-web-services`, `aws-ec2`, etc.

---

## 🚨 Emergency Recovery

### If Everything Breaks

**1. Create EC2 Snapshot**
```bash
# AWS Console → EC2 → Instances → attendx-backend
# Actions → Image and templates → Create image
```

**2. Start Fresh**
```bash
# Stop application
pm2 delete all

# Re-run setup
cd /home/ubuntu
wget https://raw.githubusercontent.com/.../setup-ec2-initial.sh
bash setup-ec2-initial.sh

# Re-deploy
bash deploy-backend.sh
```

**3. Database Backup**
```bash
# Export database
mysqldump -h YOUR_RDS_ENDPOINT -u admin -p attendx > backup.sql

# Restore if needed
mysql -h YOUR_RDS_ENDPOINT -u admin -p attendx < backup.sql
```

---

**Still stuck? Check the main deployment guide or review AWS service dashboards for any service disruptions.**
