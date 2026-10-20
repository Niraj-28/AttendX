Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "    AttendX Local Environment Test Suite" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Test 1: Check database schema
Write-Host "[TEST 1] Checking database schema..." -ForegroundColor Yellow

Write-Host "  - Checking subjects.stream column..." -NoNewline
$streamCol = mysql -u root -p'Niraj#2804' -D attendx -se "SHOW COLUMNS FROM subjects LIKE 'stream';" 2>$null
if ($streamCol) {
    Write-Host " ✅ EXISTS" -ForegroundColor Green
} else {
    Write-Host " ❌ MISSING" -ForegroundColor Red
}

Write-Host "  - Checking sessions.session_type column..." -NoNewline
$sessionTypeCol = mysql -u root -p'Niraj#2804' -D attendx -se "SHOW COLUMNS FROM sessions LIKE 'session_type';" 2>$null
if ($sessionTypeCol) {
    Write-Host " ✅ EXISTS" -ForegroundColor Green
} else {
    Write-Host " ❌ MISSING" -ForegroundColor Red
}

# Test 2: Check MCA subjects
Write-Host "`n[TEST 2] Checking MCA Semester 3 subjects..." -ForegroundColor Yellow
$mcaSubjects = mysql -u root -p'Niraj#2804' -D attendx -se "SELECT COUNT(*) FROM subjects WHERE stream='MCA' AND semester=3;" 2>$null
Write-Host "  - Found $mcaSubjects MCA Sem 3 subjects" -ForegroundColor $(if ($mcaSubjects -ge 6) { "Green" } else { "Red" })

if ($mcaSubjects -gt 0) {
    Write-Host "`n  Subject List:" -ForegroundColor Cyan
    mysql -u root -p'Niraj#2804' -D attendx -se "SELECT subject_code, subject_name FROM subjects WHERE stream='MCA' AND semester=3 ORDER BY subject_name;" 2>$null | ForEach-Object {
        Write-Host "    • $_" -ForegroundColor White
    }
}

# Test 3: Check Backend Server
Write-Host "`n[TEST 3] Checking backend server..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:5001/health' -TimeoutSec 3
    if ($health.status -eq 'success') {
        Write-Host "  ✅ Backend is running and healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Backend is not responding" -ForegroundColor Red
}

# Test 4: Check Frontend Server
Write-Host "`n[TEST 4] Checking frontend server..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 3 -UseBasicParsing
    if ($frontend.StatusCode -eq 200) {
        Write-Host "  ✅ Frontend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Frontend is not responding" -ForegroundColor Red
}

# Test 5: Check Login Works
Write-Host "`n[TEST 5] Testing login functionality..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = 'saurin.parikh@nirmauni.ac.in'
        password = 'admin123'
        role = 'faculty'
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Method POST -Uri 'http://localhost:5001/api/auth/login' -Body $loginBody -ContentType 'application/json'
    
    if ($loginResponse.status -eq 'success') {
        Write-Host "  ✅ Login successful!" -ForegroundColor Green
        Write-Host "  - User: $($loginResponse.data.user.name)" -ForegroundColor Cyan
        Write-Host "  - Role: $($loginResponse.data.user.role)" -ForegroundColor Cyan
        
        # Test 6: Check Subjects API with token
        Write-Host "`n[TEST 6] Testing subjects API..." -ForegroundColor Yellow
        $headers = @{ 'Authorization' = "Bearer $($loginResponse.data.token)" }
        try {
            $subjects = Invoke-RestMethod -Uri 'http://localhost:5001/api/subjects' -Headers $headers
            Write-Host "  ✅ Subjects API works!" -ForegroundColor Green
            Write-Host "  - Total subjects: $($subjects.data.Count)" -ForegroundColor Cyan
            
            $mcaSubjectsAPI = $subjects.data | Where-Object { $_.stream -eq 'MCA' -and $_.semester -eq 3 }
            Write-Host "  - MCA Sem 3 subjects: $($mcaSubjectsAPI.Count)" -ForegroundColor Cyan
        } catch {
            Write-Host "  ❌ Subjects API failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Test 7: Check Sessions API
        Write-Host "`n[TEST 7] Testing sessions API..." -ForegroundColor Yellow
        try {
            $sessions = Invoke-RestMethod -Uri 'http://localhost:5001/api/sessions' -Headers $headers
            Write-Host "  ✅ Sessions API works!" -ForegroundColor Green
            Write-Host "  - Total sessions: $($sessions.data.Count)" -ForegroundColor Cyan
        } catch {
            Write-Host "  ❌ Sessions API failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "              Test Suite Complete" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan
