# Role System Fix - Organization Member Roles

**Date:** October 11, 2025  
**Issue:** Driver logging in saw admin interface instead of driver portal  
**Root Cause:** Frontend was reading the wrong role (User role instead of Organization Member role)

---

## 🔍 Problem Analysis

### Two Role Systems:
The system has **TWO separate role systems** that were being confused:

1. **User Role** (on `User` table):
   - Values: `superadmin` or `user`
   - Purpose: Global system access level
   - Set by Better Auth during user creation

2. **Organization Member Role** (on `Member` table):
   - Values: `owner`, `admin`, `manager`, `driver`, `employee`
   - Purpose: Role within a specific organization
   - Set when user joins an organization

### The Bug:
- Frontend `RoleContext` was reading `session.user.role` (User role = `"user"`)
- Should have been reading the **Organization Member role** (e.g., `"driver"`)
- Result: Driver with User role `"user"` appeared as generic user, not driver

---

## ✅ Solution Implemented

### 1. Fixed Role Constants (`/packages/client/src/data/constants.js`)

**Before:**
```javascript
export const ROLES = {
  ADMIN: 'user',  // ❌ Wrong!
  MANAGER: 'user' // ❌ Wrong!
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Fleet Manager'
};
```

**After:**
```javascript
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DRIVER: 'driver',
  EMPLOYEE: 'employee',
  OWNER: 'owner'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Fleet Manager',
  [ROLES.DRIVER]: 'Driver',
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.OWNER]: 'Owner'
};
```

---

### 2. Created Enriched Session Endpoint (`/packages/server/src/routes/session.ts`)

**New endpoint:** `GET /api/session`

**What it does:**
1. Gets standard Better Auth session
2. Fetches user's organizations
3. Determines active organization
4. Looks up user's role in that organization (`Member` table)
5. Returns enriched session with `organizationRole`

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "robert.johnson@fleetmanager.com",
    "name": "Robert Johnson",
    "role": "user",  // User table role (superadmin/user)
    "organizationRole": "driver",  // Member table role ✅
    "activeOrganizationId": "org_sterling",
    "activeOrganizationSlug": "sterling-logistics",
    "activeOrganizationName": "Sterling Logistics Solutions"
  },
  "session": { ... }
}
```

---

### 3. Created Custom Hook (`/packages/client/src/lib/use-enriched-session.ts`)

**New hook:** `useEnrichedSession()`

**Purpose:** Fetch enriched session from our custom endpoint instead of Better Auth's default

```typescript
export function useEnrichedSession() {
  const [session, setSession] = useState<EnrichedSession | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const response = await fetch('http://localhost:3000/api/session', {
        credentials: 'include'  // Important: include cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        setSession(data.user ? data : null);
      }
    };

    fetchSession();
  }, []);

  return { data: session, isPending };
}
```

---

### 4. Updated RoleContext (`/packages/client/src/contexts/RoleContext/index.jsx`)

**Changes:**

1. **Import enriched session hook:**
   ```javascript
   import { useEnrichedSession } from "../../lib/use-enriched-session";
   ```

2. **Use enriched session:**
   ```javascript
   const { data: session, isPending } = useEnrichedSession();
   ```

3. **Updated role normalization to handle all organization roles:**
   ```javascript
   const normalizeRole = (raw) => {
     if (!raw || typeof raw !== 'string') return null;
     const lower = raw.toLowerCase();
     if (lower === 'admin' || lower === 'administrator') return ROLES.ADMIN;
     if (lower === 'manager' || lower === 'fleet_manager') return ROLES.MANAGER;
     if (lower === 'driver') return ROLES.DRIVER;
     if (lower === 'employee') return ROLES.EMPLOYEE;
     if (lower === 'owner') return ROLES.OWNER;
     return null;
   };
   ```

4. **Get organization role from enriched session:**
   ```javascript
   useEffect(() => {
     if (!isPending && session) {
       // Get organization role (this is what we actually want!)
       const organizationRole = session.user?.organizationRole;
       if (organizationRole) {
         const next = normalizeRole(organizationRole);
         setRole(next);
         return;
       }
       
       // Fallback: superadmin users
       if (session.user?.role === 'superadmin') {
         setRole(ROLES.ADMIN);
         return;
       }
       
       setRole(null);
     }
   }, [session, isPending]);
   ```

---

## 📝 How It Works Now

### Flow:
1. User logs in via Better Auth
2. Frontend calls `/api/session` endpoint
3. Backend enriches session with organization member role
4. Frontend `useEnrichedSession` hook fetches enriched data
5. `RoleContext` reads `session.user.organizationRole`
6. Role is normalized to match `ROLES` constants
7. UI renders based on correct organization role

### For Driver (robert.johnson@fleetmanager.com):
```
1. Login → Better Auth creates session
2. Better Auth session.user.role = "user" (User table)
3. GET /api/session → Looks up Member table
4. Member.role = "driver" for Sterling Logistics
5. Returns: { user: { organizationRole: "driver" } }
6. RoleContext normalizes "driver" → ROLES.DRIVER
7. App.jsx sees isDriver = true
8. Shows driver portal ✅
```

### For Admin:
```
1. Login → session.user.role = "user"
2. GET /api/session → Member.role = "admin"
3. Returns: { user: { organizationRole: "admin" } }
4. RoleContext normalizes "admin" → ROLES.ADMIN
5. Shows admin interface ✅
```

### For Superadmin (no organization):
```
1. Login → session.user.role = "superadmin"
2. GET /api/session → No organization
3. Returns: { user: { organizationRole: null } }
4. RoleContext fallback: superadmin → ROLES.ADMIN
5. Shows admin interface ✅
```

---

## 🎯 Expected Behavior by Role

### DRIVER Role:
- ✅ Sees driver portal only
- ✅ Mobile-optimized UI
- ✅ Can access: /driver/*, /notifications, /settings
- ❌ Cannot access: /dashboard, /routes, /vehicles, /employees, etc.

### EMPLOYEE Role:
- ✅ Should see dashboard with their own route only
- ✅ Limited read-only access
- ❌ Cannot modify data

### MANAGER Role:
- ✅ Sees full admin interface
- ✅ Can manage: routes, vehicles, drivers, employees
- ❌ Cannot access: organization management

### ADMIN Role:
- ✅ Full access to everything
- ✅ Can manage organizations
- ✅ Can manage users

### OWNER Role:
- ✅ Full access like admin
- ✅ Can delete organization
- ✅ Can transfer ownership

---

## 🚀 Testing

### Test Driver Login:
```
Email: robert.johnson@fleetmanager.com
Password: Driver123!
Organization: Sterling Logistics Solutions
Expected Role: driver
```

1. Login → Should auto-redirect to `/driver`
2. TopBar → Should show simplified header (no admin nav)
3. Routes → Can only access driver portal routes
4. Try `/dashboard` → Should redirect to `/driver`

### Test Admin Login:
```
Email: john.mitchell@fleetmanager.com
Password: [admin password]
Organization: Sterling Logistics Solutions
Expected Role: admin
```

1. Login → Should redirect to `/dashboard`
2. TopBar → Should show full navigation
3. Routes → Can access all admin routes
4. Can access `/driver` portal if needed

---

## 🔧 Backend Changes Made

1. ✅ Created `/packages/server/src/routes/session.ts`
2. ✅ Registered route in `/packages/server/src/routes/index.ts`
3. ✅ Uses existing `getUserOrganizationRole()` helper

## 🎨 Frontend Changes Made

1. ✅ Updated `/packages/client/src/data/constants.js`
2. ✅ Created `/packages/client/src/lib/use-enriched-session.ts`
3. ✅ Updated `/packages/client/src/contexts/RoleContext/index.jsx`

---

## ⚠️ Important Notes

1. **Session endpoint caching:** Consider adding caching/polling to avoid excessive API calls
2. **Organization switching:** Need to refresh session when user switches organizations
3. **Backend security:** All endpoints must still check roles server-side (frontend restrictions are NOT security)
4. **Employee role:** Not fully implemented yet - needs dashboard with limited view

---

## 📊 Role Hierarchy

```
SUPERADMIN (User role)
  └─> Treated as ADMIN in frontend
  
ORGANIZATION OWNER
  └─> Full access + can delete org
  
ORGANIZATION ADMIN
  └─> Full access to org features
  
ORGANIZATION MANAGER
  └─> Manage routes, vehicles, drivers, employees
  
ORGANIZATION DRIVER
  └─> Driver portal only
  
ORGANIZATION EMPLOYEE
  └─> Dashboard view only (read-only)
```

---

## ✨ Next Steps

1. **Test all roles** to verify correct UI rendering
2. **Implement employee dashboard** with read-only route view
3. **Add organization switching** UI
4. **Add session refresh** on org switch
5. **Backend role enforcement** on all API endpoints
6. **Add role-based menu items** that hide based on role

---

**The driver portal should now work correctly!** 🎉

Login with `robert.johnson@fleetmanager.com` / `Driver123!` and you should see the driver portal.
