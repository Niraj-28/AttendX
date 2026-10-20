# Fix SSM Connection & Deploy - Quick Guide

## 🔴 Error Identified

**Session Manager Error:**
```
Systems Manager default role not enabled (No SSM fallback)
SSM Agent unable to acquire credentials
Not connected
```

**Root Causes:**
1. EC2 instance doesn't have the required IAM role attached
2. SSM Agent may not be installed/running
3. Instance needs specific permissions to work with Session Manager

---

## ✅ Quick Fix Options (Choose One)

### Option 1: Fix SSM and Use Session Manager (10 minutes)

#### Step 1.1: Create IAM Role for EC2

1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click **Roles** → **Create role**
3. Select **AWS service** → **EC2** → Click **Next**
4. Search and select: **AmazonSSMManagedInstanceCore**
5. Click **Next**
6. Role name: `EC2-SSM-Role`
7. Click **Create role**

#### Step 1.2: Attach Role to EC2 Instance

1. Go to EC2 Console: https://console.aws.amazon.com/ec2/
2. Find your instance (IP: 32.195.60.167)
3. Select instance → Click **Actions** → **Security** → **Modify IAM role**
4. Select **EC2-SSM-Role** from dropdown
5. Click **Update IAM role**
6. **Reboot instance**: Actions → Instance State → Reboot instance
7. Wait 3-4 minutes for reboot

#### Step 1.3: Connect and Deploy

1. Go back to EC2 instance page
2. Click **Connect** → **Session Manager** → **Connect**
3. Should work now! Run these commands:

```bash
sudo su - ubuntu
cd /home/ubuntu/AttendX
git pull origin main
pm2 restart attendx-backend
pm2 save
pm2 status attendx-backend
curl http://localhost:5001/api/health
```

---

### Option 2: Use SSH from PowerShell (5 minutes)

Your SSH key exists but connection timed out. This might be because:
1. **Security Group** doesn't allow SSH from your current IP
2. **EC2 instance** might be stopped or restarting

#### Step 2.1: Fix Security Group

1. Go to EC2 Console → **Instances**
2. Click on your instance (32.195.60.167)
3. Click **Security** tab
4. Click on the security group name (looks like sg-xxxxxxxxx)
5. Click **Edit inbound rules**
6. Find SSH rule (Port 22):
   - If it exists but has wrong IP: Click **Edit**
   - Source: Select **My IP** (will auto-fill your current IP)
   - If it doesn't exist: Click **Add rule**
     - Type: SSH
     - Source: My IP
7. Click **Save rules**

#### Step 2.2: Start Instance (if stopped)

1. EC2 Console → Instances
2. If instance shows "Stopped": Select it
3. **Actions** → **Instance State** → **Start instance**
4. Wait 2-3 minutes

#### Step 2.3: Deploy via SSH

Open PowerShell and run:

```powershell
# Set key path
$keyPath = "$env:USERPROFILE\OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem"

# Test connection
ssh -i "$keyPath" ubuntu@32.195.60.167 "echo 'Connection successful'"

# If successful, deploy
ssh -i "$keyPath" ubuntu@32.195.60.167 "cd /home/ubuntu/AttendX && git pull origin main && pm2 restart attendx-backend && pm2 save && pm2 status"

# Check health
ssh -i "$keyPath" ubuntu@32.195.60.167 "curl -s http://localhost:5001/api/health"
```

---

### Option 3: Manual Code Update via EC2 Console (Last Resort)

If both above fail, use EC2 Instance Connect (works through browser):

#### Step 3.1: Use EC2 Instance Connect

1. EC2 Console → **Instances**
2. Select your instance
3. Click **Connect** → Choose **EC2 Instance Connect** tab
4. Username: `ubuntu`
5. Click **Connect**

This opens a browser-based terminal.

#### Step 3.2: Deploy Commands

Run these commands in the terminal:

```bash
# Navigate to app
cd /home/ubuntu/AttendX

# Check current version
git log --oneline -1

# Pull latest code
git pull origin main

# If git pull fails due to local changes
git stash
git pull origin main

# Restart backend
pm2 restart attendx-backend

# Save PM2 config
pm2 save

# Check status
pm2 status attendx-backend

# Check logs
pm2 logs attendx-backend --lines 30 --nostream

# Test health
curl http://localhost:5001/api/health
```

---

## 🔍 Verify Deployment Success

After running deployment commands, check:

### 1. PM2 Status
Should show:
```
┌─────┬──────────────────┬─────┬────────┬─────┬─────────┐
│ id  │ name             │mode │ status │ ... │ ... ... │
├─────┼──────────────────┼─────┼────────┼─────┼─────────┤
│ 0   │ attendx-backend  │fork │ online │ ... │ ... ... │
└─────┴──────────────────┴─────┴────────┴─────┴─────────┘
```
✅ Status should be **online**

### 2. Health Check
```bash
curl http://localhost:5001/api/health
```
Should return: `{"status":"ok"}`

### 3. Check Logs for Errors
```bash
pm2 logs attendx-backend --lines 50 --nostream
```
Look for any errors. Should see:
- `✅ Database connected successfully`
- `Server: http://localhost:5001`
- No error messages

### 4. Test in Browser
Open: http://32.195.60.167

- Should load the login page
- Login with faculty credentials
- Try to create a session
- **Expected behavior**: System blocks attendance with enrollment error

---

## 🎯 Expected Result After Deployment

### When You Try to Take Attendance:

❌ **System will show error:**
```
Only 5 out of 58 students (8.6%) have face embeddings enrolled.
Please enroll at least 80% of students with their photos before taking attendance.
Missing students will not be recognized and may be incorrectly marked absent.
```

**This is the FIX working correctly!** It prevents false identifications.

### What Changed:
✅ Stricter matching (70% confidence required)
✅ 80% enrollment requirement enforced
✅ Weak matches properly rejected
✅ Better logging and error messages

---

## 📝 After Successful Deployment

### Immediate Actions:
1. ✅ Verify application loads at http://32.195.60.167
2. ✅ Test faculty login
3. ✅ Try creating a session (should see enrollment error)

### Next Steps (To Resume Attendance):
1. **Collect student photos**:
   - Individual headshots
   - Name: 25MCA001.jpg, 25MCA002.jpg, etc.
   - Need photos for at least 47 students (80% of 58)

2. **Run bulk enrollment**:
   ```bash
   # Upload photos to EC2 first
   # Then on EC2:
   cd /home/ubuntu/AttendX/backend
   node scripts/bulk-enroll-students.js /path/to/photos
   ```

3. **Verify enrollment**:
   ```bash
   mysql -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com -u admin -p
   # Password: Niraj#2804
   
   USE attendx;
   SELECT 
     COUNT(*) as total,
     SUM(CASE WHEN face_embedding IS NOT NULL THEN 1 ELSE 0 END) as enrolled
   FROM students WHERE class='A' AND stream='MCA' AND semester=3;
   ```

4. **Resume attendance** once 80%+ enrolled!

---

## 🆘 Troubleshooting

### "Permission denied" with SSH key:
```powershell
# Fix permissions (Windows)
icacls "$keyPath" /inheritance:r
icacls "$keyPath" /grant:r "$env:USERNAME:(R)"
```

### "git pull" shows conflicts:
```bash
git stash
git pull origin main
```

### PM2 restart fails:
```bash
pm2 delete attendx-backend
cd /home/ubuntu/AttendX/backend
pm2 start src/server.js --name attendx-backend
pm2 save
```

### Can't access application in browser:
1. Check if instance is running in EC2 console
2. Check security group allows HTTP (port 80) and API (port 5001)
3. Check nginx is running: `sudo systemctl status nginx`

---

## 🎯 Quick Decision Guide

**Choose Option 1 (Fix SSM)** if:
- ✅ You want the cleanest solution
- ✅ You'll use AWS frequently
- ✅ You have 10 minutes

**Choose Option 2 (SSH)** if:
- ✅ You need it deployed NOW
- ✅ You're comfortable with terminal commands
- ✅ You have 5 minutes

**Choose Option 3 (EC2 Instance Connect)** if:
- ✅ Other options aren't working
- ✅ You want browser-based access
- ✅ You need a guaranteed working method

---

**All options will successfully deploy your code!** Pick whichever is easiest for you. 🚀
