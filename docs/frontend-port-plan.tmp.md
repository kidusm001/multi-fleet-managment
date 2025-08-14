Frontend port plan (disposable)

Goal: Copy the old frontend into `packages/client`, replace legacy name occurrences (MMCY -> Routegna), remove the old sidebar and replace with a top navigation bar, and update routing/pages to be fast and correct. Align client with backend realities: cookie session, tenant-aware API calls, RBAC roles, and CORS.

Important rule: DO NOT copy any literal string 'MMCY' into the new code; replace all occurrences with the new app name: "Routegna".

High-level steps:

1) Branching
   - Create a temporary branch for the port work: `tempo/port-frontend`.
   - Work in that branch until the port is stable, then produce a clean PR branch `develop-client` with squashed commits.

2) Discovery
   - Find the old frontend source tree in the old project (ask user or search the repo for candidate folders). Do not assume any path.
   - Identify public assets and environment variables required by the client.

3) Copying
   - Copy the minimal source files into `packages/client/src/` (pages, components, assets) preserving history if possible, otherwise copy-as-new.
   - Immediately run a global replace to swap 'MMCY' and variants with 'Routegna' (case-preserving): MMCY -> Routegna, mmcy -> routegna, Mmcy -> Routegna.

4) Restructure / Cleanup (backend-informed)
   - Replace sidebar components with a top navigation bar.
   - Ensure route-based code-splitting using dynamic imports where appropriate.
   - Remove any build-time references to the old project name in package.json, README, and meta tags.
   - RBAC roles to support on client: `admin`, `administrator`, `fleetManager`, `user`.
   - API base: `/api` for data routes and `/auth` for session; use `fetch`/axios with `credentials: 'include'` (cookies).
   - Handle 401 by redirecting to login; handle 403 by showing Forbidden.

5) Routing and Pages (backend-informed)
   - Verify `react-router` routes map to pages and make sure each page exports a default component.
   - Add small wrapper components for fast loading and skeleton states.
    - Ensure Vite dev build works and `pnpm -w -C packages/client dev` starts without errors.
    - Initial pages backed by server endpoints:
       - Dashboard (calls `/auth/me` to resolve session + shows counts via `/api/search` aggregates later)
       - Routes (`/api/routes` list, view)
       - Vehicles (`/api/shuttles` legacy vehicle routes)
       - Departments/Employees (`/api/departments`, `/api/employees`)
       - Shifts (`/api/shifts`)
       - Notifications (`/api/notifications`)
       - Search (`/api/search?q=`)

6) Tests
   - Add a small smoke test with Vitest + Playwright (or RTL) to assert the main routes render.
   - Mock cookie-based session for `/auth/me` using MSW; test 401 guard redirects.

7) Documentation & finalization
   - Update `packages/client/README.md` with setup and the replacement naming note.
   - Create a PR branch from the tempo branch: `feature/frontend-routegna` (or directly update `develop-client`).
   - Document environment variables: `VITE_API_BASE` (defaults to same-origin), `VITE_ENABLE_MSW` for local mocks.

Checklist (quick):
 - [x] tempo branch created
 - [x] Find old frontend path
 - [ ] Copy files
 - [ ] Replace MMCY -> Routegna
 - [ ] Remove sidebar, add nav bar
 - [ ] Run vite dev and fix errors
 - [ ] Add smoke tests
 - [ ] Prepare PR
 - [ ] Wire API client with cookie sessions and 401/403 handling
 - [ ] Add CSP meta tag and safe link rel attrs

Notes:
- I will not blindly copy any files until you confirm the source path or approve that I search and copy. This avoids accidentally porting proprietary or unwanted content.

---

Copy Plan (concrete)

Sources discovered (read-only):
- SM legacy UI: `/home/leul/Documents/Github/shuttle-management/packages/frontend/src`
- Routegna UI kit: `/home/leul/Documents/Github/routegna-shuttle-nexus/src`

Targets (this repo):
- New app: `/home/leul/Documents/Github/multi-fleet-managment/packages/client/src`
- Public assets: `/home/leul/Documents/Github/multi-fleet-managment/packages/client/public`

Conventions:
- Copy one file at a time; after each copy run `pnpm -C packages/client typecheck` and fix issues.
- Replace strings: MMCY → Routegna (and case variants) as you touch each file.
- Do NOT bring any sidebar component; we keep the new top navbar in `layouts/`.

Page-By-Page Copy Order (Incremental Testing)

Objective: For each page, copy only the required services/components (and workers if needed), wire the route, and verify in the browser before moving on. This keeps failures localized and fast to fix.

Prereqs (run once):
- mkdir -p packages/client/src/{components,components/ui,services,workers,utils,hooks,contexts,pages}
- Ensure `AppLayout.tsx` has nav links to enabled routes only; add links as you complete pages.
- Each time you copy a file from `.jsx` to `.tsx`, adjust React/TS types and imports immediately.

Phase 1 — Routes page (`/routes`)
- Services needed:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/routeService.js packages/client/src/services/routeService.ts
- Page:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/pages/RouteManagement/index.jsx packages/client/src/pages/Routes.tsx
- UI (if needed initially):
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/{table.tsx,input.tsx,button.tsx,card.tsx} packages/client/src/components/ui/
- Adaptations after copy:
   - Update `routeService.ts` to use `~/lib/api` (fetch with credentials) and endpoints `/api/routes`.
   - In `Routes.tsx`, fix imports to local paths and TS types; remove/replace any sidebar references.
- Wire route: add `<Route path="/routes" element={<RoutesPage/>} />` and a nav link.
- Test:
   - pnpm -C packages/client typecheck
   - pnpm -C packages/client dev
   - Visit `/routes`; verify list renders; 401 redirects to `/login` when logged out.

Phase 2 — Vehicles page (`/vehicles`)
- Services needed:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/shuttleService.js packages/client/src/services/vehicleService.ts
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/shuttleCategoryService.js packages/client/src/services/vehicleCategoryService.ts
- Page:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/pages/ShuttleManagement/index.jsx packages/client/src/pages/Vehicles.tsx
- UI:
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/{table.tsx,select.tsx,badge.tsx,input.tsx,button.tsx,card.tsx} packages/client/src/components/ui/
- Adaptations:
   - Replace all `shuttle*` wording with `vehicle*` in file names, symbols, and UI labels.
   - Update endpoints to `/api/shuttles` (legacy vehicle routes) and `/api/shuttle-categories` if applicable.
- Wire route and test similar to Phase 1.

Phase 3 — Employees page (`/employees`)
- Services:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/employeeService.js packages/client/src/services/employeeService.ts
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/departmentService.js packages/client/src/services/departmentService.ts
- Page:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/pages/EmployeeManagement/index.jsx packages/client/src/pages/Employees.tsx
- UI:
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/{table.tsx,select.tsx,form.tsx,input.tsx,button.tsx,dialog.tsx} packages/client/src/components/ui/
- Adaptations:
   - Point services to `/api/employees` and `/api/departments`.
   - Ensure tenant-aware selection values (departments) are fetched via our endpoints.
- Wire + test.

Phase 4 — Notifications page (`/notifications`)
- Services:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/notificationApi.ts packages/client/src/services/notificationApi.ts
- Page:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/pages/notifications/index.jsx packages/client/src/pages/Notifications.tsx
- UI:
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/{alert.tsx,toaster.tsx,toast.tsx,badge.tsx} packages/client/src/components/ui/
- Adaptations:
   - Use `/api/notifications`; wire a basic list and read/unread toggle.
- Wire + test.

Phase 5 — Search page (`/search`)
- Services:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/searchService.js packages/client/src/services/searchService.ts
- Page (create new simple page):
   - touch packages/client/src/pages/Search.tsx and implement using `searchService` against `/api/search?q=`
- UI:
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/{input.tsx,table.tsx,skeleton.tsx} packages/client/src/components/ui/
- Wire + test.

Phase 6 — Dashboard page (`/`)
- Services (reuse minimal calls):
   - Use `searchService` or add small helpers in `routeService/vehicleService` for counts.
- Page:
   - Keep our current `Dashboard.tsx` and incrementally enrich.
   - Optionally copy legacy as reference: `cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/pages/Dashboard/index.jsx packages/client/src/pages/Dashboard.legacy.tsx`
- UI:
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/{card.tsx,chart.tsx,badge.tsx} packages/client/src/components/ui/
- Test home loads and shows session user.

Phase 7 — Unauthorized page (optional)
- Page:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/pages/Unauthorized.jsx packages/client/src/pages/Unauthorized.tsx
- Adjust `ProtectedRoute` to navigate to `/unauthorized` on 403 (keep `/login` for 401).
- Wire + test 403 flow (use an account lacking required role).

Workers (copy only when needed by a page)
- Copy destination dir:
   - mkdir -p packages/client/src/workers
- Examples to copy (defer unless required by a page):
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/workers/* packages/client/src/workers/
- Vite Worker usage pattern:
   - new Worker(new URL('../workers/<name>.ts', import.meta.url), { type: 'module' })
- TS config note:
   - If workers use `self` or Worker types, ensure `tsconfig.app.json` has `"lib": ["ES2020", "DOM", "WebWorker"]`.

Step 0 — prepare dirs (idempotent)
- mkdir -p packages/client/src/components/ui
- mkdir -p packages/client/src/pages
- mkdir -p packages/client/src/services
- mkdir -p packages/client/public/assets

Step 1 — UI primitives from Routegna UI kit (shadcn-based)
- Copy only essentials first; skip any `sidebar.tsx`/`navigation.tsx`.
- Commands (fish):
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/button.tsx packages/client/src/components/ui/
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/input.tsx packages/client/src/components/ui/
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/card.tsx packages/client/src/components/ui/
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/table.tsx packages/client/src/components/ui/
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/badge.tsx packages/client/src/components/ui/
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/alert.tsx packages/client/src/components/ui/
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/skeleton.tsx packages/client/src/components/ui/
   - cp /home/leul/Documents/Github/routegna-shuttle-nexus/src/components/ui/pagination.tsx packages/client/src/components/ui/

Step 2 — Pages (see Page-By-Page section for exact order)
- Follow phases 1–7. Copy only the current phase’s files, adapt, then test before continuing.

Step 3 — Services/APIs (port to fetch + cookies)
- Strategy: copy service files, then refactor to use `src/lib/api.ts` (fetch with credentials). Rename shuttle → vehicle in filenames and APIs.
- Copy candidates (one by one):
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/routeService.js packages/client/src/services/routeService.ts
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/shuttleService.js packages/client/src/services/vehicleService.ts
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/departmentService.js packages/client/src/services/departmentService.ts
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/employeeService.js packages/client/src/services/employeeService.ts
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/shiftService.js packages/client/src/services/shiftService.ts
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/notificationApi.ts packages/client/src/services/notificationApi.ts
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/searchService.js packages/client/src/services/searchService.ts
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/services/shuttleCategoryService.js packages/client/src/services/vehicleCategoryService.ts
- For each file after copying:
   - Replace imports to use `~/lib/api` methods.
   - Update endpoints to our server routes (e.g., `/api/routes`, `/api/shuttles` for legacy vehicles, `/api/departments`, `/api/employees`, `/api/shifts`, `/api/notifications`, `/api/search`).
   - Replace `shuttle` wording with `vehicle` in types, names, and UI labels.

Step 3.1 — Components beyond UI kit (Common, special widgets)
- Copy selectively when a page requires them, then adapt to our style/layout.
- Examples:
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/components/Common/* packages/client/src/components/
   - cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/components/ExportPopup.jsx packages/client/src/components/ExportPopup.tsx
   - (Optional, defer) cp /home/leul/Documents/Github/shuttle-management/packages/frontend/src/components/ShuttleNetwork3D.tsx packages/client/src/components/VehicleNetwork3D.tsx

Step 4 — Public assets
- Copy only needed images/icons; skip index.html as ours has CSP already.
- Example:
   - cp -r /home/leul/Documents/Github/shuttle-management/packages/frontend/public/assets/* packages/client/public/assets/

Step 5 — Wire routes in App.tsx
- Add routes for new pages under ProtectedRoute:
   - `/routes` → `pages/Routes.tsx`
   - `/vehicles` → `pages/Vehicles.tsx`
   - `/employees` → `pages/Employees.tsx`
   - `/notifications` → `pages/Notifications.tsx`
   - `/unauthorized` → `pages/Unauthorized.tsx` (if kept)

Step 6 — Verification loop per copy (run each time)
- pnpm -C packages/client typecheck
- pnpm -C packages/client dev
- Navigate to the new route; fix imports/types; confirm 401→/login and 403→Forbidden behavior remains intact.

Step 7 — Mechanical renames and text
- Grep and replace within copied files (scoped) before committing:
   - grep -RIn "MMCY\|Mmcy\|mmcy" packages/client/src || true
   - For each match, replace with "Routegna" (case-appropriate).
   - Example with sed (case-specific):
      - sed -i 's/MMCY/Routegna/g' packages/client/src/**/*.tsx
      - sed -i 's/mmcy/routegna/g' packages/client/src/**/*.tsx

Step 8 — Clean up leftovers
- Remove any unused copied components and any sidebar/navigation pieces brought accidentally.
- Ensure no references to old envs, build scripts, or axios defaults remain.

Notes for future increments
- If additional UI primitives are needed, copy from Routegna UI kit `src/components/ui/*` as required.
- Some SM pages (About, Home, Profile, Settings, Payroll) are out of current scope and should be skipped unless explicitly requested.
