# Upload Frontend to S3 Bucket
# Run this after configuring AWS CLI credentials

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "AttendX Frontend Deployment to S3" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FrontendDistPath = "frontend/dist"
$S3Bucket = "s3://attendx-frontend-nk-2026"
$Region = "us-east-1"

# Check if AWS CLI is installed
Write-Host "[1/4] Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version
    Write-Host "✓ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install AWS CLI:" -ForegroundColor Yellow
    Write-Host "  winget install Amazon.AWSCLI" -ForegroundColor White
    Write-Host ""
    Write-Host "Or download from: https://aws.amazon.com/cli/" -ForegroundColor White
    exit 1
}

# Check if credentials are configured
Write-Host ""
Write-Host "[2/4] Checking AWS credentials..." -ForegroundColor Yellow
try {
    aws sts get-caller-identity | Out-Null
    $identity = aws sts get-caller-identity --query 'Account' --output text
    Write-Host "✓ AWS credentials configured (Account: $identity)" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS credentials not configured!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure credentials:" -ForegroundColor Yellow
    Write-Host "  aws configure" -ForegroundColor White
    Write-Host ""
    Write-Host "You'll need:" -ForegroundColor Yellow
    Write-Host "  - AWS Access Key ID" -ForegroundColor White
    Write-Host "  - AWS Secret Access Key" -ForegroundColor White
    Write-Host "  - Default region: us-east-1" -ForegroundColor White
    exit 1
}

# Check if frontend/dist exists
Write-Host ""
Write-Host "[3/4] Checking frontend build..." -ForegroundColor Yellow
if (Test-Path $FrontendDistPath) {
    $fileCount = (Get-ChildItem -Path $FrontendDistPath -Recurse -File).Count
    Write-Host "✓ Frontend build found ($fileCount files)" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend build not found at: $FrontendDistPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Build the frontend first:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm run build" -ForegroundColor White
    exit 1
}

# Upload to S3
Write-Host ""
Write-Host "[4/4] Uploading to S3..." -ForegroundColor Yellow
Write-Host "Source: $FrontendDistPath" -ForegroundColor Gray
Write-Host "Destination: $S3Bucket" -ForegroundColor Gray
Write-Host ""

try {
    aws s3 sync $FrontendDistPath $S3Bucket --delete --region $Region
    
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "✓ Deployment Successful!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Wait 5-10 minutes for CloudFront cache to update" -ForegroundColor White
    Write-Host "2. Or invalidate CloudFront cache manually:" -ForegroundColor White
    Write-Host "   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths '/*'" -ForegroundColor Gray
    Write-Host "3. Test the phone camera feature:" -ForegroundColor White
    Write-Host "   - Login as faculty" -ForegroundColor Gray
    Write-Host "   - Go to Sessions page" -ForegroundColor Gray
    Write-Host "   - Click '📱 Capture from Phone'" -ForegroundColor Gray
    Write-Host "   - Scan QR code with your phone" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "✗ Upload failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Insufficient S3 permissions" -ForegroundColor White
    Write-Host "2. Bucket doesn't exist or wrong name" -ForegroundColor White
    Write-Host "3. Network connectivity issues" -ForegroundColor White
    exit 1
}
