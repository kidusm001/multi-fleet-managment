# Chapter 4 – Implementation Report

## 4.1 Development Environment and Technology Stack

The Routegna platform employs a modern, polyglot architecture to deliver enterprise-grade fleet management capabilities. This section inventories the complete technology stack, categorized by functional domain, with precise version specifications drawn from project configuration files (`package.json`, `pyproject.toml`, `requirements.txt`, `Dockerfile`, and `docker-compose.yml`). Verified components (backend service, clustering microservice, and React client) interoperate via the documented HTTP/`/fastapi` proxy and shared Better Auth session model within the `pnpm` monorepo; no additional hidden services or infrastructure layers (e.g. Redis cache, message queue) are present.

### Core Backend
The backend service, housed in `packages/server`, provides RESTful APIs for CRUD operations, authentication, and data persistence. It leverages Node.js for runtime efficiency and Express for routing and middleware composition.

- **Runtime and Framework**:
  - `Node.js` runtime (not pinned; `pnpm@10.x` and Express 5 require Node ≥ 18).
  - `Express 5.1.0` (`packages/server/package.json`) for HTTP server management, middleware stacking, and API routing.
- **Execution and Compilation**:
  - `tsx 4.20.3` (root) powers TypeScript scripts and the server-side `nodemon` dev workflow, while the client relies on `vite 5.0.0` for its hot-reload development server; the client’s `tsx 4.19.3` install is limited to utility scripts.

### Optimization Microservice
The clustering service, located in `clustering/`, implements heuristic route assignment using OR-Tools. Containerized for portability, it exposes a FastAPI interface for solver invocations, ensuring scalable optimization without blocking the main backend.

- **Runtime and Framework**:
  - `Python 3.11` (base image in `clustering/Dockerfile`).
  - `FastAPI 0.109.0` with `uvicorn 0.27.0` for asynchronous API serving and automatic OpenAPI documentation generation.
- **Core Dependencies**:
  - `numpy 1.26.3` for numerical computations and matrix operations.
  - `haversine 2.8.0` for geodesic distance calculations.
  - `ortools` (latest) for constraint programming and vehicle routing optimization.
  - `httpx 0.28.1` for HTTP client operations, including authentication proxying.
- **Additional Libraries**:
  - `folium` and `requests` for visualization and external API interactions (declared in `pyproject.toml`).
- **Containerization and Orchestration**:
  - Dockerized via `clustering/Dockerfile` with `uv` package manager for efficient dependency caching.
  - Orchestrated using `docker-compose.yml` (Compose v3.8) for local development and health checks.

### Frontend
The client application, in `packages/client`, delivers a responsive web interface for fleet operations. Built with React and Vite, it emphasizes performance, accessibility, and role-based UI adaptation.

- **Framework and Runtime**:
  - `React 18.3.1` with `react-dom 18.3.1` for component-based UI development.
  - `react-router-dom 6.20.1` for client-side routing and navigation guards.
- **Build Tooling**:
  - `Vite 5.0.0` with `@vitejs/plugin-react 4.2.0` and `@vitejs/plugin-react-swc 3.5.0` for fast bundling and hot module replacement.
- **Styling and Theming**:
  - `tailwindcss 3.3.5` with `tailwindcss-animate 1.0.7` for utility-first CSS.
  - `next-themes 0.4.4` for dark/light mode support.
  - `@emotion/react 11.11.3` for styled components where needed.

### Database & Data Layer
Data persistence relies on PostgreSQL with Prisma ORM for type-safe queries. The schema (`packages/server/prisma/schema.prisma`) defines entities for organizations, routes, vehicles, and more, with migrations ensuring schema evolution.

- **Database**:
  - PostgreSQL datasource (configured in `packages/server/prisma/schema.prisma`).
- **ORM and Tooling**:
  - `@prisma/client 6.13.0` with `prisma` CLI `6.13.0` for query generation and migration management.
  - Prisma migrations/seeds via `prisma/seed.ts` and migration scripts stored under `packages/server/prisma/migrations/`.

### Caching & Job Queues
No dedicated caching or job queue systems are implemented in the current stack. Asynchronous tasks (e.g., solver invocations) are handled via native `asyncio` in the Python service, with no Redis or BullMQ dependencies present. Earlier SDD/ODD drafts explored Redis and BullMQ, but those components were deliberately descoped for the first release and remain optional future enhancements.

### Authentication
Authentication and authorization are centralized through Better Auth, supporting multi-tenant organization scoping and session-based access control. Integration with Fayda provides local identity provider capabilities.

- **Primary Library**:
  - `better-auth` (`1.3.8` root tooling, `1.3.4` server, `1.1.16` client, `shared` package) for OAuth2 flows, session management, and permission checks.
- **Supporting Libraries**:
  - `fayda 0.0.14` for local authentication provider integration.
  - `bcrypt 6.0.0` and `jsonwebtoken 9.0.2` for password hashing and token issuance.

### Core Libraries (Backend)
The backend stack includes utilities for HTTP handling, validation, logging, and real-time features, all integrated via Express middleware.

- **HTTP and Middleware**:
  - `cors 2.8.5` for cross-origin requests.
  - `express-async-handler 1.2.0` for error handling in async routes.
  - `express-fileupload 1.5.2` and `express-validator 7.2.1` for file uploads and input validation.
- **Validation and Schema**:
  - `zod 4.1.1` (server) with custom middleware wrappers for runtime type checking.
- **Observability**:
  - `pino 9.3.2`, `pino-http 10.3.0`, and `pino-pretty 11.2.2` for structured logging and HTTP request tracing.
- **Realtime & Messaging**:
  - `socket.io 4.8.1` for WebSocket-based notifications and live updates.
- **Utilities**:
  - `dotenv 17.2.1` for environment variable loading.
  - `pdfkit 0.15.0` for server-side PDF generation.
  - `shared` workspace module for cross-package utilities.

### Core Libraries (Frontend)
The frontend leverages a rich ecosystem of libraries for data fetching, UI components, visualization, and file handling, ensuring a polished user experience.

- **Data Handling & UI**:
  - `axios 1.7.9` for HTTP requests.
  - `@tanstack/react-table 8.20.6` for sortable, filterable data tables.
  - `class-variance-authority 0.7.1` and `clsx 2.1.1` for conditional styling.
  - `usehooks-ts 2.16.0`, `lodash 4.17.21`, and `date-fns 4.1.0` for utility functions and date manipulation.
- **Visualization**:
  - `d3 7.9.0`, `d3-force 3.0.0`, `recharts 2.15.0`, and `chart.js 4.4.7` for interactive charts and graphs.
  - `framer-motion 11.14.4` for animations and transitions.
- **Component Frameworks**:
  - Radix UI suite (`@radix-ui/react-*` 1.1.x/2.1.x) for accessible primitives.
  - `@headlessui/react 2.2.0` for unstyled UI components.
  - `lucide-react 0.468.0` for iconography.
  - `vaul 1.1.2` for drawer components.
  - `sonner 2.0.1` for toast notifications.
- **File & Document Tooling**:
  - `react-dropzone 14.3.5` for drag-and-drop file uploads.
  - `papaparse 5.4.1` and `xlsx 0.18.5` for CSV/Excel parsing.
  - `jspdf 3.0.0` with `jspdf-autotable 5.0.2` for client-side PDF generation.
- **Maps & Scheduling Widgets**:
  - `mapbox-gl 3.8.0` for interactive mapping.
  - `react-day-picker 8.10.1` for date selection.
  - `socket.io-client 4.8.1` for real-time client connections.

### Development & Tooling
The project adopts modern tooling for monorepo management, type safety, testing, and deployment, facilitating collaborative development and CI/CD integration.

- **Package Management**:
  - `pnpm` (`10.14.0` root, `10.10.0` server) for efficient dependency resolution and workspace orchestration.
- **TypeScript Compilers**:
  - `typescript 5.9.2` (server), `5.7.2` (client), `5.8.3` (shared) for static type checking.
- **Testing Frameworks**:
  - `vitest 2.1.4` with `@vitest/ui` and `@vitest/coverage-v8` for backend unit/integration tests.
  - `jest 29.7.0` with `@testing-library/react 14.1.2` and `@testing-library/jest-dom 6.1.5` for frontend component testing.
  - `supertest 7.0.0` for API endpoint validation.
- **Linting & Code Quality**:
  - `eslint 8.53.0` with `@typescript-eslint` plugins `8.40.0`, `eslint-plugin-react 7.33.2`, `eslint-plugin-react-hooks 4.6.0`, and `eslint-plugin-react-refresh 0.4.4` for code standards.
- **Build & Development Scripts**:
  - `nodemon 3.1.10` for backend hot-reloading.
  - `ts-node 10.9.2` and `babel-jest 29.7.0` for transpilation.
  - `postcss 8.4.32` and `autoprefixer 10.4.14` for CSS processing.
- **Automation & Documentation**:
  - `task-master-ai 0.24.0` for task orchestration.
  - Docker tooling (`clustering/Dockerfile`, `docker-compose.yml` v3.8) for containerized services.

## 4.2 Implementation of Key Modules and Algorithms

### 4.2.1 Core Backend Service Implementation (Node.js/Express)

#### Layered Architecture Overview
The backend follows a layered Express → Router → Handler/Service structure. `createApp` (`packages/server/src/app.ts`) bootstraps global middleware—CORS, JSON parsing, Better Auth adapters, structured logging, and a lightweight rate limiter—before delegating to the aggregated API router (`routes/index.ts`). `index.ts` hosts HTTP startup logic and wires Socket.IO on top of the HTTP server for realtime updates. Each feature exposes its own route module (for example, `routes/routes.ts` for shuttle routes) that composes middleware, validates requests, and interacts with Prisma-powered services.

#### Request Lifecycle and Middleware Chain
1. **Transport & Logging** – Requests enter Express and are optionally logged via `pino`/`pino-http`, depending on environment flags.
2. **Security & Auth** – `/api/auth/*` routes are delegated to Better Auth’s Node adapter (`toNodeHandler(auth)`). Protected business routes attach `requireAuth` to hydrate `req.user`/`req.session` from Better Auth and, when applicable, `requireRole` or permission checks using `auth.api.hasPermission`.
3. **Organization/Tenant Scoping** – Handlers that need tenant context call helpers in `middleware/organization.ts` to load organization memberships and determine `req.activeOrganization` from the Better Auth session. Many route handlers (including the create-route flow) read `req.session.session.activeOrganizationId` directly to scope Prisma queries.
4. **Validation Layer** – Incoming payloads are vetted via Zod-backed middleware (`validateSchema`/`validateMultiple` inside `routes/routes.ts`) to ensure DTOs are well-formed before touching the data layer.
5. **Controller/Handler Execution** – Route definitions in `routes/*` modules contain the orchestration logic. They gather metadata, invoke helper services (such as `VehicleAvailabilityService`), and wrap state-changing operations in Prisma transactions where consistency is required.
6. **Service & Persistence Layer** – Database access is funneled through the singleton Prisma client (`db.ts`). Supporting services (for example, `VehicleAvailabilityService`) encapsulate reusable queries and business rules, while transactions enforce atomic updates of related tables. Cross-service calls (e.g., to the clustering FastAPI) travel through the `/fastapi` proxy middleware, which forwards HTTP requests to the Python microservice with appropriate headers and payloads.

This flow keeps middleware concerns orthogonal to business logic while ensuring authentication, tenant scoping, and validation are executed before any Prisma mutation occurs.

#### Key Module Responsibilities
- **Route orchestration (`routes/routes.ts`)** – Although no dedicated `RouteService.ts` exists, the route module itself acts as the service layer for shuttle routing. It implements superadmin-specific CRUD and organization-scoped user endpoints, performs permission checks with Better Auth, validates organization ownership for related entities (vehicles, shifts, locations), and wraps the create-route flow inside a `prisma.$transaction` block so stops, employee assignment flags, and vehicle availability records update atomically. Update and delete handlers issue targeted Prisma mutations outside a transaction, immediately mirroring availability and assignment flags afterward to keep related tables consistent.
- **VehicleAvailabilityService (`services/vehicleAvailabilityService.ts`)** – Provides two exported utilities:
  - `getAvailableVehicles` filters vehicles by organization, `VehicleStatus`, and existing non-cancelled routes before returning enriched vehicle metadata for scheduling screens.
  - `checkVehicleAvailability` verifies a proposed route window by checking vehicle status flags, overlapping routes, and prior `vehicleAvailability` records. Both helpers surface “available/false + reason” semantics to calling handlers, allowing HTTP responses to accurately reflect scheduling conflicts. A `VehicleAvailabilityService` class offers wrapper methods for legacy callers, and legacy `getAvailableShuttles`/`ShuttleAvailabilityService` maintain backwards compatibility with historic naming.
- **PayrollService (`services/payrollService.ts`)** – Currently encapsulates payroll reporting stubs. Methods such as `generateMonthlyPayroll`, `getMonthlyPayrollByVehicle`, and `processPayroll` return structured payloads describing the requested scope. Although the implementation is placeholder (completing business logic is tracked separately), the interface defines the contract consumed by hypothetical controllers for payroll analytics and export workflows and documents the extension points for the planned automation work.

#### Create Route Sequence (Organization-Scoped Endpoint)
Route creation is implemented inside `routes/routes.ts` under `router.post('/')`. The handler coordinates authentication, validation, availability checks, and persistence. The following pseudo-code mirrors the production implementation and illustrates the full control flow:

```text
handleCreateRoute(request):
  dto = validate(CreateRouteSchema, request.body)
  activeOrgId = request.session?.session?.activeOrganizationId
  assert activeOrgId exists → otherwise 400 “Active organization not found”

  // Authorization & contextual lookups
  hasPermission = auth.api.hasPermission(headers: fromNodeHeaders(request.headers), body: { permissions: { route: ['create'] } })
  abort 403 if Better Auth denies `route:create`
  ensure vehicleId, shiftId, date, locationId present (400 on mismatch)
  location = prisma.location.findFirst({ where: { id: locationId, organizationId: activeOrgId } })
  abort 400 if location missing or cross-tenant

  // Duration guard & shift alignment
  reject if dto.totalTime > 90 minutes (business constraint)
  shift = prisma.shift.findFirst({ where: { id: shiftId, organizationId: activeOrgId } })
  abort 404 if shift missing
  startTime = shift.endTime
  endTime = new Date(startTime + totalTime minutes)

  // Vehicle availability verification
  availability = VehicleAvailabilityService.checkVehicleAvailability({
    vehicleId,
    shiftId,
    proposedDate: new Date(date),
    proposedStartTime: startTime,
    proposedEndTime: endTime,
  })
  abort 400 with `availability.reason` when conflicts detected (maintenance, overlapping routes, etc.)

  // Employee + stop validation
  employeeIds = dto.employees[].employeeId
  stopIds = dto.employees[].stopId
  availableEmployees = prisma.employee.findMany({
    where: { id: { in: employeeIds }, organizationId: activeOrgId, assigned: false },
  })
  abort 400 if counts mismatch (some employees already assigned)
  existingStops = prisma.stop.findMany({
    where: {
      id: { in: stopIds },
      organizationId: activeOrgId,
      employee: { id: { in: employeeIds }, assigned: false },
      routeId: null,
    },
    include: { employee: true },
  })
  abort 400 if stops missing or already bound to routes

  // Atomic persistence layer
  transaction(prisma => {
    newRoute = prisma.route.create({
      data: {
        name,
        vehicleId,
        shiftId,
        locationId,
        date: new Date(date),
        startTime,
        endTime,
        totalDistance,
        totalTime,
        status: 'ACTIVE',
        organizationId: activeOrgId,
      },
    })

    prisma.stop.updateMany({ where: { id: { in: stopIds } }, data: { routeId: newRoute.id, estimatedArrivalTime: new Date() } })
    prisma.employee.updateMany({ where: { id: { in: employeeIds } }, data: { assigned: true } })

    vehicle = prisma.vehicle.findUnique({ where: { id: vehicleId } })
    driverId = vehicle?.driverId ?? prisma.driver.findFirst({
      where: {
        organizationId: activeOrgId,
        isActive: true,
        vehicleAvailability: {
          none: { shiftId, date: new Date(date), available: false }
        }
      }
    })?.id
    abort 500 if driverId missing → surfaces "No available drivers" error

    prisma.vehicleAvailability.upsert({
      where: { vehicleId_shiftId_date: { vehicleId, shiftId, date: new Date(date) } },
      create: {
        vehicle: { connect: { id: vehicleId } },
        shift: { connect: { id: shiftId } },
        organization: { connect: { id: activeOrgId } },
        driver: { connect: { id: driverId } },
        date: new Date(date),
        startTime,
        endTime,
        available: false,
      },
      update: { available: false },
    })
  })

  return 201 with `newRoute`
```

**Notes on orchestration**
- The handler assumes route-stop assignments originate from upstream clustering. When clients need algorithmic assistance, they call the FastAPI microservice through the `/fastapi` proxy prior to invoking this endpoint. The Express server itself does not currently invoke a `ClusteringOrchestrator`; instead, it validates and persists the assignments it receives.
- Optimistic concurrency via a `version` column is not yet implemented. Transactions ensure atomicity, and Prisma’s default isolation level protects against conflicting updates for the scope of the transaction. Introducing versioned `WHERE` clauses would be the next step if multi-writer conflicts become a concern.
- Driver assignment is automatic: if the selected vehicle lacks an attached driver, the handler searches for an active driver without conflicting availability records. If none are free the transaction aborts with a 500 (“No available drivers”).

### 4.2.2 Optimization Service Implementation (Python/FastAPI)

#### API Surface and Contract
The FastAPI app (`clustering/src/main.py`) exposes three routes: `GET /health`, `GET /` (diagnostic), and `POST /clustering`. To guard against overlapping solver runs, the module keeps a module-level `current_task` and cancels any in-flight asyncio task before spawning a new one for an incoming request. The clustering endpoint expects the body to match the `RouteRequest` schema:

```jsonc
{
  "locations": {
    "HQ": [lat, lon],
    "employees": [
      { "id": "emp-1", "latitude": <float>, "longitude": <float> },
      ...
    ]
  },
  "shuttles": [
    { "id": <int>, "capacity": <int> },
    ...
  ]
}
```

On success the endpoint returns:

```jsonc
{
  "success": true,
  "routes": [
    { "shuttle_id": <shuttleId>, "employees": [<employeeId>, ...] },
    ...
  ],
  "verification_passed": <bool>,
  "total_demand": <int>,
  "total_capacity": <int>
}
```

Each `employees` array is ordered according to the solver output. The microservice stops here; it does **not** compute road-network geometry, distances, or ETAs. Those metrics are delegated to the frontend Mapbox helpers described in §4.2.3.

#### Algorithm Identification
`assign_routes.py` constructs a vehicle routing problem (VRP) using **Google OR-Tools**. It combines:
- A custom cost evaluator that blends haversine distance with a bearing-change penalty to discourage sharp turns and long hops.
- Capacity constraints based on the shuttle capacities supplied in the payload (one passenger demand per employee node).
- `PATH_CHEAPEST_ARC` for the initial solution, followed by `GUIDED_LOCAL_SEARCH` metaheuristics with a 30-second limit, a 500-solution cap, `log_search` telemetry, full propagation, and a guided-local-search lambda coefficient of 0.5.

The solver works on a fully connected graph whose weights come from precomputed matrices:
- `calculate_distance_and_bearing_matrix` uses vectorized NumPy haversine calculations and bearing math to populate symmetric distance and directional grids for HQ + employees.
- The cost callback scales distance beyond 3–5 km, penalizes heading changes >120°, and returns an integer cost (`distance_factor * 1000 + bearing_penalty * 800`).

#### Step-by-Step Logic
The control flow inside `assign_routes_endpoint` orchestrates preprocessing and solver invocation:

```python
process_request(payload):
  hq = payload.locations.HQ
  employees = payload.locations.employees
  shuttle_capacities = [shuttle.capacity for shuttle in payload.shuttles]

  locations = [hq] + [[emp.latitude, emp.longitude] for emp in employees]
  distance_matrix, bearing_matrix = calculate_distance_and_bearing_matrix(locations)

  routes = assign_employees_to_shuttles(locations, distance_matrix, bearing_matrix, shuttle_capacities)
  if routes is None: raise 400 "No solution found"

  verification_passed = verify_unique_assignments(routes, len(employees))

  mapped = []
  for shuttle_idx, route in enumerate(routes):
    employee_indices = route[1:]  // drop depot index 0
    assigned = [employees[idx - 1].id for idx in employee_indices]
    mapped.append({
      "shuttle_id": payload.shuttles[shuttle_idx].id,
      "employees": assigned
    })

  return {
    "success": true,
    "routes": mapped,
    "verification_passed": verification_passed,
    "total_demand": len(employees),
    "total_capacity": sum(shuttle_capacities)
  }
```

`assign_employees_to_shuttles` encapsulates the OR-Tools configuration:

```python
manager = pywrapcp.RoutingIndexManager(num_locations, num_shuttles, 0)
routing = pywrapcp.RoutingModel(manager)

def combined_cost_callback(from_index, to_index):
    distance = distance_matrix[from_node][to_node]
    bearing_change = ...  # derived from bearing_matrix and previous node
    distance_factor = 1.2 if distance > 3 else 1.0
    if distance > 5: distance_factor *= 1.3
    bearing_penalty = (bearing_change / 180) * distance * 0.8
    if bearing_change > 120: bearing_penalty *= 1.5
    return int(distance * distance_factor * 1000 + bearing_penalty * 800)

routing.SetArcCostEvaluatorOfAllVehicles(routing.RegisterTransitCallback(combined_cost_callback))

demand_callback_index = routing.RegisterUnaryTransitCallback(lambda i: demand[manager.IndexToNode(i)])
routing.AddDimensionWithVehicleCapacity(demand_callback_index, 0, shuttle_capacities, True, "Capacity")

search = pywrapcp.DefaultRoutingSearchParameters()
search.first_solution_strategy = PATH_CHEAPEST_ARC
search.local_search_metaheuristic = GUIDED_LOCAL_SEARCH
search.time_limit.FromSeconds(30)
search.solution_limit = 500

solution = routing.SolveWithParameters(search)
```

The helper `verify_unique_assignments` simply confirms that all employee nodes (`1..N`) appear exactly once across the returned vehicle tours.

### 4.2.3 Frontend Application Implementation (React)

#### Architecture and State Management
The SPA under `packages/client/src` is composed in `App.jsx`, which layers providers for theming, authentication, roles, organizations, and toasts (`ThemeProvider`, `AuthProvider`, `RoleProvider`, `OrganizationProvider`, `ToastProvider`). Routing is handled by React Router, with `AuthRoute` and `ProtectedRoute` wrappers enforcing Better Auth sessions and role checks before rendering feature routes such as `@pages/RouteManagement` or `@pages/ShuttleManagement`.

Server interactions flow through a single Axios instance (`services/api.js`) that injects Better Auth cookies, handles 401 redirects, and exposes helper methods like `getRoutes`, `createRoute`, and `optimizeClusters`. Rather than relying on TanStack Query or Zustand, module-scoped service classes (for example, `routeService.js`, `shuttleService.js`) provide lightweight in-memory caching; debounced write logic is explicitly implemented where needed (e.g. `shuttleService.js`) and not universally applied. UI components then manage view state with React hooks (`useState`, `useEffect`) and domain contexts. Authentication and tenant metadata come from custom contexts that wrap the Better Auth React client (`lib/auth-client.ts`), while `OrganizationContext/index.tsx` enriches Better Auth organization hooks with additional loading/error state and helper actions (e.g., `inviteMember`, `mapOrgError`). A lightweight toast context plus Sonner’s `<Toaster />` surface global notifications, and `useRouteOptimizer.js` keeps a five-minute memoized cache of Mapbox responses on the client.

#### Route Assignment Experience (`RouteAssignment` flow)
The Route Assignment tab (`pages/RouteManagement/components/RouteAssignment/RouteAssignment.jsx`) operates as the route-assignment wizard described in the design docs. The container component fetches shift options (`shiftService.getAllShifts()`), hydrates routes on shift change (`routeService.getRoutesByShift()`), and hands both datasets to its children. It orchestrates three coordinated components:
- **`Controls.jsx`** receives the pre-fetched `shifts` list from its parent, lets dispatchers search/filter the options, and optionally scopes by location via `locationService.getLocations()`; it does not fetch shifts itself or expose a separate route/time picker.
- **`DataSection.jsx`** reacts to those selections by fetching available employees via `getUnassignedEmployeesByShift` (REST call defined in `services/api.js`), applying client-side filtering/pagination, and presenting the assignment table. When the user selects an employee, it opens the modal and passes the current route list.
- **`AssignmentModal.jsx`** handles the heavy lifting for previewing assignments. It invokes the Mapbox-backed optimization helper (`services/routeOptimization.js`) to render a provisional route on the map, computes metrics, and hands the confirmed assignment to its `onAssign` callback; `DataSection.jsx` owns the actual `routeService.addEmployeeToRoute` mutation plus subsequent list refresh. Capacity guardrails (`route.stops.length < route.shuttle.capacity`) and ID format validation (CUID regex checks) match backend constraints. Upon success, the parent view patches local state so the updated route appears immediately without a full refetch.

Elsewhere in Route Management, `RouteManagementView/index.jsx` pulls route, shuttle, department, and shift inventories in parallel (via cached service calls), applies search/filter logic, and drives drawers or modals for inspection and editing. All of these components rely on the same service layer and shared contexts for permissions.

#### Driver-Facing Surfaces (Current State)
Dispatcher and driver personas both land on the shuttle workspace, where the driver-facing dashboard is implemented using `ShuttleManagement/components/DriverStatus/index.jsx`. That module consumes `driverService.getDrivers()` to surface assigned route IDs, duty state, and shift hours, giving drivers a consolidated manifest without exposing administrative controls. The view is wrapped by the same `AuthRoute`/`OrganizationGuard` stack as management pages, ensuring driver accounts only see their own organization’s data while keeping the portal responsive on mobile devices.

#### Client-Side Route Optimization Heuristic
Two cooperating modules deliver responsive route previews while the backend clustering service runs:
- `services/routeOptimization.js` accepts `{ coordinates, areas }`, calls Mapbox Directions, and adjusts the returned duration to account for per-stop overhead before shipping enriched metrics back to consumers like `AssignmentModal.jsx`.
- `components/Common/Map/services/routeOptimization.js` focuses on rendering: it builds an ordering via a nearest-neighbor heuristic, requests Mapbox geometry with exponential backoff, and falls back to a deterministic HQ→Stops→HQ polyline if Mapbox is unreachable.

The shared hook `useRouteOptimizer.js` caches successful responses so repeat previews reuse the same geometry within five minutes. The nearest-neighbor algorithm and fallback logic mirror the source code:

```Javascript 
getInitialOrder(hqCoords, dropOffPoints):
  visited = [false] * len(dropOffPoints)
  order = []
  current = hqCoords
  while len(order) < len(dropOffPoints):
    nextIndex = findNearestPoint(current, dropOffPoints, visited)
    if nextIndex == -1: break
    order.append(nextIndex)
    visited[nextIndex] = true
    current = dropOffPoints[nextIndex]
  return order

optimizeRoute(coordinates, enableOptimization):
  guard against missing coords or invalid numbers → return fallback
  hq = coordinates[0]; dropOffs = coordinates[1:]
  if !MAPBOX_ACCESS_TOKEN or !enableOptimization → return fallback
  order = getInitialOrder(hq, dropOffs)
  if order empty and dropOffs present → return fallback
  waypoints = [hq] + reorder(dropOffs, order) + [hq]
  url = buildMapboxDirectionsURL(waypoints)
  response = retryFetch(url)  // 3 attempts, exponential backoff
  if response not ok or code != 'Ok' → return fallback
  route = response.routes[0]
  return {
    coordinates: route.geometry.coordinates,
    waypoints: annotateWaypoints(hq, dropOffs, order),
    dropOffOrder: [i + 1 for i in order],
    distance: route.distance,
    duration: route.duration,
    optimized: true
  }

getFallbackRoute(hq, dropOffs):
  chain HQ → dropOffs → HQ
  estimate distance/time with haversine + 40 km/h average speed
  flag optimized:false so the UI can warn users
```
While the rendering helper returns `{ coordinates, waypoints, distance, duration, optimized }`, the assignment helper packages its metrics under a `metrics` object (`{ totalDistance, totalTime, rawData }`). Callers normalize these differences—`AssignmentModal.jsx`, for instance, recomputes haversine totals when Mapbox fails so the UI can still surface distance/time estimates. The frontend therefore produces fast, local previews while deferring canonical routing decisions to the backend OR-Tools service documented in §4.2.2.

## 4.3 Code for Major Functionalities (Annotated Snippets)

### Backend Route Creation (Express + Prisma)
The create-route endpoint (`packages/server/src/routes/routes.ts`) demonstrates how request scope, authorization, validation, and multi-table consistency are orchestrated inside a single handler. The excerpt below preserves control-flow order while trimming validation branches for brevity.

```typescript
router.post('/', requireAuth, validateSchema(CreateRouteSchema, 'body'), async (req, res) => {
  const { employees, ...payload } = req.body as CreateRouteInput;
  const activeOrgId = req.session?.session?.activeOrganizationId;
  if (!activeOrgId) {
    return res.status(400).json({ message: 'Active organization not found' });
  }

  const permissionCheck = await auth.api.hasPermission({
    headers: await fromNodeHeaders(req.headers),
    body: { permissions: { route: ['create'] } },
  });
  if (!permissionCheck.success) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  // …vehicle availability validation omitted…
  const shift = await prisma.shift.findFirst({
    where: { id: payload.shiftId, organizationId: activeOrgId },
  });
  if (!shift) {
    return res.status(404).json({ error: 'Shift not found.' });
  }

  const startTime = shift.endTime;
  const endTime = new Date(startTime.getTime() + (payload.totalTime || 0) * 60000);
  const employeeIds = employees.map((employee) => employee.employeeId);
  const stopIds = employees.map((employee) => employee.stopId);

  await prisma.$transaction(async (tx) => {
    const newRoute = await tx.route.create({
      data: {
        ...payload,
        date: new Date(payload.date),
        organizationId: activeOrgId,
      },
    });

    await tx.stop.updateMany({
      where: { id: { in: stopIds } },
      data: { routeId: newRoute.id, estimatedArrivalTime: new Date() },
    });

    await tx.employee.updateMany({
      where: { id: { in: employeeIds } },
      data: { assigned: true },
    });

    const vehicle = await tx.vehicle.findUnique({ where: { id: payload.vehicleId } });
    let driverId = vehicle?.driverId;
    if (!driverId) {
      const availableDriver = await tx.driver.findFirst({
        where: {
          organizationId: activeOrgId,
          isActive: true,
          vehicleAvailability: {
            none: {
              shiftId: payload.shiftId,
              date: new Date(payload.date),
              available: false,
            },
          },
        },
      });
      if (!availableDriver) {
        throw new Error('No available drivers found for this vehicle.');
      }
      driverId = availableDriver.id;
    }

    await tx.vehicleAvailability.upsert({
      where: {
        vehicleId_shiftId_date: {
          vehicleId: payload.vehicleId,
          shiftId: payload.shiftId,
          date: new Date(payload.date),
        },
      },
      create: {
        vehicle: { connect: { id: payload.vehicleId } },
        shift: { connect: { id: payload.shiftId } },
        organization: { connect: { id: activeOrgId } },
        driver: { connect: { id: driverId } },
        date: new Date(payload.date),
        startTime,
        endTime,
        available: false,
      },
      update: { available: false },
    });

    res.status(201).json(newRoute);
  });
});
```
*This handler begins by enforcing Better Auth permissions, then uses a Prisma transaction so route creation, stop assignment, employee status updates, and vehicle availability state changes either succeed together or fail together; when the chosen vehicle lacks a driver, in-transaction fallback logic selects an available driver or aborts with an error.*

### Tenant Context Hydration (Better Auth Middleware)
Organization-aware routes wrap their controllers with `withOrganization` (`packages/server/src/middleware/organization.ts`) so downstream handlers receive tenant context without repeating boilerplate logic.

```typescript
export function withOrganization(handler: Function) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const orgs = await auth.api.listOrganizations({
      headers: fromNodeHeaders(req.headers),
    });
    if (!orgs?.length) {
      return res.status(403).json({ error: 'No organization access' });
    }

    req.organizations = orgs;
    req.activeOrganization =
      orgs.find((org) => org.id === req.session?.activeOrganizationId) || orgs[0];

    return handler(req, res, next);
  };
}
```
*The middleware raises clear 401/403 errors when session context is missing, then attaches both the organization list and the active organization to the request so feature routes can trust `req.activeOrganization` without repeating Better Auth calls.*

### OR-Tools Heuristic (Python Clustering Service)
The FastAPI microservice (`clustering/src/assign_routes.py`) relies on a custom cost callback that biases the solver toward short legs and smooth turns. The snippet highlights the weighted penalties used when OR-Tools evaluates each hop in the tour.

```python
def combined_cost_callback(from_index: int, to_index: int) -> int:
    from_node = manager.IndexToNode(from_index)
    to_node = manager.IndexToNode(to_index)
    distance = distance_matrix[from_node][to_node]

    bearing = bearing_matrix[from_node][to_node]
    prev_bearing = 0
    if from_node != 0:
        for i in range(num_locations):
            if routing.IsStart(manager.NodeToIndex(i)):
                prev_bearing = bearing_matrix[i][from_node]
                break

    bearing_change = min((bearing - prev_bearing) % 360, (prev_bearing - bearing) % 360)

    distance_factor = 1.2 if distance > 3 else 1.0
    if distance > 5:
        distance_factor *= 1.3

    bearing_penalty = (bearing_change / 180.0) * distance * 0.8
    if bearing_change > 120:
        bearing_penalty *= 1.5

    base_cost = distance * distance_factor * 1000
    return int(base_cost + bearing_penalty * 800)
```
*Distance scaling discourages long detours, while the bearing penalty dampens zig-zag patterns. The callback feeds OR-Tools’ `GUIDED_LOCAL_SEARCH`, producing balanced shuttle tours that respect capacity constraints.*

### Route Assignment Modal (React Client)
On the client, `AssignmentModal.jsx` orchestrates the preview workflow. It validates the candidate employee, delegates geometry to Mapbox, and computes fallback metrics so the UI remains responsive even when external services are slow.

```jsx
useEffect(() => {
  if (!show || !selectedRoute) return;

  const calculateOptimalRoute = async () => {
    setIsLoading(true);
    try {
      if (!employee.stopId || !employee.stop) {
        throw new Error("Employee must have a valid stop location");
      }

      const allStops = [
        ...selectedRoute.stops.map((stop) => ({
          ...stop,
          displayName: stop.employee
            ? `${stop.employee.name} (${stop.employee.area})`
            : stop.area,
        })),
        {
          id: employee.stopId,
          latitude: employee.stop.latitude,
          longitude: employee.stop.longitude,
          area: employee.area || employee.location,
          displayName: `${employee.name} (${employee.area || employee.location})`,
          isNew: true,
        },
      ];

      const validStops = allStops.filter((stop) => stop.latitude && stop.longitude);
      if (!validStops.length) {
        throw new Error("No valid stops found");
      }

      const optimized = await optimizeRoute({
        coordinates: validStops.map((stop) => [stop.longitude, stop.latitude]),
        areas: validStops.map((stop) => stop.displayName),
      });

      let totalDistance = 0;
      for (let i = 0; i < optimized.coordinates.length - 1; i++) {
        const [lon1, lat1] = optimized.coordinates[i];
        const [lon2, lat2] = optimized.coordinates[i + 1];
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        totalDistance += 6371 * c;
      }

      const estimatedTime = Math.ceil((totalDistance / 30) * 60);
      setRouteMetrics({
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalTime: estimatedTime,
      });

      setOptimizedRoute({
        id: selectedRoute.id,
        coordinates: optimized.coordinates,
        areas: optimized.areas,
        stops: validStops,
        status: 'preview',
      });
    } catch (error) {
      toast.error('Failed to create route preview: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  calculateOptimalRoute();
}, [selectedRoute, show, employee]);
```
*The effect-driven workflow keeps the modal responsive: data validation blocks invalid stops early, Mapbox optimization runs asynchronously, and a haversine fallback ensures distance/time metrics are still available.*


## 4.4 Testing Specification and Reports

### 4.4.1 Unit Testing
- **Client contexts**: Tests such as `packages/client/src/__tests__/organization-error-mapping.test.ts` verify pure helpers like `mapOrgError`, ensuring UI messaging aligns with backend error shapes.
- **Auth guards**: `packages/client/src/__tests__/smoke-auth.test.js` renders a minimal `ProtectedRoute` with React Testing Library to confirm role-based access decisions without booting the full app shell.

### 4.4.2 Integration Testing
- **Express smoke suite**: `packages/server/src/tests/api.smoke.test.ts` mounts the aggregated router with Supertest and Vitest, mocking Prisma and notification side effects to validate `/api/debug`, `/api/shuttles`, and `/health` responses.
- **Authentication flow**: `packages/server/src/tests/auth.integration.test.ts` drives sign-up, sign-in, and protected route access against a real `PrismaClient`, asserting tenant scoping, ban enforcement, and session cookie handling.

### 4.4.3 End-to-End (E2E) Testing
- Dedicated end-to-end browser automation is not yet committed. The current workflow relies on integration coverage and manual verification through `pnpm dev`. Cypress/Playwright scaffolding is planned but absent in the repository.

### 4.4.4 Test Results Summary
- **Execution commands**: The root `pnpm test` script is a placeholder that exits immediately; use `pnpm --filter server test` for the Vitest/Prisma backend suite, `pnpm --filter @routegna/client test` for the Jest-based frontend suite, or run `pnpm --filter server exec -- vitest run src/routes.backup/__tests__ --coverage` for the route regression suite. Python API checks live in `clustering/test_api.py` and invoke FastAPI endpoints with the included Docker Compose network.
- **Current coverage**: The latest Vitest coverage run (2025-10-02) over the exercised route regression suite reports 8.26 % statements, 35.74 % branches, 15.88 % functions, and 8.26 % lines. Broader coverage is blocked by failing auth/API smoke harnesses (axios module resolution and tightened auth guards), so expanding fixtures and stabilising those suites remains a priority before re-running full-project coverage.
