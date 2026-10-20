# Emergency Deployment Guide - EC2 Connection Issues

## 🔴 Current Error

```
Failed to connect to your instance
Error establishing SSH connection to your instance. Try again later.
```

**This means:**
1. EC2 instance might be **STOPPED** ❌
2. EC2 instance might be **TERMINATED** ❌
3. Security groups blocking all connections
4. Instance is rebooting

---

## ⚡ IMMEDIATE ACTIONS

### Step 1: Check Instance Status

1. **Go to EC2 Dashboard:**
   - URL: https://console.aws.amazon.com/ec2/
   - Click **"Instances"** in left sidebar

2. **Find Your Instance:**
   - Look for instance with Public IP: **32.195.60.167**
   - Instance ID: i-0add0b0d8327Sae6d (from your screenshot)

3. **Check the "Instance state" column:**

---

### 🔍 If Instance State is "Stopped"

✅ **SOLUTION: Start the Instance**

1. Select the instance (checkbox)
2. Click **"Instance state"** dropdown (top right)
3. Click **"Start instance"**
4. Wait 2-3 minutes for it to fully boot up
5. **Important:** Public IP might change after restart!
6. Check new IP in instance details
7. Try connecting again with EC2 Instance Connect

**After starting, proceed to Step 2 below**

---

### 🔍 If Instance State is "Terminated"

❌ **PROBLEM: Instance is gone permanently**

**You'll need to:**
1. Create a new EC2 instance
2. Set up the backend again
3. Redeploy from scratch

**OR** restore from a snapshot/AMI if you created one.

---

### 🔍 If Instance State is "Running"

✅ **Instance is running but connections are blocked**

**Try these fixes:**

#### Fix A: Check Security Groups

1. Click on your instance
2. Click **"Security"** tab (at bottom)
3. Click on the security group name (sg-xxxxxxxxx)
4. Check **"Inbound rules"** tab

**Required rules:**
```
Type          Protocol  Port Range  Source
SSH           TCP       22          0.0.0.0/0  (or My IP)
HTTP          TCP       80          0.0.0.0/0
Custom TCP    TCP       5001        0.0.0.0/0
Custom TCP    TCP       3000        0.0.0.0/0
```

**If missing, add them:**
1. Click **"Edit inbound rules"**
2. Click **"Add rule"**
3. Add missing rules
4. Click **"Save rules"**
5. Try connecting again

#### Fix B: Check Network ACLs

1. EC2 Dashboard → **Network & Security** → **Network ACLs**
2. Find the NACL associated with your VPC
3. Check both Inbound and Outbound rules
4. Should allow SSH (22), HTTP (80), HTTPS (443)

#### Fix C: Reboot Instance

1. Select instance
2. **Instance state** → **Reboot instance**
3. Wait 3-4 minutes
4. Try connecting again

---

## 🎯 Alternative: Deploy Using AWS CloudShell

If instance is running but you can't connect via console:

### Step 1: Open CloudShell

1. In AWS Console, click the **CloudShell icon** (terminal icon, top right)
2. Wait for CloudShell to load

### Step 2: Configure SSH Key

```bash
# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# You'll need to paste your private key content
cat > ~/.ssh/attendx-key.pem << 'EOF'
[Paste the content of attendx-backend-key.pem here]
EOF

chmod 400 ~/.ssh/attendx-key.pem
```

### Step 3: Get Current Public IP

```bash
# Get instance details
aws ec2 describe-instances \
  --instance-ids i-0add0b0d8327Sae6d \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

### Step 4: Connect and Deploy

```bash
# Connect via SSH (use IP from previous command)
ssh -i ~/.ssh/attendx-key.pem ubuntu@[PUBLIC_IP]

# If connection works, run deployment:
cd /home/ubuntu/AttendX
git pull origin main
pm2 restart attendx-backend
pm2 save
pm2 status
```

---

## 🔧 If Public IP Changed After Restart

The public IP (32.195.60.167) might change if instance was stopped/started.

### Get New IP:

**Method 1: From Console**
1. EC2 → Instances
2. Click your instance
3. Look at **"Public IPv4 address"** in details

**Method 2: From AWS CLI**
```bash
aws ec2 describe-instances \
  --instance-ids i-0add0b0d8327Sae6d \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

### Update Your Frontend

If IP changed, update frontend `.env`:
```bash
VITE_API_BASE_URL=http://[NEW_IP]/api
```

---

## 🆘 Nuclear Option: Deploy Fresh Instance

If instance is terminated or unfixable:

### Quick Re-deployment Checklist:

1. **Create new EC2 instance** (t2.micro, Ubuntu 24.04)
2. **Configure security groups** (ports 22, 80, 5001, 3000)
3. **SSH to new instance**
4. **Clone repository:**
   ```bash
   git clone https://github.com/Niraj-28/AttendX.git
   cd AttendX/backend
   ```
5. **Install dependencies:**
   ```bash
   # Node.js & npm
   sudo apt update
   sudo apt install nodejs npm -y
   npm install -g pm2
   
   # Install packages
   npm install
   
   # Python dependencies
   cd python
   pip3 install -r requirements.txt
   cd ..
   ```
6. **Configure .env file** (copy from local or create new)
7. **Start services:**
   ```bash
   pm2 start src/server.js --name attendx-backend
   pm2 save
   pm2 startup
   ```

---

## 📊 Quick Diagnostics

Run these to diagnose the issue:

### Check Instance Status:
```bash
aws ec2 describe-instances --instance-ids i-0add0b0d8327Sae6d --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress]' --output table
```

### Check Security Group:
```bash
aws ec2 describe-instances --instance-ids i-0add0b0d8327Sae6d --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text
```

### Check If Instance Is Reachable:
```bash
ping [PUBLIC_IP]
nc -zv [PUBLIC_IP] 22
```

---

## 🎯 Most Likely Issue & Fix

**90% chance the instance is STOPPED.**

### Quick Fix:
1. Go to EC2 Console
2. Find instance i-0add0b0d8327Sae6d
3. If "Instance state" = "Stopped":
   - Click "Instance state" → "Start instance"
   - Wait 3 minutes
4. Try EC2 Instance Connect again
5. Run deployment commands:
   ```bash
   sudo su - ubuntu
   cd /home/ubuntu/AttendX
   git pull origin main
   pm2 restart attendx-backend
   ```

---

## 📝 What To Report If Still Stuck

If none of this works, check:

1. **Instance State:** (Running / Stopped / Terminated?)
2. **Public IP:** (Current IP address)
3. **Security Group Rules:** (Screenshot of inbound rules)
4. **Error Message:** (Exact error when trying to connect)

---

## 🔄 Prevention for Future

To avoid this issue:

1. **Use Elastic IP** (static IP that doesn't change)
2. **Enable detailed monitoring** (CloudWatch)
3. **Set up CloudWatch alarms** (notify if instance stops)
4. **Create AMI snapshot** (backup of instance)
5. **Attach proper IAM role** (for Session Manager)

---

**First Action:** Check if instance is stopped and start it! That's usually the issue. 🚀
