# Testing Organization Role-Based Notifications Fix

## Issue Fixed
Notifications were only appearing for organization owners, not admins, despite both roles being targeted.

**Root Cause:** Socket.IO room assignment used global user role (`user`) instead of organization member role (`owner`, `admin`, `member`).

## Changes Made

### `/packages/server/src/lib/socket.ts`

1. **Added import:**
   - Import `getUserOrganizationRole` helper from `./auth/organizationRole`

2. **Updated connection handler (line 70-85):**
   - Now uses `await getUserOrganizationRole()` to get organization-specific role
   - Joins `role:{orgRole}` room instead of `role:{globalRole}`
   - Enhanced logging to show both global and org roles

3. **Updated subscribe-role handler (line 87-99):**
   - Validates against organization role instead of global role

4. **Added organization:switched event handler (line 129-148):**
   - Leaves old role room when switching organizations
   - Joins new role room based on new organization membership
   - Updates org room subscription

## Testing Steps

### Setup
1. Create test users with different roles:
   - User A: Owner of Org 1
   - User B: Admin of Org 1 
   - User C: Member of Org 1

### Test 1: Vehicle Creation Notification
1. Log in as User B (admin)
2. Open notifications panel
3. As User A (owner), create a new vehicle
4. **Expected:** Both User A and User B receive notification
5. **Expected:** User C does NOT receive notification

### Test 2: Vehicle Status Update (Critical)
1. As User A (owner), change vehicle status to OUT_OF_SERVICE
2. **Expected:** Both User A and User B receive CRITICAL notification
3. **Expected:** User C does NOT receive notification

### Test 3: Organization Switching
1. Create Org 2 where User B is a member (not admin)
2. User B switches from Org 1 to Org 2
3. As owner of Org 2, create a vehicle
4. **Expected:** User B does NOT receive notification (member role)
5. User B switches back to Org 1
6. As User A, create another vehicle in Org 1
7. **Expected:** User B DOES receive notification (admin role)

### Test 4: Multiple Role Targeting
1. Send notification targeting `['owner', 'admin', 'member']`
2. **Expected:** All three users receive notification

## Verification Checklist

- [ ] Admin users receive notifications when targeted by role
- [ ] Owner users still receive notifications
- [ ] Member users receive appropriate notifications
- [ ] Role-based filtering works correctly
- [ ] Organization switching updates role rooms correctly
- [ ] Console logs show correct org roles
- [ ] No TypeScript errors in socket.ts

## Console Log Examples

**Successful Connection (Admin):**
```
[Socket] Client connected: abc123, user: admin@example.com, global role: user, org role: admin
```

**Organization Switch:**
```
[Socket] User admin@example.com switched to org org-456 with role member
```

## Database Query to Verify Roles

```sql
SELECT 
  u.email,
  m.role as organization_role,
  o.name as organization_name
FROM User u
JOIN Member m ON m.userId = u.id
JOIN Organization o ON o.id = m.organizationId
WHERE u.email IN ('owner@example.com', 'admin@example.com', 'member@example.com');
```
