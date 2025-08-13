# Backend: Route & Schedule Management

Date: 2025-08-13

## 1. Overview
Implements tenant-aware backend APIs for creating and managing routes, stops, and vehicle availability. All data access is scoped by tenant and secured with RBAC.

Key goals:
- Strict multi-tenancy: every query filtered by tenantId where applicable.
- Operational safety: enforce time bounds, vehicle availability, and employee assignment rules.
- Clear validation and errors: consistent 4xx/5xx responses.

## 2. Architecture & Data Flow
- Express 5 app (`packages/server/src/app.ts`) exposes routes under `/api` via `routes/index.ts` aggregator.
- Prisma models: Vehicle, Route, Shift, Stop, VehicleAvailability (string cuid IDs).
- Middleware:
  - `middleware/validation.ts` – express-validator chains for IDs and route payloads.
  - `middleware/requireRole.ts` – RBAC; endpoints require specific roles.
  - `middleware/auth.ts` – session/identity loader.
- Services:
  - `services/shuttleAvailabilityService.ts` – provides available vehicles for a shift.
  - `services/notificationService.ts` – async notifications for ops events.

Data flow (create route):
1) Client POST /api/routes with name, vehicleId (shuttleId), shiftId, date, totalTime, employees[].
2) Validate body and RBAC; fetch shift; compute start/end; check vehicle availability via `VehicleAvailability`.
3) Transaction: create Route, link Stops, mark Employees assigned, upsert VehicleAvailability, emit notification.

## 3. API Endpoints
- GET /api/debug – router introspection; lists registered route bases.
- GET /api/shuttles – list vehicles (vehicle-backed legacy path). Returns non-deleted vehicles with relations.
- GET /api/routes – list routes (RBAC required). Includes vehicle, shift, and stops.
- GET /api/routes/:id – fetch route by ID (RBAC).
- GET /api/routes/shift/:shiftId – routes for a shift (RBAC).
- GET /api/routes/:routeId/stops – ordered stops for route (RBAC).
- POST /api/routes – create route for a shift and vehicle (RBAC + validations).
- PUT /api/routes/:id – update route (RBAC + validations).
- PATCH /api/routes/:id/status – update status (RBAC).

Notes:
- shuttles endpoints use `prisma.vehicle` under the hood (`routes/shuttles.ts`).
- vehicle availability uses a composite unique key on (vehicleId, shiftId, date) to avoid overlaps.

## 4. Validation & Constraints
- Route totalTime must be ≤ 90 minutes.
- Employees must be unassigned to be included in a new route.
- Stops must belong to supplied employees and not already linked to a route.
- Vehicle must exist and have an assigned driver before creating a route.

## 5. Security & Multi-Tenancy
- RBAC: `requireRole(['admin','administrator','fleetManager'])` enforced on route endpoints.
- Tenant scoping: create/update operations include tenantId; list queries filtered by tenant where applicable.
- OWASP:
  - Input validation via express-validator; Prisma parameterization prevents injection.
  - No secrets returned; enable HTTPS in prod; CORS configured.
  - Error responses avoid leaking stack traces in production.

See `docs/security-owasp-checklist.md` for a living checklist.

## 6. Error Handling
- 400 – validation failures (e.g., missing fields, time bounds, employee assignment conflicts).
- 404 – shift/vehicle/route not found within tenant scope.
- 409 – availability conflicts (vehicle already booked for shift window).
- 500 – unexpected server errors; logged and notified.

## 7. Testing Strategy
- Unit:
  - Availability helpers in `routeRoutes.ts` (checkVehicleAvailability).
  - Validation edge-cases.
- Integration (vitest + supertest):
  - Auth flows: `src/tests/auth.integration.test.ts`.
  - Smoke tests for API base and shuttles: `src/tests/api.smoke.test.ts`.
  - Route creation negative cases (validation/availability) – extend with prisma mocks and role bypass.
- Mocking:
  - `vi.mock('../db')` to simulate prisma during integration tests.
  - `vi.mock('../middleware/requireRole')` to bypass RBAC where testing just transport/validation.

## 8. Try it (local)

- Health check:
```sh
curl -s http://localhost:3000/health | jq
```

- List vehicles (legacy shuttles path):
```sh
curl -s http://localhost:3000/api/shuttles | jq
```

- Debug routes:
```sh
curl -s http://localhost:3000/api/debug | jq
```

For protected routes (e.g., /api/routes), include Authorization header with a valid JWT per your auth setup.

## 9. Future Work
- Add more integration tests: RBAC enforcement and tenant-leak prevention across endpoints.
- WebSocket authentication & tenant isolation when real-time features are introduced.
- Document full JSON schemas (OpenAPI) for client usage.
