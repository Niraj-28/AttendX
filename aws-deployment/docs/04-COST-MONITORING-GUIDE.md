# AttendX - AWS Cost Monitoring & Optimization Guide

Stay within AWS Free Tier and avoid unexpected charges.

---

## 💰 AWS Free Tier Limits (First 12 Months)

### EC2 - Elastic Compute Cloud
```
✅ 750 hours/month of t2.micro instance (Linux)
✅ Enough for: 1 instance running 24/7 (31 days × 24 hours = 744 hours)
⚠️ Exceeds if: Running 2+ instances simultaneously
💵 Cost if exceeded: ~$0.0116/hour = $8.41/month for t2.micro
```

### RDS - Relational Database Service
```
✅ 750 hours/month of db.t2.micro instance
✅ 20 GB storage (SSD)
✅ Enough for: 1 database running 24/7
⚠️ Exceeds if: Running 2+ databases or > 20GB storage
💵 Cost if exceeded: ~$0.017/hour = $12.32/month for db.t2.micro
```

### S3 - Simple Storage Service
```
✅ 5 GB storage
✅ 20,000 GET requests
✅ 2,000 PUT requests
✅ 100 GB data transfer out (to internet)
⚠️ Exceeds if: > 5GB total files
💵 Cost if exceeded: $0.023/GB/month for storage
```

### CloudFront - Content Delivery Network
```
✅ 50 GB data transfer out
✅ 2,000,000 HTTP/HTTPS requests
✅ Enough for: Small to medium traffic sites
⚠️ Exceeds if: > 50GB traffic or > 2M requests/month
💵 Cost if exceeded: $0.085/GB for data transfer
```

### SNS - Simple Notification Service
```
✅ 1,000 email notifications
✅ 100 SMS messages (US)
⚠️ Exceeds if: > 1000 emails or > 100 SMS
💵 Cost if exceeded: $0.00065/email, $0.00645/SMS
```

### Data Transfer
```
✅ 100 GB out to internet (combined across all services)
⚠️ Exceeds if: Heavy image downloads or video streaming
💵 Cost if exceeded: $0.09/GB for first 10TB
```

---

## 🎯 Estimated Monthly Costs for AttendX

### Scenario 1: Free Tier Only (Target: $0-5/month)

**Configuration:**
- 1× EC2 t2.micro (24/7)
- 1× RDS db.t2.micro (24/7)
- S3: < 5GB storage
- CloudFront: < 50GB traffic
- SNS: < 1000 emails

**Expected Cost:**
```
EC2:             $0.00   (within free tier)
RDS:             $0.00   (within free tier)
S3 Storage:      $0.00   (< 5GB)
S3 Requests:     $0.00   (< 20K GET, 2K PUT)
CloudFront:      $0.00   (< 50GB, < 2M requests)
Data Transfer:   $0.00   (< 100GB)
SNS:             $0.00   (< 1000 emails)
────────────────────────
Total:           $0.00/month ✅
```

**Potential Small Charges:**
- Route 53 (if using custom domain): $0.50/month
- SNS SMS (if enabled): ~$0.65 per SMS
- Slight overages: $1-5/month

---

### Scenario 2: Light Usage (After Free Tier)

**Configuration:**
- Same as above, but after 12 months

**Expected Cost:**
```
EC2 t2.micro:    $8.41   (720 hrs × $0.0116)
RDS db.t2.micro: $12.32  (720 hrs × $0.0171)
S3 Storage:      $0.12   (5GB × $0.023)
S3 Requests:     $0.10   (~2K PUT, ~20K GET)
CloudFront:      $1.00   (~10GB traffic)
Data Transfer:   $0.90   (~10GB × $0.09)
SNS:             $0.65   (~1000 emails)
────────────────────────
Total:           $23.50/month
```

---

### Scenario 3: Medium Usage (Growing App)

**Configuration:**
- EC2 t3.small (instead of t2.micro)
- RDS db.t3.small
- 10GB S3 storage
- 100GB CloudFront traffic

**Expected Cost:**
```
EC2 t3.small:    $15.18  (720 hrs × $0.0208)
RDS db.t3.small: $25.92  (720 hrs × $0.036)
S3 Storage:      $0.23   (10GB × $0.023)
CloudFront:      $8.50   (~100GB traffic)
Data Transfer:   $9.00   (~100GB)
SNS:             $2.00
────────────────────────
Total:           $60.83/month
```

---

## 📊 Setting Up Billing Alerts

### Step 1: Enable Billing Alerts

1. Login to AWS Console as **root user**
2. Click your account name → **Billing Dashboard**
3. Left sidebar → **Billing preferences**
4. Enable:
   - ✅ **Receive PDF Invoice by Email**
   - ✅ **Receive Free Tier Usage Alerts**
   - ✅ **Receive Billing Alerts**
5. Enter your email address
6. Click **Save preferences**

### Step 2: Create Budget Alerts

1. Billing Dashboard → **Budgets** (left sidebar)
2. Click **Create budget**

**Budget 1: Free Tier Alert**
- Template: **Zero spend budget**
- Budget name: `AttendX-Free-Tier-Watch`
- Email: your-email@example.com
- Click **Create budget**

**Budget 2: $5 Warning**
- Template: **Monthly cost budget**
- Budget name: `AttendX-$5-Alert`
- Budgeted amount: `$5.00`
- Email: your-email@example.com
- Alert threshold: `80%` ($4.00) and `100%` ($5.00)
- Click **Create budget**

**Budget 3: $10 Critical**
- Budget name: `AttendX-$10-Critical`
- Budgeted amount: `$10.00`
- Alert threshold: `100%` ($10.00)
- Click **Create budget**

### Step 3: Create CloudWatch Alarms (Optional)

1. Navigate to **CloudWatch** service
2. Left sidebar → **Alarms** → **Create alarm**
3. Select metric → **Billing** → **Total Estimated Charge**
4. Set threshold: `$5.00`
5. Create SNS topic for notifications
6. Name: `Billing-Alert-$5`
7. Click **Create alarm**

**Repeat for $10, $15, $20 thresholds**

---

## 📈 Monitoring Your Costs

### Daily Monitoring (First 2 Weeks)

**Every Day: Check Billing Dashboard**

1. AWS Console → **Billing Dashboard**
2. View **Month-to-Date Spending**
3. Check **Service by Service Breakdown**

**What to Look For:**
```
✅ EC2: Should stay $0 (if within 750 hrs)
✅ RDS: Should stay $0 (if within 750 hrs)
✅ S3: Should stay < $1
✅ Data Transfer: Should stay $0
⚠️ Any service > $5: Investigate immediately
```

### Weekly Monitoring (After First 2 Weeks)

**Every Monday: Review AWS Cost Explorer**

1. Billing Dashboard → **Cost Explorer**
2. View **Last 7 Days**
3. Group by: **Service**
4. Check trends

**Questions to Ask:**
- Are costs increasing week over week?
- Which service costs the most?
- Any unexpected spikes?

### Monthly Monitoring (Always)

**End of Month: Full Analysis**

1. Download **Monthly Bill (PDF)**
2. Review **Free Tier Usage** report
3. Check **Data Transfer** costs
4. Analyze **Top Services**

---

## 🚨 Cost Optimization Strategies

### 1. Stop Resources When Not in Use

**Weekday Usage Only (Class/Office Hours)**
```bash
# Stop EC2 instance (6pm - 8am, weekends)
# Saves: 60% of EC2 costs

# AWS Console → EC2 → Instances → Stop

# Or use scheduled actions:
# EC2 → Auto Scaling → Scheduled Actions
```

**Stop RDS During Idle Times**
```bash
# RDS can be stopped for up to 7 days
# AWS Console → RDS → Databases → Stop

# Restart before 7 days or it auto-starts
```

**Savings:**
- EC2: $8.41/month → $3.36/month (running 12hrs/day)
- RDS: $12.32/month → $4.93/month (running 12hrs/day)
- **Total saved: ~$12.44/month**

---

### 2. Optimize S3 Storage

**Delete Old Attendance Images**
```bash
# Set up S3 lifecycle policy

# AWS Console → S3 → Bucket → Management → Lifecycle rules
# Create rule:
# - Name: Delete-Old-Attendance
# - Scope: attendance/ folder
# - Lifecycle rule actions: Delete objects
# - Days after object creation: 90 days
```

**Use S3 Intelligent-Tiering**
```bash
# Automatically moves rarely accessed files to cheaper storage
# AWS Console → S3 → Bucket → Properties → Default storage class
# Select: Intelligent-Tiering
```

**Compress Images Before Upload**
```javascript
// In backend code, compress images
const sharp = require('sharp');

await sharp(inputBuffer)
  .resize(800, 800, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toFile(outputPath);

// Reduces storage by 60-80%
```

**Savings:**
- 5GB → 2GB storage: $0.07/month saved
- Lifecycle: Prevents unlimited growth

---

### 3. Reduce Data Transfer Costs

**Enable CloudFront Caching**
```bash
# Reduces origin requests by 80%+
# Already done if following guide

# Increase cache TTL:
# CloudFront → Distributions → Behaviors → Edit
# Cache TTL: 86400 seconds (1 day) for static assets
```

**Compress Frontend Assets**
```javascript
// In vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
}
```

**Use CloudFront for Images Too**
```bash
# Point CloudFront to S3 images bucket
# Reduces S3 data transfer charges
```

**Savings:**
- Data transfer: $9/month → $2-3/month

---

### 4. Optimize Database

**Reduce RDS Backup Retention**
```bash
# Free tier includes 7 days
# Anything > 7 days costs money

# AWS Console → RDS → Modify
# Backup retention: 7 days (not 30)
```

**Disable Performance Insights**
```bash
# Costs $0.0161/hour if enabled
# AWS Console → RDS → Modify
# Performance Insights: Disabled
```

**Export Old Data**
```sql
-- Archive old attendance records to S3
-- Keep only last 6 months in RDS

SELECT * INTO OUTFILE 's3://bucket/archive.csv'
FROM attendance
WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);

DELETE FROM attendance
WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

**Savings:**
- Prevents database growth beyond 20GB free tier

---

### 5. SNS Optimization

**Use Email Instead of SMS**
```bash
# Email: $0.00065 each
# SMS: $0.00645 each (10× more expensive!)

# In backend, prefer email notifications
```

**Batch Notifications**
```javascript
// Instead of 1 notification per student (59 emails)
// Send 1 notification per session (1 email)

const summary = `Attendance marked: ${present}/${total} present`;
await sendNotification(summary);
```

**Savings:**
- 1000 SMS/month: $6.45
- 1000 emails/month: $0.65
- **Saved: $5.80/month**

---

### 6. Use Reserved Instances (Long-Term)

**If Running for 1+ Year**
```bash
# EC2 Reserved Instance (1 year, no upfront)
# Regular t2.micro: $8.41/month = $100.92/year
# Reserved t2.micro: $4.86/month = $58.32/year
# Savings: 42% ($42.60/year)

# RDS Reserved Instance (1 year, no upfront)
# Regular db.t2.micro: $12.32/month = $147.84/year
# Reserved db.t2.micro: $7.59/month = $91.08/year
# Savings: 49% ($56.76/year)

# AWS Console → EC2 → Reserved Instances → Purchase
```

**⚠️ Only do this if:**
- You're sure you'll use it for full term
- Free tier has expired
- App is in production (not testing)

---

## 📋 Cost Monitoring Checklist

### Daily (First 2 Weeks)
- [ ] Check Billing Dashboard
- [ ] Verify no unexpected charges
- [ ] Check email for billing alerts

### Weekly (After Launch)
- [ ] Review Cost Explorer
- [ ] Check Free Tier usage
- [ ] Verify instance hours
- [ ] Check S3 storage size
- [ ] Review data transfer

### Monthly (Always)
- [ ] Download and review bill
- [ ] Compare to previous month
- [ ] Check for optimization opportunities
- [ ] Update budget alerts if needed
- [ ] Archive old data if needed

---

## 🔍 Investigating High Costs

### If Bill > $10 Unexpectedly

**Step 1: Identify Culprit Service**
```bash
# Billing Dashboard → Cost Explorer → Daily Costs
# Group by: Service
# Find which service spiked
```

**Step 2: Common Causes**

**EC2 High Costs:**
- ✅ Running multiple instances?
- ✅ Running wrong instance type? (t3.large instead of t2.micro)
- ✅ Using Elastic IPs without instances?

**RDS High Costs:**
- ✅ Backup storage > 20GB?
- ✅ Performance Insights enabled?
- ✅ Multi-AZ enabled? (costs 2×)

**S3 High Costs:**
- ✅ Storage > 5GB?
- ✅ Too many PUT requests?
- ✅ Versioning enabled with many versions?

**Data Transfer High Costs:**
- ✅ Serving large files without CloudFront?
- ✅ Images not compressed?
- ✅ Videos or large downloads?

**Step 3: Take Action**
```bash
# Stop unused resources immediately
# Delete unnecessary files
# Enable compression
# Contact AWS Support if unsure
```

---

## 💡 Pro Tips

### Tip 1: Always Tag Resources
```bash
# Tag everything with project name
# Makes cost tracking easier

# When creating resources, add tags:
# Project: AttendX
# Environment: Production
# Owner: YourName
```

### Tip 2: Use AWS Calculator
```bash
# Estimate costs before deploying
# https://calculator.aws/#/

# Input your expected usage
# See cost breakdown
```

### Tip 3: Set Up Cost Anomaly Detection
```bash
# AWS Console → Cost Management → Cost Anomaly Detection
# AWS automatically alerts you to unusual spending
```

### Tip 4: Free Tier Expiration Reminder
```bash
# Add calendar reminder for 11 months from now
# Plan to either:
# - Optimize for paid tier
# - Migrate to cheaper alternatives
# - Shut down if no longer needed
```

---

## 📞 If You Get a Surprise Bill

### Don't Panic!

**Step 1: Review the Bill**
- Download PDF invoice
- Check line items
- Identify unusual charges

**Step 2: Check for Mistakes**
- Resources left running accidentally?
- Wrong region (some are more expensive)?
- Misconfigured services?

**Step 3: Contact AWS Support**
```bash
# AWS Console → Support → Create Case
# Select: Account and Billing Support
# Explain situation (new user, free tier, unexpected charge)

# AWS often forgives small charges for new users
# Especially if clearly accidental
```

**Step 4: Prevent Future Issues**
- Set stricter budget alerts
- Enable Cost Anomaly Detection
- Review resources weekly

---

## 🎯 Target Costs by Phase

### Month 1-12 (Free Tier)
**Target: $0-3/month**
- Should be mostly free
- Small charges for SNS SMS or minor overages

### Month 13+ (After Free Tier)
**Target: $20-30/month**
- EC2 t2.micro: $8.41
- RDS db.t2.micro: $12.32
- S3 + CloudFront: $2-3
- SNS: $1-2
- Misc: $2-3

### After Optimization
**Target: $15-20/month**
- Stop instances when not in use: -$12
- Optimize storage: -$2
- Efficient caching: -$3

---

## 📊 Sample Monthly Report Template

```
AttendX AWS Cost Report - [Month/Year]
═══════════════════════════════════════

Service Costs:
├─ EC2:              $_____ (_____ hours used / 750 free)
├─ RDS:              $_____ (_____ hours used / 750 free)
├─ S3 Storage:       $_____ (_____ GB used / 5GB free)
├─ S3 Requests:      $_____ (_____ requests / limits)
├─ CloudFront:       $_____ (_____ GB traffic / 50GB free)
├─ Data Transfer:    $_____ (_____ GB out / 100GB free)
├─ SNS:              $_____ (_____ notifications sent)
└─ Other:            $_____

Total: $_____

Compared to Last Month: [+/- $_____] ([+/- ___%])

Free Tier Status:
✅ Within limits: [list services]
⚠️ Approaching limits: [list services]
🚫 Exceeded: [list services]

Actions Taken:
- [Action 1]
- [Action 2]

Next Month Goals:
- [Goal 1]
- [Goal 2]
```

---

**Remember: The best cost optimization is proactive monitoring. Check your AWS costs regularly to avoid surprises!**
