# Role System Debugging Guide

## Issue
Users are showing as "employee" instead of their proper organization roles (owner, admin, manager, driver).

## Root Cause Analysis

### Better Auth Organization Plugin
According to the Better Auth documentation, the `getActiveMember()` method should return the user's membership in the active organization with their role.

### Expected Behavior
1. User logs in → session created
2. User selects/has active organization → `activeOrganizationId` set in session
3. `getActiveMember()` returns member object with:
   - `userId`: User's ID
   - `organizationId`: Organization ID
   - `role`: Organization role (owner, admin, manager, driver, employee)

### Role Hierarchy
- **SUPERADMIN** (us) - Platform-level access, not org-specific
- **OWNER** - Full access + can delete organization
- **ADMIN** - Full admin interface within organization
- **MANAGER** - Manage operations (routes, vehicles, employees)
- **DRIVER** - Driver portal only (mobile-optimized)
- **EMPLOYEE** - Dashboard view only

## Debug Changes Made

### 1. Enhanced Logging in RoleContext
Added comprehensive console logging to trace:
- When active member is fetched
- Organization ID being used
- Member data structure
- Role normalization process
- Final effective role calculation

### 2. Debug Output to Monitor

Open browser console and look for these logs:

#### When Fetching Member:
```
Fetching active member with: {
  organizationId: "...",
  sessionActiveOrganizationId: "...",
  activeOrganizationId: "...",
  userId: "..."
}
```

#### On Success:
```
✅ Active member fetched successfully: {
  userId: "...",
  organizationId: "...",
  role: "admin" | "owner" | "manager" | "driver" | "employee",
  fullData: { ... }
}
```

#### On Failure:
```
❌ Failed to fetch active member: { error details }
```
or
```
⚠️ No active member data returned - this might mean the user is not a member of any organization
```

#### Role State:
```
Role Context State: {
  userRole: "user",           // From session.user.role (platform role)
  memberRole: "admin",        // From activeMember.role (org role)
  manualRole: null,           // Override if set
  effectiveRole: "admin",     // Final role used (priority: manual > member > user > employee)
  activeMember: { ... },
  sessionUserRole: "user",
  isReady: true
}
```

## How to Test

### 1. Login as Different Roles

Test with these accounts (see createUsers.ts for full list):

**Owner:**
```
email: robert.sterling@fleetmanager.com
password: Owner123!
organization: Sterling Logistics Solutions
expected role: OWNER
```

**Admin:**
```
email: john.mitchell@fleetmanager.com
password: AdminFleet123!
organization: Sterling Logistics Solutions
expected role: ADMIN
```

**Manager:**
```
email: mike.rodriguez@fleetmanager.com
password: Manager123!
organization: Sterling Logistics Solutions
expected role: MANAGER
```

**Driver:**
```
email: robert.johnson@fleetmanager.com
password: Driver123!
organization: Sterling Logistics Solutions
expected role: DRIVER
```

**Employee:**
```
email: james.brown@fleetmanager.com
password: User123!
organization: Sterling Logistics Solutions
expected role: EMPLOYEE
```

### 2. Check Console Output

1. Open browser DevTools (F12)
2. Go to Console tab
3. Login with one of the accounts above
4. Look for the debug logs
5. Verify:
   - Active organization is set
   - Member data is fetched
   - Role is correctly assigned

### 3. What to Look For

#### ✅ Correct Behavior:
- `getActiveMember()` returns data with correct `role` field
- `memberRole` matches expected organization role
- `effectiveRole` uses `memberRole` (not defaulting to EMPLOYEE)
- UI shows correct navigation/access

#### ❌ Problem Indicators:
- `getActiveMember()` returns null/error
- `memberRole` is null (falls back to userRole "user")
- `effectiveRole` defaults to EMPLOYEE
- All users see same interface

## Potential Issues

### Issue 1: No Active Organization
**Symptom:** `organizationId` is undefined/null
**Fix:** Ensure user selects an organization after login

### Issue 2: Member Not Found
**Symptom:** `getActiveMember()` returns null despite active org
**Fix:** Check database - user must have a record in `member` table with correct `organizationId` and `role`

### Issue 3: Role Not Normalized
**Symptom:** `activeMember.role` has value but `memberRole` is null
**Fix:** Check ROLE_NORMALIZATION map - ensure the role string is recognized

### Issue 4: Better Auth API Issue
**Symptom:** Error from `getActiveMember()` API call
**Fix:** Check network tab - verify endpoint `/api/auth/organization/get-active-member` returns proper data

## Database Verification

Run this SQL to check a user's organization membership:

```sql
SELECT 
  u.email,
  u.name as user_name,
  m.role as org_role,
  o.name as org_name,
  o.id as org_id
FROM "user" u
JOIN "member" m ON m."userId" = u.id
JOIN "organization" o ON o.id = m."organizationId"
WHERE u.email = 'robert.sterling@fleetmanager.com';
```

Expected result:
| email | user_name | org_role | org_name | org_id |
|-------|-----------|----------|----------|--------|
| robert.sterling@fleetmanager.com | Robert Sterling | owner | Sterling Logistics Solutions | ... |

## Next Steps

1. **Run the app** with debug logging
2. **Login** as different role users
3. **Check console** for the debug output
4. **Identify** which step is failing:
   - Organization selection?
   - Member fetch?
   - Role normalization?
   - Role application?
5. **Report findings** with console logs and screenshots

## Files Modified

- `packages/client/src/contexts/RoleContext/index.jsx` - Added debug logging
- `packages/server/src/app.ts` - Fixed path-to-regexp wildcard issue

## References

- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization#get-active-member)
- [Better Auth React Hooks](https://www.better-auth.com/docs/react)
