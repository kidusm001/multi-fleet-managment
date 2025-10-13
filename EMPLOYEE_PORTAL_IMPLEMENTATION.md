# Employee Portal and Member Management Implementation Summary

## ✅ Completed Features

### 1. Employee Portal (Desktop/Responsive)
Created a complete Employee Portal at `/employee-portal` with:

**Files Created:**
- `/packages/client/src/pages/EmployeePortal/index.jsx` - Main portal router
- `/packages/client/src/pages/EmployeePortal/EmployeePortalLayout.jsx` - Tabbed layout component
- `/packages/client/src/pages/EmployeePortal/views/Dashboard.jsx` - Dashboard view (reuses main Dashboard)
- `/packages/client/src/pages/EmployeePortal/views/Request.jsx` - Shuttle request form and history

**Features Implemented:**
- ✅ Tab navigation between Dashboard and Request views
- ✅ Dashboard view (existing dashboard component)
- ✅ Request shuttle service form with:
  - Date picker for request date
  - Shift selection dropdown
  - Pickup location input
  - Optional notes field
  - Submit button with loading states
- ✅ Request history display showing:
  - Request date
  - Shift information
  - Pickup location
  - Status badges (Pending/Approved/Rejected)
  - Notes if provided

**Navigation Updates:**
- ✅ Updated `nav-config.ts` to include Employee navigation items
- ✅ Added `EMPLOYEE_PORTAL` route to constants
- ✅ Updated Home page routing logic for employees
- ✅ Updated App.jsx with Employee Portal route
- ✅ Employees auto-redirect to `/employee-portal` on login

### 2. Routing Configuration
- ✅ Employee role gets Dashboard and Request navigation items
- ✅ Employees can access their portal without needing active organization
- ✅ Auto-navigation logic updated in Home component

## 🔧 Backend API Requirements (To Be Implemented)

### Shuttle Request Endpoints
The Request view expects these endpoints:

1. **GET `/api/shuttle-requests/my-requests`**
   - Returns employee's shuttle request history
   - Response: `{ data: [{ id, date, shiftId, shift: {name}, pickupLocation, notes, status }] }`

2. **POST `/api/shuttle-requests`**
   - Creates new shuttle request
   - Body: `{ date, shiftId, pickupLocation, notes? }`
   - Response: `{ success: true, data: {...} }`

3. **GET `/api/shifts`**
   - Returns available shifts for selection
   - Response: `{ data: [{ id, name, startTime, endTime }] }`

### Database Schema Addition Required
You may need to add a `ShuttleRequest` or `CommuteRequest` table:

```prisma
model ShuttleRequest {
  id             String   @id @default(cuid())
  employeeId     String
  date           DateTime
  shiftId        String
  pickupLocation String
  notes          String?
  status         RequestStatus @default(PENDING) // PENDING, APPROVED, REJECTED
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  employee       Employee     @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  shift          Shift        @relation(fields: [shiftId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([employeeId])
  @@index([organizationId])
  @@index([status])
  @@map("shuttle_requests")
}

enum RequestStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## 📋 TODO: Member Management Modals

### Required Implementations

#### 1. Edit Role Modal (Replace browser prompt)
Location: `OrganizationSelection/index.jsx`

**Current Implementation:**
```javascript
// Uses browser prompt - needs replacement
const newRole = prompt(`Change role for ${member.user.name}:`, member.role);
```

**What's Needed:**
Create a modal component similar to `UserFormDialog.jsx` with:
- Role dropdown (admin, manager, employee, etc.)
- For employee role: Add shift selection dropdown (REQUIRED)
- For employee role: Add active status toggle (default: true)
- Confirmation buttons
- Proper error handling

#### 2. Delete Member Modal (Replace browser confirm)
Location: `OrganizationSelection/index.jsx`

**Current Implementation:**
```javascript
// Uses browser confirm - needs replacement
if (confirm(`Remove ${member.user.name} from this organization?`)) {
  // delete logic
}
```

**What's Needed:**
Create a modal component similar to `UserActionDialog.jsx` with:
- Warning message with member name
- Consequences explanation
- Cancel and Confirm buttons
- Proper styling (red for destructive action)

#### 3. Add Member Modal Enhancement
When adding a member with employee role:
- **Show shift selection** (REQUIRED field)
- **Show active status toggle** (default: true)
- Update backend call to include: `{ role, shiftId?, isActive? }`
- Ensure employee is automatically included in route creation data

#### 4. Edit Member Modal Enhancement
When editing an employee member:
- **Show shift selection** (REQUIRED field, pre-filled with current)
- **Show active status toggle** (pre-filled with current)
- Update backend call to include: `{ role, shiftId?, isActive? }`
- Ensure route creation data stays synced

### Implementation Files to Create

```
packages/client/src/pages/OrganizationSelection/components/
├── MemberEditRoleModal.jsx      # Edit role with employee fields
├── MemberDeleteModal.jsx         # Delete confirmation
├── MemberFormModal.jsx           # Shared form for add/edit
└── index.js                      # Export all modals
```

### Backend API Requirements for Members

1. **Update Member Role:**
   ```
   PATCH /api/organization/members/:memberId/role
   Body: { 
     role: string,
     shiftId?: string,    // If role is employee
     isActive?: boolean   // If role is employee
   }
   ```

2. **Get Shifts for Selection:**
   ```
   GET /api/shifts
   Response: [{ id, name, startTime, endTime }]
   ```

3. **Sync Employee Data:**
   - When member role changes to employee, create Employee record if needed
   - When shift/active status changes, update Employee record
   - Ensure Employee is included in route assignment queries based on isActive

## 🎨 Modal Component Examples

### Edit Role Modal Structure
```jsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Change Member Role</DialogTitle>
      <DialogDescription>
        Update role and settings for {member.user.name}
      </DialogDescription>
    </DialogHeader>
    
    <form onSubmit={handleSubmit}>
      <Select value={role} onValueChange={setRole}>
        {/* Role options */}
      </Select>
      
      {role === 'employee' && (
        <>
          <Select value={shiftId} onValueChange={setShiftId} required>
            {/* Shift options */}
          </Select>
          
          <Switch checked={isActive} onCheckedChange={setIsActive}>
            Active Employee
          </Switch>
        </>
      )}
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Delete Member Modal Structure
```jsx
<AlertDialog open={isOpen} onOpenChange={onClose}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove Member</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to remove {member.user.name} from this organization?
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-red-600">
        Remove Member
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 🔍 Finding Member Management Code

Search for these patterns in `OrganizationSelection/index.jsx`:
- `prompt(` - Edit role functionality
- `confirm(` - Delete member functionality  
- `addMember` - Add member functionality
- `org.members` - Member list rendering

## 📝 Testing Checklist

### Employee Portal
- [ ] Employee can log in and auto-navigate to portal
- [ ] Dashboard tab works correctly
- [ ] Request tab loads shifts from API
- [ ] Can submit shuttle request with all fields
- [ ] Request history displays correctly
- [ ] Status badges show proper colors
- [ ] Form validation works (date, shift, location required)
- [ ] Loading states display during submission
- [ ] Error messages show for API failures

### Member Management Modals
- [ ] Edit role modal opens instead of browser prompt
- [ ] Shift selection shows when role is employee
- [ ] Active status toggle works
- [ ] Delete modal opens instead of browser confirm
- [ ] Delete modal has destructive styling
- [ ] Employee data syncs with role changes
- [ ] Employees appear in route creation when active

## 🚀 Next Steps

1. **Implement Backend APIs** for shuttle requests
2. **Create Member Management Modals** to replace browser dialogs
3. **Test Employee Portal** end-to-end flow
4. **Test Member Management** with employee role changes
5. **Verify Route Creation** includes active employees

## 📚 Reference Components

Look at these existing components for patterns:
- `UserFormDialog.jsx` - Form modal with role selection
- `UserActionDialog.jsx` - Confirmation modal with variants
- `UserDeleteDialog.jsx` - Destructive action confirmation
- `EmployeeManagement/` - Employee-specific forms and validation
