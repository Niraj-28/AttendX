# Check Instance Status & Deploy

## ✅ Security Group is Correct!

I can see your security group **sg-0f202c92015896355** (attendx-backend-sg) has all required ports open:
- ✅ SSH (Port 22)
- ✅ HTTP (Port 80)
- ✅ HTTPS (Port 443)
- ✅ Backend API (Port 5001)

**So the issue is NOT the security group.**

---

## 🔍 Next Step: Check Instance Status

### Option 1: Check in Console (You're Already There!)

1. **Click on "Instances" in the left sidebar** (under EC2)
2. Find instance with ID: **i-0add0b0d8327Sae6d**
3. Check the **"Instance state"** column

**Look for:**
- 🟢 **Running** = Good, instance is on
- 🔴 **Stopped** = Need to start it
- ⚫ **Terminated** = Instance is deleted (bad)

---

## If Instance is STOPPED:

### Start the Instance:
1. ✅ Select the instance (checkbox)
2. ✅ Click **"Instance state"** dropdown (top right)
3. ✅ Click **"Start instance"**
4. ⏰ Wait 2-3 minutes for boot
5. 🔄 Refresh the page
6. 📝 **Note the Public IPv4 address** (might be different from 32.195.60.167)

---

## If Instance is RUNNING:

The instance is on but something else is preventing connection.

### Try This: Use SSH from PowerShell

Since security group is fine and if instance is running, SSH should work:

```powershell
# Set the key path
$keyPath = "$env:USERPROFILE\OneDrive\Desktop\AWS AttendeX\attendx-backend-key.pem"

# Fix key permissions (Windows might block it)
icacls "$keyPath" /inheritance:r
icacls "$keyPath" /grant:r "${env:USERNAME}:(R)"

# Test connection (use the CURRENT IP shown in console)
ssh -i "$keyPath" -o "StrictHostKeyChecking=no" ubuntu@32.195.60.167

# If IP changed, use new IP:
# ssh -i "$keyPath" ubuntu@[NEW_IP_HERE]
```

**If this works**, you'll see a Ubuntu welcome message. Then run:

```bash
cd /home/ubuntu/AttendX
git pull origin main
pm2 restart attendx-backend
pm2 save
pm2 status
curl http://localhost:5001/api/health
```

---

## If SSH Still Fails:

### Alternative: Use AWS CloudShell

1. **In your AWS Console** (top right), click the **CloudShell icon** (looks like >_ terminal)
2. Wait for CloudShell to open
3. Run these commands:

```bash
# Get instance details
INSTANCE_ID="i-0add0b0d8327Sae6d"

# Check instance state
aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress,InstanceId]' \
  --output table

# If instance is running, get the IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Instance IP: $PUBLIC_IP"

# Now test if port 22 is reachable
nc -zv $PUBLIC_IP 22
```

If that shows port 22 is open, the issue might be:
- Key permissions on Windows
- Network firewall on your side
- VPN blocking the connection

---

## 🎯 Quickest Path to Deploy

Since you have the console open:

### Method A: Check Instance State First

1. Go to **EC2 → Instances**
2. Find your instance
3. Is it **Running** or **Stopped**?

**If STOPPED:**
- Start it
- Wait 3 minutes
- Get new IP
- Try SSH or Instance Connect

**If RUNNING:**
- Note the Public IP
- Try SSH from PowerShell (commands above)
- If SSH works, deploy
- If SSH fails, use CloudShell method

---

## 📱 Can You Share?

To help you faster, can you check:

1. **Instance State:** What does it show?
   - Running / Stopped / Terminated?

2. **Public IPv4 Address:** What IP is shown?
   - Is it still 32.195.60.167 or different?

3. **Status Checks:** (shown in instance details)
   - 2/2 checks passed?
   - Initializing?
   - Failed?

---

## 🚀 Once Connected, Deploy is Simple:

```bash
cd /home/ubuntu/AttendX
git pull origin main
pm2 restart attendx-backend
pm2 save
```

**That's it!** Takes 30 seconds once you're connected.

---

## ⚡ Emergency: Deploy Without SSH

If you absolutely can't connect but instance is running:

### Use AWS Systems Manager Run Command

1. **EC2 Console → Systems Manager → Run Command**
2. Click **"Run command"**
3. Search for: **AWS-RunShellScript**
4. Select it
5. Under **"Command parameters"**, paste:

```bash
cd /home/ubuntu/AttendX
sudo -u ubuntu git pull origin main
sudo -u ubuntu pm2 restart attendx-backend
sudo -u ubuntu pm2 save
```

6. Under **"Targets"**, select your instance
7. Click **"Run"**
8. Wait for completion

**Note:** This requires the instance to have SSM agent and IAM role, which is why it might not work.

---

## 🎯 Summary

**Most likely scenario:** Instance is stopped → Start it → Deploy

**Current status:** Security group is perfect ✅

**Next action:** Check if instance is running in EC2 Instances page
