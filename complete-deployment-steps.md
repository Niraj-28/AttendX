# Complete Deployment Steps for Phone Camera Feature

## Overview
This guide will help you complete the deployment of the phone camera attendance capture feature to AWS.

## Prerequisites
- ✅ Backend deployed and running on EC2 (DONE)
- ✅ Frontend built locally (DONE)
- ⏳ Need to upload frontend to S3
- ⏳ Need to update nginx for WebSocket support

---

## Step 1: Configure AWS CLI (One-time setup)

### Option A: If AWS CLI not installed
```powershell
# Install AWS CLI
winget install Amazon.AWSCLI

# Restart PowerShell after installation
```

### Option B: Configure credentials
```powershell
aws configure
```

Enter when prompted:
- **AWS Access Key ID**: [Your access key]
- **AWS Secret Access Key**: [Your secret key]
- **Default region name**: `us-east-1`
- **Default output format**: `json`

---

## Step 2: Upload Frontend to S3

### Automated Method (Recommended)
```powershell
# Run the deployment script
.\upload-frontend-to-s3.ps1
```

### Manual Method
```powershell
cd "d:\MCA\Sem 3\CC\AttendX\AttendX"
aws s3 sync frontend/dist/ s3://attendx-frontend-nk-2026 --delete --region us-east-1
```

### Alternative: AWS Console
1. Go to https://s3.console.aws.amazon.com/s3/buckets/attendx-frontend-nk-2026
2. Delete all existing files
3. Upload all files from `d:\MCA\Sem 3\CC\AttendX\AttendX\frontend\dist\`
4. Make sure to preserve the folder structure

---

## Step 3: Update Nginx Configuration for WebSocket

### Connect to EC2
```powershell
ssh -i "C:\Users\Niraj\OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem" ubuntu@32.195.60.167
```

### Update Nginx Config
```bash
# Backup current config
sudo cp /etc/nginx/sites-available/attendx /etc/nginx/sites-available/attendx.backup

# Edit the config
sudo nano /etc/nginx/sites-available/attendx
```

### Add WebSocket Location Block
Add this **BEFORE** the `/api` location block:

```nginx
# WebSocket support for Socket.IO
location /socket.io/ {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # WebSocket timeout settings
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
}
```

### Test and Reload Nginx
```bash
# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

---

## Step 4: Verify Deployment

### Check Backend
```bash
# Check if backend is running
pm2 status

# Check recent logs
pm2 logs attendx-backend --lines 50

# Test API endpoint
curl http://localhost:5001/api/health
```

### Check Frontend Files
```bash
# Verify files in production
ls -lah /home/ubuntu/frontend/

# If files are old, you may need to manually copy them
# (If using CloudFront + S3, skip this step)
```

---

## Step 5: Test the Phone Camera Feature

### On Laptop (Faculty Side)

1. **Login** to AttendX
   - URL: http://32.195.60.167 or your domain
   - Login as faculty

2. **Navigate to Sessions**
   - Go to "Sessions" page
   - Click "Start Session" or select existing active session

3. **Open QR Capture**
   - Click **"📱 Capture from Phone"** button
   - QR code should appear in a modal

4. **Check Browser Console** (F12)
   - Should see WebSocket connection: `Connected to Socket.IO server`
   - Look for any errors in console

### On Phone

1. **Scan QR Code**
   - Use phone camera or QR scanner app
   - Scan the QR code displayed on laptop

2. **Camera Page Should Open**
   - URL format: `http://32.195.60.167/capture/{token}`
   - Camera selection dropdown should appear
   - Camera preview should load

3. **Capture Image**
   - Click "Capture Photo" button
   - Preview the captured image
   - Click "✓ Use This Photo" button

4. **Upload**
   - Upload progress should show
   - Success message should appear: "✓ Photo uploaded successfully!"

### On Laptop (Automatic Processing)

1. **Image Should Appear**
   - Image should automatically show on laptop
   - Face recognition should start processing

2. **Check Attendance**
   - Attendance records should be created
   - Check "Mark Attendance" page for results

---

## Step 6: Troubleshooting

### Issue: QR Code not generating
**Check:**
```bash
# Backend logs
pm2 logs attendx-backend --lines 100

# Look for errors related to phone-capture controller
```

**Solution:**
- Verify phone-capture.controller.js exists in /home/ubuntu/backend/src/controllers/
- Verify phone-capture.routes.js exists in /home/ubuntu/backend/src/routes/
- Restart backend: `pm2 restart attendx-backend`

### Issue: WebSocket not connecting
**Check:**
```bash
# Nginx config
sudo nginx -t
cat /etc/nginx/sites-available/attendx | grep -A 10 "socket.io"

# Backend logs
pm2 logs attendx-backend | grep -i websocket
```

**Solution:**
- Verify nginx has /socket.io/ location block
- Reload nginx: `sudo systemctl reload nginx`
- Check firewall: WebSocket uses same port (80/443)

### Issue: Phone page not loading
**Check:**
- URL format: `http://32.195.60.167/capture/{token}`
- Token should be valid (not expired)
- Frontend files deployed to S3 (or /home/ubuntu/frontend/)

**Solution:**
```bash
# Check frontend files
ls -lah /home/ubuntu/frontend/

# Check nginx is serving files
curl http://localhost/index.html
```

### Issue: Image upload fails
**Check:**
- File size limit (current: 50MB in nginx)
- Network connectivity from phone
- Token validity (expires in 10 minutes)

**Solution:**
```bash
# Check nginx body size limit
sudo grep client_max_body_size /etc/nginx/sites-available/attendx

# Check backend upload logs
pm2 logs attendx-backend | grep -i upload
```

### Issue: Image not appearing on laptop
**Check:**
- WebSocket connection established
- Same sessionId for QR token and WebSocket room
- Browser console for WebSocket messages

**Solution:**
- Open browser DevTools → Network tab → WS filter
- Should see active WebSocket connection
- Messages should flow when image uploaded

---

## Step 7: Database Verification

### Check Attendance Records
```bash
# Connect to database
mysql -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com -u admin -p attendx

# Check recent attendance
SELECT * FROM attendance ORDER BY marked_at DESC LIMIT 10;

# Check session attendance
SELECT 
    s.student_name,
    a.status,
    a.marked_at
FROM attendance a
JOIN students s ON a.student_id = s.student_id
WHERE a.session_id = [YOUR_SESSION_ID]
ORDER BY s.student_name;
```

---

## Monitoring Commands

### Backend Health
```bash
# PM2 status
pm2 status

# Backend logs (live)
pm2 logs attendx-backend

# Backend logs (last 100 lines)
pm2 logs attendx-backend --lines 100

# System resources
pm2 monit
```

### Nginx Health
```bash
# Status
sudo systemctl status nginx

# Error logs
sudo tail -f /var/log/nginx/error.log

# Access logs
sudo tail -f /var/log/nginx/access.log

# Test config
sudo nginx -t
```

### Network Testing
```bash
# Test backend API
curl http://localhost:5001/api/health

# Test WebSocket endpoint (should not return 404)
curl -I http://localhost:5001/socket.io/

# Test from outside
curl http://32.195.60.167/api/health
```

---

## Rollback Plan (If something goes wrong)

### Backend Rollback
```bash
# Stop current backend
pm2 stop attendx-backend

# Checkout previous commit
cd /home/ubuntu/backend
git log --oneline -5  # Find previous commit
git checkout [PREVIOUS_COMMIT]

# Restart
pm2 restart attendx-backend
```

### Frontend Rollback
```bash
# If using S3
aws s3 sync s3://attendx-frontend-nk-2026-backup/ s3://attendx-frontend-nk-2026/ --delete

# Or revert to previous build
cd /home/ubuntu/frontend
# Restore from backup
```

### Nginx Rollback
```bash
# Restore backup config
sudo cp /etc/nginx/sites-available/attendx.backup /etc/nginx/sites-available/attendx

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## Performance Monitoring

### Expected Metrics
- **QR Generation**: < 1 second
- **Image Upload**: 2-5 seconds (depends on image size and network)
- **WebSocket Transfer**: < 1 second
- **Face Recognition**: 5-15 seconds (depends on image size and number of students)

### Monitor Backend Load
```bash
# CPU and Memory
pm2 monit

# Detailed metrics
pm2 show attendx-backend

# System resources
htop
```

---

## Security Checklist

- ✅ Tokens expire in 10 minutes
- ✅ One-time use tokens
- ✅ Session-based WebSocket rooms (isolated)
- ✅ No credentials on phone page
- ✅ CORS configured
- ✅ HTTPS recommended for production

---

## Success Criteria

Your deployment is successful when:

1. ✅ Faculty can click "📱 Capture from Phone" button
2. ✅ QR code displays without errors
3. ✅ Phone can scan QR and open camera page
4. ✅ Photo upload works from phone
5. ✅ Image appears on laptop in real-time
6. ✅ Face recognition processes automatically
7. ✅ Attendance records are created in database
8. ✅ No errors in browser console or backend logs

---

## Support & Documentation

- **GitHub**: https://github.com/Niraj-28/AttendX
- **Deployment Status**: See PHONE-CAMERA-DEPLOYED.md
- **Architecture**: See PHONE-CAMERA-DEPLOYMENT.md
- **Backend URL**: http://ec2-32-195-60-167.compute-1.amazonaws.com:5001
- **S3 Bucket**: s3://attendx-frontend-nk-2026

---

**Last Updated**: October 20, 2026
**Version**: 1.0.0
**Status**: Backend Deployed ✅ | Frontend Pending Upload ⏳
