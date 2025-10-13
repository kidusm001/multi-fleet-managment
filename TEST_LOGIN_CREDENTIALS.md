# Test User Login Credentials

## Database Successfully Seeded ✅

**Date**: October 13, 2025  
**Database Stats**:
- 👤 Users: 499
- 🏢 Organizations: 5
- 👥 Members: 418
- 💼 Employees: 776
- 🚗 Drivers: 15
- 🚙 Vehicles: 85
- 🛣️ Routes: 10
- 📍 Stops: 686
- 📌 Locations: 16
- 🔔 Notifications: 20

---

## Login Credentials by Role

### 1. Super Admin
**Email**: `superadmin@fleetmanager.com`  
**Password**: `SuperAdmin123!`  
**Role**: Super Admin (highest level access)  
**Description**: System-wide administrator with full access to all organizations and features

---

### 2. Owner (Organization Owner)
**Email**: `robert.sterling@fleetmanager.com`  
**Password**: `Owner123!`  
**Role**: Owner  
**Organization**: Sterling Logistics Solutions  
**Description**: Organization owner with full control over Sterling Logistics

---

### 3. Organization Admin
**Email**: `john.mitchell@fleetmanager.com`  
**Password**: `AdminFleet123!`  
**Role**: Admin  
**Description**: Fleet administrator with management access to organization resources

---

### 4. Manager
**Email**: `mike.rodriguez@fleetmanager.com`  
**Password**: `Manager123!`  
**Role**: Manager  
**Description**: Fleet manager with operational oversight capabilities

---

### 5. Driver
**Email**: `robert.johnson@fleetmanager.com`  
**Password**: `Driver123!`  
**Role**: Driver  
**Description**: Driver with access to routes, schedules, and vehicle assignments

---

### 6. Employee (Regular User)
**Email**: `emma.rodriguez@fleetmanager.com`  
**Password**: `User123!`  
**Role**: Employee  
**Description**: Regular employee with basic access to shuttle requests and personal info

---

## Additional Test Accounts

### More Owners
- **Victoria Hamilton**: `victoria.hamilton@fleetmanager.com` / `Owner123!`
- **Marcus Blackstone**: `marcus.blackstone@fleetmanager.com` / `Owner123!`
- **Elena Rosewood**: `elena.rosewood@fleetmanager.com` / `Owner123!`
- **Jonathan Maxwell**: `jonathan.maxwell@fleetmanager.com` / `Owner123!`

### More Admins
- **Sarah Thompson**: `sarah.thompson@fleetmanager.com` / `AdminFleet123!`
- **Kevin Martinez**: `kevin.martinez@fleetmanager.com` / `AdminFleet123!`
- **Nicole Johnson**: `nicole.johnson@fleetmanager.com` / `AdminFleet123!`
- **Brian Wilson**: `brian.wilson@fleetmanager.com` / `AdminFleet123!`
- **Catherine Moore**: `catherine.moore@fleetmanager.com` / `AdminFleet123!`
- **Gregory Evans**: `gregory.evans@fleetmanager.com` / `AdminFleet123!`

### More Managers
- **Emily Chen**: `emily.chen@fleetmanager.com` / `Manager123!`
- **David Wilson**: `david.wilson@fleetmanager.com` / `Manager123!`
- **Lisa Park**: `lisa.park@fleetmanager.com` / `Manager123!`

### More Drivers
- **Maria Garcia**: `maria.garcia@fleetmanager.com` / `Driver123!`
- **James Brown**: `james.brown@fleetmanager.com` / `Driver123!`
- **Jennifer Davis**: `jennifer.davis@fleetmanager.com` / `Driver123!`
- **Michael Lee**: `michael.lee@fleetmanager.com` / `Driver123!`
- **Amanda Williams**: `amanda.williams@fleetmanager.com` / `Driver123!`
- **Christopher Taylor**: `christopher.taylor@fleetmanager.com` / `Driver123!`
- **Jessica Martinez**: `jessica.martinez@fleetmanager.com` / `Driver123!`
- **Daniel Anderson**: `daniel.anderson@fleetmanager.com` / `Driver123!`
- **Ashley White**: `ashley.white@fleetmanager.com` / `Driver123!`

---

## Organizations in Database

1. **Sterling Logistics Solutions**
   - Members: 206
   - Employees: 580
   - Locations: 4

2. **Mitchell Transport & Logistics**
3. **Metro Transit Services**
4. **Garcia Freight Solutions**
5. **Johnson Delivery Network**

---

## Quick Test Guide

### Test Super Admin Access
```
1. Login: superadmin@fleetmanager.com / SuperAdmin123!
2. Should see all organizations
3. Can manage all users and settings
4. Has access to admin panel
```

### Test Owner Access
```
1. Login: robert.sterling@fleetmanager.com / Owner123!
2. Should see Sterling Logistics organization
3. Can manage organization members
4. Can create admins and managers
5. Full access to organization resources
```

### Test Admin Access
```
1. Login: john.mitchell@fleetmanager.com / AdminFleet123!
2. Can manage fleet operations
3. Can assign routes and vehicles
4. Can manage employees and drivers
5. Cannot modify organization settings
```

### Test Manager Access
```
1. Login: mike.rodriguez@fleetmanager.com / Manager123!
2. Can view and manage routes
3. Can assign drivers
4. Can approve shuttle requests
5. Limited administrative access
```

### Test Driver Access
```
1. Login: robert.johnson@fleetmanager.com / Driver123!
2. Can view assigned routes
3. Can see schedule
4. Can update trip status
5. Limited to driver portal features
```

### Test Employee Access
```
1. Login: emma.rodriguez@fleetmanager.com / User123!
2. Can request shuttles
3. Can view personal schedule
4. Can see notifications
5. Basic employee features only
```

---

## Features to Test by Role

### Super Admin
- [x] View all organizations
- [x] Create/edit/delete organizations
- [x] Manage all users globally
- [x] Access system settings
- [x] View all analytics

### Owner
- [x] Manage organization details
- [x] Add/remove members
- [x] Assign roles (admin, manager, driver, employee)
- [x] View organization analytics
- [x] Manage billing (if implemented)

### Admin
- [x] Fleet management
- [x] Route creation/editing
- [x] Vehicle assignment
- [x] Employee management
- [x] Driver management
- [x] Shuttle request approval

### Manager
- [x] View fleet status
- [x] Assign drivers to routes
- [x] Approve shuttle requests
- [x] View schedules
- [x] Basic reporting

### Driver
- [x] View assigned routes
- [x] See daily schedule
- [x] Update trip status
- [x] View passenger list
- [x] Navigation features

### Employee
- [x] Request shuttle service
- [x] View personal schedule
- [x] See pickup location
- [x] Track shuttle status
- [x] View notifications

---

## Ethiopian Names Implementation ✅

All seed data now uses authentic Ethiopian names:
- **225 unique employee names** across 5 organizations (0% duplication)
- **123 additional Sterling employees** with Ethiopian names
- Names from Amharic, Oromo, and Tigrinya origins
- Proper email format: firstname.lastname@organization.com

### Sample Ethiopian Names in Database:
- Almaz Bekele, Getachew Haile, Tigist Abebe
- Mamitu Hailu, Henok Kassa, Nigist Kedir
- Haymanot Araya, Ermias Ashenafi, Helen Assefa
- Tewabech Shiferaw, Addisu Tadesse, Tirunesh Tarekegn
- Fikru Demeke, Nigist Deneke, Samson Dereje

---

## Database Location
**File**: `/home/leul/Documents/github/multi-fleet-managment/packages/server/prisma/dev.db`

## Reseed Database
To reseed the database from scratch:
```bash
cd /home/leul/Documents/github/multi-fleet-managment/packages/server
npx tsx src/script/masterSeedAll.ts
```

---

## Notes
- All passwords follow secure format with uppercase, lowercase, numbers, and special characters
- Database includes realistic Ethiopian locations in Addis Ababa
- Routes and stops are properly distributed across the city
- All employees have assigned locations and stops
- Notifications are created for various scenarios

**Ready for Testing!** 🚀
