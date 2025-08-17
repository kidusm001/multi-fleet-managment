# Employee Management System

## Overview
The Employee Management System is a comprehensive solution for managing employee recruitment, review, and administration. It supports three distinct roles (Recruiter, Manager, and Admin) with specific responsibilities and access levels.

## Roles and Responsibilities

### Recruiter
- Upload candidate batches via CSV or manual entry
- Preview and edit candidate information before submission
- View batch history and download review results
- Track candidate status through the review process

### Manager
- Review candidate batches
- Approve or deny candidate locations
- View batch history and statistics
- Access detailed candidate information

### Admin
- All Manager permissions
- Manage employee records
- Deactivate employees
- Access system-wide statistics

## Features and Workflows

### 1. Candidate Upload (Recruiter)
#### CSV Upload
- Support for CSV/Excel file upload
- Required fields: Name, Contact, Email, Department, Location
- Real-time validation of data format
- Duplicate detection

#### Manual Entry
- Tab-separated data paste support
- Real-time preview of entered data
- Validation for phone numbers and email formats

#### Preview and Edit
- Review candidates before submission
- Edit individual candidate details
- Remove candidates from batch
- Validate Ethiopian phone numbers
- Check for duplicates

### 2. Batch Management
#### Batch Organization
- Smart sorting algorithm:
  1. Batches needing review (edited batches)
  2. Unreviewed batches
  3. Recently reviewed batches
  4. Recently submitted batches

#### Batch Status States
- **Preview Stage**:
  - New: Initial state
  - Duplicate: Detected duplicate entry
- **Post-Upload Stage**:
  - Pending Review: Awaiting manager review
  - Approved: Location approved by manager
  - Denied: Location denied by manager

#### Visual Indicators
- Color-coded status badges
- Background highlights for status
- Animation effects for items needing attention
- Clear timestamps for all actions

### 3. Review Process (Manager/Admin)
#### Batch Review
- Bulk selection of candidates
- Individual candidate review
- Approve/Deny with single action
- Review history tracking

#### Review Interface
- Detailed candidate information
- Status tracking
- Edit history
- Review comments

### 4. Employee Management (Admin)
#### Employee List
- Comprehensive employee details
- Status tracking
- Location assignment
- Shuttle route assignment
- Deactivation capability

#### Employee Status
- Active/Inactive status
- Assignment status
- Location status
- Department tracking

### 5. Statistics and Reporting
- Total candidates/employees
- Approval rates
- Location distribution
- Assignment statistics
- Batch processing metrics

## Technical Implementation

### Status Flow
```
Upload Stage:
[File Upload/Manual Entry] -> Preview -> Validation -> Batch Creation

Review Stage:
Pending Review -> Manager Review -> Approved/Denied

Employee Stage:
Approved -> Active Employee -> Assigned/Unassigned
```

### Manager/Admin Review Interface
#### Batch List View
- Smart sorting prioritization:
  1. Pending batches (orange background highlight)
  2. Recently edited batches needing review
  3. Reviewed batches (with green status indicator)
  4. Older batches

#### Review Actions
- "Review" button for pending batches
- Disabled actions after review submission
- No edit option for reviewed batches
- Bulk approve/deny functionality
- Clear visual feedback for selected candidates

#### Status Indicators
- Pending: Orange background with attention-grabbing style
- Reviewed: Green background with success indicator
- Needs Review: Amber background with warning indicator
- Review in Progress: Blue background with active indicator

#### Visual Hierarchy
- Prominent batch status badges
- Clear submission timestamps
- Edit history when applicable
- Review counts and statistics
- Candidate count per batch

### Data Validation
- Ethiopian phone number format
- Email format
- Required fields
- Duplicate detection
- Location validation

### Security
- Role-based access control
- Action audit logging
- Status change tracking
- Edit history maintenance

### UI/UX Considerations
- Consistent color coding
- Status-based styling
- Clear visual hierarchy
- Responsive feedback
- Intuitive batch organization
- Dark mode support throughout all components
- Pagination for batches (5 per page) and employees (10 per page)
- Accessible color schemes for status indicators

### Error Handling
- Validation feedback for file uploads
- Duplicate entry detection and resolution
- Network error recovery
- Invalid data format handling
- Session timeout management
- Batch processing error recovery

### Performance Considerations
- Optimized batch loading with pagination
- Efficient status updates
- Responsive search and filtering
- Cached batch history
- Optimized CSV processing for large files

## For Backend Developers

### Database Schema
```sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    contact VARCHAR(100),
    email VARCHAR(255),
    department VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(50),  -- ENUM: 'PENDING', 'APPROVED', 'DENIED'
    batch_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    reviewed_by UUID,    -- Reference to manager who reviewed
    review_date TIMESTAMP
);

CREATE TABLE candidate_duplicates (
    id UUID PRIMARY KEY,
    candidate_id UUID,
    duplicate_info TEXT,
    detected_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_note TEXT
);

CREATE TABLE batch_history (
    id UUID PRIMARY KEY,
    batch_id UUID,
    action VARCHAR(50),  -- ENUM: 'CREATED', 'EDITED', 'REVIEWED'
    action_by UUID,
    action_at TIMESTAMP,
    details JSONB        -- Store additional action details
);
```

### API Endpoints
```
Batch Management:
POST   /api/batches                    - Create new batch
GET    /api/batches                    - List all batches
GET    /api/batches/{id}               - Get batch details
PUT    /api/batches/{id}/review        - Submit batch review
GET    /api/batches/{id}/history       - Get batch history

Candidate Management:
POST   /api/candidates/check-duplicates - Check for duplicates
POST   /api/candidates/batch           - Upload candidate batch
PUT    /api/candidates/{id}/status     - Update candidate status
GET    /api/candidates/search          - Search candidates

Employee Management:
GET    /api/employees                  - List employees
PUT    /api/employees/{id}/deactivate  - Deactivate employee
PUT    /api/employees/{id}/assign      - Assign to shuttle route
```

### Batch History Tracking
- Track all batch-level actions:
  ```json
  {
    "action": "REVIEWED",
    "timestamp": "2024-01-06T12:00:00Z",
    "actor": "manager_id",
    "details": {
      "approved_count": 10,
      "denied_count": 2,
      "notes": "Location verification complete"
    }
  }
  ```

### Validation Rules
- Preview stage:
  - Validate required fields
  - Check for duplicates before allowing upload
  - Validate phone number format (Ethiopian)
  - Validate email format
- Batch stage:
  - Status can only be updated by authorized managers
  - Status changes must be logged for audit purposes
  - Only valid status transitions are allowed
  - No modifications after review submission

### Business Logic
- Preview stage:
  - Duplicate detection runs in real-time
  - All validations must pass before upload
- Batch stage:
  - Status updates trigger notifications
  - Batch approval/denial is atomic
  - Historical status changes are tracked
  - Review decisions are final

### Security Considerations
- Role-based access for status changes
- Audit logging for all status updates
- Validation of status transition rules
- Separate permissions for preview vs batch management
- Prevent unauthorized batch modifications
- Track all user actions

## Future Enhancements
1. Advanced search and filtering
2. Batch templates
3. Automated location suggestions
4. Integration with HR systems
5. Advanced reporting features
6. Mobile app support 