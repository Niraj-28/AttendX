# 🚀 Quick Start - Phone Camera Feature Deployment

## TL;DR - Complete in 3 Commands

### 1️⃣ Configure AWS (one-time)
```powershell
aws configure
# Enter: Access Key, Secret Key, region: us-east-1
```

### 2️⃣ Upload Frontend
```powershell
.\upload-frontend-to-s3.ps1
```

### 3️⃣ Update Nginx
```bash
ssh -i "C:\Users\Niraj\OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem" ubuntu@32.195.60.167 << 'EOF'
sudo cp /etc/nginx/sites-available/attendx /etc/nginx/sites-available/attendx.backup
sudo tee -a /etc/nginx/sites-available/attendx > /dev/null << 'NGINX'
    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
NGINX
sudo nginx -t && sudo systemctl reload nginx
EOF
```

---

## ✅ What's Already Done

- ✅ Backend deployed and running on EC2
- ✅ WebSocket server enabled
- ✅ Phone capture API working
- ✅ Frontend built locally
- ✅ All code pushed to GitHub

---

## 📱 Test It (After Deployment)

1. **Login** → http://32.195.60.167
2. **Sessions** → Click "📱 Capture from Phone"
3. **Scan QR** with your phone
4. **Take Photo** → Upload
5. **Done!** Attendance marked automatically

---

## 🆘 Troubleshooting

### AWS CLI not found?
```powershell
winget install Amazon.AWSCLI
```

### Credentials error?
```powershell
aws configure
```

### Nginx error?
```bash
sudo nginx -t  # Shows exact error
```

### WebSocket not connecting?
```bash
pm2 logs attendx-backend --lines 50
```

---

## 📖 Full Documentation

- **Detailed Steps**: `complete-deployment-steps.md`
- **Deployment Status**: `PHONE-CAMERA-DEPLOYED.md`
- **Architecture**: `PHONE-CAMERA-DEPLOYMENT.md`

---

**Questions?** Check the documentation files or GitHub issues.

**Time Required**: ~15 minutes total
