# Quick Test Guide - Role System Fix

## What Was Fixed
Users were stuck with "employee" role. **Fixed by forcing client session refresh after setting active organization.**

## Quick Test (2 minutes)

### 1. Restart Server
```bash
pnpm dev
```

### 2. Clear Browser & Login
1. Open DevTools (F12)
2. Go to **Application** tab → **Storage** → Click "Clear site data"
3. Or use **Incognito/Private window**
4. Login as: `robert.sterling@fleetmanager.com`

### 3. Check Console for Success ✅
Should see this sequence:
```
🔧 OrganizationGuard: Auto-setting first organization
🔄 Setting active organization: org_123
✅ Active organization set successfully
🔄 Refreshing session to sync activeOrganizationId...
✅ Session refreshed successfully
✅ Active member fetched successfully: { role: "owner" }
Role Context State: { effectiveRole: "owner" }
```

### 4. Check Server Logs ✅
Should show:
```
[Socket] Client connected: ..., 
  user: robert.sterling@fleetmanager.com, 
  global role: user, 
  org role: owner  ← NOT "member"!
```

### 5. Check UI ✅
- Role badge shows: **"owner"** (not "employee")
- Can access admin features
- No 400 errors in network tab

## If It Still Fails ❌

### See "employee" role?
```bash
# 1. Hard refresh
Ctrl + Shift + R

# 2. Check console for this warning:
⚠️ No active member data returned
📌 This means session.activeOrganizationId is NOT set!

# 3. If you see it, session refresh failed
# Check network tab for /api/auth/get-session request
```

### See "member" in server logs?
```bash
# activeOrganizationId not set in session
# Check database:
SELECT s.activeOrganizationId 
FROM session s 
JOIN user u ON s.userId = u.id 
WHERE u.email = 'robert.sterling@fleetmanager.com'
ORDER BY s.createdAt DESC 
LIMIT 1;

# Should NOT be null
```

### Session refresh not happening?
```bash
# Check OrganizationContext line 246-265
# Should call: authClient.$fetch('/api/auth/get-session')
# Check network tab for this GET request
```

## Test All Roles

| Role | Email | Expected Role |
|------|-------|---------------|
| Owner | robert.sterling@fleetmanager.com | owner |
| Admin | jennifer.thompson@fleetmanager.com | admin |
| Manager | mike.rodriguez@fleetmanager.com | manager |
| Driver | (test account) | driver |
| Employee | (test account) | employee |

## Key Files Changed

1. `/packages/client/src/contexts/OrganizationContext/index.tsx`
   - Added session refresh after `setActive()`

2. `/packages/client/src/contexts/RoleContext/index.jsx`
   - Added warnings when session missing activeOrganizationId

3. `/packages/client/src/pages/OrganizationSelection/index.jsx`
   - Use context method instead of direct API

4. `/packages/client/src/components/Common/Organizations/OrganizationSwitcher.jsx`
   - Use context method instead of direct API

5. `/packages/client/src/components/Common/Guards/OrganizationGuard.jsx`
   - Use context method instead of direct API

## The Fix in One Line

**BEFORE**: Direct API call didn't refresh client session cache
```js
await authClient.organization.setActive({ organizationId });
```

**AFTER**: Context method includes session refresh
```js
await setActiveOrgContext(organizationId);
// ↓ Internally calls:
// await authClient.$fetch('/api/auth/get-session')
```

## Documentation
- `ACTIVE_ORGANIZATION_FIX.md` - Technical details
- `SESSION_REFRESH_FIX_SUMMARY.md` - Complete summary
- `ROLE_DEBUG_GUIDE.md` - Debug steps
- `ORG_ROLE_FIX_GUIDE.md` - Troubleshooting

## Success = ✅
- Console: "Active member fetched successfully: { role: 'owner' }"
- Server: "org role: owner" (not "member")
- UI: Role badge shows actual role (not "employee")
- Network: No 400 errors on notification endpoints
