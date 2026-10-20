# 📱 Test Phone Camera Feature Locally

## Why You Can't Access It Yet

Looking at your screenshot, you're in the "Start New Session" dialog. The phone camera button there says "Coming Soon" because:
1. You need to **start a session first**
2. The phone capture button only works **during an active session**

## How to Test Locally

### Step 1: Update Backend Environment

Add to `backend/.env`:
```env
# Your local IP address (so phone can access)
FRONTEND_URL=http://10.10.12.242:3000
```

### Step 2: Restart Backend
```powershell
# Stop current backend
Get-Process node | Where-Object {$_.Path -like "*backend*"} | Stop-Process

# Or in the backend terminal, press Ctrl+C, then:
cd backend
npm run dev
```

### Step 3: Access from Phone

1. **Make sure your phone and laptop are on the same WiFi network**

2. **On your laptop**, open browser and go to:
   ```
   http://10.10.12.242:3000
   ```
   (Not localhost - use your IP!)

3. **Login as faculty**

4. **Start a session**:
   - Fill out the "Start New Session" form
   - Select semester, session type, subject, class, date/time
   - Click "Start Session" button

5. **Look for the Active Session card** at the top of the page
   - It will show session details
   - You'll see a green button: **"📱 Capture from Phone"**

6. **Click that button**:
   - QR code modal will open
   - The QR URL will be: `http://10.10.12.242:3000/capture/{token}`

7. **Scan QR with your phone**:
   - Phone will open the camera capture page
   - Select camera (front/back)
   - Take photo
   - Upload

8. **Image appears on laptop automatically!**

---

## Option 2: Test on Production (AWS)

If you want to test on the deployed version:

### Step 1: Upload Frontend to S3
```powershell
# Configure AWS CLI first
aws configure

# Upload
.\upload-frontend-to-s3.ps1
```

### Step 2: Update Nginx on EC2
```bash
ssh -i "C:\Users\Niraj\OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem" ubuntu@32.195.60.167

# Add WebSocket support
sudo nano /etc/nginx/sites-available/attendx
# (see nginx-config-with-websocket.conf for what to add)

sudo nginx -t && sudo systemctl reload nginx
```

### Step 3: Test
1. Go to: http://32.195.60.167
2. Login as faculty
3. Start session
4. Click "📱 Capture from Phone"
5. Scan QR with phone
6. Works from anywhere!

---

## Troubleshooting

### "Can't access from phone"
- Make sure phone and laptop on same WiFi
- Use IP address (10.10.12.242:3000), not localhost
- Check Windows Firewall allows port 3000
- Update backend .env with FRONTEND_URL

### "Button says Coming Soon"
- You're looking at wrong button
- Start a session first
- Look for "Active Session" card at top
- Real button is there

### "QR code not generating"
- Check browser console (F12)
- Check backend is running on port 5001
- Check backend logs for errors

### "WebSocket not connecting"
- Check browser console for WS connection
- Backend should show "Socket.IO server initialized"
- Make sure CORS allows your origin

---

## Quick Firewall Fix (Windows)

If phone can't reach laptop:

```powershell
# Allow port 3000 (frontend)
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Allow port 5001 (backend)
New-NetFirewallRule -DisplayName "AttendX Backend" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow
```

---

## What You Should See

### On Laptop (Before Starting Session):
- Sessions page with "Start Session" button
- Modal with form (this is what you're seeing now)
- Button says "Coming Soon" ← This is expected!

### On Laptop (After Starting Session):
- "Active Session" card at top
- Green button "📱 Capture from Phone" ← This one works!
- Click it → QR code modal opens

### On Phone:
- Scan QR
- Camera page loads
- Select camera
- Capture photo
- Upload progress
- Success message

### On Laptop (Automatic):
- Image appears in modal
- "Process Attendance" button appears
- Click it → Face recognition runs
- Attendance marked!

---

## Current Status

✅ Backend running on localhost:5001  
✅ Frontend running on localhost:3000  
✅ Code is ready  
⏳ Need to start a session to see the button  
⏳ Need to use IP address for phone access  

---

**Your Local IP**: 10.10.12.242  
**Frontend URL**: http://10.10.12.242:3000  
**Backend URL**: http://10.10.12.242:5001  

Update backend/.env with:
```
FRONTEND_URL=http://10.10.12.242:3000
```
