# AttendX Frontend Deployment Script (PowerShell)
# Run this on your LOCAL Windows machine to build and upload frontend to S3

param(
    [string]$BucketName = "",
    [string]$ApiUrl = "",
    [switch]$Help
)

# Colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"

function Print-Status {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor $Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor $Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor $Yellow
}

function Show-Help {
    Write-Host @"
AttendX Frontend Deployment Script
===================================

Usage:
    .\deploy-frontend-local.ps1 -BucketName <bucket-name> -ApiUrl <api-url>

Parameters:
    -BucketName    : S3 bucket name (e.g., attendx-frontend-nb-2026)
    -ApiUrl        : Backend API URL (e.g., http://3.85.123.45/api)
    -Help          : Show this help message

Example:
    .\deploy-frontend-local.ps1 -BucketName attendx-frontend-nb-2026 -ApiUrl http://3.85.123.45/api

Requirements:
    - Node.js installed
    - AWS CLI installed and configured
    - Internet connection

"@
    exit 0
}

if ($Help) {
    Show-Help
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "AttendX Frontend Deployment Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check parameters
if ([string]::IsNullOrEmpty($BucketName)) {
    Print-Error "BucketName is required!"
    Write-Host "Run with -Help for usage information"
    exit 1
}

if ([string]::IsNullOrEmpty($ApiUrl)) {
    Print-Error "ApiUrl is required!"
    Write-Host "Run with -Help for usage information"
    exit 1
}

# Get script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$FrontendDir = Join-Path $ProjectRoot "frontend"

Print-Status "Project root: $ProjectRoot"
Print-Status "Frontend directory: $FrontendDir"

# Check if frontend directory exists
if (-not (Test-Path $FrontendDir)) {
    Print-Error "Frontend directory not found: $FrontendDir"
    exit 1
}

# Navigate to frontend directory
Set-Location $FrontendDir
Print-Status "Changed directory to: $FrontendDir"

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Print-Error "package.json not found in frontend directory!"
    exit 1
}

# Update .env file
Print-Status "Creating production .env file..."
$EnvContent = @"
VITE_API_BASE_URL=$ApiUrl
VITE_APP_NAME=AttendX
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
"@

$EnvContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
Print-Status ".env file created with API URL: $ApiUrl"

# Install dependencies (if node_modules doesn't exist)
if (-not (Test-Path "node_modules")) {
    Print-Status "Installing dependencies..."
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Print-Error "npm install failed!"
        exit 1
    }
} else {
    Print-Status "Dependencies already installed (skipping npm install)"
}

# Build frontend
Print-Status "Building frontend for production..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Print-Error "Build failed!"
    exit 1
}

# Check if dist directory was created
if (-not (Test-Path "dist")) {
    Print-Error "Build output directory (dist) not found!"
    exit 1
}

Print-Status "Build completed successfully!"

# Check if AWS CLI is installed
$AwsCliInstalled = Get-Command aws -ErrorAction SilentlyContinue

if (-not $AwsCliInstalled) {
    Print-Error "AWS CLI not found!"
    Write-Host ""
    Write-Host "Please install AWS CLI:"
    Write-Host "1. Download from: https://awscli.amazonaws.com/AWSCLIV2.msi"
    Write-Host "2. Or use chocolatey: choco install awscli"
    Write-Host "3. Configure: aws configure"
    Write-Host ""
    exit 1
}

# Check if AWS CLI is configured
Print-Status "Checking AWS CLI configuration..."
aws sts get-caller-identity *>$null

if ($LASTEXITCODE -ne 0) {
    Print-Error "AWS CLI not configured!"
    Write-Host ""
    Write-Host "Please configure AWS CLI:"
    Write-Host "  aws configure"
    Write-Host ""
    Write-Host "You'll need:"
    Write-Host "  - AWS Access Key ID"
    Write-Host "  - AWS Secret Access Key"
    Write-Host "  - Default region (us-east-1)"
    Write-Host ""
    exit 1
}

Print-Status "AWS CLI configured"

# Check if bucket exists
Print-Status "Checking if S3 bucket exists..."
aws s3 ls "s3://$BucketName" *>$null

if ($LASTEXITCODE -ne 0) {
    Print-Error "S3 bucket not found: $BucketName"
    Write-Host ""
    Write-Host "Please create the bucket first in AWS Console:"
    Write-Host "1. Go to S3 service"
    Write-Host "2. Create bucket: $BucketName"
    Write-Host "3. Enable static website hosting"
    Write-Host "4. Set bucket policy for public read access"
    Write-Host ""
    exit 1
}

Print-Status "Bucket exists: $BucketName"

# Upload to S3
Print-Status "Uploading to S3..."
Write-Host ""

aws s3 sync dist/ "s3://$BucketName/" --delete

if ($LASTEXITCODE -ne 0) {
    Print-Error "Upload to S3 failed!"
    exit 1
}

Write-Host ""
Print-Status "Upload completed successfully!"

# Get S3 website URL
$Region = (aws s3api get-bucket-location --bucket $BucketName --query LocationConstraint --output text)
if ($Region -eq "None" -or [string]::IsNullOrEmpty($Region)) {
    $Region = "us-east-1"
}

$WebsiteUrl = "http://$BucketName.s3-website-$Region.amazonaws.com"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Print-Status "Deployment completed successfully!"
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your frontend is live at:"
Write-Host "  $WebsiteUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Open the URL in your browser"
Write-Host "2. Test login functionality"
Write-Host "3. Verify all features work"
Write-Host ""
Write-Host "If you're using CloudFront:"
Write-Host "  aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths '/*'"
Write-Host ""
