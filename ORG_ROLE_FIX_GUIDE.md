# Organization Role Assignment Fix

## Problem
Users are showing as "employee" instead of their actual organization roles (owner, admin, manager, driver) because **no active organization is set in the session**.

## Root Cause

### Server Logs Show:
```
2025-10-11T11:20:30.106Z INFO [Better Auth]: No active organization found, returning null
[Socket] Client connected: ..., user: robert.sterling@fleetmanager.com, global role: user, org role: member
```

### What's Happening:
1. User logs in successfully ✅
2. Session is created ✅
3. User has organization memberships ✅
4. **BUT**: No `activeOrganizationId` is set in the session ❌
5. `getActiveMember()` returns null because no active org ❌
6. Role falls back to default "employee" ❌

## The Fix

### Enhanced Logging Added

#### 1. OrganizationContext (`packages/client/src/contexts/OrganizationContext/index.tsx`)
```javascript
const setActiveOrganization = async (organizationId: string) => {
  console.log('🔄 Setting active organization:', organizationId);
  // ... set active org
  console.log('✅ Active organization set successfully:', result.data);
}
```

#### 2. OrganizationGuard (`packages/client/src/components/OrganizationGuard.tsx`)
```javascript
// Auto-set first organization with logging
useEffect(() => {
  if (/* should auto-set */) {
    console.log('🔧 OrganizationGuard: Auto-setting first organization:', {
      firstOrgId: organizations[0].id,
      firstOrgName: organizations[0].name,
      totalOrgs: organizations.length
    });
    setActiveOrganization(organizations[0].id)
      .then(() => console.log('✅ Successfully auto-set'))
      .catch(console.error);
  }
});
```

#### 3. RoleContext (already has debug logging)
```javascript
console.log('Fetching active member with:', { organizationId, userId });
console.log('✅ Active member fetched successfully:', { userId, organizationId, role });
console.log('Role Context State:', { userRole, memberRole, effectiveRole });
```

## Testing Steps

### 1. Clear Browser Storage
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Clear cookies for localhost:3000 and localhost:5173
```

### 2. Login and Watch Console

Login as owner: `robert.sterling@fleetmanager.com / Owner123!`

**Expected Console Output:**

#### Phase 1: Organization Loading
```
🔍 OrganizationGuard: Skip auto-set: {
  isAuthenticated: true,
  isLoading: true,  // Still loading
  hasActiveOrg: false,
  orgCount: 0,
  requireActiveOrganization: true
}
```

#### Phase 2: Organizations Loaded
```
🔧 OrganizationGuard: Auto-setting first organization: {
  firstOrgId: "org-xyz-123",
  firstOrgName: "Sterling Logistics Solutions",
  totalOrgs: 1
}
```

#### Phase 3: Setting Active Organization
```
🔄 Setting active organization: org-xyz-123
✅ Active organization set successfully: { ... }
✅ OrganizationGuard: Successfully auto-set organization
```

#### Phase 4: Fetching Active Member
```
Fetching active member with: {
  organizationId: "org-xyz-123",
  sessionActiveOrganizationId: "org-xyz-123",
  activeOrganizationId: "org-xyz-123",
  userId: "user-abc-456"
}

✅ Active member fetched successfully: {
  userId: "user-abc-456",
  organizationId: "org-xyz-123",
  role: "owner",
  fullData: { ... }
}
```

#### Phase 5: Role Calculation
```
Role Context State: {
  userRole: "user",           // Platform role (ignored for org users)
  memberRole: "owner",        // From organization membership ✅
  manualRole: null,
  effectiveRole: "owner",     // This is what's used! ✅
  activeMember: { userId, organizationId, role: "owner" },
  isReady: true
}
```

### 3. Verify Server Logs

**Should see:**
```
[Socket] Client connected: ..., user: robert.sterling@fleetmanager.com, global role: user, org role: owner
```

**Instead of:**
```
[Socket] Client connected: ..., user: robert.sterling@fleetmanager.com, global role: user, org role: member
```

## Troubleshooting

### Issue: Still Shows "employee"

**Check 1: Is organization being set?**
- Look for `🔧 OrganizationGuard: Auto-setting first organization` in console
- If missing, check if OrganizationGuard is wrapping your routes in App.jsx

**Check 2: Is setActive working?**
- Look for `✅ Active organization set successfully` in console
- If missing or error, check Better Auth configuration
- Check network tab for `/api/auth/organization/set-active` request

**Check 3: Is member data correct in database?**
```sql
SELECT 
  u.email,
  m.role as org_role,
  o.name as org_name
FROM "user" u
JOIN "member" m ON m."userId" = u.id
JOIN "organization" o ON o.id = m."organizationId"
WHERE u.email = 'robert.sterling@fleetmanager.com';
```

Should return:
| email | org_role | org_name |
|-------|----------|----------|
| robert.sterling@fleetmanager.com | owner | Sterling Logistics Solutions |

**Check 4: Session persistence issue?**
- Check cookies in DevTools → Application → Cookies
- Should have `better-auth.session_token` for localhost:3000
- Try refreshing page after login

## What Each Role Should See

### SUPERADMIN (superadmin@fleetmanager.com)
- Platform role: `superadmin`
- No organization needed
- Sees all superadmin routes
- UI shows: All management features + superadmin panel

### OWNER (robert.sterling@fleetmanager.com)
- Platform role: `user`
- Organization role: `owner`
- Effective role: `owner` (inherits admin)
- UI shows: Full admin interface + delete organization

### ADMIN (john.mitchell@fleetmanager.com)
- Platform role: `user`
- Organization role: `admin`
- Effective role: `admin` (inherits manager)
- UI shows: Full admin interface

### MANAGER (mike.rodriguez@fleetmanager.com)
- Platform role: `user`
- Organization role: `manager`
- Effective role: `manager`
- UI shows: Routes, vehicles, employees management

### DRIVER (robert.johnson@fleetmanager.com)
- Platform role: `user`
- Organization role: `driver`
- Effective role: `driver`
- UI shows: Driver portal only (mobile-optimized)

### EMPLOYEE (james.brown@fleetmanager.com)
- Platform role: `user`
- Organization role: `employee`
- Effective role: `employee`
- UI shows: Dashboard view only

## Flow Diagram

```
Login
  ↓
Session Created (user.role = "user")
  ↓
Fetch Organizations (via Better Auth)
  ↓
Organizations Loaded [Org1, Org2, ...]
  ↓
OrganizationGuard Checks:
  - Has active org? NO
  - Has orgs? YES
  ↓
Auto-set First Organization
  → Call: authClient.organization.setActive({ organizationId })
  → Updates session: session.activeOrganizationId = orgId
  ↓
Session Updated ✅
  ↓
RoleContext Fetches Active Member:
  → Call: authClient.organization.getActiveMember()
  → Returns: { userId, organizationId, role: "owner" }
  ↓
Role Normalized:
  memberRole = normalizeRole("owner") = ROLES.OWNER
  ↓
Effective Role Calculated:
  effectiveRole = memberRole ?? userRole ?? ROLES.EMPLOYEE
  effectiveRole = ROLES.OWNER ✅
  ↓
UI Updates with Owner Access
```

## Files Modified

1. **packages/client/src/contexts/OrganizationContext/index.tsx**
   - Added logging to `setActiveOrganization`
   - Tracks success/failure of setting active org
   - Added 100ms delay to ensure session updates

2. **packages/client/src/components/OrganizationGuard.tsx**
   - Enhanced logging for auto-set logic
   - Shows why auto-set is skipped or triggered
   - Logs success/failure of auto-set

3. **packages/client/src/contexts/RoleContext/index.jsx** (already done)
   - Comprehensive member fetch logging
   - Role state calculation logging
   - Debug output for troubleshooting

## Next Steps

1. **Test the flow** - Login and watch console
2. **Verify each role** - Test with different user accounts
3. **Check UI** - Ensure navigation matches role permissions
4. **Remove debug logs** - Once confirmed working, clean up console.log statements

## Expected Outcome

After this fix, when robert.sterling@fleetmanager.com logs in:
- ✅ Organization auto-set to "Sterling Logistics Solutions"
- ✅ Active member fetched with role "owner"
- ✅ Effective role = "owner"
- ✅ UI shows owner interface
- ✅ Socket connects with "org role: owner"
- ✅ All features work as expected
