Frontend Port Plan — Changelog

This file archives the update logs previously embedded in `frontend-port-plan.md`.

Update Log — 2025-08-19
- Resolved remaining TypeScript compile issues (animated tabs typing, auth client export conflict, global test token typing).
- Verified ESLint clean for JS/JSX; build compiles TS/TSX without blocking errors.
- Backend auth routes confirmed: `/auth/sign-in`, `/auth/sign-in/email`, `/auth/me`, `/auth/logout` (port 3000). Client `authClient` uses `credentials: 'include'` and `API_BASE` default http://localhost:3000.
- Added debug logging in `AuthContext` login flow to surface server errors while validating credentials.
- Rebranding progress: replaced logos in TopBar, Sidebar, Login, Home; updated texts in Footer, About, RouteList; map HQ label; loading animation text. Added `logo-dark.PNG` and `logo-light.png` assets.
- Updated `packages/client/.env` to set `VITE_HQ_NAME="Routegna (HQ)"`.
- Updated Shuttle Add dialog placeholder to "Routegna Express 3".

Update Log — 2025-08-20
- Implemented global 401 redirect with `next=` and added global 403 redirect to `/unauthorized` in all axios clients (`api.js`, settings `apiService.js`, and `clusterService.js`).
- Normalized roles in `RoleContext` to map uppercase backend roles to frontend canonical roles; hardened user dropdown role display and badge.
- Increased logo sizes across UI for better visibility (TopBar, Sidebar, Home, Login).

Update Log — 2025-08-20 (cont.)
- Standardized API base handling across clients: `api.js`, `clusterService.js`, `settings/apiService.js` now use `VITE_API_BASE` (fallback `VITE_API_URL`) and `/api` via dev proxy. All send `withCredentials`.
- Refactored `UserContext` to rely on `authClient.getSession()` (`/auth/me`), removed legacy `/api/auth/get-session` call and unsafe casts.
- Added manualChunks to Vite build for heavy libs (`mapbox-gl`, `recharts`, `chart.js`, `framer-motion`, React libs).
- Renamed package to `@routegna/client` per plan.
- Added `VITE_API_BASE` to `.env`.

Update Log — 2025-08-21
- Removed all recruitment/candidate/batch features from UI, services, notifications, and search.
- Refactored EmployeeManagement to employees-only with filters, sorting, pagination, and activate/deactivate.
- Simplified `EmployeeTable.jsx`; deleted dead candidate/batch code paths.
- Updated EmployeeManagement README to reflect the new scope.

Update Log — 2025-08-21 (cont.)
- Notifications: normalized client API to server shape; aligned icon types to `route|shuttle|vehicle|employee|department|driver`; removed legacy batch icon.
- Validators: renamed `validateCandidateData` → `validateEmployeeUploadData` and updated imports/usages in `DataTable.jsx` and `EmployeeUploadSection.jsx`.
- Cleanup: removed obsolete `candidate` branch from TopBar `TypeIcon`; renamed local variables in `validateFileContents` from `candidate` → `employee` for clarity; identified legacy `notificationService.js` as unused (pending deletion after reference sweep).

Update Log — 2025-08-20 (cont. 2)
- Settings/Employees: Fixed service import path and added missing `getEmployeeStats`; stabilized employees tab at `/settings`.
- Removed reliance on non-existent endpoints (`/drivers/stats`, `/drivers/history`, `/employees/history`, `/activities`) by computing metrics client-side and returning safe fallbacks.
- Activity services: global returns mock in dev/404; settings-scoped service returns empty list on error to avoid crashes.
- App polish: Added `ErrorBoundary`, refined CSP meta, added a11y skip link with styles, set `id="main"` on primary landmark, and improved Suspense fallbacks.
- Verified frontend and backend dev servers run: Vite on 5173, API on 3000 with Socket.IO ready. 401/403 handling confirmed.
