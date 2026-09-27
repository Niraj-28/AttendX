#!/bin/bash
# AttendX EC2 Health Check Script
# Run this on your EC2 instance to verify all components

echo "=========================================="
echo "   AttendX Deployment Health Check"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS="${GREEN}✅ PASS${NC}"
FAIL="${RED}❌ FAIL${NC}"
WARN="${YELLOW}⚠️  WARN${NC}"

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    TEST_NAME=$1
    TEST_COMMAND=$2
    
    echo -n "Testing: $TEST_NAME ... "
    
    if eval "$TEST_COMMAND" > /dev/null 2>&1; then
        echo -e "$PASS"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "$FAIL"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test 1: Check PM2 is installed
echo "=== Backend Services ==="
run_test "PM2 installed" "which pm2"

# Test 2: Check backend is running
if pm2 status | grep -q "attendx-backend"; then
    if pm2 status | grep "attendx-backend" | grep -q "online"; then
        echo -e "Testing: Backend running ... $PASS"
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "Testing: Backend running ... $FAIL"
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    echo -e "Testing: Backend running ... $FAIL"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 3: Check Nginx is running
echo ""
echo "=== Web Server ==="
run_test "Nginx installed" "which nginx"
run_test "Nginx running" "sudo systemctl is-active nginx"

# Test 4: Check database connection
echo ""
echo "=== Database ==="
DB_HOST=$(grep DB_HOST /home/ubuntu/backend/.env | cut -d '=' -f2)
DB_USER=$(grep DB_USER /home/ubuntu/backend/.env | cut -d '=' -f2)
DB_PASS=$(grep DB_PASSWORD /home/ubuntu/backend/.env | cut -d '=' -f2 | tr -d '"')

echo -n "Testing: Database connection ... "
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" > /dev/null 2>&1; then
    echo -e "$PASS"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "$FAIL"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 5: Check backend API
echo ""
echo "=== API Endpoints ==="
echo -n "Testing: Backend health endpoint ... "
HEALTH_RESPONSE=$(curl -s http://localhost:5001/health)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "$PASS"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "$FAIL"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo -n "Testing: API through Nginx ... "
API_RESPONSE=$(curl -s http://localhost/api/)
if echo "$API_RESPONSE" | grep -q "AttendX"; then
    echo -e "$PASS"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "$FAIL"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 6: Check frontend files
echo ""
echo "=== Frontend ==="
run_test "Frontend directory exists" "test -d /home/ubuntu/frontend"
run_test "index.html exists" "test -f /home/ubuntu/frontend/index.html"
run_test "Assets folder exists" "test -d /home/ubuntu/frontend/assets"

# Test 7: Check Python dependencies
echo ""
echo "=== Python Environment ==="
run_test "Python3 installed" "which python3"
echo -n "Testing: face_recognition module ... "
if python3 -c "import face_recognition" 2>/dev/null; then
    echo -e "$PASS"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "$FAIL"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 8: Check disk space
echo ""
echo "=== System Resources ==="
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo -n "Testing: Disk space (used: ${DISK_USAGE}%) ... "
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "$PASS"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "$WARN (${DISK_USAGE}% used)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Test 9: Check memory
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')
echo -n "Testing: Memory usage (${MEM_USAGE}%) ... "
if [ "$MEM_USAGE" -lt 90 ]; then
    echo -e "$PASS"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "$WARN (${MEM_USAGE}% used)"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Summary
echo ""
echo "=========================================="
echo "           Test Summary"
echo "=========================================="
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your deployment is healthy.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Backend not running: pm2 restart attendx-backend"
    echo "  - Nginx not running: sudo systemctl restart nginx"
    echo "  - Database connection: Check .env credentials"
    echo "  - Python modules: pip3 install --break-system-packages -r python/requirements.txt"
    exit 1
fi
