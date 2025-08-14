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
 - [ ] tempo branch created
 - [ ] Find old frontend path
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
