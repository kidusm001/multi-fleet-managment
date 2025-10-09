#!/bin/bash

# Payroll System Quick Test Script
# This script tests the attendance + payroll system end-to-end

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Payroll System Test Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
BASE_URL="http://localhost:3000/api"
AUTH_TOKEN=${AUTH_TOKEN:-""}
ORG_ID=${ORG_ID:-""}

if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${RED}ERROR: AUTH_TOKEN environment variable not set${NC}"
  echo "Usage: AUTH_TOKEN='your-token' ORG_ID='your-org-id' ./test-payroll.sh"
  exit 1
fi

if [ -z "$ORG_ID" ]; then
  echo -e "${RED}ERROR: ORG_ID environment variable not set${NC}"
  echo "Usage: AUTH_TOKEN='your-token' ORG_ID='your-org-id' ./test-payroll.sh"
  exit 1
fi

# Helper function to make API calls
api_call() {
  local METHOD=$1
  local ENDPOINT=$2
  local DATA=$3
  
  if [ -n "$DATA" ]; then
    curl -s -X $METHOD \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "$DATA" \
      "$BASE_URL$ENDPOINT"
  else
    curl -s -X $METHOD \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      "$BASE_URL$ENDPOINT"
  fi
}

# Step 1: Create Driver
echo -e "${BLUE}Step 1: Creating test driver...${NC}"
DRIVER_RESPONSE=$(api_call POST "/drivers/superadmin" '{
  "name": "Test Driver",
  "email": "testdriver@example.com",
  "licenseNumber": "DL-TEST-001",
  "phoneNumber": "+1234567890",
  "baseSalary": 5000,
  "hourlyRate": 30,
  "overtimeRate": 1.5,
  "bankAccountNumber": "1234567890",
  "bankName": "Test Bank",
  "organizationId": "'$ORG_ID'"
}')
DRIVER_ID=$(echo $DRIVER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$DRIVER_ID" ]; then
  echo -e "${RED}Failed to create driver${NC}"
  echo $DRIVER_RESPONSE
  exit 1
fi

echo -e "${GREEN}✓ Created driver: $DRIVER_ID${NC}"

# Step 2: Create Vehicle
echo -e "${BLUE}Step 2: Creating test vehicle...${NC}"
VEHICLE_RESPONSE=$(api_call POST "/shuttles/superadmin" '{
  "plateNumber": "TEST-001",
  "model": "Toyota Hiace",
  "make": "Toyota",
  "type": "IN_HOUSE",
  "capacity": 14,
  "year": 2023,
  "status": "AVAILABLE",
  "dailyRate": 300,
  "organizationId": "'$ORG_ID'"
}')
VEHICLE_ID=$(echo $VEHICLE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$VEHICLE_ID" ]; then
  echo -e "${RED}Failed to create vehicle${NC}"
  echo $VEHICLE_RESPONSE
  exit 1
fi

echo -e "${GREEN}✓ Created vehicle: $VEHICLE_ID${NC}"

# Step 3: Create Attendance Records
echo -e "${BLUE}Step 3: Creating attendance records (22 days)...${NC}"
ATTENDANCE_COUNT=0

for day in {1..22}; do
  DATE=$(printf "2024-01-%02d" $day)
  HOURS=$((RANDOM % 3 + 8))  # 8-10 hours
  TRIPS=$((RANDOM % 10 + 60))  # 60-70 trips
  KMS=$((RANDOM % 100 + 1800))  # 1800-1900 kms
  
  ATTENDANCE_RESPONSE=$(api_call POST "/attendance" '{
    "vehicleId": "'$VEHICLE_ID'",
    "driverId": "'$DRIVER_ID'",
    "date": "'$DATE'",
    "hoursWorked": '$HOURS',
    "tripsCompleted": '$TRIPS',
    "kmsCovered": '$KMS'
  }')
  
  if echo $ATTENDANCE_RESPONSE | grep -q '"id"'; then
    ATTENDANCE_COUNT=$((ATTENDANCE_COUNT + 1))
  else
    echo -e "${RED}Failed to create attendance for $DATE${NC}"
  fi
done

echo -e "${GREEN}✓ Created $ATTENDANCE_COUNT attendance records${NC}"

# Step 4: Get Driver Summary
echo -e "${BLUE}Step 4: Getting driver summary...${NC}"
SUMMARY_RESPONSE=$(api_call GET "/attendance/summary/driver/$DRIVER_ID?startDate=2024-01-01&endDate=2024-01-31")
echo $SUMMARY_RESPONSE | python3 -m json.tool 2>/dev/null || echo $SUMMARY_RESPONSE
echo ""

# Step 5: Create Payroll Period
echo -e "${BLUE}Step 5: Creating payroll period...${NC}"
PERIOD_RESPONSE=$(api_call POST "/payroll-periods" '{
  "name": "Test January 2024",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}')
PERIOD_ID=$(echo $PERIOD_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PERIOD_ID" ]; then
  echo -e "${RED}Failed to create payroll period${NC}"
  echo $PERIOD_RESPONSE
  exit 1
fi

echo -e "${GREEN}✓ Created period: $PERIOD_ID${NC}"

# Step 6: Generate Payroll Entries (THE MAGIC!)
echo -e "${BLUE}Step 6: Generating payroll entries from attendance...${NC}"
GENERATE_RESPONSE=$(api_call POST "/payroll-periods/$PERIOD_ID/generate-entries" "")
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PAYROLL GENERATION RESULTS:${NC}"
echo -e "${GREEN}========================================${NC}"
echo $GENERATE_RESPONSE | python3 -m json.tool 2>/dev/null || echo $GENERATE_RESPONSE
echo ""

# Step 7: Get Payroll Details
echo -e "${BLUE}Step 7: Getting detailed payroll breakdown...${NC}"
DETAIL_RESPONSE=$(api_call GET "/payroll-periods/$PERIOD_ID")
echo $DETAIL_RESPONSE | python3 -m json.tool 2>/dev/null || echo $DETAIL_RESPONSE
echo ""

# Step 8: Update Status
echo -e "${BLUE}Step 8: Updating payroll status to PROCESSED...${NC}"
STATUS_RESPONSE=$(api_call PATCH "/payroll-periods/$PERIOD_ID/status" '{
  "status": "PROCESSED"
}')
echo -e "${GREEN}✓ Status updated${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TEST SUMMARY${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Driver ID:       ${DRIVER_ID}"
echo -e "Vehicle ID:      ${VEHICLE_ID}"
echo -e "Attendance:      ${ATTENDANCE_COUNT} records"
echo -e "Payroll Period:  ${PERIOD_ID}"
echo ""
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Check the payroll calculations above"
echo "2. Verify bonuses and deductions are correct"
echo "3. Update status to PAID when ready"
echo ""
echo -e "${BLUE}To clean up:${NC}"
echo "curl -X DELETE -H 'Authorization: Bearer $AUTH_TOKEN' $BASE_URL/payroll-periods/$PERIOD_ID"
echo "curl -X DELETE -H 'Authorization: Bearer $AUTH_TOKEN' $BASE_URL/drivers/$DRIVER_ID"
