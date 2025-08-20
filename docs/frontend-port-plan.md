Frontend Port Plan — Integration & Cleanup (Routegna)

Note: All detailed update logs have been moved to `docs/frontend-port-plan.changelog.md` to keep this plan concise.

Goal: The legacy Shuttle Management frontend has been copied into `packages/client`. We are now systematically fixing linting issues, rebranding from MMCY to Routegna, and integrating with our backend. The focus is on making the existing code work properly in our monorepo environment.

Guiding Principles
- Rebrand fully: replace all MMCY references (case variants) with Routegna; swap logos/assets and visible copy.
- Keep navigation simple: remove any legacy sidebar; use a top navigation bar.
- Align with backend: cookie-based session (`credentials: 'include'`), tenant-aware API calls, and RBAC.
- Keep Vite + pnpm workspace standards. Prefer `fetch` over ad-hoc axios unless already standardized.
- Make incremental, verifiable changes: page-by-page, service-by-service.

Next Plans (Frontend)

- [x] Navigation overhaul: replace Sidebar with structured Top Nav
	- Files: `packages/client/src/components/Common/Layout/TopBar/index.jsx`, `packages/client/src/components/Common/Layout/Sidebar/index.jsx`, `packages/client/src/App.jsx`, `packages/client/src/contexts/SidebarContext/*`, `packages/client/src/styles/*`.
	- Tasks:
		- Add `MainNav` inside TopBar next to the logo showing primary paths: Dashboard, Routes, Vehicles, Employees, Payroll, Settings (role-aware).
		- Create `nav-config.ts` exporting role-based nav schema with optional subpaths (e.g., Routes → List, Assignment, Create).
		- Implement hover dropdowns under each main item to reveal subpaths (simple absolute container; keyboard-focusable; ESC closes).
		- Remove `<Sidebar />` from `App.jsx`, delete SidebarProvider usage, and remove SidebarContext.
		- Update layout paddings to no longer rely on sidebar width variables; ensure content width and top padding account for fixed TopBar.
	- Acceptance: No references to `Sidebar` or `SidebarContext`, main nav is visible in TopBar, hover shows subpaths, keyboard navigation works (Tab/Shift+Tab), current route highlighted.

- [x] Sidebar decommissioning and cleanup
	- Files: `.../Sidebar/index.jsx`, `.../contexts/SidebarContext/*`, any CSS vars referencing `--sidebar-width*`.
	- Tasks:
		- Remove Sidebar component, provider, hooks; delete CSS vars and data attributes like `data-sidebar-collapsed` usages.
		- Refactor `App.jsx` container wrappers to a single responsive content area.
	- Acceptance: Build passes; grep for `Sidebar` and `SidebarContext` returns zero matches under `packages/client/src`.

- Page design QA and responsiveness
	- Scope: `Home`, `Dashboard`, `RouteManagement`, `Shuttle/VehicleManagement`, `EmployeeManagement`, `Payroll`, `Settings`, `notifications`.
	- Tasks per page:
		- Verify mobile (≤640px), tablet (641–1024px), desktop (≥1025px) layouts; remove redundant nested cards and excessive padding.
		- Ensure consistent section headings, spacing scale, and grid usage; prefer one container per page with logical sub-sections.
		- Standardize loading and empty states; confirm Suspense fallbacks are visible and accessible.
	- Acceptance: No horizontal scroll on mobile; Lighthouse Accessibility ≥ 95 on key pages; no nested triple card containers.

- Env/types cleanup (mmcy → hilcoe where applicable)
	- Files: Repo-wide search. Primary env: `packages/client/.env*`, constants in `packages/client/src/data/constants.js` (if any), docs.
	- Tasks:
		- rg search for `MMCY|Mmcy|mmcy|hilcoe` and replace any lingering “mmcy location” strings with “hilcoe” per requirement.
		- Validate rebranding envs like `VITE_HQ_NAME` remain “Routegna (HQ)”.
	- Acceptance: Repo-wide grep for `MMCY|Mmcy|mmcy` returns no results; any intended “hilcoe” references present where required.

- Seed data improvements (realistic demo)
	- File: `packages/server/prisma/seed.ts`.
	- Tasks:
		- Add 2–3 more departments, 15–25 employees distributed across shifts and departments with realistic locations.
		- Ensure each vehicle has a driver; add 1–2 additional vehicles and availability records for morning/evening.
		- Create a second route with 3–5 stops; ensure stop orders and coordinates are valid.
		- Add a second manager/admin user for coverage per tenant; keep shared demo password.
	- Acceptance: Prisma seed runs without error; verification logs reflect increased counts; UI pages load meaningful data immediately after `pnpm -C packages/server prisma db seed`.

- Toasts consolidation to latest `sonner`
	- Files: components using `use-toast.jsx` or custom `Toaster`, e.g., `packages/client/src/components/Common/UI/use-toast.jsx`, `.../UI/Toaster/*`, plus pages/components importing `useToast`.
	- Tasks:
		- Replace `useToast` usage with `import { toast } from 'sonner'` and call `toast.success|error|warning|info` accordingly.
		- Keep a single `<Toaster />` mounted (prefer the existing one in `App.jsx`); remove duplicate Toaster mounts (e.g., in `main.jsx`).
		- Delete custom toast implementation files after migration; adjust styling via Sonner props.
	- Acceptance: `rg "use-toast"` returns zero matches; only `sonner` is used for toasts; duplicate Toaster mounts removed; visual regression minimal.

- API alignment and error sweep
	- Files: services under `packages/client/src/services/*.js` and `packages/client/src/pages/Settings/services/*.js`.
	- Tasks:
		- Verify each service method points to an existing server route; remove calls to non-existent endpoints and provide safe fallbacks (return empty arrays/objects with toasts).
		- Ensure all axios/fetch calls include `credentials: 'include'`; confirm global 401→/auth/login and 403→/unauthorized behaviors.
		- Add light zod/yup client-side validation where responses are consumed to prevent runtime crashes on partial data.
	- Acceptance: Navigating each page yields no red console errors; network calls resolve to existing endpoints; degraded states handled gracefully.

- Dev ergonomics and docs
	- Files: `packages/client/README.md`, `docs/frontend-port-plan.md`.
	- Tasks:
		- Document `VITE_ENABLE_STRICT_MODE` dev flag behavior and recommend disabling for network-chatter reduction during debugging.
		- Note Socket.IO WebSocket-only transport preference in `src/lib/socket.ts` and rationale.
	- Acceptance: README updated; team can replicate settings without asking in chat.

- Build and tests
	- Files: `packages/client/package.json`, potential test harness in `packages/client/src/test/*`.
	- Tasks:
		- Ensure `pnpm -C packages/client build` passes; add a minimal e2e smoke for auth happy-path and role guards.
	- Acceptance: Clean build; smoke test passes locally.

Environment Variables
- `VITE_API_BASE` (default: `http://localhost:3001` in `.env`; same-origin in dev via proxy).
- `VITE_API_URL` (legacy compatibility; used as fallback).
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
rg -n "MMCY|Mmcy|mmcy|MMCY Tech|MMCYTech" packages/client -g '!dist' '!**/dist/**' || true
# Replace carefully (confirm each change or run scoped replacements per folder/filetype). Avoid touching built files under dist.
```

Page Verification Loop (per page)
```fish
pnpm -C packages/client typecheck
pnpm -C packages/client dev
# Navigate to the route in the browser; fix imports/types; verify 401→/login and 403→Forbidden.
```

