# Reboot Instance and Deploy - Final Steps

## ✅ Current Status
- Instance: **Running** ✅
- Security Group: **Configured correctly** ✅
- Issue: **Network connectivity problem** 🔴

## 🔄 Solution: Reboot Instance

The instance is running but network connections are failing. A reboot will:
- Refresh network configuration
- Reset SSH daemon
- Clear any stuck processes
- Fix connectivity issues

---

## 📋 Steps to Reboot and Deploy

### Step 1: Reboot the Instance

You already have the dropdown open in your screenshot!

1. ✅ The instance is already selected (attendx-backend)
2. ✅ You see the **"Instance state"** dropdown
3. ✅ Click **"Reboot instance"**
4. ✅ Confirm the reboot
5. ⏰ Wait 3-4 minutes for full restart

**The instance will:**
- Shut down
- Restart
- Keep the same IP address (32.195.60.167)
- Preserve all data

---

### Step 2: Wait for Reboot to Complete

After clicking reboot:

1. The **"Instance state"** will show "Rebooting" briefly
2. Then return to "Running"
3. **Status checks** will show "Initializing"
4. Wait until **Status checks** show "2/2 checks passed"

**This takes about 3-4 minutes.**

---

### Step 3: Test SSH Connection

After reboot is complete, open PowerShell and run:

```powershell
# Set key path
$keyPath = "$env:USERPROFILE\OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem"

# Fix permissions
icacls "$keyPath" /inheritance:r
icacls "$keyPath" /grant:r "${env:USERNAME}:(R)"

# Test connection
ssh -i "$keyPath" -o StrictHostKeyChecking=no ubuntu@32.195.60.167
```

**If this works**, you'll see:
```
Welcome to Ubuntu 24.04 LTS
...
ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

---

### Step 4: Deploy the Code

Once connected via SSH:

```bash
# Switch to ubuntu user (if not already)
sudo su - ubuntu

# Navigate to app directory
cd /home/ubuntu/AttendX

# Check current version
echo "Current version:"
git log --oneline -1

# Pull latest changes
echo ""
echo "Pulling latest code..."
git pull origin main

# You should see output like:
# remote: Counting objects: 12, done.
# Updating 7900cde..852b9ad
# Fast-forward

# Restart backend service
echo ""
echo "Restarting backend..."
pm2 restart attendx-backend

# Save PM2 config
pm2 save

# Check status
echo ""
echo "Service status:"
pm2 status attendx-backend

# Should show:
# attendx-backend │ online │

# Test health endpoint
echo ""
echo "Health check:"
curl -s http://localhost:5001/api/health

# Should return: {"status":"ok"}

echo ""
echo "✅ Deployment complete!"
```

---

### Step 5: Verify in Browser

1. Open: http://32.195.60.167
2. Should load the AttendX login page
3. Login with faculty credentials
4. Try to create a session
5. Try to take attendance

**Expected behavior:**
- ❌ System will block attendance with error:
  > "Only 5 out of 58 students (8.6%) have face embeddings enrolled."

**This is correct!** The fix is working.

---

## 🎯 Alternative: Try EC2 Instance Connect After Reboot

If SSH still doesn't work after reboot, use browser-based connection:

1. In EC2 Console, select your instance
2. Click **"Connect"** button (top right)
3. Choose **"EC2 Instance Connect"** tab
4. Username: `ubuntu`
5. Click **"Connect"**

This should work after the reboot!

---

## 📊 What the Deployment Does

After pulling the latest code, your system will:

1. **Require 80% enrollment** before allowing attendance
   - Currently: 5/58 students (8.6%) ❌
   - Required: 47/58 students (80%) ✅

2. **Use stricter face matching**
   - Old threshold: 50% similarity
   - New threshold: 70% similarity
   - Reduces false positives significantly

3. **Properly reject weak matches**
   - Won't force "best match" when confidence is low
   - Shows "unknown face" for unmatched faces

4. **Provide bulk enrollment tool**
   - Can enroll multiple students at once
   - Much faster than one-by-one

---

## 🔍 Troubleshooting

### If Reboot Doesn't Help:

The issue might be on your network side:

**Try these:**

1. **Disable VPN** (if you're using one)
2. **Try from different network** (mobile hotspot)
3. **Check Windows Firewall**:
   ```powershell
   # Check if Windows Firewall is blocking SSH
   Get-NetFirewallRule | Where-Object {$_.DisplayName -match "OpenSSH"}
   ```

4. **Use AWS CloudShell** (always works):
   - Click CloudShell icon in AWS Console (top right)
   - Run:
   ```bash
   ssh ubuntu@32.195.60.167
   # Type 'yes' when prompted
   ```

---

## ⏰ Timeline

- **Reboot:** 3-4 minutes
- **Deploy:** 1 minute (once connected)
- **Total:** 5 minutes from now to deployed!

---

## 🎯 Quick Actions

**Right now in your AWS Console:**

1. ✅ Click **"Reboot instance"** in the dropdown (it's open in your screenshot)
2. ⏰ Wait 4 minutes
3. 🔌 Try SSH connection from PowerShell
4. 📦 Deploy code (1 minute)
5. ✅ Done!

**Click that Reboot button and let me know when it's done rebooting!** 🚀
