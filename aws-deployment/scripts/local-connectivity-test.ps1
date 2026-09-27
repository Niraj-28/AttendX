# AttendX Local Connectivity Test
# Run this on your local Windows machine to test connectivity to EC2

$EC2_IP = "32.195.60.167"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   AttendX Connectivity Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedContent
    )
    
    $script:TotalTests++
    Write-Host "Testing: $Name ... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            if ($ExpectedContent -and $response.Content -notmatch $ExpectedContent) {
                Write-Host "❌ FAIL" -ForegroundColor Red
                Write-Host "  Expected content not found" -ForegroundColor Yellow
                $script:FailedTests++
            } else {
                Write-Host "✅ PASS" -ForegroundColor Green
                $script:PassedTests++
            }
        } else {
            Write-Host "❌ FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
            $script:FailedTests++
        }
    }
    catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $script:FailedTests++
    }
}

# Test 1: Ping EC2 instance
Write-Host "=== Network Connectivity ===" -ForegroundColor Cyan
$TotalTests++
Write-Host "Testing: Ping EC2 instance ... " -NoNewline
$pingResult = Test-Connection -ComputerName $EC2_IP -Count 2 -Quiet
if ($pingResult) {
    Write-Host "✅ PASS" -ForegroundColor Green
    $PassedTests++
} else {
    Write-Host "❌ FAIL" -ForegroundColor Red
    $FailedTests++
}

Write-Host ""
Write-Host "=== API Endpoints ===" -ForegroundColor Cyan

# Test 2: Health endpoint
Test-Endpoint -Name "Backend health endpoint" -Url "http://$EC2_IP/health" -ExpectedContent "ok"

# Test 3: API base endpoint
Test-Endpoint -Name "API base endpoint" -Url "http://$EC2_IP/api/" -ExpectedContent "AttendX"

Write-Host ""
Write-Host "=== Frontend ===" -ForegroundColor Cyan

# Test 4: Frontend homepage
Test-Endpoint -Name "Frontend homepage" -Url "http://$EC2_IP/" -ExpectedContent "AttendX"

# Test 5: Check if it's HTML
$TotalTests++
Write-Host "Testing: Frontend returns HTML ... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP/" -TimeoutSec 10 -UseBasicParsing
    if ($response.Content -match "<html" -and $response.Content -match "</html>") {
        Write-Host "✅ PASS" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        $FailedTests++
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    $FailedTests++
}

# Test 6: Check for React app div
$TotalTests++
Write-Host "Testing: React app container exists ... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP/" -TimeoutSec 10 -UseBasicParsing
    if ($response.Content -match 'id="root"') {
        Write-Host "✅ PASS" -ForegroundColor Green
        $PassedTests++
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        $FailedTests++
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    $FailedTests++
}

Write-Host ""
Write-Host "=== SSH Connectivity ===" -ForegroundColor Cyan

# Test 7: SSH port
$TotalTests++
Write-Host "Testing: SSH port (22) accessible ... " -NoNewline
$sshTest = Test-NetConnection -ComputerName $EC2_IP -Port 22 -WarningAction SilentlyContinue
if ($sshTest.TcpTestSucceeded) {
    Write-Host "✅ PASS" -ForegroundColor Green
    $PassedTests++
} else {
    Write-Host "❌ FAIL" -ForegroundColor Red
    $FailedTests++
}

# Test 8: HTTP port
$TotalTests++
Write-Host "Testing: HTTP port (80) accessible ... " -NoNewline
$httpTest = Test-NetConnection -ComputerName $EC2_IP -Port 80 -WarningAction SilentlyContinue
if ($httpTest.TcpTestSucceeded) {
    Write-Host "✅ PASS" -ForegroundColor Green
    $PassedTests++
} else {
    Write-Host "❌ FAIL" -ForegroundColor Red
    $FailedTests++
}

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "           Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Total Tests:  $TotalTests"
Write-Host "Passed:       $PassedTests" -ForegroundColor Green
Write-Host "Failed:       $FailedTests" -ForegroundColor Red
Write-Host ""

if ($FailedTests -eq 0) {
    Write-Host "🎉 All tests passed! Your application is accessible." -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Cyan
    Write-Host "  1. Open http://$EC2_IP in your browser" -ForegroundColor White
    Write-Host "  2. Log in with: lata.gohil@nirmauni.ac.in / f123" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some tests failed. Please check:" -ForegroundColor Yellow
    Write-Host "  1. EC2 instance is running" -ForegroundColor White
    Write-Host "  2. Security group allows HTTP (port 80)" -ForegroundColor White
    Write-Host "  3. Backend and Nginx are running on EC2" -ForegroundColor White
    Write-Host ""
}

# Open browser if all tests pass
if ($FailedTests -eq 0) {
    $response = Read-Host "Would you like to open the application in your browser? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        Start-Process "http://$EC2_IP"
    }
}
