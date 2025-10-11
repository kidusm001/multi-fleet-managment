# Active Organization Fix - Role System Resolution

## Problem Summary
Users were stuck with "employee" role regardless of their actual organization membership role (owner/admin/manager/driver).

## Root Cause Analysis

### Better Auth Organization Plugin Behavior
1. **Default State**: When a user logs in, `session.activeOrganizationId` is `null` by default
2. **getActiveMember() Requirement**: This API call **ONLY** works when `session.activeOrganizationId` is set
3. **Session Sync Issue**: After calling `setActive()`, the server updates the session, but the **client-side session cache doesn't automatically refresh**

### The Chain of Failure
```
1. User logs in → session.activeOrganizationId = null
2. OrganizationGuard auto-sets first org → calls setActive(orgId)
3. Server updates session.activeOrganizationId ✅
4. Client session cache still has null ❌
5. RoleContext calls getActiveMember() → returns null (no active org in client cache)
6. Role fallback to EMPLOYEE
```

## The Fix

### 1. Force Session Refresh After setActive()
**File**: `packages/client/src/contexts/OrganizationContext/index.tsx`

```typescript
const setActiveOrganization = async (organizationId: string) => {
  const result = await authClient.organization.setActive({ organizationId });
  
  if (result.error) {
    throw new Error(result.error.message);
  }
  
  // CRITICAL: Force session refresh to update activeOrganizationId in client
  await authClient.$fetch('/api/auth/get-session', {
    method: 'GET',
    credentials: 'include'
  });
  
  // Small delay for React Query cache to update
  await new Promise(resolve => setTimeout(resolve, 150));
};
```

### 2. Use getActiveMemberRole() API
**File**: `packages/client/src/contexts/RoleContext/index.jsx`

**Change**: Use the more efficient `getActiveMemberRole()` API instead of `getActiveMember()`
```javascript
// BEFORE: Gets full member object
const { data, error } = await authClient.organization.getActiveMember();

// AFTER: Gets just the role (more efficient)
const { data, error } = await authClient.organization.getActiveMemberRole();
```

## Testing Steps

### 1. Restart Dev Server
```bash
pnpm dev
```

### 2. Clear Browser Storage
- Open DevTools → Application → Storage
- Clear all cookies, localStorage, sessionStorage
- Or use incognito/private window

### 3. Test Owner Account
Login: `robert.sterling@fleetmanager.com`

**Expected Console Output:**
```
🔧 OrganizationGuard: Auto-setting first organization: { firstOrgId: "...", firstOrgName: "..." }
🔄 Setting active organization: org_123
✅ Active organization set successfully
🔄 Refreshing session to sync activeOrganizationId...
✅ Session refreshed successfully
🔍 Fetching active member with: { organizationId: "org_123", ... }
✅ Active member fetched successfully: { role: "owner", ... }
Role Context State: { effectiveRole: "owner", ... }
```

**Socket Connection:**
```
[Socket] Client connected: ..., user: robert.sterling@fleetmanager.com, global role: user, org role: owner
```

### 4. Test All Roles
- Owner: `robert.sterling@fleetmanager.com`
- Admin: `jennifer.thompson@fleetmanager.com`
- Manager: `mike.rodriguez@fleetmanager.com`
- Driver: Test driver accounts
- Employee: Test employee accounts

## Verification Checklist

✅ **OrganizationGuard Auto-Set**
- Should see: `🔧 OrganizationGuard: Auto-setting first organization`
- Should see: `✅ OrganizationGuard: Successfully auto-set organization`

✅ **Session Refresh**
- Should see: `🔄 Refreshing session to sync activeOrganizationId...`
- Should see: `✅ Session refreshed successfully`

✅ **Member Fetch**
- Should see: `🔍 Fetching active member with: { organizationId: "..." }`
- Should see: `✅ Active member fetched successfully: { role: "owner" }`
- Should NOT see: `⚠️ No active member data returned`

✅ **Role Calculation**
- Should see: `Role Context State: { effectiveRole: "owner" }` (not "employee")
- Socket log should show correct `org role: owner` (not "member")

## Common Issues & Solutions

### Issue: Still showing "employee" role
**Solution**: 
1. Ensure OrganizationGuard is wrapping your routes in App.jsx
2. Check browser console for session refresh logs
3. Verify network tab shows `/api/auth/get-session` call after setActive
4. Clear browser storage completely

### Issue: "No active organization found" in logs
**Solution**:
1. Check user has organization membership in database:
   ```sql
   SELECT * FROM member WHERE userId = 'user_id';
   ```
2. Verify OrganizationGuard is triggering auto-set
3. Check console for `🔧 OrganizationGuard: Auto-setting` message

### Issue: Session refresh not working
**Solution**:
1. Check network tab for `/api/auth/get-session` request
2. Verify response includes `activeOrganizationId` field
3. Check Better Auth session cookie is being sent with requests

## Technical Documentation

### Better Auth Organization Plugin
- **Docs**: https://www.better-auth.com/docs/plugins/organization#get-active-member
- **Key Concept**: `getActiveMember()` is session-dependent
- **Requirement**: `session.activeOrganizationId` must be set
- **Default**: activeOrganizationId is `null` on login

### Session Flow
1. Login → session created with `activeOrganizationId: null`
2. setActive(orgId) → server updates session
3. **Manual refresh required** → client fetch `/api/auth/get-session`
4. React Query cache updates → hooks re-evaluate
5. getActiveMember() → now returns correct member with role

### Role Calculation Priority
```javascript
effectiveRole = manualRole ?? memberRole ?? userRole ?? EMPLOYEE
```

Where:
- `manualRole`: Temporary override (admin impersonation)
- `memberRole`: From organization membership (via getActiveMember)
- `userRole`: Global user.role field (superadmin only)
- `EMPLOYEE`: Default fallback

## Files Changed

1. `/packages/client/src/contexts/OrganizationContext/index.tsx`
   - Added session refresh after setActive()
   - Enhanced logging

2. `/packages/client/src/contexts/RoleContext/index.jsx`
   - Enhanced warning messages
   - Added session state debugging

3. `/packages/client/src/components/OrganizationGuard.tsx`
   - Already had auto-set logic with logging

## Prevention

To prevent this issue in future:
1. Always call session refresh after Better Auth state changes
2. Use debug logging to track session state
3. Document session-dependent APIs clearly
4. Add TypeScript types for session fields
5. Consider using Better Auth hooks with proper cache invalidation

## Related Issues
- Server logs showing "No active organization found"
- Socket connections showing generic "member" role instead of actual role
- UI role badges showing "employee" for all users
- 400 errors on notification endpoints (due to missing org context)
