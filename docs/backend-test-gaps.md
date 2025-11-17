# Backend Test Coverage & Gaps

This document summarizes current backend API test coverage and highlights missing areas to validate based on the codebase logic.

Scope: packages/server

Current tests (green):
- src/tests/api.smoke.test.ts — healthcheck and route registry debug
- src/tests/auth.integration.test.ts — basic auth/session flows
- src/routes/__tests__/driverRoutes.test.ts — list/create/update/delete
- src/routes/__tests__/shiftRoutes.test.ts — list/get/create/update/delete + guards
- src/routes/__tests__/shuttleCategoryRoutes.test.ts — list/create/update/delete with tenant-aware init guard
- src/routes/__tests__/vehicleRequestRoutes.test.ts — create/list pending/approve/reject lifecycle

Key backend modules and endpoints without direct tests:
1) Routes domain (src/routes/routeRoutes.ts)
   - Create route with stops (validations for stop ordering, distance/time integrity)
   - Update route (mutate stops, handle removal/addition reorder constraints)
   - Delete route with existing assignments (should guard or cascade as intended)
   - Query: routes by driver/vehicle, currently exposed endpoints lack tests

2) Vehicles core (src/routes/shuttles.ts & shuttleRoutes.ts)
   - Note: naming in code still uses "shuttle"; aligned to Vehicle model. Missing tests for:
     - CRUD on vehicles (create/update/delete/restore)
     - Availability endpoints (/available, shift-based availability)
     - Maintenance schedule endpoint
     - Deleted listing (/deleted)

3) Department & Employee (src/routes/departmentRoutes.ts, employeeRoutes.ts)
   - Department CRUD, employees by department
   - Employee lifecycle (hire/assign/transfer endpoints), bulk ops

4) Notifications (src/routes/notificationRoutes.ts)
   - Retrieval by type/status, mark read/unread, broadcasting (mock notifier)

5) Clustering & Search (src/routes/clusterRoutes.ts, searchRoutes.ts)
   - Clustering job submission endpoints with body shape validations
   - Search endpoint behavior (param combinations)

6) Payroll (src/routes/payrollRoutes.ts)
   - Monthly payroll generation and retrieval, projections, distributions

7) RBAC & Tenant isolation
   - Cross-tenant access should be denied for all domains
   - Negative tests for insufficient roles on sensitive routes

8) Validation & Error handling
   - Express-validator chains for IDs and bodies
   - 400 for invalid inputs; 404 for not-found; 409 for conflicts

Recommended test additions (next steps):
- Add test suite: src/routes/__tests__/routeRoutes.test.ts
  • Happy path create route (+stops), update stops (reorder), get variants, delete guard
- Add test suite: src/routes/__tests__/vehicleRoutes.test.ts (cover shuttles.ts and shuttleRoutes.ts)
  • Vehicle CRUD, /available, shift availability, maintenance, /deleted, restore
- Add test suite: src/routes/__tests__/departmentEmployeeRoutes.test.ts
  • Department CRUD + employees-by-dept; employee lifecycle endpoints
- Add test suite: src/routes/__tests__/notificationRoutes.test.ts
  • List by type/status, mark read, broadcast
- Add test suite: src/routes/__tests__/clusterSearchRoutes.test.ts
  • Cluster submissions validation; search param variations
- Add test suite: src/routes/__tests__/payrollRoutes.test.ts
  • Generation, retrievals, projections
- Add suite: src/tests/rbac-tenant.integration.test.ts
  • Systematic RBAC matrix and cross-tenant isolation with mocked sessions

Utilities:
- Continue using vi.hoisted mocks for Prisma and notification service.
- Seed realistic data as baseline where end-to-end is needed; else mock DB layer per suite.

Exit criteria to consider coverage adequate:
- Each router file has at least one dedicated test suite covering happy paths and 1–2 edge cases.
- At least one cross-tenant isolation test per domain.
- Validation tests for invalid IDs and payloads for major create/update endpoints.
