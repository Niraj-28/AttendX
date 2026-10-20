# Deploy Face Recognition Fixes to AWS EC2

## Current Status
✅ Code committed to git (commit 852b9ad)
✅ Code pushed to GitHub main branch

## Deployment Steps

### Option 1: SSH Deployment (Recommended)

If you have the `attendx-backend-key.pem` file:

1. **Connect to EC2 instance:**
   ```bash
   ssh -i /path/to/attendx-backend-key.pem ubuntu@32.195.60.167
   ```

2. **Navigate to app directory:**
   ```bash
   cd /home/ubuntu/AttendX
   ```

3. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

4. **Restart PM2 processes:**
   ```bash
   pm2 restart attendx-backend
   pm2 save
   ```

5. **Verify deployment:**
   ```bash
   pm2 logs attendx-backend --lines 50
   curl http://localhost:5001/api/health
   ```

### Option 2: AWS Systems Manager Session Manager

If SSH key is not available, use AWS Console:

1. **Go to EC2 Console:**
   - https://console.aws.amazon.com/ec2/

2. **Find your instance:**
   - Look for instance with IP `32.195.60.167`

3. **Connect using Session Manager:**
   - Select instance → Click "Connect" button
   - Choose "Session Manager" tab
   - Click "Connect"

4. **Run deployment commands:**
   ```bash
   # Switch to ubuntu user
   sudo su - ubuntu
   
   # Navigate to app
   cd /home/ubuntu/AttendX
   
   # Pull latest code
   git pull origin main
   
   # Restart backend
   pm2 restart attendx-backend
   pm2 save
   
   # Check status
   pm2 status
   pm2 logs attendx-backend --lines 50
   ```

### Option 3: Manual File Upload (If needed)

If git pull doesn't work:

1. **Connect to EC2** (via SSH or Session Manager)

2. **Backup current files:**
   ```bash
   cd /home/ubuntu/AttendX
   cp backend/python/face_detector_opencv.py backend/python/face_detector_opencv.py.backup
   cp backend/src/controllers/attendance.controller.js backend/src/controllers/attendance.controller.js.backup
   ```

3. **Update files using nano/vim:**
   
   For `backend/python/face_detector_opencv.py`:
   - Key change: Line ~240-280 (match command logic)
   - Improved threshold checking and rejection logic
   
   For `backend/src/controllers/attendance.controller.js`:
   - Key changes:
     - Line ~90-110: Added enrollment validation (80% threshold)
     - Line ~145: Changed tolerance from 0.5 to 0.3 (requires 0.7 similarity)
     - Line ~165: Changed threshold from 0.5 to 0.7
   
4. **Or use file transfer:**
   ```bash
   # On your local machine
   scp -i attendx-backend-key.pem backend/python/face_detector_opencv.py ubuntu@32.195.60.167:/home/ubuntu/AttendX/backend/python/
   scp -i attendx-backend-key.pem backend/src/controllers/attendance.controller.js ubuntu@32.195.60.167:/home/ubuntu/AttendX/backend/src/controllers/
   scp -i attendx-backend-key.pem backend/scripts/bulk-enroll-students.js ubuntu@32.195.60.167:/home/ubuntu/AttendX/backend/scripts/
   scp -i attendx-backend-key.pem backend/scripts/BULK-ENROLLMENT-GUIDE.md ubuntu@32.195.60.167:/home/ubuntu/AttendX/backend/scripts/
   ```

5. **Restart services:**
   ```bash
   cd /home/ubuntu/AttendX
   pm2 restart attendx-backend
   pm2 save
   ```

## Verification Steps

After deployment:

1. **Check PM2 status:**
   ```bash
   pm2 status
   ```
   Should show `attendx-backend` as `online`

2. **Check logs for errors:**
   ```bash
   pm2 logs attendx-backend --lines 100
   ```
   Look for any startup errors

3. **Test health endpoint:**
   ```bash
   curl http://localhost:5001/api/health
   ```
   Should return: `{"status":"ok"}`

4. **Test from browser:**
   - Open: http://32.195.60.167/api/health
   - Should show: `{"status":"ok"}`

5. **Test login:**
   - Go to: http://32.195.60.167
   - Login with faculty credentials
   - Try to create a session

## Expected Behavior After Fix

### Before Taking Attendance:
- System will check enrollment percentage
- If less than 80% students enrolled, will show error:
  ```
  Only 5 out of 58 students (8.6%) have face embeddings enrolled.
  Please enroll at least 80% of students with their photos before taking attendance.
  ```

### After Enrolling 80%+ Students:
- Face detection will work normally
- Matching will be stricter (0.7 similarity required)
- Weak matches will be rejected instead of accepted
- Logs will show detailed match results with confidence scores

## Troubleshooting

### If git pull fails:
```bash
# Check git status
git status

# Discard local changes if needed
git reset --hard origin/main

# Try pull again
git pull origin main
```

### If PM2 restart fails:
```bash
# Stop and delete process
pm2 stop attendx-backend
pm2 delete attendx-backend

# Start fresh
cd /home/ubuntu/AttendX/backend
pm2 start src/server.js --name attendx-backend
pm2 save
```

### If database connection fails:
```bash
# Check .env file exists
cat /home/ubuntu/AttendX/backend/.env

# Verify database connection
mysql -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com -u admin -p attendx
```

## Files Modified in This Deployment

1. **backend/python/face_detector_opencv.py**
   - Improved match rejection logic
   - Better threshold handling
   - Enhanced logging

2. **backend/src/controllers/attendance.controller.js**
   - Added 80% enrollment validation
   - Increased matching threshold to 0.7
   - Better error messages
   - Improved logging

3. **backend/scripts/bulk-enroll-students.js** (NEW)
   - Bulk student photo enrollment tool

4. **backend/scripts/BULK-ENROLLMENT-GUIDE.md** (NEW)
   - Documentation for bulk enrollment

5. **FACE-RECOGNITION-FIXES.md** (NEW)
   - Complete explanation of all fixes

## Important Notes

⚠️ **The system will block attendance until 80% enrollment**
- This is intentional to prevent false matches
- Use the bulk enrollment script to enroll students quickly

📊 **Current Enrollment Status:**
- Total students: 58
- Enrolled: 5 (8.6%)
- Needed: 47 students (80%)

🔧 **Next Steps After Deployment:**
1. Deploy the fixes (this file)
2. Collect student photos
3. Run bulk enrollment script on EC2:
   ```bash
   cd /home/ubuntu/AttendX/backend
   node scripts/bulk-enroll-students.js /path/to/photos
   ```
4. Verify 80%+ enrollment
5. Resume taking attendance with accurate face recognition

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs attendx-backend`
2. Check system logs: `tail -f /var/log/syslog`
3. Verify Python service: `python3 --version` (should be 3.x)
4. Check installed packages: `pip3 list | grep -E "opencv|numpy"`
