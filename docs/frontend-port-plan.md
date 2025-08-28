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

- [x] Page design QA and responsiveness
	- Scope: `Home`, `Dashboard`, `RouteManagement`, `Shuttle/VehicleManagement`, `EmployeeManagement`, `Payroll`, `Settings`, `notifications`.
	- Tasks per page:
		- Verify mobile (≤640px), tablet (641–1024px), desktop (≥1025px) layouts; remove redundant nested cards and excessive padding.
		- Ensure consistent section headings, spacing scale, and grid usage; prefer one container per page with logical sub-sections.
		- Standardize loading and empty states; confirm Suspense fallbacks are visible and accessible.
	- Acceptance: No horizontal scroll on mobile; Lighthouse Accessibility ≥ 95 on key pages; no nested triple card containers.
	- Final Verification (2025-08-29): Responsive passes at 375/768/1280px with no horizontal scroll; heading hierarchy normalized; removed excessive nested cards; accessible loading fallbacks present.

 - [x] Env/types cleanup (mmcy → hilcoe where applicable)
	- Files: Repo-wide search. Primary env: `packages/client/.env*`, constants in `packages/client/src/data/constants.js` (if any), docs.
	- Tasks:
		- rg search for `MMCY|Mmcy|mmcy|hilcoe` and replace any lingering “mmcy location” strings with “hilcoe” per requirement.
		- Validate rebranding envs like `VITE_HQ_NAME` remain “Routegna (HQ)”.
	- Acceptance: Repo-wide grep for `MMCY|Mmcy|mmcy` returns no results; any intended “hilcoe” references present where required.
	- Verification (2025-08-28): Repo-wide search returned no matches for `MMCY|Mmcy|mmcy`; existing intended `hilcoe` references preserved; no environment or constants file contained legacy brand identifiers. Acceptance criteria met.

- [x] Seed data improvements (realistic demo)
	- File: `packages/server/prisma/seed.ts`.
	- Tasks:
		- Add 2–3 more departments, 15–25 employees distributed across shifts and departments with realistic locations.
		- Ensure each vehicle has a driver; add 1–2 additional vehicles and availability records for morning/evening.
		- Create a second route with 3–5 stops; ensure stop orders and coordinates are valid.
		- Add a second manager/admin user for coverage per tenant; keep shared demo password.
	- Acceptance: Prisma seed runs without error; verification logs reflect increased counts; UI pages load meaningful data immediately after `pnpm -C packages/server prisma db seed`.
	- Final Verification (2025-08-29): Seed expanded (additional departments, employees, drivers, vehicles, second route, second manager); upserts remain idempotent; verification logs show increased counts.

- [x] Toasts consolidation to latest `sonner`
	- Files: components using `use-toast.jsx` or custom `Toaster`, e.g., `packages/client/src/components/Common/UI/use-toast.jsx`, `.../UI/Toaster/*`, plus pages/components importing `useToast`.
	- Tasks:
		- Replace `useToast` usage with `import { toast } from 'sonner'` and call `toast.success|error|warning|info` accordingly.
		- Keep a single `<Toaster />` mounted (prefer the existing one in `App.jsx`); remove duplicate Toaster mounts (e.g., in `main.jsx`).
		- Delete custom toast implementation files after migration; adjust styling via Sonner props.
	- Acceptance: `rg "use-toast"` returns zero matches; only `sonner` is used for toasts; duplicate Toaster mounts removed; visual regression minimal. (Status: COMPLETED ✅ – legacy `use-toast.jsx` and custom `Toaster` removed, ShuttlePreview migrated, repository now exclusively uses `sonner` helpers.)

		- Final Verification (2025-08-28): Confirmed single `<Toaster />` (direct import from `sonner`) mounted in `App.jsx`. Removed legacy Radix toast files (`use-toast.jsx`, `UI/Toaster/index.jsx`) and unused wrapper (`sonner.tsx`). All toast calls standardized to `toast.success|error|warning|info` with optional JSX nodes; no stale imports remain. Migration locked.

 - [x] API alignment and error sweep
	- Files: services under `packages/client/src/services/*.js` and `packages/client/src/pages/Settings/services/*.js`.
	- Tasks:
		- Verify each service method points to an existing server route; remove calls to non-existent endpoints and provide safe fallbacks (return empty arrays/objects with toasts).
		- Ensure all axios/fetch calls include `credentials: 'include'`; confirm global 401→/auth/login and 403→/unauthorized behaviors.
		- Add light zod/yup client-side validation where responses are consumed to prevent runtime crashes on partial data.
	- Acceptance: Navigating each page yields no red console errors; network calls resolve to existing endpoints; degraded states handled gracefully.
	- Final Verification (2025-08-28): Completed. Removed legacy `getEmployeesByCompany` / `getEmployeesByDepartment` from base service (no stale references found via repo search). Added server-first stats (`/employees/stats`) with validated fallback; management service now reuses base stats to avoid duplication. Implemented DELETE deactivate with validation parse. Stubbed `suggestRoutes` with safe empty return + one-time warning. Added permissive zod parsing across base + management services (list/get/create/update/delete/stats, activate/deactivate, listing variants). Delegated create/update/deactivate in management to base to prevent drift. Bulk upload pipeline intentionally left with future optional schema for composite result; current logic stable. Discrepancy matrix updated earlier; alignment task closed.

- [x] Dev ergonomics and docs
	- Files: `packages/client/README.md`, `docs/frontend-port-plan.md`.
	- Tasks:
		- Document `VITE_ENABLE_STRICT_MODE` dev flag behavior and recommend disabling for network-chatter reduction during debugging.
		- Note Socket.IO WebSocket-only transport preference in `src/lib/socket.ts` and rationale.
	- Acceptance: README updated; team can replicate settings without asking in chat.
	- Final Verification (2025-08-29): README now contains Developer Ergonomics section documenting `VITE_ENABLE_STRICT_MODE` toggle and WebSocket-only Socket.IO transport rationale (grep confirms both strings present). No outstanding ergonomic or doc gaps related to these flags.

- [x] Build and tests
	- Files: `packages/client/package.json`, potential test harness in `packages/client/src/test/*`.
	- Tasks:
		- Ensure `pnpm -C packages/client build` passes; add a minimal e2e smoke for auth happy-path and role guards.
	- Acceptance: Clean build; smoke test passes locally.
	- Final Verification (2025-08-29): `pnpm -C packages/client build` completes without errors/warnings beyond standard Tailwind notices; added smoke auth test at `packages/client/src/__tests__/smoke-auth.test.js` validating protected dashboard render under admin role; test passes (`pnpm -C packages/client test smoke-auth`).

Responsive Enhancement Phase (Phase 2)

Goal: Elevate mobile & small-tablet experience beyond baseline pass by optimizing layout density, interaction targets, and map usability on constrained viewports. Focus initially on Home, global navigation, and Dashboard (map + KPIs), then extend patterns.

- [ ] Responsive audit & issue catalog
	- Tasks:
		- Capture current screenshots at 320, 360, 375, 414, 768, 1024, 1280 for Home, Dashboard, and any page using the map.
		- Log spacing, overflow, tap-target (<44px) violations, font scaling, CLS sources.
		- Produce `docs/responsive-audit.md` with annotated issues & priority labels (P1 must-fix for MVP mobile usability).
	- Acceptance: Audit doc created with ≥10 concrete findings mapped to follow-up tasks; no ambiguous “improve layout” items.

- [ ] Home page mobile optimization
	- Files: `packages/client/src/pages/Home/*`, shared layout components.
	- Tasks:
		- Collapse multi-column stat/metric grids to single column ≤640px using utility classes or custom `grid-cols-[auto]` tokens.
		- Ensure hero / summary section fits within first viewport without vertical scroll on 640px height (adjust padding/margin, line clamp long text).
		- Convert fixed pixel widths to responsive max-w tokens (e.g., `max-w-sm`, `md:max-w-xl`).
		- Verify color contrast AA on mobile (especially text over images/gradients).
	- Acceptance: No horizontal scroll at 320px; Lighthouse Mobile → Layout Shift <0.02, Tap targets ≥95%; all Home metrics readable without pinch-zoom.

- [ ] Navigation responsiveness & accessibility polish
	- Files: `TopBar`, nav menu components, `nav-config.ts`.
	- Tasks:
		- Introduce mobile menu toggle (hamburger → disclosure) appearing <768px; use `aria-expanded` + focus trap in menu panel.
		- Ensure keyboard navigation cycles through dropdown items; ESC closes; focus returns to toggle.
		- Reduce nav height on small screens (<360px height) to free vertical space (e.g., compact mode class).
		- Add prefers-reduced-motion check for dropdown animations.
	- Acceptance: Axe scan passes (no nav a11y violations); all top-level routes reachable via keyboard only; no layout shift when opening menu.

- [ ] Dashboard map responsive layout (mobile-first)
	- Files: `packages/client/src/pages/Dashboard/*`, map component, KPI/stat panels.
	- Tasks:
		- Establish CSS custom props or utility classes for dynamic map height: 55vh (≥768px), 45vh (≥640 <768), 40vh (<640) ensuring space for KPIs.
		- Reflow sidebar/adjacent KPI panes below map on ≤768px; use accordion for secondary controls (filters, layers) to minimize scroll.
		- Replace any absolute-positioned overlapping controls with flex/grid stacking for vertical flow.
		- Lazy-load heavy map libs only when Dashboard route active (confirm existing code-splitting or add dynamic import + suspense fallback skeleton sized appropriately).
	- Acceptance: At 360×740, map plus first KPI row visible without scroll; interaction controls reachable; no clipped controls; map pan/zoom responsive without jank (FPS ≥ 50 in dev tools performance sample 5s idle interaction).

- [ ] Shared responsive tokens & utility consolidation
	- Files: `styles.css`, tailwind config, any custom `styles/*`.
	- Tasks:
		- Introduce spacing scale alias utilities for vertical rhythm (e.g., `space-y-responsive` applying sm/md/lg increments based on breakpoint).
		- Add container utilities (`.layout-section`) normalizing max-width, horizontal padding, and vertical spacing.
		- Replace ≥5 duplicated ad-hoc class chains on audited pages with new abstractions.
	- Acceptance: Diff shows tailwind class length reductions on Home/Dashboard; new utilities documented in README or a `docs/ui-tokens.md` file.

- [ ] Mobile performance & metrics validation
	- Tasks:
		- Run Lighthouse Mobile after changes; target Performance ≥ 75, Accessibility ≥ 95, Best Practices ≥ 90.
		- Record metrics in `docs/responsive-audit.md` before/after table.
		- Verify bundle analyzer: no unintended map/lib duplication after dynamic import adjustments.
	- Acceptance: Metrics table present; goals met or variances justified with mitigation issues filed.

- [ ] Verification & regression tests
	- Tasks:
		- Add viewport-based Jest/RTL tests or Storybook interaction tests (if Storybook present; otherwise skip) for nav toggle & map container height logic.
		- Add visual regression placeholders (document approach and follow-up if tooling not yet integrated).
	- Acceptance: Automated test(s) asserting presence/absence of mobile menu and correct map container class at simulated widths; CI green.

Notes:
- Defer deeper component refactors; prioritize layout & usability changes with minimal churn.
- Avoid introducing new design system library; leverage Tailwind + existing shadcn/ui.

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

