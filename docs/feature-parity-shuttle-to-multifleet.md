# Feature Parity Check: shuttle-management → multi-fleet-managment (Backend)

This document compares the old Shuttle Management backend to the current Multi-Fleet Management backend and notes deltas that are intentionally dropped vs still missing.

Sources compared:
- Old: shuttle-management (packages/backend/src/routes/*)
- New: multi-fleet-managment (packages/server/src/routes/*)

Summary:
- Recruitment/batch features: intentionally removed per requirement. Endpoints in old repo (batches.ts, candidates.ts) are not ported by design.
- Shuttle Request flow: migrated to Vehicle Request under `vehicleRequestRoutes.ts`, covering create, pending list, approve, reject.
- Vehicle endpoints: retained legacy file names (`shuttles.ts`, `shuttleRoutes.ts`) but backed by Vehicle model. Functionally parity exists but tests are missing.
- Routes, Departments, Employees, Drivers, Shifts, Notifications, Payroll: present in both. Some advanced endpoints exist but lack tests in new repo.

Endpoint-by-endpoint parity highlights:
- routeRoutes: GET variants, POST create, PUT updates (incl. stops), DELETE — parity present by code; add tests.
- shuttleCategoryRoutes: full CRUD — parity present and tested.
- shuttleRoutes & shuttles: list, availability, maintenance, CRUD, restore, deleted listing — parity present by code; tests missing.
- vehicleRequestRoutes: replaces shuttleRequestRoutes — parity present and tested for core lifecycle.
- departmentRoutes & employeeRoutes: multiple endpoints for hierarchy and lifecycle — parity present; tests missing.
- shiftRoutes: parity present and tested.
- notificationRoutes: parity present; tests missing.
- payrollRoutes: parity present; tests missing.
- clusterRoutes: endpoints for clustering jobs — parity present; tests missing.
- searchRoutes: parity present; tests missing.
- auth.routes.ts & auth.ts: parity (session and protected checks) — smoke/integration tests present.

Known intentional differences:
- All recruitment and candidate/batch modules are omitted. This is intentional and complete.
- Role names slightly differ in places (requireRoles vs requireRole, and role labels). Functionally equivalent.
- IDs are cuid strings in new repo; old repo code used string IDs as well in most places, but some numeric assumptions were removed.

Action items (to reach full parity confidence):
- Add tests as outlined in docs/backend-test-gaps.md for untested routers.
- Consider renaming files `shuttles.ts` and `shuttleRoutes.ts` to `vehicles.ts` and `vehicleRoutes.ts` for clarity (low priority, breaking imports/tests).
- Add tenant-isolation tests for each domain.
