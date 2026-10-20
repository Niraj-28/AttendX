#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy AttendX face recognition fixes to AWS EC2

.DESCRIPTION
    This script helps deploy the latest code changes to your AWS EC2 instance.
    It will SSH to the instance, pull the latest code, and restart services.

.PARAMETER KeyPath
    Path to your SSH key file (attendx-backend-key.pem)

.PARAMETER SkipBackup
    Skip creating backups of existing files

.EXAMPLE
    .\deploy-to-ec2.ps1 -KeyPath "C:\path\to\attendx-backend-key.pem"

.EXAMPLE
    .\deploy-to-ec2.ps1 -KeyPath "~\Downloads\attendx-backend-key.pem" -SkipBackup
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$KeyPath = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup = $false
)

# Configuration
$EC2_HOST = "32.195.60.167"
$EC2_USER = "ubuntu"
$APP_DIR = "/home/ubuntu/AttendX"

Write-Host "🚀 AttendX AWS Deployment Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if SSH key path is provided
if ([string]::IsNullOrWhiteSpace($KeyPath)) {
    Write-Host "❌ Error: SSH key path is required" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\deploy-to-ec2.ps1 -KeyPath 'C:\path\to\attendx-backend-key.pem'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If you don't have the SSH key, use AWS Systems Manager Session Manager instead:" -ForegroundColor Cyan
    Write-Host "  1. Go to: https://console.aws.amazon.com/ec2/" -ForegroundColor White
    Write-Host "  2. Find instance with IP $EC2_HOST" -ForegroundColor White
    Write-Host "  3. Click 'Connect' → 'Session Manager' → 'Connect'" -ForegroundColor White
    Write-Host "  4. Run the manual commands from DEPLOY-FIXES-TO-AWS.md" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Expand path (handle ~ for home directory)
$KeyPath = $ExecutionContext.InvokeCommand.ExpandString($KeyPath)
if ($KeyPath -match "^~") {
    $KeyPath = $KeyPath -replace "^~", $env:USERPROFILE
}

# Check if SSH key exists
if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ Error: SSH key not found at: $KeyPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please provide the correct path to your attendx-backend-key.pem file" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSH key found: $KeyPath" -ForegroundColor Green
Write-Host "🌐 Target: $EC2_USER@$EC2_HOST" -ForegroundColor Cyan
Write-Host ""

# Test SSH connection
Write-Host "🔍 Testing SSH connection..." -ForegroundColor Yellow
$testConnection = ssh -i "$KeyPath" -o ConnectTimeout=10 -o BatchMode=yes "$EC2_USER@$EC2_HOST" "echo connected" 2>&1

if ($testConnection -notmatch "connected") {
    Write-Host "❌ Error: Cannot connect to EC2 instance" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  - EC2 instance is stopped" -ForegroundColor White
    Write-Host "  - Security group doesn't allow SSH from your IP" -ForegroundColor White
    Write-Host "  - Wrong SSH key" -ForegroundColor White
    Write-Host ""
    Write-Host "Try using AWS Systems Manager Session Manager instead (see DEPLOY-FIXES-TO-AWS.md)" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ SSH connection successful" -ForegroundColor Green
Write-Host ""

# Create deployment script
$deployScript = @"
#!/bin/bash
set -e

echo "======================================"
echo "AttendX Deployment - Face Recognition Fixes"
echo "======================================"
echo ""

cd $APP_DIR

# Check current branch and commit
echo "📋 Current status:"
git branch
git log --oneline -1
echo ""

# Backup files (if not skipped)
if [ "$SkipBackup" != "true" ]; then
    echo "💾 Creating backups..."
    mkdir -p backups
    cp backend/python/face_detector_opencv.py backups/face_detector_opencv.py.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    cp backend/src/controllers/attendance.controller.js backups/attendance.controller.js.backup.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    echo "✅ Backups created in backups/ directory"
    echo ""
fi

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git fetch origin main
git pull origin main

if [ \$? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi

echo "✅ Code updated successfully"
echo ""

# Show what changed
echo "📝 Files changed in this deployment:"
git show --stat HEAD
echo ""

# Install any new dependencies (if package.json changed)
if git diff HEAD~1 HEAD --name-only | grep -q "backend/package.json"; then
    echo "📦 Installing new dependencies..."
    cd backend
    npm install --production
    cd ..
    echo "✅ Dependencies updated"
    echo ""
fi

# Restart PM2 process
echo "🔄 Restarting backend service..."
pm2 restart attendx-backend

if [ \$? -ne 0 ]; then
    echo "❌ PM2 restart failed!"
    exit 1
fi

pm2 save
echo "✅ Service restarted successfully"
echo ""

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 5

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status attendx-backend
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
HEALTH=\$(curl -s http://localhost:5001/api/health 2>&1)

if echo "\$HEALTH" | grep -q "ok"; then
    echo "✅ Health check passed!"
else
    echo "⚠️ Health check warning - service may still be starting"
    echo "Response: \$HEALTH"
fi

echo ""
echo "======================================"
echo "✅ Deployment completed successfully!"
echo "======================================"
echo ""
echo "📝 Next steps:"
echo "  1. Test the application at: http://$EC2_HOST"
echo "  2. Check logs: pm2 logs attendx-backend --lines 50"
echo "  3. Enroll students using: node backend/scripts/bulk-enroll-students.js"
echo ""
echo "🔍 Verify enrollment status:"
echo "  mysql -h attendx-db.cq9ecao08u6w.us-east-1.rds.amazonaws.com -u admin -p attendx"
echo "  Then run: SELECT COUNT(*), SUM(CASE WHEN face_embedding IS NOT NULL THEN 1 ELSE 0 END) FROM students WHERE class='A';"
echo ""
"@

# Save script to temp file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript | Out-File -FilePath $tempScript -Encoding ASCII -NoNewline

Write-Host "📤 Uploading deployment script..." -ForegroundColor Yellow

# Upload and execute script
try {
    # Upload script
    scp -i "$KeyPath" "$tempScript" "${EC2_USER}@${EC2_HOST}:/tmp/deploy.sh" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload deployment script"
    }
    
    Write-Host "✅ Script uploaded" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Executing deployment..." -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Execute script
    $skipBackupArg = if ($SkipBackup) { "true" } else { "false" }
    ssh -i "$KeyPath" "$EC2_USER@$EC2_HOST" "chmod +x /tmp/deploy.sh && SkipBackup=$skipBackupArg /tmp/deploy.sh && rm /tmp/deploy.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📱 Your application is live at: http://$EC2_HOST" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "⚠️ Deployment completed with warnings. Check the output above." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
} finally {
    # Cleanup temp file
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}

Write-Host ""
Write-Host "📚 Useful commands:" -ForegroundColor Cyan
Write-Host "  ssh -i `"$KeyPath`" $EC2_USER@$EC2_HOST" -ForegroundColor White
Write-Host "  pm2 logs attendx-backend" -ForegroundColor White
Write-Host "  pm2 restart attendx-backend" -ForegroundColor White
Write-Host "  pm2 monit" -ForegroundColor White
Write-Host ""
