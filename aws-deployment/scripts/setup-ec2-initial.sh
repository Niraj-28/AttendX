#!/bin/bash

# AttendX EC2 Initial Setup Script
# Run this FIRST TIME on a fresh EC2 instance to install all required software

set -e

echo "======================================"
echo "AttendX EC2 Initial Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    print_error "Please run this script as ubuntu user"
    exit 1
fi

print_status "Starting initial EC2 setup..."

# Update system
print_status "Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

node --version
npm --version

# Install Python and dependencies
print_status "Installing Python and system dependencies..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    cmake \
    libopencv-dev \
    python3-opencv \
    libboost-all-dev \
    libgtk-3-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    git \
    wget \
    curl

python3 --version
pip3 --version

# Install MySQL client
print_status "Installing MySQL client..."
sudo apt install -y mysql-client

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

print_status "Nginx installed and started"

# Install PM2
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

pm2 --version

# Create swap space (important for t2.micro)
print_status "Creating 2GB swap space..."
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

print_status "Swap space created and enabled"

# Create application directory
print_status "Creating application directory..."
mkdir -p /home/ubuntu/backend
mkdir -p /home/ubuntu/logs

# Configure firewall (UFW)
print_status "Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5001/tcp  # Node.js API
sudo ufw --force enable

print_status "Firewall configured"

# Optimize system for low-memory environment
print_status "Optimizing system settings..."

# Increase file descriptors
echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf

# Optimize sysctl
cat << EOF | sudo tee -a /etc/sysctl.conf
# Network optimizations
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.ip_local_port_range = 10000 65000

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 2
EOF

sudo sysctl -p

# Install htop for monitoring
print_status "Installing system monitoring tools..."
sudo apt install -y htop

# Create SSH key for GitHub (optional)
print_status "Generating SSH key for Git (optional)..."
if [ ! -f /home/ubuntu/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -C "attendx-ec2" -f /home/ubuntu/.ssh/id_rsa -N ""
    print_status "SSH key generated: /home/ubuntu/.ssh/id_rsa.pub"
    print_warning "Add this to your GitHub account if you plan to clone private repos:"
    cat /home/ubuntu/.ssh/id_rsa.pub
else
    print_status "SSH key already exists"
fi

# Clean up
print_status "Cleaning up..."
sudo apt autoremove -y
sudo apt clean

echo ""
echo "======================================"
print_status "Initial setup completed!"
echo "======================================"
echo ""
echo "Installed software:"
echo "  - Node.js $(node --version)"
echo "  - npm $(npm --version)"
echo "  - Python $(python3 --version)"
echo "  - PM2 $(pm2 --version)"
echo "  - Nginx $(nginx -v 2>&1)"
echo "  - MySQL Client $(mysql --version)"
echo ""
echo "System info:"
echo "  - Total Memory: $(free -h | awk '/^Mem:/ {print $2}')"
echo "  - Swap Space: $(free -h | awk '/^Swap:/ {print $2}')"
echo "  - Disk Space: $(df -h / | awk 'NR==2 {print $4}') available"
echo ""
echo "Next steps:"
echo "1. Transfer your backend code to /home/ubuntu/backend"
echo "2. Create .env file from template"
echo "3. Run: ./deploy-backend.sh"
echo ""
