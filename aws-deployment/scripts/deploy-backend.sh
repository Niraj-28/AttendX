#!/bin/bash

# AttendX Backend Deployment Script
# Run this on EC2 instance after transferring code

set -e  # Exit on error

echo "======================================"
echo "AttendX Backend Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/ubuntu/backend"
APP_NAME="attendx-backend"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running on Ubuntu
if [ ! -f /etc/lsb-release ]; then
    print_error "This script is designed for Ubuntu. Exiting."
    exit 1
fi

print_status "Starting deployment process..."

# Navigate to app directory
cd $APP_DIR || {
    print_error "Directory $APP_DIR not found!"
    exit 1
}

print_status "Current directory: $(pwd)"

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found! Please create it from .env.production.template"
    exit 1
fi

print_status ".env file found"

# Install/Update Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    print_error "npm install failed!"
    exit 1
fi

# Install Python dependencies
print_status "Installing Python dependencies..."
cd python
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    print_warning "Python dependencies installation had issues. Continuing..."
fi

cd ..

# Create logs directory
mkdir -p logs
print_status "Logs directory created"

# Test database connection
print_status "Testing database connection..."
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('Database connection successful!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
})();
"

if [ $? -ne 0 ]; then
    print_error "Database connection test failed! Check your .env file"
    exit 1
fi

print_status "Database connection successful"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing..."
    sudo npm install -g pm2
fi

# Stop existing PM2 process (if running)
print_status "Stopping existing PM2 process (if any)..."
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

if [ $? -ne 0 ]; then
    print_error "Failed to start application with PM2!"
    exit 1
fi

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (if not already done)
print_status "Setting up PM2 startup script..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

print_status "Waiting for application to start..."
sleep 5

# Check if application is running
pm2 list | grep -q "$APP_NAME.*online"
if [ $? -eq 0 ]; then
    print_status "Application is running!"
else
    print_error "Application failed to start. Check logs with: pm2 logs $APP_NAME"
    exit 1
fi

# Test health endpoint
print_status "Testing health endpoint..."
sleep 2
HEALTH_CHECK=$(curl -s http://localhost:5001/api/health || echo "failed")

if [[ $HEALTH_CHECK == *"ok"* ]]; then
    print_status "Health check passed!"
else
    print_warning "Health check failed. Application may still be starting..."
fi

echo ""
echo "======================================"
print_status "Deployment completed successfully!"
echo "======================================"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs $APP_NAME      - View logs"
echo "  pm2 restart $APP_NAME   - Restart application"
echo "  pm2 stop $APP_NAME      - Stop application"
echo "  pm2 monit               - Monitor in real-time"
echo ""
echo "API Endpoint: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api"
echo ""
