#!/bin/bash

# Attendance + Payroll System Test Script
# Uses cookie-based authentication (Better Auth)

set -e  # Exit on error

# Configuration
BASE_URL="http://localhost:3000"
COOKIE_FILE="test-cookies.txt"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

# Helper function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Helper function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Helper function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if server is running
print_header "Checking Server Status"
# Try to connect to the server (any endpoint will do, we just check if server responds)
if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/vehicles" | grep -q "[0-9]"; then
    print_error "Server not running at $BASE_URL"
    print_info "Please start the server with: pnpm dev"
    exit 1
fi
print_success "Server is running"

# Step 1: Authenticate
print_header "Step 1: Authentication"

if [ -f "$COOKIE_FILE" ]; then
    print_info "Found existing cookie file"
    # Test if cookie is still valid
    if curl -s -b "$COOKIE_FILE" "$BASE_URL/api/vehicles" | grep -q "id"; then
        print_success "Existing session is valid"
    else
        print_info "Session expired, need to re-authenticate"
        rm "$COOKIE_FILE"
    fi
fi

if [ ! -f "$COOKIE_FILE" ]; then
    print_info "Signing in..."
    read -p "Enter email: " EMAIL
    read -sp "Enter password: " PASSWORD
    echo
    
    curl -c "$COOKIE_FILE" -X POST "$BASE_URL/api/auth/sign-in/email" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
        -s > /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Signed in successfully"
    else
        print_error "Sign-in failed"
        exit 1
    fi
fi

# Step 2: Create Test Driver
print_header "Step 2: Creating Test Driver"

# First, check if user has an active organization
print_info "Checking active organization..."
ACTIVE_ORG=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/auth/organization/get-full")

if echo "$ACTIVE_ORG" | grep -q '"id"'; then
    ORG_NAME=$(echo "$ACTIVE_ORG" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    print_success "Active organization: $ORG_NAME"
else
    print_info "No active organization set. Getting list of organizations..."
    
    # Get list of organizations using Better Auth endpoint
    ORGS_LIST=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/auth/organization/list")
    
    if echo "$ORGS_LIST" | grep -q '"id"'; then
        # Extract first organization ID
        FIRST_ORG_ID=$(echo "$ORGS_LIST" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        FIRST_ORG_NAME=$(echo "$ORGS_LIST" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        print_info "Setting active organization to: $FIRST_ORG_NAME"
        
        # Set active organization using Better Auth endpoint
        SET_RESULT=$(curl -s -b "$COOKIE_FILE" -c "$COOKIE_FILE" -X POST "$BASE_URL/api/auth/organization/set-active" \
            -H "Content-Type: application/json" \
            -d "{\"organizationId\":\"$FIRST_ORG_ID\"}")
        
        if echo "$SET_RESULT" | grep -q '"id"'; then
            print_success "Active organization set successfully"
        else
            print_error "Failed to set active organization"
            echo "Response: $SET_RESULT"
            exit 1
        fi
    else
        print_error "No organizations found for this user"
        print_info "Debug - Organizations response: $ORGS_LIST"
        print_info "Please create an organization first via the web UI"
        exit 1
    fi
fi

print_info "Creating test driver..."
DRIVER_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/drivers" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Driver John",
        "email": "testdriver'$(date +%s)'@example.com",
        "licenseNumber": "DL'$(date +%s)'",
        "phoneNumber": "+1234567890",
        "experienceYears": 5,
        "baseSalary": 5000,
        "hourlyRate": 30,
        "overtimeRate": 1.5,
        "bankAccountNumber": "1234567890",
        "bankName": "Test Bank"
    }')

DRIVER_ID=$(echo $DRIVER_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DRIVER_ID" ]; then
    print_error "Failed to create driver"
    echo "Response: $DRIVER_RESPONSE"
    exit 1
fi

print_success "Created driver with ID: $DRIVER_ID"

# Step 3: Create Test Vehicle
print_header "Step 3: Creating Test Vehicle"

VEHICLE_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/shuttles" \
    -H "Content-Type: application/json" \
    -d '{
        "plateNumber": "TEST-'$(date +%s)'",
        "model": "Toyota Hiace",
        "make": "Toyota",
        "type": "IN_HOUSE",
        "capacity": 14,
        "year": 2023,
        "status": "AVAILABLE",
        "dailyRate": 300
    }')

VEHICLE_ID=$(echo $VEHICLE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$VEHICLE_ID" ]; then
    print_error "Failed to create vehicle"
    echo "Response: $VEHICLE_RESPONSE"
    exit 1
fi

print_success "Created vehicle with ID: $VEHICLE_ID"

# Step 4: Create Attendance Records
print_header "Step 4: Creating Attendance Records"

ATTENDANCE_DATA='[
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-02",
        "hoursWorked": 8.5,
        "tripsCompleted": 12,
        "kmsCovered": 150
    },
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-03",
        "hoursWorked": 9,
        "tripsCompleted": 14,
        "kmsCovered": 180
    },
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-04",
        "hoursWorked": 8,
        "tripsCompleted": 11,
        "kmsCovered": 140
    },
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-05",
        "hoursWorked": 9.5,
        "tripsCompleted": 15,
        "kmsCovered": 190
    },
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-08",
        "hoursWorked": 8,
        "tripsCompleted": 13,
        "kmsCovered": 160
    },
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-09",
        "hoursWorked": 10,
        "tripsCompleted": 16,
        "kmsCovered": 200
    },
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-10",
        "hoursWorked": 8.5,
        "tripsCompleted": 12,
        "kmsCovered": 155
    },
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-11",
        "hoursWorked": 9,
        "tripsCompleted": 14,
        "kmsCovered": 175
    },
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-12",
        "hoursWorked": 7.5,
        "tripsCompleted": 10,
        "kmsCovered": 130
    },
    {
        "vehicleId": "'$VEHICLE_ID'",
        "driverId": "'$DRIVER_ID'",
        "date": "2024-01-15",
        "hoursWorked": 180,
        "tripsCompleted": 65,
        "kmsCovered": 1900
    }
]'

BULK_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/attendance/bulk" \
    -H "Content-Type: application/json" \
    -d "{\"records\":$ATTENDANCE_DATA}")

if echo "$BULK_RESPONSE" | grep -q "attendance records created"; then
    print_success "Created 10 attendance records"
else
    print_error "Failed to create attendance records"
    echo "Response: $BULK_RESPONSE"
fi

# Step 5: Get Driver Summary
print_header "Step 5: Getting Driver Summary"

SUMMARY=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/attendance/summary/driver/$DRIVER_ID?startDate=2024-01-01&endDate=2024-01-31")

TOTAL_HOURS=$(echo $SUMMARY | grep -o '"totalHours":[0-9.]*' | cut -d':' -f2)
TOTAL_TRIPS=$(echo $SUMMARY | grep -o '"totalTrips":[0-9]*' | cut -d':' -f2)
TOTAL_KMS=$(echo $SUMMARY | grep -o '"totalKms":[0-9.]*' | cut -d':' -f2)

print_success "Driver Summary:"
echo "  Total Hours: $TOTAL_HOURS"
echo "  Total Trips: $TOTAL_TRIPS"
echo "  Total Kms: $TOTAL_KMS"

# Step 6: Create Payroll Period
print_header "Step 6: Creating Payroll Period"

PERIOD_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/payroll-periods" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Period - January 2024",
        "startDate": "2024-01-01",
        "endDate": "2024-01-31"
    }')

PERIOD_ID=$(echo $PERIOD_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PERIOD_ID" ]; then
    print_error "Failed to create payroll period"
    echo "Response: $PERIOD_RESPONSE"
    exit 1
fi

print_success "Created payroll period with ID: $PERIOD_ID"

# Step 7: Generate Payroll Entries (THE MAGIC!)
print_header "Step 7: Generating Payroll Entries"

print_info "Triggering automatic payroll calculation..."

GENERATE_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/api/payroll-periods/$PERIOD_ID/generate-entries")

if echo "$GENERATE_RESPONSE" | grep -q "Generated"; then
    print_success "Payroll entries generated successfully!"
    
    # Extract entry details
    echo -e "\n${YELLOW}Payroll Entry Details:${NC}"
    echo "$GENERATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GENERATE_RESPONSE"
    
else
    print_error "Failed to generate payroll entries"
    echo "Response: $GENERATE_RESPONSE"
fi

# Step 8: Get Payroll Period Details
print_header "Step 8: Getting Payroll Period Details"

PERIOD_DETAILS=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/payroll-periods/$PERIOD_ID")

echo "$PERIOD_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$PERIOD_DETAILS"

# Step 9: Test Entry Adjustment
print_header "Step 9: Testing Entry Adjustment"

# Get the first entry ID from the period
ENTRY_ID=$(echo "$PERIOD_DETAILS" | grep -o '"id":"[^"]*"' | grep -v "$PERIOD_ID" | head -1 | cut -d'"' -f4)

if [ ! -z "$ENTRY_ID" ]; then
    print_info "Adding bonus to entry $ENTRY_ID"
    
    ADJUST_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X PATCH "$BASE_URL/api/payroll-periods/$PERIOD_ID/entries/$ENTRY_ID" \
        -H "Content-Type: application/json" \
        -d '{
            "bonuses": 500
        }')
    
    if echo "$ADJUST_RESPONSE" | grep -q "bonuses"; then
        print_success "Entry adjusted successfully"
    else
        print_error "Failed to adjust entry"
        echo "Response: $ADJUST_RESPONSE"
    fi
else
    print_info "No entries found to adjust"
fi

# Step 10: Update Period Status
print_header "Step 10: Updating Period Status"

STATUS_RESPONSE=$(curl -s -b "$COOKIE_FILE" -X PATCH "$BASE_URL/api/payroll-periods/$PERIOD_ID/status" \
    -H "Content-Type: application/json" \
    -d '{
        "status": "PROCESSED"
    }')

if echo "$STATUS_RESPONSE" | grep -q "PROCESSED"; then
    print_success "Period marked as PROCESSED"
else
    print_error "Failed to update status"
    echo "Response: $STATUS_RESPONSE"
fi

# Summary
print_header "Test Summary"

print_success "All tests completed!"
echo
echo "Test Data Created:"
echo "  Driver ID:  $DRIVER_ID"
echo "  Vehicle ID: $VEHICLE_ID"
echo "  Period ID:  $PERIOD_ID"
echo
print_info "View the payroll period at: $BASE_URL/api/payroll-periods/$PERIOD_ID"
print_info "View driver summary at: $BASE_URL/api/attendance/summary/driver/$DRIVER_ID?startDate=2024-01-01&endDate=2024-01-31"
echo
print_success "Cookie saved to: $COOKIE_FILE (for future requests)"
