# Employee API Discrepancy Matrix (Initial Pass)

Purpose: Track alignment between frontend employee service calls and backend routes to eliminate 404s / incorrect verbs before deeper refactors (dedupe + validation).

Legend: KEEP (matches) · FIX (adjust method/path) · STUB (backend missing; safe fallback) · DEDUPE (planned consolidation) · REVIEW (decision pending) · PURGE (remove if found)

| # | Client Method (File) | Before (Verb Path) | Server Route? | Canonical | Action | Note |
|---|----------------------|--------------------|---------------|-----------|--------|------|
| 1 | deactivateEmployee (base `services/employeeService.js`) | POST /employees/:id/deactivate | No | DELETE /employees/:id | FIX (done) | Soft delete implemented as DELETE. |
| 2 | deactivateEmployee (mgmt service) | DELETE /employees/:id | Yes | Same | KEEP | Already correct. |
| 3 | activateEmployee (mgmt) | POST /employees/:id/restore | Yes | Same | KEEP | Restore endpoint exists. |
| 4 | suggestRoutes (base) | GET /employees/suggest-routes | No | — | STUB (done) | Returns [] with one-time console.warn. |
| 5 | listEmployeesForManagement (mgmt) | GET /employees/management | Yes | Same | KEEP | Includes deleted. |
| 6 | getEmployeeStats (base) | Derived from /employees/management | Yes | Potential /employees/stats | REVIEW | Decide whether to use dedicated stats route later. |
| 7 | createEmployee (base & mgmt) | POST /employees | Yes | Same | DEDUPE (planned) | Avoid drift between services. |
| 8 | updateEmployee (base & mgmt) | PUT /employees/:id | Yes | Same | DEDUPE (planned) | Same rationale. |
| 9 | uploadEmployees (mgmt) | POST /employees/bulk-upload | Yes | Same | KEEP | OK. |
|10 | validateUploadData (mgmt) | POST /employees/validate-upload | Yes | Same | KEEP | OK. |
|11 | getUploadTemplate (mgmt) | GET /employees/upload-template | Yes | Same | KEEP | OK. |
|12 | getUnassignedEmployeesByShift | GET /employees/shift/:shiftId/unassigned | Yes | Same | KEEP | Used in assignment. |
|13 | Legacy filtered endpoints (company/department variants) | Various | No | — | PURGE (watch) | Remove if still referenced. |

Completed This Pass:
1. Converted base deactivateEmployee to DELETE.
2. Stubbed missing suggestRoutes to prevent 404 noise.

Next Steps (Planned):
- Dedupe create/update logic (central helper export).
- Decide whether to adopt backend /employees/stats or keep client derivation.
- Introduce lightweight response validation (zod) for list & bulk endpoints.
- Sweep & purge any lingering legacy filtered endpoints if discovered.

Date: 2025-08-28
