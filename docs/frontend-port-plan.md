Frontend Port Plan — Post-Copy Migration (Routegna)

Goal: We have copied the legacy Shuttle Management frontend wholesale into `packages/client`. Now we will systematically rebrand, integrate, and harden it to work in this monorepo and with our backend. All references to MMCY (names, logos, assets, data) must be removed or replaced with Routegna.

Guiding Principles
- Rebrand fully: replace all MMCY references (case variants) with Routegna; swap logos/assets and visible copy.
- Keep navigation simple: remove any legacy sidebar; use a top navigation bar.
- Align with backend: cookie-based session (`credentials: 'include'`), tenant-aware API calls, and RBAC.
- Keep Vite + pnpm workspace standards. Prefer `fetch` over ad-hoc axios unless already standardized.
- Make incremental, verifiable changes: page-by-page, service-by-service.

Current State Snapshot
- Copied legacy frontend into `packages/client` (includes its own tooling configs and possibly `node_modules`).
- Repo uses pnpm and a monorepo structure; server is under `packages/server` (or `server/` here). We will align client dependencies and scripts to pnpm.

Migration Phases

1) Workspace Integration
- Package manager & locks:
  - Remove legacy lockfiles in `packages/client` (e.g., `package-lock.json`, `yarn.lock`) if present.
  - Prefer pnpm; ensure root `pnpm-workspace.yaml` includes `packages/*` (already present).
- Node modules hygiene:
  - Delete `packages/client/node_modules` to avoid mismatched deps; reinstall via pnpm.
- Package.json normalization:
  - Set `name` to `@routegna/client` (or `client`).
  - Ensure scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test` use Vite/Vitest.
  - Remove unused jest/babel configs if migrating to Vitest; or keep temporarily until tests port.
- TS & Vite config:
  - Verify `tsconfig.json` path aliases and `vite.config.*` align with our structure (consider alias `~` → `/src`).
  - Confirm `index.html` uses our CSP and meta conventions.

2) Rebranding & Asset Cleanup
- String replacement (code and content):
  - Replace across `packages/client/src` and `packages/client/public`:
    - "MMCY" → "Routegna"
    - "Mmcy" → "Routegna"
    - "mmcy" → "routegna"
- Logos & images:
  - Replace any MMCY logos under `public/` or `src/assets/` with Routegna assets.
  - Update favicon and manifest if present.
- Theming/branding:
  - Tailwind/CSS variables: update brand palette, component tokens, and titles.
  - Replace document titles and any hardcoded org strings.

3) Navigation Layout
- Remove legacy sidebar/navigation components.
- Introduce a top navigation bar consistent with our `AppLayout` pattern.
- Ensure lazy route-based code splitting where useful.

4) Auth & Session Wiring
- API client:
  - Standardize on `src/lib/api.ts` (or implement) that wraps `fetch` with `credentials: 'include'` and a base URL from `VITE_API_BASE` (default same-origin).
- Session endpoints:
  - Use `/auth/me` to resolve the current session.
  - On 401 → redirect to `/login`; on 403 → show Forbidden (or `/unauthorized`).
- Guards & contexts:
  - Implement/align `AuthContext` and `ProtectedRoute` to use the above logic.

5) Multi‑Tenancy & RBAC
- Roles supported on client: `admin`, `administrator`, `fleetManager`, `user`.
- Ensure UI conditionals and route guards respect roles.
- Pass tenant information as required by backend (header or cookie); ensure all service calls include it.

6) Page‑By‑Page Adaptation (and Services)
- Routes (`/routes`):
  - Services: refactor to `/api/routes` via shared API client.
  - Verify list/detail views and map integrations (Mapbox) still work under Vite.
- Vehicles (`/vehicles`):
  - Replace shuttle→vehicle in code and UI. Endpoints: `/api/shuttles` (legacy vehicle routes) and categories if applicable.
- Employees/Departments (`/employees`, supporting `/api/departments`):
  - Wire both services; ensure tenant-aware selections.
- Shifts (`/shifts`):
  - Align endpoints and time handling.
- Notifications (`/notifications`):
  - Use `/api/notifications`; basic list and read/unread toggle.
- Search (`/search`):
  - Implement against `/api/search?q=` with sensible debouncing and results table.

7) Remove Legacy/Unused Features
- Remove recruitment or any modules out of scope.
- Drop any leftover admin panels not aligned with our RBAC.
- Delete leftover workers/components not used after the port.

8) Testing & Quality
- Prefer Vitest + React Testing Library for UI tests.
- Add smoke tests that render main routes and assert guards:
  - `/` (Dashboard), `/routes`, `/vehicles`, `/employees`, `/notifications`.
- Mock `/auth/me` via MSW for 401/403 flows.
- Lint & typecheck must pass in CI.

9) Security & Hardening
- Add/confirm CSP meta tag, `rel="noopener noreferrer"` etc.
- Ensure no secrets in the frontend; document envs.
- Optional: Sentry/monitoring hook if desired.

10) Branching & Delivery
- Continue work on `tempo/port-frontend`.
- Once stable, create a clean PR branch `develop-client` with squashed commits.
- Provide migration notes in `packages/client/README.md`.

Environment Variables
- `VITE_API_BASE` (default: same-origin).
- `VITE_ENABLE_MSW` (optional, for local mocks).

Operational Checklists

Initial Clean & Install (fish)
```fish
# from repo root
rm -rf packages/client/node_modules
rm -f packages/client/package-lock.json packages/client/yarn.lock
pnpm -C packages/client install
pnpm -C packages/client typecheck
pnpm -C packages/client dev
```

Global Rebranding Sweep (fish)
```fish
rg -n "MMCY|Mmcy|mmcy" packages/client || true
# Replace carefully (confirm each change or run scoped replacements per folder/filetype)
```

Page Verification Loop (per page)
```fish
pnpm -C packages/client typecheck
pnpm -C packages/client dev
# Navigate to the route in the browser; fix imports/types; verify 401→/login and 403→Forbidden.
```

Deliverables
- Client runs with Vite (pnpm) and loads core routes.
- No MMCY references (names, logos, copy) remain.
- Navbar replaces sidebar; layout consistent with Routegna.
- API client uses cookie sessions; tenant/rbac working on guarded routes.
- Smoke tests and basic docs updated.

Progress Tracker
- [ ] Workspace integrated (pnpm, configs aligned)
- [ ] Rebranding sweep (strings, assets, titles)
- [ ] Top navigation in place (sidebar removed)
- [ ] Auth/session wired (401/403 flows)
- [ ] Routes page adapted
- [ ] Vehicles page adapted
- [ ] Employees/Departments adapted
- [ ] Shifts adapted
- [ ] Notifications adapted
- [ ] Search adapted
- [ ] Legacy/unused removed
- [ ] Tests passing (smoke + guards)
- [ ] Docs updated, PR prepared

Backend Alignment (APIs, Auth, Roles)
- API base: `/api` mounted in `app.ts`; Auth base: `/auth`.
- CORS: server enforces `CORS_ORIGINS` allowlist. For local dev, set `CORS_ORIGINS=http://localhost:5173` (or your Vite dev URL) on the server; client must send `credentials: 'include'`.
- Rate limiting: in-memory limiter returns 429 with `Retry-After`. Frontend should show a friendly message and optionally retry.
- Session: `/auth/sign-in` sets `session` httpOnly cookie; `/auth/me` reads it; `/auth/logout` clears it. Handle 401 by redirecting to `/login`; show ban info for 403 with `{ error: 'Account is banned', reason }`.
- Roles: Two styles appear in backend:
  - Uppercase (auth middleware): `ADMIN`, `MANAGER` (via `requireRoles`)
  - Lowercase (resource routes): `admin`, `administrator`, `fleetManager` (via `requireRole`)
  - Frontend should normalize user roles (e.g., map uppercase to lowercase) and gate UI for: `admin`, `administrator`, `fleetManager`, `user`.

API Surface (confirmed endpoints)
- Auth (`/auth`):
  - POST `/sign-in` and `/sign-in/email` → body `{ email, password }` → sets cookie; returns `{ user: { id, email, tenantId, role } }`
  - GET `/me` → returns user or 401
  - POST `/logout` → clears cookie
- Routes (`/api/routes`):
  - GET `/` → list non-deleted routes with `vehicle`, `shift`, and `stops.employee`
  - GET `/unique-locations` → routes with `uniqueLocations` derived from employee locations
  - GET `/:id` → a single route
  - GET `/shift/:shiftId` → routes for shift
  - GET `/:routeId/stops` → all stops for a route
  - POST `/` → create route. Important constraints enforced by server:
    - `totalTime` must be <= 90 minutes
    - `shuttleId` maps to `vehicleId`; vehicle must exist and have an assigned `driverId`
    - Each employee must be unassigned; stops must belong to those employees and not be assigned to any route
    - Transaction marks employees assigned, associates stops, upserts `VehicleAvailability`
- Shuttles/Vehicles (`/api/shuttles`):
  - GET `/` → active vehicles; GET `/deleted` → soft-deleted
  - GET `/:id` → single vehicle
  - POST `/` → create vehicle. Body mapping: `{ name, licensePlate -> plateNumber, categoryId, dailyRate, capacity, model?, type? ('in-house'|'outsourced'), vendor? }`
  - PUT `/:id` → partial update; same field mapping rules
  - DELETE `/:id` → soft-delete
  - PATCH `/:id/status` → `{ status: 'active'|'maintenance'|'inactive', lastMaintenance?, nextMaintenance? }`
  - POST `/:id/restore` → restore soft-deleted vehicle
- Search (`/api/search`):
  - GET with query params: `?query=...&limit=20&isRouteQuery=true&role=...` (or `forceRole` for debug)
  - Returns mixed results: `route`, `department`, `vehicle`, and for admin: `employee`; for admin/manager: `driver`; plus `shift` entries.
- Other mounted base paths (to integrate later): `/employees`, `/departments`, `/drivers`, `/shuttle-categories`, `/clusters`, `/notifications`, `/vehicle-requests`, `/shifts`.

Service Contracts (frontend adapters)
- `authClient`:
  - `signIn(email, password)` → POST `/auth/sign-in` with `credentials: 'include'`
  - `me()` → GET `/auth/me` → on 401 clear client session and redirect
  - `logout()` → POST `/auth/logout`
- `routeService`:
  - `list()` → GET `/api/routes`
  - `get(id)` → GET `/api/routes/${id}`
  - `listByShift(shiftId)` → GET `/api/routes/shift/${shiftId}`
  - `stops(routeId)` → GET `/api/routes/${routeId}/stops`
  - `uniqueLocations()` → GET `/api/routes/unique-locations`
  - `create(payload)` → POST `/api/routes` (client validation mirrors server constraints; map `vehicleId` → `shuttleId` when calling server)
- `vehicleService`:
  - `list()` → GET `/api/shuttles`
  - `get(id)` → GET `/api/shuttles/${id}`
  - `create(dto)` → POST `/api/shuttles` (map UI `licensePlate` to server `licensePlate` which becomes DB `plateNumber`)
  - `update(id, dto)` → PUT `/api/shuttles/${id}`
  - `remove(id)` → DELETE `/api/shuttles/${id}`
  - `updateStatus(id, body)` → PATCH `/api/shuttles/${id}/status`
  - `listDeleted()` and `restore(id)` for deleted items
- `searchService`:
  - `search(q, opts)` → GET `/api/search` with `query`, `limit`, `isRouteQuery`, optional `role`

RBAC & Tenant Rules (frontend behavior)
- Normalize roles from session to one canonical set: `{ admin, administrator, fleetManager, user }`.
- Gate routes and controls based on roles used in backend:
  - Routes read endpoints require one of: `admin`, `administrator`, `fleetManager`.
  - Vehicle create/update likely manager/admin (confirm per route when wiring pages).
- Tenant: server derives `tenantId` from session; no extra client header is required. Avoid cross-tenant navigation by construction. Keep a (future) tenant switcher if needed; all calls remain credentialed.

HTTP Semantics & Error Handling
- Always call `fetch` with `{ credentials: 'include' }`.
- Handle JSON validation errors (400) with `errors: []` shape for some endpoints (e.g., vehicles).
- Handle 401 (not authenticated) → redirect; 403 (forbidden/banned) → show message; 404 → toast; 429 → rate limit notice and retry suggestion.

Environment Matrix (client + server)
- Client:
  - `VITE_API_BASE` → usually same-origin; if cross-origin, ensure server `CORS_ORIGINS` includes the Vite origin.
  - `VITE_ENABLE_MSW` (optional)
  - `VITE_MAPBOX_TOKEN` if map features are enabled
- Server:
  - `CORS_ORIGINS` (comma-separated), `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`

Page-Specific Notes from Backend
- Routes creation must enforce:
  - totalTime <= 90 minutes; startTime derives from `shift.endTime`; endTime = start + totalTime
  - Vehicle must exist and have `driverId`
  - Employees must be unassigned and their stops unassigned
  - On success, employees become assigned; VehicleAvailability entry is upserted
- Vehicles (shuttles):
  - Model uses `plateNumber` internally; UI should still display/edit `licensePlate` and map it in service
  - Soft delete and restore supported; status lifecycle includes `maintenance`

Testing Additions (based on backend)
- Auth flow test: sign-in → `/auth/me` → protected API 200; logout → protected API 401.
- Role-gate tests: mock session role and ensure gated UI controls hidden/disabled.
- Routes creation client validation mirrors server constraints; unit test DTO mapping (`vehicleId`→`shuttleId`).
- Search integration test: assert mixed result types are rendered correctly.

