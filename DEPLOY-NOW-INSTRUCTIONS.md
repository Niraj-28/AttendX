# Deploy Face Recognition Fixes - Quick Instructions

## ⚠️ SSH Connection Issue

SSH connection to EC2 timed out. This could be because:
1. EC2 instance is stopped
2. Security group doesn't allow SSH from your current IP address
3. Network firewall blocking the connection

## ✅ Solution: Use AWS Systems Manager Session Manager

This method doesn't require SSH and works through the AWS Console.

---

## 📋 Step-by-Step Deployment (5 minutes)

### Step 1: Check EC2 Instance Status

1. Open AWS Console: https://console.aws.amazon.com/ec2/
2. Go to **Instances** (left sidebar)
3. Find instance with **Public IP: 32.195.60.167**

**If instance is STOPPED:**
- Select the instance
- Click **Instance State** → **Start instance**
- Wait 2-3 minutes for it to start

### Step 2: Connect via Session Manager

1. Select your EC2 instance
2. Click **Connect** button (top right)
3. Choose **Session Manager** tab
4. Click **Connect** button

A terminal window will open in your browser.

### Step 3: Deploy the Code

Copy and paste these commands one by one:

```bash
# Switch to ubuntu user
sudo su - ubuntu

# Navigate to application directory
cd /home/ubuntu/AttendX

# Check current status
echo "📋 Current version:"
git log --oneline -1

# Pull latest changes from GitHub
echo "📥 Pulling latest code..."
git pull origin main

# Verify what changed
echo "📝 Files changed:"
git show --stat HEAD

# Restart the backend service
echo "🔄 Restarting backend..."
pm2 restart attendx-backend

# Save PM2 configuration
pm2 save

# Wait for service to start
sleep 5

# Check status
echo "📊 Service status:"
pm2 status attendx-backend

# Check recent logs
echo "📋 Recent logs:"
pm2 logs attendx-backend --lines 20 --nostream

# Test health endpoint
echo "🏥 Health check:"
curl -s http://localhost:5001/api/health

echo ""
echo "✅ Deployment completed!"
```

### Step 4: Verify Deployment

After running the commands, check:

1. **PM2 Status** should show:
   ```
   attendx-backend │ online │
   ```

2. **Health Check** should return:
   ```json
   {"status":"ok"}
   ```

3. **Test in Browser:**
   - Open: http://32.195.60.167
   - Login with your faculty credentials
   - Try to create a session

---

## 🎯 What Changed After Deployment

### New Behavior:
When you try to take attendance, the system will now check:

**Current Status:**
- Total students: 58
- Students with face embeddings: 5 (8.6%)

**Error Message You'll See:**
```
Only 5 out of 58 students (8.6%) have face embeddings enrolled.
Please enroll at least 80% of students with their photos before taking attendance.
Missing students will not be recognized and may be incorrectly marked absent.
```

This is **INTENTIONAL** - it prevents the false identification problem you had.

### Improvements Made:
✅ Stricter face matching (70% confidence required, was 50%)
✅ 80% enrollment requirement (prevents false matches)
✅ Better rejection of incorrect matches
✅ Detailed logging with confidence scores
✅ Bulk enrollment tool available

---

## 📝 Next Steps: Enroll Students

After deployment, you need to enroll at least 47 students (80% of 58).

### Option A: One-by-One Enrollment (Current Method)
Use the existing student enrollment feature in the UI.

### Option B: Bulk Enrollment (Faster - Recommended)

1. **Collect student photos:**
   - Individual headshots (one face per photo)
   - Name files with roll numbers: `25MCA001.jpg`, `25MCA002.jpg`, etc.
   - Formats: JPG, JPEG, or PNG

2. **Upload photos to EC2:**
   
   Open PowerShell on your computer:
   ```powershell
   # Upload folder of photos
   scp -i "$env:USERPROFILE\OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem" -r "C:\path\to\student-photos" ubuntu@32.195.60.167:/home/ubuntu/
   ```

3. **Run bulk enrollment on EC2:**
   
   In Session Manager terminal:
   ```bash
   cd /home/ubuntu/AttendX/backend
   node scripts/bulk-enroll-students.js /home/ubuntu/student-photos
   ```

4. **Verify enrollment:**
   ```bash
   # Connect to database and check
   mysql -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com -u admin -p
   # Password: Niraj#2804
   
   # Run this query:
   USE attendx;
   SELECT 
     COUNT(*) as total,
     SUM(CASE WHEN face_embedding IS NOT NULL THEN 1 ELSE 0 END) as enrolled,
     ROUND((SUM(CASE WHEN face_embedding IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as percentage
   FROM students
   WHERE class='A' AND stream='MCA' AND semester=3;
   ```

---

## 🔍 Troubleshooting

### If git pull fails:
```bash
cd /home/ubuntu/AttendX
git status
git reset --hard origin/main
git pull origin main
```

### If PM2 restart fails:
```bash
pm2 stop attendx-backend
pm2 delete attendx-backend
cd /home/ubuntu/AttendX/backend
pm2 start src/server.js --name attendx-backend
pm2 save
```

### If you see errors in logs:
```bash
pm2 logs attendx-backend --lines 100
```

### Check if EC2 instance is running:
- AWS Console → EC2 → Instances
- Look for your instance, should show "Running"

---

## 📊 Expected Results

### Before 80% Enrollment:
- ❌ Attendance capture will be blocked
- ✅ Clear error message with enrollment stats
- ✅ No more false identifications

### After 80% Enrollment (47+ students):
- ✅ Attendance capture works
- ✅ More accurate face matching
- ✅ Confidence scores logged
- ✅ Weak matches properly rejected

---

## 🆘 Need Help?

If Session Manager doesn't work:
1. Check if instance has **SSM Agent** installed
2. Check IAM role attached to instance
3. Alternative: Use AWS CloudShell to run commands

If deployment fails:
1. Share the error message from PM2 logs
2. Check if Node.js/npm are working: `node --version`
3. Verify database connection in logs

---

## ✅ Deployment Checklist

- [ ] Start EC2 instance (if stopped)
- [ ] Connect via Session Manager
- [ ] Run all deployment commands
- [ ] Verify PM2 status shows "online"
- [ ] Test health endpoint returns {"status":"ok"}
- [ ] Test login in browser
- [ ] Try to create session (should see enrollment error)
- [ ] Collect student photos
- [ ] Run bulk enrollment
- [ ] Verify 80%+ enrollment
- [ ] Test attendance with accurate results

---

**Your code is ready on GitHub. Just need to pull it to EC2!** 🚀
