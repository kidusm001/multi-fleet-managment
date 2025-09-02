# Object Design Document (ODD)

Version: 1.1
Status: Final
Date: 2025-09-02

Authors: Routegna Engineering Team

---

## Table of Contents
1. Introduction / Overview
2. Conventions & Trade-offs
3. Package Decomposition
4. Representative Module & Class Interfaces
5. Backend Detailed Interface Signatures
6. Frontend Module Summaries & Contracts
7. Error Handling & Exceptions
8. Testing & Validation Patterns
9. Patterns and Anti-Patterns
10. UML / Diagrams
11. Future Enhancements
12. References

---

## 1. Introduction / Overview
This Object Design Document (ODD) provides a concrete description of package decomposition, major modules, representative service and middleware interfaces, and coding conventions for the Routegna multi-fleet management system. It supports developers implementing, testing, and extending the system.

---

## 2. Conventions & Trade-offs
- Naming: PascalCase for React components and TypeScript types; camelCase for functions and variables.
- Error Handling: Services throw structured errors `{ code, message, details? }`; routes transform to HTTP responses.
- Tenant Enforcement: Services accept `tenantId` and never derive tenant from incoming payloads.
- DTO Validation: Per-route validation using schemas (express-validator or `zod` as suggested future enhancement).

Trade-offs
- Prefer pragmatic, testable service functions over heavy DDD patterns for speed and maintainability.

---

## 3. Package Decomposition
### Backend (Representative)
- `packages/server/src/app.ts` — application bootstrap, middleware wiring.
- `packages/server/src/routes/` — route definitions grouped by domain (`routes`, `employees`, `vehicles`, `auth`, `notifications`, `payroll`).
- `packages/server/src/middleware/` — auth, session, role checks, validation.
- `packages/server/src/services/` — domain services that encapsulate business logic.
- `packages/server/prisma/` — Prisma schema and seed scripts.
- `packages/server/src/utils/` — helpers (e.g., error mapping, pagination helpers).

### Frontend (Representative)
- `packages/client/src/App.jsx` — route table and layout.
- `packages/client/src/pages/` — feature pages (Dashboard, RouteManagement, ShuttleManagement, EmployeeManagement, Settings).
- `packages/client/src/components/Common/Map/` — Map rendering & route layers.
- `packages/client/src/contexts/` — AuthContext, ThemeContext, RoleContext, NotificationContext.
- `packages/client/src/services/` — API wrappers (employeeService, routeService, shuttleService, mapService).

---

## 4. Representative Module & Class Interfaces

### 4.1 Backend Interfaces (selected)

Auth Middleware (`middleware/auth.ts`)
- `async function authMiddleware(req, res, next)`
  - Ensures session exists, loads `req.user` and `req.tenantId`.
  - On failure: `res.status(401).json({ code: 'UNAUTHORIZED', message: '...' })`.

RBAC (`middleware/requireRole.ts`)
- `function requireRole(allowedRoles: string[])` returns middleware
  - Checks `req.user.role` and throws 403 if unauthorized.

Route Service (`services/routeService.ts`)
- `async function createRoute(tenantId, payload)` — creates a route and stops within a transaction
- `async function getRoute(tenantId, routeId)` — returns route with stops and assignment
- `async function updateRoute(tenantId, routeId, changes)` — applies changes, ensures constraints
- `async function optimizeRoute(tenantId, routeId, options)` — triggers optimization workflow (calls Mapbox or fallback)

Notification Service (`services/notificationService.ts`)
- Stub currently; will evolve into persistence + dispatch orchestrator.

Clustering Service (`services/clusteringService.ts`)
- Provides vehicle cluster suggestions for shift & date.

Shuttle Availability (`services/shuttleAvailabilityService.ts`)
- Returns available shuttles for a shift with shift timing metadata.

Payroll Service (`services/payrollService.ts`)
- Aggregates and projects payroll metrics (currently stub data).

---

## 5. Backend Detailed Interface Signatures

### 5.1 Notification Service
File: `notificationService.ts`
```ts
type Notification = { id: string; type: string; seen: boolean; createdAt: Date };

interface Pagination<T> { items: T[]; page: number; total: number }

notificationService.createNotification(payload: Record<string, unknown>): Promise<{ ok: boolean }>
notificationService.getNotifications(userId: string, opts: { page?: number; pageSize?: number }): Promise<Pagination<Notification>>
notificationService.getUnreadNotifications(opts: any): Promise<Pagination<Notification>>
notificationService.getReadNotifications(opts: any): Promise<Pagination<Notification>>
notificationService.getNotificationsByType(opts: { type: string }): Promise<Pagination<Notification>>
notificationService.markAsSeen(id: string, userId: string): Promise<{ ok: boolean }>
notificationService.markAsUnread(id: string, userId: string): Promise<{ ok: boolean }>
notificationService.markAllAsSeen(userId: string): Promise<{ ok: boolean }>
notificationService.getUnseenCount(userId: string): Promise<number>
notificationService.getNotificationsSortedByImportance(opts: any): Promise<Pagination<Notification>>
```

### 5.2 Clustering Service
File: `clusteringService.ts`
```ts
clusteringService.getOptimalClusters(
  shiftId: string,
  date: Date,
  vehicles: Array<{ id: string|number; capacity: number }>
): Promise<{ clusters: Array<{ vehicleId: string; capacity: number; stops: any[] }> }>

clusteringService.getOptimalClusterForShuttle(
  shiftId: string,
  date: Date,
  shuttleId: number|string
): Promise<{ vehicleId: string; capacity: number; stops: any[] }>
```

### 5.3 Shuttle Availability Service
File: `shuttleAvailabilityService.ts`
```ts
interface GetAvailableShuttlesParams { shiftId: number|string }

function getAvailableShuttles(params: GetAvailableShuttlesParams): Promise<{
  count: number;
  shuttles: any[];
  shiftDetails: { startTime: string; endTime: string; timeZone: string }
}>

class ShuttleAvailabilityService {
  static getAvailableShuttles(params: GetAvailableShuttlesParams): ReturnType<typeof getAvailableShuttles>
}
```
Error Codes:
| Code | Scenario |
| ---- | -------- |
| SHIFT_NOT_FOUND | Shift ID not found in DB |

### 5.4 Payroll Service
File: `payrollService.ts`
```ts
class PayrollService {
  generateMonthlyPayroll(vehicleId: string, month: string, year: number): Promise<{ vehicleId: string; month: string; year: number; status: string }>
  getMonthlyPayrollByVehicle(vehicleId: string, month: string, year: number): Promise<{ vehicleId: string; month: string; year: number; records: any[] }>
  getAllMonthlyPayrolls(month: string, year: number): Promise<{ month: string; year: number; records: any[] }>
  getPayrollDistribution(month: string, year: number): Promise<{ month: string; year: number; distribution: any[] }>
  getHistoricalPayrollData(months: number): Promise<{ months: number; data: any[] }>
  getPayrollProjections(startMonth: string, startYear: number, numMonths: number): Promise<{ startMonth: string; startYear: number; numMonths: number; projections: any[] }>
  processPayroll(payrollId: string): Promise<{ payrollId: string; status: string }>
}
```

### 5.5 Error & Result Modeling (Backend)
| Pattern | Description |
| ------- | ----------- |
| `{ ok: boolean }` | Lightweight acknowledgement for mutating ops in stub phase |
| Pagination wrapper | Uniform shape for list endpoints |
| Domain error codes | Facilitates UI mapping & i18n later |

### 5.6 Evolution Notes
- Notification & Clustering services are stubs; mark with `@todo` during enhancement.
- Introduce discriminated union types for richer error modeling.

---

## 6. Frontend Module Summaries & Contracts

---

### 6.1 Map Module Contract
| File | Responsibility | Key Props / Inputs | Key Outputs |
| ---- | -------------- | ------------------ | ----------- |
| `MapComponent.jsx` | Map instantiation, theme/style switch | `selectedRoute`, `enableOptimization` | Visual layers, fallback banner |
| `RouteLayer.jsx` | Adds/removes route line layer | `map`, `route`, `enableOptimization` | Optimized or fallback coordinates |
| `routeOptimization.js` | Directions API + fallback heuristic | `coordinates`, `enableOptimization` | `{ coordinates, optimized, distance, duration }` |

### 6.2 Consistency Rules
- Components invoking optimization must honor color semantics: Blue (optimized), Orange (fallback).
- Debounce route redraw to >=300ms to limit API churn.

### 6.3 Employee Service (Example Shape)
```ts
employeeService.list(params: { page?: number; q?: string }): Promise<{ items: any[]; page: number; total: number }>
employeeService.create(dto: EmployeeCreateDto): Promise<Employee>
```

### 6.4 Context Interfaces (Representative)
| Context | Provides | Consumed By |
| ------- | -------- | ----------- |
| AuthContext | `{ user, login(), logout() }` | Nav, protected routes |
| RoleContext | `role, setRole` | Conditional menus |
| ThemeContext | `theme, toggleTheme` | Map + UI theming |
| NotificationContext | `notifications, markSeen()` | Header badges |

---

## 7. Error Handling & Exceptions

Employee Service (`packages/client/src/services/employeeService.js`)
- `list(params)`
- `get(id)`
- `create(dto)`
- `update(id, dto)`
- `deactivate(id)`

Map Module (`packages/client/src/components/Common/Map/`)
- `MapComponent.jsx` — instantiates Mapbox map, manages layers and markers
- `RouteLayer.jsx` — adds/removes route layer; uses `optimizeRoute` service
- `routeOptimization.js` — client-side optimizer with Mapbox Directions API + fallback

---

Added backend error codes & frontend mapping guidance.
- Services must throw domain-specific errors with `code` and `message`.
- Routes map errors to HTTP status codes:
  - `ValidationError` → 400
  - `UnauthorizedError` → 401
  - `ForbiddenError` → 403
  - `NotFoundError` → 404
  - `ConflictError` → 409
  - `ServerError` → 500

---

## 8. Testing & Validation Patterns
- Unit tests target pure service functions.
- Integration tests spin up the Express app with an in-memory or test Postgres instance.
- Frontend tests use Vitest + React Testing Library for components and service function mocks.
- Add negative case tests for multi-tenancy isolation.

---

## 9. Patterns and Anti-Patterns
Patterns
- Layered services with clear contracts.
- Prisma transactions for composite updates.
- Defensive validation at the boundary.

Anti-Patterns
- Business logic inside route handlers.
- Inferring tenant from payloads instead of session/middleware.

---

## 10. UML / Diagrams
PlantUML sources located in `docs/project main docs/diagrams/`:
| Diagram | File |
| ------- | ---- |
| Route Creation Sequence | `project main docs/diagrams/route_creation_sequence.puml` |
| Map Render Flow | `project main docs/diagrams/map_render_flow.puml` |
| Services Overview | `project main docs/diagrams/services_overview.puml` |

## 11. Future Enhancements
- Centralized DTO schemas shared between frontend and backend with `zod` or TypeScript codegen.
- Domain events and async workers for heavy processing.
- Redis caching for availability & hot lists.
- Audit log / append-only actions.

---

## 12. References
- `backend-deliverables-report.md`
- `backend-route-schedule.md`
- `backend-test-gaps.md`
- `security-auth-audit.md`
- `security-owasp-checklist.md`
- `frontend-port-plan.md`

(End of ODD)
