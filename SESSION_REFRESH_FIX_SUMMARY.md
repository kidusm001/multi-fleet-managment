# Session Refresh Fix - Complete Summary

## Problem
All users were showing as "employee" role instead of their actual organization roles (owner/admin/manager/driver).

## Root Cause
Better Auth's `getActiveMember()` API requires `session.activeOrganizationId` to be set, but:
1. **Default Behavior**: `activeOrganizationId` is `null` on login
2. **Client-Server Sync Issue**: After calling `setActive()`, the server updates the session, but the client-side session cache doesn't automatically refresh
3. **Result**: `getActiveMember()` returns `null` → role defaults to "employee"

## Solution
Force session refresh after calling `setActive()` to sync the client session cache with the server.

## Files Changed

### 1. OrganizationContext - Core Fix ✅
**File**: `/packages/client/src/contexts/OrganizationContext/index.tsx`

**Change**: Added session refresh after `setActive()` call
```typescript
const setActiveOrganization = async (organizationId: string) => {
  const result = await authClient.organization.setActive({ organizationId });
  
  if (result.error) {
    throw new Error(result.error.message);
  }
  
  // CRITICAL: Force session refresh
  await authClient.$fetch('/api/auth/get-session', {
    method: 'GET',
    credentials: 'include'
  });
  
  await new Promise(resolve => setTimeout(resolve, 150));
};
```

### 2. RoleContext - Enhanced Logging ✅
**File**: `/packages/client/src/contexts/RoleContext/index.jsx`

**Change**: Use `getActiveMemberRole()` API instead of `getActiveMember()` for efficiency
```javascript
// BEFORE: Full member object
const { data, error } = await authClient.organization.getActiveMember();

// AFTER: Just the role
const { data, error } = await authClient.organization.getActiveMemberRole();
```

### 3. OrganizationSelection Page ✅
**File**: `/packages/client/src/pages/OrganizationSelection/index.jsx`

**Before**:
```javascript
await authClient.organization.setActive({ organizationId: org.id });
```

**After**:
```javascript
// Use OrganizationContext method which handles session refresh
await setActiveOrgContext(org.id);
```

### 4. OrganizationSwitcher Component ✅
**File**: `/packages/client/src/components/Common/Organizations/OrganizationSwitcher.jsx`

**Before**:
```javascript
await authClient.organization.setActive({ organizationId: orgId });
```

**After**:
```javascript
// Use OrganizationContext method which handles session refresh
await setActiveOrgContext(orgId);
```

### 5. OrganizationGuard (Guards folder) ✅
**File**: `/packages/client/src/components/Common/Guards/OrganizationGuard.jsx`

**Before**:
```javascript
await authClient.organization.setActive({ organizationId: organizations[0].id });
```

**After**:
```javascript
// Use OrganizationContext method which handles session refresh
await setActiveOrgContext(organizations[0].id);
```

## Testing Checklist

### Pre-Test Setup
```bash
# 1. Restart dev server
pnpm dev

# 2. Clear browser storage
# DevTools → Application → Storage → Clear all
# Or use incognito window
```

### Test Accounts
- **Owner**: robert.sterling@fleetmanager.com
- **Admin**: jennifer.thompson@fleetmanager.com  
- **Manager**: mike.rodriguez@fleetmanager.com
- **Driver**: (test driver account)
- **Employee**: (test employee account)

### Expected Console Output

#### ✅ Successful Flow
```
🔧 OrganizationGuard: Auto-setting first organization: { firstOrgId: "...", ... }
🔄 Setting active organization: org_123
✅ Active organization set successfully
🔄 Refreshing session to sync activeOrganizationId...
✅ Session refreshed successfully
🔍 Fetching active member with: { organizationId: "org_123", ... }
✅ Active member fetched successfully: { role: "owner", ... }
Role Context State: { effectiveRole: "owner", ... }
```

#### ❌ Failure Indicators (Should NOT See)
```
⚠️ No active member data returned
📌 This means session.activeOrganizationId is NOT set!
```

### Server Logs Should Show
```
[Socket] Client connected: ..., user: robert.sterling@fleetmanager.com, 
  global role: user, org role: owner  ← (not "member"!)
```

### UI Verification
- [ ] Role badge shows correct role (not "employee")
- [ ] Navigation items match role permissions
- [ ] Socket connection logs show correct org role
- [ ] Notification endpoints work (no 400 errors)

## Technical Details

### Better Auth Session Flow
1. **Login** → session created with `activeOrganizationId: null`
2. **setActive(orgId)** → server updates `session.activeOrganizationId = orgId`
3. **Session refresh** → client fetches `/api/auth/get-session`
4. **React Query cache updates** → hooks re-evaluate with new session
5. **getActiveMember()** → now has `activeOrganizationId`, returns member with role

### Why Manual Refresh is Needed
- Better Auth uses cookies for session state
- React Query caches the session on client
- `setActive()` only updates server-side session
- Client cache doesn't auto-invalidate on server changes
- Manual GET request forces cache refresh

### Role Calculation Priority
```javascript
effectiveRole = manualRole ?? memberRole ?? userRole ?? EMPLOYEE
```

- **manualRole**: Admin impersonation override
- **memberRole**: Organization membership role (from `getActiveMember()`)
- **userRole**: Global `user.role` (superadmin only)
- **EMPLOYEE**: Default fallback

## Common Issues & Solutions

### Issue: Still showing "employee"
**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear all browser storage
3. Check console for session refresh logs
4. Verify network tab shows `/api/auth/get-session` request after setActive

### Issue: Session refresh not working
**Solution**:
1. Check network tab for 401/403 errors
2. Verify Better Auth session cookie exists
3. Check server logs for session validation errors
4. Ensure `credentials: 'include'` in fetch request

### Issue: Organization auto-set not triggering
**Solution**:
1. Verify OrganizationGuard wraps routes in App.jsx
2. Check user has organization membership in database:
   ```sql
   SELECT * FROM member WHERE userId = 'user_id';
   ```
3. Look for `🔧 OrganizationGuard: Auto-setting` in console

## Documentation Created

1. **ACTIVE_ORGANIZATION_FIX.md** - Detailed technical explanation
2. **SESSION_REFRESH_FIX_SUMMARY.md** - This file, quick reference
3. **ROLE_DEBUG_GUIDE.md** - Step-by-step debugging guide
4. **ORG_ROLE_FIX_GUIDE.md** - Troubleshooting guide

## Prevention Strategies

1. **Always use OrganizationContext.setActiveOrganization()**
   - Don't call `authClient.organization.setActive()` directly
   - Context method includes session refresh logic

2. **Add session refresh to any Better Auth state changes**
   - After creating/joining organizations
   - After role updates
   - After any session-dependent operations

3. **Use debug logging for session-dependent APIs**
   - Log before calling APIs that need session state
   - Log the actual session values being used
   - Warn when expected session fields are missing

4. **Document Better Auth quirks**
   - Document APIs that require specific session state
   - Note which operations need manual cache refresh
   - Add TypeScript types for session fields

## Verification Commands

### Check Organization Membership
```sql
SELECT m.*, u.email, o.name as org_name
FROM member m
JOIN user u ON m.userId = u.id
JOIN organization o ON m.organizationId = o.id
WHERE u.email = 'robert.sterling@fleetmanager.com';
```

### Check Session in Database
```sql
SELECT s.*, s.activeOrganizationId
FROM session s
JOIN user u ON s.userId = u.id
WHERE u.email = 'robert.sterling@fleetmanager.com'
ORDER BY s.createdAt DESC
LIMIT 1;
```

### Test API Directly
```bash
curl -X GET http://localhost:3000/api/auth/get-session \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  --cookie-jar cookies.txt
```

## Success Criteria

✅ All role accounts show correct role in UI
✅ Socket connections show correct org role (not generic "member")
✅ Notification endpoints work without 400 errors
✅ Console shows successful session refresh logs
✅ No warnings about missing activeOrganizationId
✅ Role-based navigation works correctly
✅ Admin/Owner features accessible to correct roles

## Next Steps

1. **Immediate**: Test all role accounts
2. **Short-term**: Update other Better Auth integrations with session refresh
3. **Long-term**: Consider contributing session auto-refresh to Better Auth
4. **Documentation**: Add session refresh pattern to team coding standards
