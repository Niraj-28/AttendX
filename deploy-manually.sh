#!/bin/bash
# AttendX Face Recognition Fixes - Deployment Script
# Run this on EC2 instance after connecting

echo "======================================"
echo "AttendX Deployment - Face Recognition Fixes"
echo "======================================"
echo ""

# Navigate to app directory
cd /home/ubuntu/AttendX || {
    echo "❌ Error: AttendX directory not found!"
    exit 1
}

echo "📋 Current directory: $(pwd)"
echo ""

# Check current version
echo "📝 Current version:"
git log --oneline -1
echo ""

# Pull latest changes
echo "📥 Pulling latest code from GitHub..."
git fetch origin main
git pull origin main

if [ $? -ne 0 ]; then
    echo "⚠️ Git pull had issues. Trying to reset..."
    git reset --hard origin/main
fi

echo "✅ Code updated successfully"
echo ""

# Show what changed
echo "📝 Files changed:"
git show --stat HEAD | head -20
echo ""

# Navigate to backend
cd backend

# Restart PM2 process
echo "🔄 Restarting backend service..."
pm2 restart attendx-backend

if [ $? -ne 0 ]; then
    echo "⚠️ PM2 restart failed. Trying to start fresh..."
    pm2 delete attendx-backend 2>/dev/null
    pm2 start src/server.js --name attendx-backend
fi

pm2 save
echo "✅ Service restarted successfully"
echo ""

# Wait for service to start
echo "⏳ Waiting for service to initialize..."
sleep 5

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status attendx-backend
echo ""

# Check logs for any errors
echo "📋 Recent logs:"
pm2 logs attendx-backend --lines 20 --nostream
echo ""

# Test health endpoint
echo "🏥 Health check:"
curl -s http://localhost:5001/api/health
echo ""

echo ""
echo "======================================"
echo "✅ Deployment completed!"
echo "======================================"
echo ""
echo "📝 Changes deployed:"
echo "  ✅ Stricter face matching (70% confidence)"
echo "  ✅ 80% enrollment validation"
echo "  ✅ Better match rejection logic"
echo "  ✅ Bulk enrollment tool available"
echo ""
echo "🎯 Next steps:"
echo "  1. Test: http://32.195.60.167"
echo "  2. Login and try to create session"
echo "  3. System will block attendance until 80% students enrolled"
echo "  4. Use: node scripts/bulk-enroll-students.js to enroll"
echo ""
