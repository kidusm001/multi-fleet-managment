# System Use Cases (Updated Version)

Status Legend: 
- **Implemented** – Fully available in current code paths
- **Partial** – Core path exists; some validations/steps missing
- **Prototype** – Experimental or not integrated into primary UI flow
- **Future** – Planned; no functional implementation yet

---
## Index
UC-001 Automated Route Planning & Optimization (Prototype)  
UC-002 Manual Route Creation & Management (Implemented / Partial Enhancements)  
UC-003 Driver’s Daily Workflow (Partial)  
UC-004 Administrator Manages Payroll (Implemented / Future PDF)  
UC-005 System User Role Hierarchy (Conceptual / Partial)  
UC-006 Asset & Resource Management (Implemented / Partial Pairing)  
UC-007 Operational Reporting Dashboard (Partial)  
UC-008 Authentication & Session Establishment (Implemented)  
UC-009 Tenant Context Management (Partial)  
UC-010 Employee Onboarding & Stop Association (Implemented)  
UC-011 Vehicle Availability Scheduling (Implemented)  
UC-012 Single-Stage Route Optimization (Implemented – Current)  
UC-013 Clustering Prototype Invocation (Prototype)  
UC-014 Notifications Creation & Retrieval (Scaffolded)  
UC-015 Mapbox Failure Fallback Handling (Future)  
UC-016 Documentation & Knowledge Synchronization (Implemented Process)  
UC-017 Audit & Compliance Logging (Future)  

---
## UC-001 Automated Route Planning & Optimization (Prototype)
**Goal:** Provide a future two-stage automated pipeline (clustering + route sequencing + approval) for generating dispatch-ready plans. 
**Status:** Prototype (FastAPI clustering exists; UI/approval not integrated).
**Actors:** Fleet Manager (Primary), Optimization Service (External Prototype). 
**Preconditions:** Authenticated manager; available employees & vehicles. 
**Main Success Scenario (Future Concept):** 1) Select shift/date → 2) Aggregate unassigned employees & available vehicles → 3) Invoke clustering + sequencing service → 4) Receive proposed cluster/route plan → 5) Review & adjust → 6) Approve & dispatch.  
**Current Reality:** Only clustering microservice (not mounted) + single-stage client Mapbox call (see UC-012).  
**Extensions:** Manual adjustments (Implemented via route edit forms).  
**Notes:** Approval & dispatch endpoints not implemented.

## UC-002 Manual Route Creation & Management (Implemented / Partial Enhancements)
**Goal:** Allow a Fleet Manager to manually create and refine a route. 
**Status:** Implemented (core CRUD); Partial (advanced sequence editing UX & validation depth). 
**Actors:** Fleet Manager. 
**Preconditions:** Authenticated; vehicles and employees exist. 
**Main Success Scenario:** 1) Initiate create route → 2) Enter metadata → 3) Select vehicle → 4) Add employees/stops & order them → 5) Save route → 6) (Optional) Edit stops/sequence. 
**Extensions:** Swap vehicle (if update route endpoint supports), Re-order stops (client + server update). 
**Notes:** Capacity validation mostly client-side; server-side guard improvements planned.

## UC-003 Driver’s Daily Workflow (Partial)
**Goal:** Enable driver to view assigned route and record progress. 
**Status:** Partial (view implemented; real-time push future). 
**Actors:** Driver, Fleet Manager (observer). 
**Preconditions:** Driver authenticated; route assigned. 
**Main Success Scenario:** 1) Driver logs in → 2) Views assigned route & ordered stops → 3) Marks stops complete (if action exists) or passively follows list → 4) Route completion recorded.  
**Extensions (Future):** WebSocket push for mid-route updates; offline caching. 
**Notes:** Live update mechanism not implemented (no `/ws` channel).

## UC-004 Administrator Manages Payroll (Implemented / Future PDF)
**Goal:** Generate payroll-ready period summary. 
**Status:** Implemented (CSV/JSON); PDF export future. 
**Actors:** Administrator (Finance/HR). 
**Preconditions:** Authenticated admin; trip and assignment data available. 
**Main Success Scenario:** 1) Open payroll module → 2) Select period → 3) Aggregate trip & driver data → 4) Display summary → 5) Export CSV. 
**Extensions:** PDF export (Future). 
**Notes:** Validation logic for edge cases (no trips) returns empty dataset gracefully.

## UC-005 System User Role Hierarchy (Conceptual / Partial)
**Goal:** Describe role inheritance & permissions. 
**Status:** Conceptual (hierarchy documented); Partial (many endpoints superadmin-only). 
**Actors:** System (RBAC engine), All roles. 
**Preconditions:** Session established. 
**Description:** BaseUser → Driver / Fleet Manager → Administrator chain. Current runtime uses manual permission checks and heavy superadmin gating; fine-grained delegation backlog.

## UC-006 Asset & Resource Management (Implemented / Partial Pairing)
**Goal:** CRUD for vehicles, drivers, employees, stops. 
**Status:** Implemented core CRUD; Partial for explicit driver↔vehicle pairing workflow UI. 
**Actors:** Fleet Manager / Administrator. 
**Preconditions:** Authenticated with proper permissions. 
**Main Success Scenario (Add Vehicle):** 1) Navigate to vehicles → 2) Add new vehicle → 3) Provide attributes → 4) Persist entry. 
**Extensions:** Assign driver (manual set via route or assignment fields), Soft delete (if implemented), Update capacity.

## UC-007 Operational Reporting Dashboard (Partial)
**Goal:** Present KPIs & enable drill-down analytics. 
**Status:** Partial (baseline metrics; advanced analytics service future). 
**Actors:** Fleet Manager. 
**Preconditions:** Authenticated; operational data present. 
**Main Success Scenario:** 1) View dashboard → 2) Inspect KPIs (utilisation, counts) → 3) Navigate to detailed views. 
**Extensions:** Generate specific report (future), Export PDF (future). 
**Notes:** No standalone analytics microservice yet.

## UC-008 Authentication & Session Establishment (Implemented)
**Goal:** Authenticate users via Fayda OAuth / Better Auth and establish session with active organisation context. 
**Status:** Implemented. 
**Actors:** User, Auth Provider. 
**Preconditions:** User has valid credentials with provider. 
**Main Success Scenario:** 1) User initiates login → 2) Redirect to provider → 3) Callback hits `/callback` shim → 4) Better Auth finalises session & sets cookies → 5) User redirected to client. 
**Extensions:** Session refresh, logout. 
**Notes:** MFA future (see Security roadmap).

## UC-009 Tenant Context Management (Partial)
**Goal:** Maintain correct organisation scope per session. 
**Status:** Partial (active org ID stored in session; switching flows limited). 
**Actors:** Administrator / Manager. 
**Preconditions:** Session established. 
**Main Success Scenario:** 1) User selects organisation (if multi-org) → 2) Session context updated → 3) Subsequent API queries scoped. 
**Extensions (Future):** UI org switcher component. 
**Notes:** Need negative test coverage for cross-org access.

## UC-010 Employee Onboarding & Stop Association (Implemented)
**Goal:** Create employee and associate geographic stop for routing. 
**Status:** Implemented. 
**Actors:** Fleet Manager / Administrator. 
**Preconditions:** Organisation exists; user authenticated. 
**Main Success Scenario:** 1) Create employee record → 2) Create or select stop (lat/long) → 3) Assign stop to employee → 4) Employee eligible for routing. 
**Extensions:** Bulk import (Future), Update stop location.

## UC-011 Vehicle Availability Scheduling (Implemented)
**Goal:** Register per-shift vehicle availability to support assignment/clustering. 
**Status:** Implemented. 
**Actors:** Fleet Manager. 
**Preconditions:** Vehicle exists; shifts configured. 
**Main Success Scenario:** 1) Select vehicle → 2) Choose shift/date → 3) Mark available → 4) Availability stored. 
**Extensions:** Bulk availability edit (Future), Unavailability reason codes.

## UC-012 Single-Stage Route Optimization (Implemented – Current Production Path)
**Goal:** Produce route metrics (distance/time) for an ordered list of coordinates. 
**Status:** Implemented. 
**Actors:** Fleet Manager (indirect via UI), Mapbox API. 
**Preconditions:** Route with valid coordinate list assembled. 
**Main Success Scenario:** 1) User saves/edits route → 2) Frontend invokes `optimizeRoute` → 3) Mapbox Directions returns geometry/metrics → 4) Metrics rendered in UI. 
**Extensions:** Adjusted duration heuristics applied (implemented); Heuristic fallback (Future). 
**Notes:** No server-side batching yet.

## UC-013 Clustering Prototype Invocation (Prototype)
**Goal:** Experimentally cluster unassigned employees to available vehicles. 
**Status:** Prototype (FastAPI microservice; Express bridge not fully exposed in UI). 
**Actors:** Fleet Manager (future), Clustering Service. 
**Preconditions:** Employees have stops & vehicles availability recorded. 
**Main Success Scenario (Prototype):** 1) POST to FastAPI `/clustering` with payload → 2) Service returns clusters → 3) (Future) UI displays candidate groupings. 
**Extensions:** Persist cluster-to-route transformation (Future). 
**Notes:** Contract drift between Express router and FastAPI expected.

## UC-014 Notifications Creation & Retrieval (Scaffolded)
**Goal:** Store and retrieve system/user notifications. 
**Status:** Scaffolded (CRUD present; no push). 
**Actors:** System, User. 
**Preconditions:** Authenticated user. 
**Main Success Scenario:** 1) Event or admin triggers notification creation → 2) User queries notifications list → 3) Marks read (if endpoint provided). 
**Extensions:** WebSocket push (Future), Expiration policies. 
**Notes:** Delivery channel TBD.

## UC-015 Mapbox Failure Fallback Handling (Future)
**Goal:** Provide heuristic or cached fallback when Mapbox Directions fails. 
**Status:** Future. 
**Actors:** Fleet Manager, System. 
**Preconditions:** Network/API failure detected. 
**Main Success Scenario (Future):** 1) Mapbox call fails → 2) System triggers nearest-neighbour heuristic → 3) Provide approximate path & mark degraded state. 
**Extensions:** Retry with exponential backoff; cached last-known route. 

## UC-016 Documentation & Knowledge Synchronization (Implemented Process)
**Goal:** Keep architecture docs, rules, and tasks synchronized with code evolution. 
**Status:** Implemented (process). 
**Actors:** Engineering Team, Taskmaster tooling. 
**Preconditions:** Code change or planning update. 
**Main Success Scenario:** 1) Change implemented → 2) Task/Doc updated via Taskmaster → 3) SDD & Use Cases regenerated or amended. 
**Extensions:** Automated freshness checks (Future). 

## UC-017 Audit & Compliance Logging (Future)
**Goal:** Record immutable access and change events for compliance investigations. 
**Status:** Future. 
**Actors:** Administrator, Security Auditor. 
**Preconditions:** Audit subsystem enabled. 
**Main Success Scenario (Future):** 1) User performs action → 2) Event logged with actor, timestamp, context → 3) Auditor filters/export logs. 
**Extensions:** Tamper-evident hash chain, export to SIEM.

---
## Cross-Use-Case Notes
- **Real-Time Features:** All push/streaming aspects (driver updates, notifications) are future until WebSocket or SSE layer is implemented.
- **Two-Stage Optimization:** Distinct separation documented (UC-001 conceptual vs UC-012 current).
- **Security & RBAC:** Presently coarse; refined per-resource permission matrices to be added alongside audit subsystem.
- **Fallback Logic:** Explicitly separated as UC-015 to prevent overstating current resilience.

---
## Traceability Overview (High-Level)
| Use Case Range | Maps to FR / NFR | Notes |
| -------------- | ---------------- | ----- |
| UC-002, UC-012 | FR-02, FR-03 | Core operational route flow |
| UC-004 | FR-04 | Payroll/export pipeline |
| UC-005, UC-008, UC-009 | FR-05 (Security & tenancy) | RBAC partial |
| UC-013 | FR-06 | Prototype clustering |
| UC-014 | FR-08 | Notifications scaffold |
| UC-007, UC-009, UC-016 | FR-09, FR-10 | Analytics & documentation |
| UC-015 | NFR (Resilience/Performance) | Future fallback |
| UC-017 | NFR (Compliance) | Future audit trail |

---
## Outstanding Gaps & Recommendations
| Gap | Impact | Recommended Action |
| ---- | ------ | ------------------ |
| Lack of mounted clustering UI | Delays showcasing two-stage optimization | Integrate Express cluster route & adapt payload |
| No real-time push | Reduced situational awareness | Add WebSocket/SSE layer for drivers & notifications |
| Missing audit logs | Limited forensic capability | Implement append-only audit table + viewer |
| Limited test coverage | Risk of regression | Add auth/tenant isolation integration tests |
| No fallback heuristics | Route creation brittleness on Mapbox failure | Implement local NN heuristic (UC-015) |

(End of Updated Use Case Document)
