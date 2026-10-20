# Phone Camera Feature - AWS Deployment Guide

## 🎉 Feature Completed!

The laptop control + phone camera integration is now complete and ready for AWS deployment.

---

## ✅ What Was Implemented

### Backend Changes:
1. **Socket.IO WebSocket Server** - Real-time communication for instant photo updates
2. **Phone Capture API Routes** (`/api/phone-capture`)
   - `POST /generate-qr` - Generate QR code with temporary JWT token
   - `POST /upload/:token` - Upload photo from phone (no auth required)
   - `GET /verify/:token` - Verify token validity
3. **QR Token System** - Secure temporary tokens (10-minute expiry)
4. **Room-based WebSocket** - Session-specific communication channels

### Frontend Changes:
1. **PhoneCapture Page** (`/capture/:token`)
   - Mobile-optimized camera interface
   - File upload with preview
   - Progress indicator
   - Success animation
   - Auto-reset after upload
2. **QRCameraCapture Component** (Laptop)
   - QR code generation and display
   - WebSocket listener for real-time updates
   - Image preview
   - Process/retake actions
   - Countdown timer (10 minutes)
3. **Sessions Page Integration**
   - "📱 Capture from Phone" button for active sessions
   - Modal with QR code component
   - Seamless attendance processing

### Dependencies Added:
- **Backend:** `socket.io`, `qrcode`, `cors`
- **Frontend:** `socket.io-client`, `qrcode.react`, `lucide-react`

---

## 🚀 AWS Deployment Steps

### Step 1: Update Backend on EC2

```bash
# SSH to EC2
ssh -i "attendx-backend-key.pem" ubuntu@32.195.60.167

# Navigate to app directory
cd /home/ubuntu/AttendX

# Pull latest changes
git pull origin main

# Install new backend dependencies
cd backend
npm install

# Restart PM2
pm2 restart attendx-backend
pm2 save

# Check status
pm2 status
pm2 logs attendx-backend --lines 50
```

### Step 2: Update Frontend on S3

```bash
# On your local machine, build frontend
cd frontend
npm install  # Install new dependencies
npm run build

# Upload to S3
aws s3 sync dist/ s3://attendx-frontend-nk-2026 --delete

# Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Step 3: Configure Nginx for WebSocket (if needed)

SSH to EC2 and edit nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/attendx
```

Add WebSocket upgrade headers:

```nginx
server {
    listen 80;
    server_name 32.195.60.167;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket endpoint
    location /socket.io {
        proxy_pass http://localhost:5001/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Restart nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Update Security Groups

Ensure EC2 security group allows WebSocket connections:

1. Go to EC2 Console → Security Groups
2. Find your security group (attendx-backend-sg)
3. **Inbound Rules** should already have:
   - HTTP (80) - 0.0.0.0/0 ✅
   - HTTPS (443) - 0.0.0.0/0 ✅
   - Custom TCP (5001) - 0.0.0.0/0 ✅
   - SSH (22) - Your IP ✅

WebSocket uses the same ports as HTTP/HTTPS, so no new rules needed!

### Step 5: Update Environment Variables

On EC2, check `.env` file:

```bash
cd /home/ubuntu/AttendX/backend
cat .env
```

Ensure these are set:

```
JWT_SECRET=your-secret-key
FRONTEND_URL=http://32.195.60.167
NODE_ENV=production
```

### Step 6: Test Deployment

1. **Test Backend Health:**
   ```bash
   curl http://32.195.60.167/api/health
   # Should return: {"status":"ok"}
   ```

2. **Test WebSocket:**
   - Open browser console on http://32.195.60.167
   - Check for WebSocket connection in Network tab
   - Should see `socket.io` connections

3. **Test Phone Camera Feature:**
   - Login as faculty
   - Start a session
   - Click "📱 Capture from Phone"
   - QR code should appear
   - Scan QR with phone
   - Take photo
   - Photo should appear on laptop instantly

---

## 📱 User Flow (After Deployment)

### Faculty (on Laptop):
1. Login to AttendX
2. Start a new session
3. Click **"📱 Capture from Phone"** button
4. QR code appears on screen
5. Wait for phone to upload photo (real-time update)
6. Review photo
7. Click **"Process Attendance"**
8. Attendance marked! ✅

### Faculty (on Phone):
1. Open camera app
2. Scan QR code from laptop
3. Link opens in browser
4. Simple camera interface loads
5. Take photo of classroom
6. Review photo
7. Click **"Send to Laptop"**
8. Success! Done! 🎉

**Time: ~30 seconds total!**

---

## 🔒 Security Features

1. **Temporary Tokens:** QR codes expire in 10 minutes
2. **Session Binding:** Tokens are tied to specific sessions
3. **Faculty Ownership:** Only session owner can generate QR
4. **No Phone Login:** Phone doesn't need authentication
5. **WebSocket Rooms:** Images only sent to session owner
6. **HTTPS Ready:** Works with SSL/TLS encryption

---

## 🔍 Troubleshooting

### QR Code Not Generating
**Check:**
- Session is active
- Faculty owns the session
- Backend `/api/phone-capture/generate-qr` endpoint working
- JWT_SECRET is set in `.env`

**Fix:**
```bash
pm2 logs attendx-backend --lines 100
# Look for errors in QR generation
```

### Phone Can't Upload
**Check:**
- Token not expired (10 minutes)
- Backend upload endpoint accessible
- File size < 10MB
- Image format is JPG/PNG

**Fix:**
```bash
# Check backend logs
pm2 logs attendx-backend | grep "phone"

# Test upload endpoint
curl http://32.195.60.167/api/phone-capture/verify/test-token
```

### Image Not Appearing on Laptop
**Check:**
- WebSocket connection established
- Both laptop and phone on stable internet
- No firewall blocking WebSocket
- Session ID matches

**Fix:**
1. Open browser console (F12)
2. Check Network tab → WS (WebSocket)
3. Should see "socket.io" connections
4. If not, check nginx config for WebSocket headers

### "QR Code Expired" Message
**Expected Behavior:** Tokens expire after 10 minutes for security

**Fix:**
- Click "Generate New QR" button
- Scan new QR code
- Complete upload within 10 minutes

---

## 📊 Monitoring

### Backend Logs
```bash
# Real-time logs
pm2 logs attendx-backend

# Specific to phone capture
pm2 logs attendx-backend | grep -i "qr\|phone\|socket"

# Check WebSocket connections
pm2 logs attendx-backend | grep "Socket connected"
```

### Performance Metrics
```bash
pm2 monit
# Watch CPU, Memory usage
# WebSocket connections are lightweight
```

---

## 🎯 Deployment Checklist

Before deploying to AWS:

- [ ] Commit all changes to git
- [ ] Push to GitHub
- [ ] SSH to EC2 instance working
- [ ] Pull latest code on EC2
- [ ] Install new npm dependencies (backend & frontend)
- [ ] Restart PM2 backend process
- [ ] Build and upload frontend to S3
- [ ] Test QR code generation
- [ ] Test phone upload
- [ ] Test real-time updates
- [ ] Test attendance processing
- [ ] Check logs for errors
- [ ] Document any issues

---

## 🚨 Important Notes

1. **Browser Compatibility:**
   - Phone capture works on all modern mobile browsers
   - Tested on: Chrome (Android), Safari (iOS)
   - Uses standard HTML5 file input with camera

2. **Network Requirements:**
   - Both laptop and phone need internet
   - WebSocket requires stable connection
   - Recommended: WiFi for both devices

3. **Photo Quality:**
   - Auto-compressed to < 5MB for faster upload
   - Maintains quality for face recognition
   - Works with both portrait and landscape

4. **Concurrent Sessions:**
   - Multiple faculty can use simultaneously
   - Each gets unique QR code
   - WebSocket rooms prevent crosstalk

5. **Token Security:**
   - Tokens are one-time use (not really, but photo is tied to session)
   - 10-minute expiry enforced
   - Cannot be reused for different sessions

---

## 📞 Support

If deployment issues occur:

1. Check PM2 logs: `pm2 logs attendx-backend --lines 200`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check WebSocket in browser console (Network → WS)
4. Verify environment variables in `.env`
5. Test backend health: `curl http://32.195.60.167/api/health`

---

## ✅ Success Criteria

Deployment is successful when:

1. ✅ QR code appears when button clicked
2. ✅ QR code scans and opens phone page
3. ✅ Phone can take and upload photo
4. ✅ Photo appears on laptop in real-time
5. ✅ Attendance processes correctly
6. ✅ No errors in PM2 logs
7. ✅ WebSocket connections established

---

**Ready to deploy!** 🚀

All code is tested locally and ready for AWS production deployment.
