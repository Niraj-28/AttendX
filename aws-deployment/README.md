# AttendX - AWS Deployment Documentation

**Status:** ✅ Successfully Deployed  
**Live URL:** http://32.195.60.167  
**Deployment Date:** September 26-27, 2026

---

## 📚 Documentation Structure

| File | Purpose |
|------|---------|
| **PRODUCTION-DEPLOYED.md** | Complete production details, credentials, and maintenance commands |
| **docs/01-MANUAL-DEPLOYMENT-GUIDE.md** | Detailed step-by-step deployment instructions |
| **docs/02-TROUBLESHOOTING-GUIDE.md** | Common issues and solutions |
| **docs/03-QUICK-START-CHECKLIST.md** | Quick reference checklist |
| **docs/04-COST-MONITORING-GUIDE.md** | AWS cost monitoring and optimization |
| **scripts/** | Automated deployment and health check scripts |
| **configs/** | Configuration templates for production |

---

## 🚀 Quick Access

### Production System
- **Frontend:** http://32.195.60.167
- **API:** http://32.195.60.167/api
- **Health:** http://32.195.60.167/health

### Login Credentials
- **Email:** lata.gohil@nirmauni.ac.in
- **Password:** f123

### SSH Access
```powershell
ssh -i "$env:OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem" ubuntu@32.195.60.167
```

---

## 📖 Documentation Guide

### For First-Time Setup
Read in this order:
1. `docs/01-MANUAL-DEPLOYMENT-GUIDE.md` - Complete deployment process
2. `docs/03-QUICK-START-CHECKLIST.md` - Verify setup
3. `PRODUCTION-DEPLOYED.md` - Save production details

### For Maintenance
- `PRODUCTION-DEPLOYED.md` - Commands and configurations
- `docs/02-TROUBLESHOOTING-GUIDE.md` - Fix common issues
- `scripts/ec2-health-check.sh` - Automated health checks

### For Cost Management
- `docs/04-COST-MONITORING-GUIDE.md` - Monitor AWS costs

---

## 🏗️ Infrastructure

| Component | Type | Status |
|-----------|------|--------|
| EC2 Instance | t2.micro | ✅ Running |
| RDS Database | db.t2.micro | ✅ Connected |
| Nginx | 1.24.0 | ✅ Active |
| PM2 | 7.0.4 | ✅ Managing backend |
| Node.js | 20.20.2 | ✅ Installed |
| Python | 3.12.x | ✅ With face_recognition |

---

## 🔧 Quick Commands

### Check Status
```bash
pm2 status
sudo systemctl status nginx
curl http://localhost/health
```

### View Logs
```bash
pm2 logs attendx-backend --lines 50
```

### Restart Services
```bash
pm2 restart attendx-backend
sudo systemctl restart nginx
```

---

## 📦 Configuration Files

### Templates in `configs/`
- `.env.production.template` - Backend environment variables
- `frontend.env.production.template` - Frontend environment variables
- `nginx-attendx.conf` - Nginx reverse proxy configuration
- `pm2-ecosystem.config.js` - PM2 process management

### Deployment Scripts in `scripts/`
- `setup-ec2-initial.sh` - Initial EC2 setup
- `deploy-backend.sh` - Backend deployment automation
- `deploy-frontend-local.ps1` - Frontend build and deploy (Windows)
- `ec2-health-check.sh` - Automated health verification
- `local-connectivity-test.ps1` - Local connectivity testing

---

## 📊 System Health

**Current Status:**
- **Uptime:** Stable with PM2 auto-restart
- **Memory:** 45% (450MB/950MB)
- **Disk:** 30% (8.7GB/29GB)
- **CPU:** <5% average, spikes during face recognition

**Database:**
- 58 students loaded
- 5 faculty accounts
- All tables operational

---

## 💰 Cost Estimate

**Monthly Costs (Free Tier):**
- EC2 t2.micro: $0 (750 hrs/month free)
- RDS db.t2.micro: $0 (750 hrs/month free)
- S3 Storage: $0-1 (if <5GB)
- Data Transfer: $0 (if <1GB/month)
- **Total: $0-2/month**

---

## 🆘 Support

### Documentation
- Main guide: `docs/01-MANUAL-DEPLOYMENT-GUIDE.md`
- Troubleshooting: `docs/02-TROUBLESHOOTING-GUIDE.md`
- Production details: `PRODUCTION-DEPLOYED.md`

### Common Issues
See `docs/02-TROUBLESHOOTING-GUIDE.md` for:
- Face detection failures
- Backend crashes
- Database connection errors
- Frontend permission issues

---

## 📝 Notes

- ✅ Deployment completed successfully
- ✅ All features tested and working
- ✅ Documentation comprehensive
- ✅ Cost-optimized for Free Tier
- ⚠️ Face recognition slower on t2.micro (30-60 seconds)
- ⚠️ OpenCV must be version 4.10.x (not 5.x)

---

**For complete details, see:** `PRODUCTION-DEPLOYED.md`  
**For deployment steps, see:** `docs/01-MANUAL-DEPLOYMENT-GUIDE.md`  
**For quick reference, see:** `docs/03-QUICK-START-CHECKLIST.md`
