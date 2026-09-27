# AttendX - AWS Free Tier Manual Deployment Guide

**Target Setup**: AWS Free Tier | Region: us-east-1 | Manual Console Setup

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- ✅ AWS Account (with payment method added)
- ✅ AttendX project code
- ✅ MySQL Workbench or MySQL CLI installed locally
- ✅ Git installed
- ✅ SSH client (Terminal/PowerShell)

---

## 🎯 Free Tier Services We'll Use

| Service | Free Tier Limit | Our Usage |
|---------|----------------|-----------|
| **EC2** | 750 hrs/month t2.micro | ✅ t2.micro (1 instance) |
| **RDS** | 750 hrs/month db.t2.micro | ✅ db.t2.micro MySQL |
| **S3** | 5GB storage, 20K GET, 2K PUT | ✅ ~1-2GB images |
| **Data Transfer** | 1GB/month out | ✅ Low traffic |
| **CloudFront** | 50GB out, 2M requests | ✅ Frontend CDN |
| **SNS** | 1000 emails, 100 SMS | ⚠️ Pay per use after |

**💡 Estimated Cost**: $0-5/month (mostly free, small overages possible)

---

## 🚀 Deployment Steps

### **PHASE 1: IAM User Setup** ⏱️ 10 minutes

#### Step 1.1: Create Deployment User

1. Login to AWS Console: https://console.aws.amazon.com/
2. Navigate to **IAM** service
3. Click **Users** → **Create user**

**User Details:**
- Username: `attendx-deployer`
- Access type: ✅ Programmatic access ✅ AWS Management Console access
- Console password: Set custom password
- ✅ Require password reset: NO

4. Click **Next: Permissions**

#### Step 1.2: Attach Policies

Select **Attach existing policies directly** and add:
- ✅ `AmazonEC2FullAccess`
- ✅ `AmazonRDSFullAccess`
- ✅ `AmazonS3FullAccess`
- ✅ `AmazonSNSFullAccess`
- ✅ `CloudFrontFullAccess`

> 🔒 **Security Note**: For production, create custom policies with minimal permissions

5. Click **Next** → **Create user**

#### Step 1.3: Save Credentials

**⚠️ CRITICAL**: Save these immediately (you can't see them again!):
```
Access Key ID: AKIA...
Secret Access Key: wJalrXUtn...
Console Login URL: https://123456789.signin.aws.amazon.com/console
```

📝 **Action Required**: Copy these to a secure password manager or file

---

### **PHASE 2: RDS MySQL Database** ⏱️ 20 minutes

#### Step 2.1: Create Database

1. Navigate to **RDS** service
2. Click **Create database**

**Engine Options:**
- Engine type: ✅ MySQL
- Version: MySQL 8.0.35 (or latest)
- Template: ✅ **Free tier**

**Settings:**
- DB instance identifier: `attendx-db`
- Master username: `admin`
- Master password: `YourStrongPassword123!` (save this!)
- ✅ Auto generate password: NO

**DB Instance Class:**
- ✅ db.t2.micro (auto-selected with free tier)

**Storage:**
- Storage type: General Purpose SSD (gp2)
- Allocated storage: 20 GB (free tier max)
- ❌ Storage autoscaling: OFF (to avoid charges)

**Connectivity:**
- VPC: Default VPC
- Subnet group: default
- Public access: ✅ **Yes** (we need this for initial setup)
- VPC security group: Create new
  - Name: `attendx-db-sg`
- Availability Zone: No preference
- Database port: 3306

**Additional Configuration:**
- Initial database name: `attendx`
- ❌ Automated backups: Enable (7 days free)
- ❌ Encryption: OFF (to stay in free tier)
- ❌ Performance Insights: OFF

3. Click **Create database** (takes 5-10 minutes)

#### Step 2.2: Configure Security Group

1. While database is creating, go to **EC2** → **Security Groups**
2. Find `attendx-db-sg`
3. Click **Inbound rules** → **Edit inbound rules**
4. **Add rule**:
   - Type: `MySQL/Aurora`
   - Port: `3306`
   - Source: `My IP` (for now - we'll update this later)
   - Description: `Temporary - local access`
5. **Save rules**

#### Step 2.3: Get Database Endpoint

1. Go back to **RDS** → **Databases**
2. Click on `attendx-db`
3. Wait until Status = **Available**
4. Copy the **Endpoint**: 
   ```
   attendx-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com
   ```

📝 **Save this endpoint** - you'll need it multiple times!

#### Step 2.4: Import Database

**Option A: Using MySQL Workbench (Recommended)**
1. Open MySQL Workbench
2. Create new connection:
   - Hostname: `attendx-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com`
   - Port: `3306`
   - Username: `admin`
   - Password: `YourStrongPassword123!`
3. Test connection
4. Open SQL file: `attendx_complete_database.sql`
5. Execute all statements

**Option B: Using MySQL CLI**
```bash
# From your project root
mysql -h attendx-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com -P 3306 -u admin -p attendx < attendx_complete_database.sql

# Enter password when prompted
```

**Verification:**
```sql
USE attendx;
SELECT COUNT(*) FROM students;  -- Should return 59
SELECT COUNT(*) FROM faculty;   -- Should return 5
SELECT COUNT(*) FROM subjects;  -- Should return 20
```

✅ **Checkpoint**: Database imported successfully!

---

### **PHASE 3: S3 Buckets Setup** ⏱️ 15 minutes

We need 2 buckets: one for images, one for frontend.

#### Step 3.1: Create Images Bucket

1. Navigate to **S3** service
2. Click **Create bucket**

**Bucket Settings:**
- Bucket name: `attendx-images-YOUR-INITIALS-2026` 
  - Example: `attendx-images-nb-2026`
  - Must be globally unique!
- Region: **US East (N. Virginia) us-east-1**
- ❌ Block all public access: **Uncheck this** (we need public read)
- ⚠️ Acknowledge warning: ✅ Check
- ❌ Bucket Versioning: Disabled (to save storage)
- ❌ Default encryption: Disabled
- Click **Create bucket**

#### Step 3.2: Configure Images Bucket Policy

1. Click on your bucket name: `attendx-images-nb-2026`
2. Go to **Permissions** tab
3. Scroll to **Bucket policy** → **Edit**
4. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::attendx-images-nb-2026/*"
    }
  ]
}
```

5. Click **Save changes**

#### Step 3.3: Create Folders in Images Bucket

1. Click **Create folder**
   - Folder name: `students/`
   - Click **Create folder**
2. Click **Create folder**
   - Folder name: `attendance/`
   - Click **Create folder**

#### Step 3.4: Upload Existing Student Images

1. Click on `students/` folder
2. Click **Upload**
3. **Add files** → Navigate to `backend/uploads/students/`
4. Select all images (should be ~6 student photos)
5. Click **Upload**

✅ **Checkpoint**: Images bucket configured!

#### Step 3.5: Create Frontend Bucket

1. Go back to S3 → **Create bucket**

**Bucket Settings:**
- Bucket name: `attendx-frontend-YOUR-INITIALS-2026`
  - Example: `attendx-frontend-nb-2026`
- Region: **US East (N. Virginia) us-east-1**
- ❌ Block all public access: **Uncheck**
- ⚠️ Acknowledge warning: ✅ Check
- Click **Create bucket**

#### Step 3.6: Enable Static Website Hosting

1. Click on `attendx-frontend-nb-2026`
2. Go to **Properties** tab
3. Scroll to **Static website hosting** → **Edit**
4. Settings:
   - Static website hosting: ✅ **Enable**
   - Hosting type: ✅ Host a static website
   - Index document: `index.html`
   - Error document: `index.html` (for React Router)
5. Click **Save changes**
6. **Note the Bucket website endpoint**: 
   ```
   http://attendx-frontend-nb-2026.s3-website-us-east-1.amazonaws.com
   ```

#### Step 3.7: Configure Frontend Bucket Policy

1. Go to **Permissions** tab
2. **Bucket policy** → **Edit**
3. Paste this policy (replace bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::attendx-frontend-nb-2026/*"
    }
  ]
}
```

4. Click **Save changes**

📝 **Save these bucket names** - needed for configuration!

---

### **PHASE 4: EC2 Instance Setup** ⏱️ 30 minutes

#### Step 4.1: Launch Instance

1. Navigate to **EC2** service
2. Click **Launch Instance**

**Name and Tags:**
- Name: `attendx-backend`

**Application and OS Images:**
- **Quick Start**: Ubuntu
- **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
- **Architecture**: 64-bit (x86)

**Instance Type:**
- Family: ✅ **t2.micro** (Free tier eligible)
- vCPUs: 1
- Memory: 1 GiB
- ⚠️ **Note**: Python face recognition will be slower but functional

**Key Pair:**
- Click **Create new key pair**
- Key pair name: `attendx-backend-key`
- Key pair type: RSA
- Private key format: `.pem`
- Click **Create key pair**
- **⚠️ SAVE THIS FILE**: It downloads automatically → Move to safe location

**Network Settings:**
- Click **Edit**
- VPC: default
- Subnet: No preference (default)
- Auto-assign public IP: ✅ **Enable**
- Firewall (security groups): Create security group
  - Security group name: `attendx-backend-sg`
  - Description: `Security group for AttendX backend`

**Inbound Security Group Rules:**

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | My IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP access |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS access |
| Custom TCP | TCP | 5001 | 0.0.0.0/0 | Node.js API |

**Configure Storage:**
- Root volume: 
  - Size: **30 GiB** (free tier allows up to 30GB)
  - Volume type: gp2 (General Purpose SSD)
  - ❌ Delete on termination: Yes

**Advanced Details:**
- Leave all as default
- No IAM role for now (we'll add later if needed)

3. Click **Launch instance**
4. Wait for **Instance State** = Running (2-3 minutes)

#### Step 4.2: Get Public IP

1. Click on instance `attendx-backend`
2. Copy **Public IPv4 address**: Example: `3.85.123.45`
3. Copy **Public IPv4 DNS**: Example: `ec2-3-85-123-45.compute-1.amazonaws.com`

📝 **Save both** - you'll need them!

#### Step 4.3: Update RDS Security Group

**Allow EC2 to connect to RDS:**

1. Go to **EC2** → **Security Groups**
2. Find `attendx-db-sg` (the RDS security group)
3. **Edit inbound rules**
4. **Add rule**:
   - Type: `MySQL/Aurora`
   - Port: `3306`
   - Source: `Custom` → Select `attendx-backend-sg` (the EC2 security group)
   - Description: `EC2 backend access`
5. **Save rules**

🔒 **Optional**: Remove the "My IP" rule for better security

#### Step 4.4: Connect to EC2 Instance

**On Windows (PowerShell):**
```powershell
# Move to where you saved the key
cd ~\Downloads
icacls attendx-backend-key.pem /inheritance:r
icacls attendx-backend-key.pem /grant:r "$env:USERNAME:R"

# Connect
ssh -i attendx-backend-key.pem ubuntu@3.85.123.45
```

**On Mac/Linux:**
```bash
# Move key to safe location
mv ~/Downloads/attendx-backend-key.pem ~/.ssh/
chmod 400 ~/.ssh/attendx-backend-key.pem

# Connect
ssh -i ~/.ssh/attendx-backend-key.pem ubuntu@3.85.123.45
```

Type `yes` when asked about authenticity.

✅ **Checkpoint**: You should see Ubuntu prompt: `ubuntu@ip-xxx-xxx-xxx-xxx:~$`

---

### **PHASE 5: Install Software on EC2** ⏱️ 25 minutes

**You're now connected to EC2 via SSH. Run these commands:**

#### Step 5.1: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

#### Step 5.2: Install Node.js 18.x

```bash
# Install Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

#### Step 5.3: Install Python 3 and Dependencies

```bash
# Python should be pre-installed, but let's ensure dependencies
sudo apt install -y python3 python3-pip python3-dev

# Install system libraries for OpenCV and face_recognition
sudo apt install -y \
  build-essential \
  cmake \
  libopencv-dev \
  python3-opencv \
  libboost-all-dev \
  libgtk-3-dev \
  libavcodec-dev \
  libavformat-dev \
  libswscale-dev \
  libv4l-dev \
  libxvidcore-dev \
  libx264-dev

# Verify
python3 --version  # Should show Python 3.10.x or higher
```

#### Step 5.4: Install MySQL Client

```bash
sudo apt install -y mysql-client

# Test connection to RDS
mysql -h attendx-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com -u admin -p

# Enter password, then type: exit
```

#### Step 5.5: Install Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx  # Should show "active (running)"
```

#### Step 5.6: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version
```

#### Step 5.7: Install Git

```bash
sudo apt install -y git

# Verify
git --version
```

✅ **Checkpoint**: All software installed!

---

### **PHASE 6: Deploy Backend Code** ⏱️ 20 minutes

#### Step 6.1: Transfer Code to EC2

**Option A: Using Git (Recommended if you have a repo)**
```bash
cd /home/ubuntu
git clone https://github.com/yourusername/attendx.git
cd attendx/backend
```

**Option B: Using SCP (from your local machine)**

**On your local machine (new terminal, not SSH):**

**Windows PowerShell:**
```powershell
cd "d:\MCA\Sem 3\CC\AttendX\AttendX"
scp -i ~\Downloads\attendx-backend-key.pem -r backend ubuntu@3.85.123.45:/home/ubuntu/
scp -i ~\Downloads\attendx-backend-key.pem attendx_complete_database.sql ubuntu@3.85.123.45:/home/ubuntu/
```

**Mac/Linux:**
```bash
cd "/path/to/AttendX"
scp -i ~/.ssh/attendx-backend-key.pem -r backend ubuntu@3.85.123.45:/home/ubuntu/
scp -i ~/.ssh/attendx-backend-key.pem attendx_complete_database.sql ubuntu@3.85.123.45:/home/ubuntu/
```

**Back on EC2 SSH session:**
```bash
cd /home/ubuntu/backend
ls -la  # Verify files are there
```

#### Step 6.2: Install Node.js Dependencies

```bash
cd /home/ubuntu/backend
npm install

# This will take 3-5 minutes
```

#### Step 6.3: Install Python Dependencies

```bash
cd /home/ubuntu/backend/python
pip3 install -r requirements.txt

# This will take 5-10 minutes (dlib takes time to compile)
# Don't worry if you see warnings
```

**⚠️ If dlib installation fails** (common on t2.micro due to low RAM):
```bash
# Increase swap memory temporarily
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Try again
pip3 install dlib
pip3 install face-recognition
```

#### Step 6.4: Create Production Environment File

```bash
cd /home/ubuntu/backend
nano .env
```

**Paste this configuration** (update with YOUR values):

```env
# Server Configuration
PORT=5001
NODE_ENV=production

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secure_random_jwt_secret_key_here_change_this
JWT_EXPIRES_IN=24h

# AWS Configuration
AWS_REGION=us-east-1
# We'll use IAM role instead of keys (more secure)
# If needed, add them here later

# S3 Configuration
S3_BUCKET_NAME=attendx-images-nb-2026
S3_STUDENT_PHOTOS_PREFIX=students/
S3_ATTENDANCE_IMAGES_PREFIX=attendance/

# RDS MySQL Configuration
DB_HOST=attendx-db.xxxxxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YourStrongPassword123!
DB_NAME=attendx

# SNS Configuration (we'll add later)
SNS_TOPIC_ARN=

# Python Configuration
PYTHON_EXECUTABLE=python3
FACE_RECOGNITION_SCRIPT=./python/face_recognition_service.py

# Frontend URL
FRONTEND_URL=http://attendx-frontend-nb-2026.s3-website-us-east-1.amazonaws.com

# Storage Mode
USE_AWS=true
USE_LOCAL_STORAGE=false
```

**Save and exit**: 
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

**🔒 Secure the file:**
```bash
chmod 600 .env
```

#### Step 6.5: Test Backend Locally

```bash
cd /home/ubuntu/backend
node src/server.js
```

You should see:
```
🚀 AttendX Backend Server Started
📡 Server: http://localhost:5001
✅ Database connected successfully
```

**Test the API:**
Open another terminal and SSH again, then:
```bash
curl http://localhost:5001/api/health
```

Should return: `{"status":"ok"}`

**Stop the server**: Press `Ctrl + C` in the first terminal

---

### **PHASE 7: Configure Nginx Reverse Proxy** ⏱️ 10 minutes

#### Step 7.1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/attendx
```

**Paste this configuration** (replace `3.85.123.45` with your EC2 public IP):

```nginx
server {
    listen 80;
    server_name 3.85.123.45 ec2-3-85-123-45.compute-1.amazonaws.com;

    # API requests
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for face recognition
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5001/health;
    }

    # Default response
    location / {
        return 200 'AttendX Backend API is running. Use /api endpoints.';
        add_header Content-Type text/plain;
    }
}
```

**Save and exit**: `Ctrl + X`, `Y`, `Enter`

#### Step 7.2: Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/attendx /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Should show: "syntax is ok" and "test is successful"

# Restart Nginx
sudo systemctl restart nginx
```

---

### **PHASE 8: Setup PM2 for Backend** ⏱️ 10 minutes

#### Step 8.1: Create PM2 Ecosystem File

```bash
cd /home/ubuntu/backend
nano ecosystem.config.js
```

**Paste this:**

```javascript
module.exports = {
  apps: [{
    name: 'attendx-backend',
    script: './src/server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

**Save and exit**: `Ctrl + X`, `Y`, `Enter`

#### Step 8.2: Create Logs Directory

```bash
mkdir -p /home/ubuntu/backend/logs
```

#### Step 8.3: Start Application with PM2

```bash
cd /home/ubuntu/backend
pm2 start ecosystem.config.js

# Should show:
# ┌─────┬──────────────────┬─────────┬─────────┬───────────┐
# │ id  │ name             │ status  │ restart │ uptime    │
# └─────┴──────────────────┴─────────┴─────────┴───────────┘
```

#### Step 8.4: Configure PM2 Startup

```bash
# Save PM2 process list
pm2 save

# Generate startup script
pm2 startup systemd

# Run the command it outputs (something like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

#### Step 8.5: Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs attendx-backend --lines 50

# Test API from outside
curl http://3.85.123.45/api/health
```

✅ **Checkpoint**: Backend is deployed and running!

---

### **PHASE 9: Deploy Frontend** ⏱️ 15 minutes

#### Step 9.1: Build Frontend Locally

**On your local machine (not EC2):**

```powershell
cd "d:\MCA\Sem 3\CC\AttendX\AttendX\frontend"

# Update .env with production API URL
# Edit frontend/.env
```

Update `.env`:
```env
VITE_API_BASE_URL=http://3.85.123.45/api
VITE_APP_NAME=AttendX
VITE_APP_VERSION=1.0.0
```

**Build the frontend:**
```powershell
npm install  # If not already done
npm run build

# Creates frontend/dist folder
```

#### Step 9.2: Upload to S3

**Option A: Using AWS CLI (need to install first)**

**Install AWS CLI:**
```powershell
# Download from: https://awscli.amazonaws.com/AWSCLIV2.msi
# Or use chocolatey: choco install awscli

# Configure AWS CLI
aws configure
# Enter:
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: wJalrX...
# Default region: us-east-1
# Default output format: json
```

**Upload to S3:**
```powershell
cd "d:\MCA\Sem 3\CC\AttendX\AttendX\frontend"
aws s3 sync dist/ s3://attendx-frontend-nb-2026/ --delete
```

**Option B: Using AWS Console (Manual Upload)**

1. Open S3 Console
2. Click on `attendx-frontend-nb-2026`
3. Click **Upload**
4. **Add folder** → Select `frontend/dist` folder contents (NOT the dist folder itself!)
5. Click **Upload**
6. Wait for upload to complete

#### Step 9.3: Test Frontend

Open in browser:
```
http://attendx-frontend-nb-2026.s3-website-us-east-1.amazonaws.com
```

You should see the AttendX login page!

✅ **Checkpoint**: Frontend is deployed!

---

### **PHASE 10: Setup SNS (Optional)** ⏱️ 10 minutes

#### Step 10.1: Create SNS Topic

1. Navigate to **SNS** service
2. Click **Topics** → **Create topic**
3. Settings:
   - Type: ✅ Standard
   - Name: `attendx-notifications`
   - Display name: `AttendX`
4. Click **Create topic**
5. **Copy Topic ARN**: `arn:aws:sns:us-east-1:123456789:attendx-notifications`

#### Step 10.2: Create Email Subscription (Optional)

1. Click **Create subscription**
2. Settings:
   - Protocol: Email
   - Endpoint: your-email@example.com
3. Click **Create subscription**
4. Check your email and confirm subscription

#### Step 10.3: Update Backend .env

```bash
# SSH to EC2
ssh -i attendx-backend-key.pem ubuntu@3.85.123.45

# Edit .env
cd /home/ubuntu/backend
nano .env

# Add SNS Topic ARN
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:attendx-notifications

# Save: Ctrl+X, Y, Enter

# Restart backend
pm2 restart attendx-backend
```

---

### **PHASE 11: Setup CloudFront (Optional - Better Performance)** ⏱️ 15 minutes

#### Step 11.1: Create Distribution

1. Navigate to **CloudFront** service
2. Click **Create distribution**

**Origin Settings:**
- Origin domain: Select your S3 frontend bucket from dropdown
  - `attendx-frontend-nb-2026.s3-website-us-east-1.amazonaws.com`
- Origin path: Leave empty
- Name: Auto-filled
- Origin access: Public

**Default Cache Behavior:**
- Viewer protocol policy: ✅ Redirect HTTP to HTTPS
- Allowed HTTP methods: GET, HEAD, OPTIONS
- Cache policy: CachingOptimized
- Origin request policy: CORS-S3Origin

**Settings:**
- Price class: Use only North America and Europe (cheaper)
- Alternate domain names: Leave empty (no custom domain)
- Custom SSL certificate: Default CloudFront Certificate
- Default root object: `index.html`

3. Click **Create distribution**
4. Wait 5-10 minutes for deployment
5. **Copy Distribution Domain Name**: `d111111abcdef8.cloudfront.net`

#### Step 11.2: Configure Custom Error Pages

1. Click on your distribution
2. Go to **Error pages** tab
3. Click **Create custom error response**

**Error 403:**
- HTTP error code: 403
- Error caching minimum TTL: 10
- Customize error response: Yes
- Response page path: `/index.html`
- HTTP response code: 200
- Click **Create**

**Error 404:**
- HTTP error code: 404
- Error caching minimum TTL: 10
- Customize error response: Yes
- Response page path: `/index.html`
- HTTP response code: 200
- Click **Create**

#### Step 11.3: Update Frontend .env and Rebuild

**On your local machine:**

```powershell
cd "d:\MCA\Sem 3\CC\AttendX\AttendX\frontend"

# Keep the same .env (API URL doesn't change)

# Rebuild
npm run build

# Upload again
aws s3 sync dist/ s3://attendx-frontend-nb-2026/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

#### Step 11.4: Test CloudFront URL

Open: `https://d111111abcdef8.cloudfront.net`

✅ **Much faster with HTTPS!**

---

## 🎉 DEPLOYMENT COMPLETE!

### **Your Live URLs:**

- **Frontend**: 
  - S3: `http://attendx-frontend-nb-2026.s3-website-us-east-1.amazonaws.com`
  - CloudFront (if setup): `https://d111111abcdef8.cloudfront.net`
  
- **Backend API**: `http://3.85.123.45/api`

- **Health Check**: `http://3.85.123.45/health`

---

## 🧪 Testing Checklist

### Test 1: Backend API
```bash
curl http://3.85.123.45/api/health
# Should return: {"status":"ok"}
```

### Test 2: Login
1. Open frontend URL
2. Login as: `lata.gohil@nirmauni.ac.in` / `f123`
3. Should see faculty dashboard

### Test 3: View Students
1. Click "Students" in sidebar
2. Should see 59 MCA students

### Test 4: Image Upload
1. Try uploading a student photo
2. Should upload to S3

### Test 5: Face Recognition
1. Start a session
2. Upload a group photo
3. Should detect faces (may be slow on t2.micro)

---

## 📊 Monitoring & Maintenance

### View Backend Logs
```bash
ssh -i attendx-backend-key.pem ubuntu@3.85.123.45
pm2 logs attendx-backend
```

### Restart Backend
```bash
pm2 restart attendx-backend
```

### Update Backend Code
```bash
cd /home/ubuntu/backend
git pull  # if using git
npm install  # if package.json changed
pm2 restart attendx-backend
```

### Update Frontend
```bash
# On local machine
cd frontend
npm run build
aws s3 sync dist/ s3://attendx-frontend-nb-2026/ --delete
```

### Check System Resources
```bash
# On EC2
htop  # Install: sudo apt install htop
df -h  # Disk usage
free -h  # Memory usage
```

---

## ⚠️ Important Notes

### Free Tier Limits

**What to Watch:**
1. **RDS**: 750 hours/month (one db.t2.micro running 24/7 = ~720 hours) ✅
2. **EC2**: 750 hours/month (one t2.micro running 24/7 = ~720 hours) ✅
3. **S3**: 5GB storage (stay under 5GB total) ⚠️
4. **Data Transfer**: 1GB/month outbound (careful with large images) ⚠️
5. **SNS**: 1000 emails free, then $0.00065/email ⚠️

**To Avoid Charges:**
- Don't run multiple instances simultaneously
- Delete old attendance images regularly
- Compress images before upload
- Monitor usage in AWS Billing Dashboard

### Security Recommendations

1. **Change Default Passwords**
   - Update faculty passwords after first login
   - Use strong RDS password

2. **Restrict SSH Access**
   - Update EC2 security group SSH rule to your IP only
   - Don't use 0.0.0.0/0 for SSH

3. **Environment Variables**
   - Never commit `.env` to git
   - Use strong JWT secret

4. **Database Security**
   - Remove "My IP" rule from RDS after initial setup
   - Only allow EC2 security group access

5. **S3 Bucket Security**
   - Only images bucket needs public access
   - Enable versioning for important data

### Cost Optimization

1. **Stop instances when not in use:**
   ```bash
   # Stop EC2 (doesn't delete, just stops billing for compute)
   # AWS Console → EC2 → Stop Instance
   
   # Stop RDS
   # AWS Console → RDS → Stop database (max 7 days)
   ```

2. **Setup Billing Alerts:**
   - AWS Console → Billing → Billing Preferences
   - Enable "Receive Free Tier Usage Alerts"
   - Set alert at $5, $10, $20

3. **Use S3 Lifecycle Policies:**
   - Auto-delete attendance images after 90 days
   - Move old images to Glacier

---

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs attendx-backend

# Common issues:
# 1. Database connection failed → Check RDS endpoint, password
# 2. Port already in use → pm2 delete all, pm2 start ecosystem.config.js
# 3. Python errors → Reinstall: pip3 install -r python/requirements.txt
```

### Frontend not loading
```bash
# 1. Check if files uploaded to S3
# 2. Verify bucket policy is public
# 3. Check .env has correct API URL
# 4. Clear browser cache
```

### Face recognition timeout
```bash
# t2.micro is slow for face recognition
# Options:
# 1. Increase timeout in nginx config
# 2. Upgrade to t3.small (costs money)
# 3. Use smaller images
```

### Database connection refused
```bash
# Check RDS security group allows EC2 security group
# Test from EC2:
mysql -h [RDS-ENDPOINT] -u admin -p

# If fails, check:
# 1. RDS is running
# 2. Security group rules
# 3. Endpoint is correct
```

### Out of memory on EC2
```bash
# Add swap space:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent:
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📞 Need Help?

**AWS Support:**
- Free tier: https://aws.amazon.com/free/
- Documentation: https://docs.aws.amazon.com/

**Project Issues:**
- Check backend logs: `pm2 logs`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check system logs: `sudo journalctl -xe`

---

## 🎯 Next Steps

1. **Test thoroughly** with all features
2. **Setup billing alerts** immediately
3. **Create AMI backup** of EC2 instance
4. **Setup RDS automated backups**
5. **Document any custom changes**
6. **Train users** on the system
7. **Monitor costs** daily for first week

---

**Estimated Total Time:** 3-4 hours (first time)

Good luck with your deployment! 🚀
