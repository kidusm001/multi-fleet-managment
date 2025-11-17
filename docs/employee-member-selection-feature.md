# Employee Member Selection Feature

## Overview
Enhanced the employee creation form to allow selecting from existing organization members to auto-fill employee information. This streamlines the process of adding employees by leveraging existing member data.

## Changes Made

### 1. SingleEmployeeForm Component
**File**: `packages/client/src/pages/Settings/components/EmployeeManagement/components/SingleEmployeeForm.jsx`

**Changes**:
- Added `Users` icon import from lucide-react
- Added new props: `members`, `locations`, `onMemberSelect`
- Added member selection dropdown at the top of the form (required)
- Added work location selection dropdown
- Member dropdown displays:
  - Member name (primary display)
  - Email address (secondary display, if different from name)
- Location dropdown displays:
  - Location name (primary display)
  - Address (secondary display, if available)
  - "No Work Location" option for none
- Renamed "Location" field to "Home Address" for clarity
- Styled with appropriate dark/light mode support
- Shows helpful hint text about what will be auto-filled

### 2. EmployeeUploadSection Component
**File**: `packages/client/src/pages/Settings/components/EmployeeManagement/EmployeeUploadSection.jsx`

**Changes**:
- Imported `useOrganizations` hook from OrganizationContext
- Imported `locationService` to fetch work locations
- Added `locations` state to store available work locations
- Modified initial data fetch to load departments, shifts, locations, and members
- Created `handleMemberSelect` callback that:
  - Extracts user data from Better Auth member object
  - Auto-fills: name, email, and phone (if available)
  - Preserves existing: department, shift, location, locationId
  - Shows success toast with instructions
  - Validates the auto-filled email
- Updated submit handler to include `locationId` in the payload
- Passed `members`, `locations`, and `onMemberSelect` props to SingleEmployeeForm

## User Flow

1. **Navigate to Settings → Employee Management → Add Single tab**
2. **Select Member (Required)**:
   - User sees a dropdown with all organization members
   - Each member shows their name and email
   - Selecting a member auto-fills their information
   - **This is required** because the API needs a userId from the member
3. **Auto-filled Fields**:
   - Name (from member.user.name or derived from email)
   - Email (from member.user.email or member.userId)
   - Phone (if available in member data)
   - UserId (internal - extracted from selected member)
4. **Manual Entry Required**:
   - Department (required)
   - Shift (required)
   - Work Location (optional - select from organization locations)
   - Home Address (required with coordinates via map picker)
5. **Submit**: Create employee with combined member + manual data
   - API receives: name, location, departmentId, shiftId, userId, stopId (null), locationId (selected or null)

## Data Extraction Strategy

The implementation intelligently extracts data from the Better Auth member object:

```javascript
const memberUser = selectedMember.user || {};
const memberName = memberUser.name || 
                  selectedMember.name || 
                  memberUser.email?.split('@')[0]?.replace(/[._-]/g, ' ') || 
                  selectedMember.userId?.split('@')[0]?.replace(/[._-]/g, ' ') || 
                  '';

const memberEmail = memberUser.email || 
                   selectedMember.email || 
                   (selectedMember.userId?.includes('@') ? selectedMember.userId : '');
```

This fallback chain ensures data is extracted even when member structure varies.

## Benefits

1. **Reduced Data Entry**: No need to manually type name and email for existing members
2. **Accuracy**: Uses verified member data from the organization
3. **Required User Association**: Ensures employees are always linked to valid organization members
4. **User-Friendly**: Clear visual feedback and instructions
5. **Validation**: Auto-filled data is still validated before submission
6. **API Compliance**: Properly formats data with required fields (userId, stopId, locationId)

## Technical Details

### Member Data Structure
```typescript
interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  user?: {
    id: string;      // The actual user ID we need
    name?: string;
    email?: string;
    phone?: string;
    image?: string;
  };
  name?: string;  // Sometimes directly on member
  email?: string; // Sometimes directly on member
}
```

### API Requirements
The employee creation API expects:
```typescript
{
  name: string;
  location: string | null;
  departmentId: string;  // CUID
  shiftId: string;       // CUID
  userId: string;        // Required - from member.userId or member.user.id
  stopId: string | null; // CUID or null
  locationId: string | null; // CUID or null
}
```

### Integration Points
- **Organization Context**: Loads members via `loadMembers()` function
- **Better Auth**: Member data comes from Better Auth organization plugin
- **Form State**: Member selection updates `singleEmployee` state
- **Validation**: Email validation runs on auto-filled data

## Future Enhancements

Potential improvements:
1. Add phone number extraction if available in member data
2. Show member role badge in dropdown
3. Filter members by role (e.g., only show 'employee' role members)
4. Add search/filter in member dropdown for large organizations
5. Cache member data to reduce API calls
6. Pre-populate location if member has a known location

## Testing Checklist

- [ ] Member dropdown displays all organization members
- [ ] Selecting a member auto-fills name and email
- [ ] Email validation works on auto-filled data
- [ ] "None" option clears member selection
- [ ] Manual entry still works when no member selected
- [ ] Department, shift, location remain manual entry
- [ ] Form submission works with member-selected data
- [ ] Dark mode styling is correct
- [ ] Success toast appears with clear instructions
- [ ] No console errors or warnings
