# System Design Document (SDD)

Version: 1.1
Status: Final
Date: 2025-09-02

Authors: Routegna Engineering Team

---

## Revision History
- 1.1 — 2025-09-02 — Expanded & finalized (architecture depth, risk matrix, scalability, ops runbooks, env vars)
- 1.0 — 2025-09-02 — Initial formalization from codebase and docs

---

## Table of Contents
1. Definitions, Acronyms & Abbreviations
2. Introduction / Overview
3. Software Architecture
4. Subsystem Decomposition
5. Data Persistence & Multi-Tenancy
6. Access Control, Security & Compliance
7. Deployment & Runtime View
8. Operational & Maintenance Considerations
9. Quality Attributes & Design Rationale
10. Scalability Strategy & Capacity Planning
11. Performance & Optimization Considerations
12. Configuration & Environment Variables
13. Risk Assessment & Mitigations
14. Roadmap & Future Enhancements
15. References
16. Annexes

---

## 1. Definitions, Acronyms & Abbreviations
| Term | Definition |
| ---- | ---------- |
| SaaS | Software as a Service |
| RBAC | Role-Based Access Control |
| ORM | Object Relational Mapper (Prisma) |
| DTO | Data Transfer Object |
| CSP | Content Security Policy |
| HQ | Headquarters (default seed location) |
| TSP | Traveling Salesman Problem (used for route ordering heuristics) |

---

## 2. Introduction / Overview
This System Design Document (SDD) captures the architectural and design decisions for the multi-fleet management platform ("Routegna"). It consolidates implementation reality (codebase) and intent (supporting documentation in `docs/`).

### 2.1 Goals
| Goal | Description | Success Indicator |
| ---- | ----------- | ----------------- |
| Maintainability | Modular, testable separation of concerns | PR cycle time & low churn coupling |
| Security & Isolation | Strong tenant data boundaries | Zero cross-tenant data leakage in tests / audits |
| Extensibility | Feature modules pluggable without core rewrites | New domain added without refactoring existing ones |
| Operational Readiness | Observable & deployable with minimal friction | Health endpoints + structured logs present |
| Resilience | Graceful degraded mode (e.g., route optimization fallback) | No fatal user flow blockage on external API failure |

### 2.2 Scope
Includes: multi-tenant route & fleet management (routing, employees, vehicles, notifications, emerging payroll). Single database; React SPA; Express API.

Excludes (current phase): per-tenant DB provisioning, advanced BI pipelines, SSO, infrastructure-as-code formalization.

### 2.3 Stakeholders
| Role | Interest |
| ---- | -------- |
| Product Owner | Roadmap alignment & feature velocity |
| Backend Engineers | Service & persistence evolution |
| Frontend Engineers | Consistent API shape / stability |
| Security Lead | Isolation, authn/z integrity |
| Ops / DevOps | Deployability & monitoring |

### 2.4 Document Conventions
Markdown; tables for concise structure; placeholders for diagrams in Annexes.

---

## 3. Software Architecture

### 3.1 Architectural Style
Layered architecture emphasizing boundary clarity:
```
Client (React SPA)
	↕ REST / (future) WebSocket
API Gateway Layer (Express routes)
	↕
Middleware (Auth, RBAC, Validation, Tenant Context)
	↕
Domain Services (Business logic orchestration)
	↕
Data Access (Prisma ORM) ↔ PostgreSQL
```

### 3.2 Views
| View | Focus | Notes |
| ---- | ----- | ----- |
| Logical | Domain module separation | Routes, Employees, Vehicles, Payroll, Notifications |
| Development | Folder/package structure | Monorepo: `/packages/server`, `/packages/client` |
| Process | Runtime processes | API (stateless), DB (stateful), static SPA |
| Deployment | Environment topology | Container-friendly (K8s / ECS ready) |
| Data | Entity & relationship overview | Shared tenant key, relational constraints |

### 3.3 Key Decisions & Trade-offs
| Decision | Rationale | Alternative | Status |
| -------- | --------- | ---------- | ------ |
| Single DB + tenantId | Simplifies early ops, fast dev loops | DB-per-tenant | Adopted (revisit scale) |
| Prisma | Type safety + migrations + DX | TypeORM / Knex | Adopted |
| Session auth | Easier server-driven tenant context | JWT-only | Adopted (hybrid future) |
| Client-side optimization | Lower backend complexity | Server optimization microservice | Adopted (pave backend later) |
| Monorepo | Shared tooling + atomic changes | Polyrepo | Adopted |

### 3.4 External Integrations
| Service | Usage | Failure Mode Handling |
| ------- | ----- | -------------------- |
| Mapbox Directions API | Route optimization | Fallback heuristic path (no outage of UI) |

### 3.5 Error Propagation Strategy
Layer-specific mapping:
- Services throw domain errors (`{ code, message }`).
- Routes map to HTTP (e.g., `NotFoundError` → 404). 
- Client displays contextual toasts / banners.

### 3.6 Configuration Loading
Runtime environment variables read at process start; frontend build-time injection via `import.meta.env`.

---

## 4. Subsystem Decomposition
The following subsystems define the macro boundaries for maintenance & ownership.

### 4.1 Auth & Session
- Responsibilities: user login, session lifecycle, tenant attachment, RBAC enforcement.
- Interfaces: `/auth/*` routes, session cookie/headers.

### 4.2 Tenant & Organization
- Responsibilities: tenant bootstrap, tenant metadata, organization hierarchy.
- Interfaces: implicitly enforced via `tenantId` in requests and middleware.

### 4.3 Fleet & Vehicles
- Responsibilities: shuttle/vehicle registration, availability, maintenance.
- Interfaces: `/vehicles/*`, `/maintenance/*`.

### 4.4 Routes & Scheduling
- Responsibilities: route creation, stop sequencing, assignments, route optimization (Mapbox integration + fallback TSP heuristics).
- Interfaces: `/routes/*`.

### 4.5 Employees & Drivers
- Responsibilities: employee lifecycle, approvals, assignment to routes.
- Interfaces: `/employees/*`, `/drivers/*`.

### 4.6 Payroll & Costing
- Responsibilities: aggregation of trip costs, payroll computation (future iterations).
- Interfaces: `/payroll/*`.

### 4.7 Notifications & Real-time
- Responsibilities: dispatch & retrieval of user/system notifications; future push channel.
- Interfaces: `/notifications/*`, planned WebSocket namespace `/ws/notifications`.

### 4.8 Cross-Cutting Concerns
| Concern | Mechanism | Future Improvement |
| ------- | --------- | ------------------ |
| Validation | express-validator | Adopt shared schema (zod) |
| Caching | None (explicit) | Introduce Redis tier |
| Observability | Basic logging | Add tracing (OpenTelemetry) |
| Rate Limiting | Not yet | Token bucket middleware |
| Auditing | Not yet | Append-only audit table |

---

## 5. Data Persistence & Multi-Tenancy

### 5.1 Strategy
- Single PostgreSQL database.
- All domain models include `tenantId` column (enforced at service and middleware).
- Prisma schema drives migrations and client generation.

### 5.2 Migration & Seeding
- Use Prisma Migrate for schema changes; idempotent seed scripts for example tenants and HQ location.

### 5.3 Entity Pattern (Illustrative)
```
model Employee {
	id        String   @id @default(cuid())
	tenantId  String   @index
	fullName  String
	role      String
	active    Boolean  @default(true)
	createdAt DateTime @default(now())
	updatedAt DateTime @updatedAt
}
```

### 5.4 Performance Considerations
| Aspect | Current | Planned |
| ------ | ------- | ------- |
| Indexing | `tenantId` (selected tables) | Composite functional indexes |
| Partitioning | None | Evaluate hash partitioning on `tenantId` (scale) |
| Connection Pool | Default | Tune via pgbouncer / Prisma pool config |

---

## 6. Access Control, Security & Compliance

### 6.1 Authentication & Authorization
- Authentication: session cookie-based auth with server-side session verification.
- Authorization: middleware that enforces roles via `requireRole` pattern and resource-level tenant checks.

### 6.2 Data & Transport Security
- TLS enforced at deployment layer; local dev uses unencrypted HTTP.
- CSP and secure headers on frontend; avoid unsafe inline scripts in production.

### 6.3 OWASP & Security Posture
Referenced: `security-owasp-checklist.md` & `security-auth-audit.md`.

| Category | Current Control | Gap | Planned Action |
| -------- | --------------- | --- | -------------- |
| A01 Broken Access Control | RBAC + tenant scoping | Limited test coverage | Add negative tests per route |
| A02 Cryptographic Failures | HTTPS termination external | Secret rotation manual | Introduce rotation policy |
| A05 Security Misconfig | CSP baseline | Missing strict prod CSP template | Harden build-time injection |
| A07 Identification & Auth | Session-based auth | No MFA | Add optional MFA (TOTP) |
| A09 Security Logging | Basic logs | No anomaly detection | Structured JSON + alert rules |

### 6.4 Compliance Considerations (Forward-Looking)
Multi-tenant segregation audit logging + data export (GDPR portability) future deliverables.

---

## 7. Deployment & Runtime View

### 7.1 Components & Process Models
- API: Node.js processes; can be containerized and horizontally scaled.
- Static Frontend: served from CDN or reverse proxy.
- DB: Postgres with backup/restore policy.

### 7.2 Topologies
| Phase | Topology |
| ----- | -------- |
| Dev | Local: API + DB (docker/local) + Vite dev server |
| Staging | Single container per service + managed Postgres |
| Prod (Phase 1) | Horizontally scalable API (N replicas) + Postgres HA |
| Prod (Phase 2) | Add CDN + edge cache for SPA + read replicas |

### 7.3 Environment & Config Summary
See Section 12 for full variable table.

### 7.4 Health & Readiness
- `/healthz` (liveness) planned.
- DB connectivity & migration drift check (readiness) future enhancement.

---

## 8. Operational & Maintenance Considerations

### 8.1 Monitoring & Logging
| Layer | Signal | Tooling (Current) | Future |
| ----- | ------ | ----------------- | ------ |
| API | Request latency/error rate | Console logs | APM + metrics exporter |
| DB | Query performance | Manual inspection | pg_stat_statements dashboard |
| Frontend | Route load times | DevTools/manual | RUM beacon instrumentation |

### 8.2 Backups & Recovery
- Regular DB backups; test restore procedures in staging.

### 8.3 Testing & CI
| Layer | Tool | Notes |
| ----- | ---- | ----- |
| Unit (backend) | Vitest | Service logic |
| Integration | Supertest (planned) | Auth + RBAC + tenant isolation |
| Frontend Components | Vitest + RTL | Critical UI flows |
| E2E | Playwright (future) | Cross-layer sanity |
| Load | k6 / Artillery (future) | Baseline SLO verification |

### 8.4 Runbook (Abbreviated)
| Incident | First Steps | Escalation |
| -------- | ---------- | ---------- |
| DB latency spike | Check slow queries; inspect connections | Add read replica / optimize queries |
| Mapbox outage | Verify fallback active (orange route) | Disable optimization flag globally |
| Session store failure | Restart instance / failover | Switch to backup store |
| High 5xx rate | Inspect recent deploy | Rollback + open incident ticket |

---

## 9. Quality Attributes & Design Rationale
| Attribute | Mechanisms | Metrics / SLO (Target) |
| --------- | ---------- | ---------------------- |
| Maintainability | Layer separation, typed models | < 15% churn touches >3 layers |
| Security | RBAC, tenant filters, validated inputs | Zero cross-tenant leakage |
| Availability | Stateless API, graceful degradation | 99.5% (Phase 1) |
| Performance | Indexes, minimized over-fetching | p95 API < 400ms |
| Resilience | Mapbox fallback, error mapping | 0 catastrophic failures on external outage |
| Observability | Structured logs (planned JSON) | 100% core routes logged |

Design rationale focuses on early value delivery with progressive hardening.

## 10. Scalability Strategy & Capacity Planning
| Dimension | Phase 1 | Phase 2 | Phase 3 |
| --------- | ------- | ------- | ------- |
| API Scale | Horizontal pods | Auto-scaling | Regional replication |
| Database | Single primary | HA + read replicas | Partitioning / sharding |
| Caching | None | Redis layer | Tiered cache (CDN + Redis) |
| Queueing | None | Introduce message bus | Event sourcing optional |

Capacity triggers: sustained CPU > 65%, p95 latency breaches, or connection pool saturation.

## 11. Performance & Optimization Considerations
| Area | Current Approach | Future Enhancement |
| ---- | --------------- | ------------------ |
| Route Optimization | Client TSP heuristic + Mapbox | Server-side batch optimization |
| DB Access | Direct ORM queries | Add query tracing & caching |
| Frontend Bundle | Vite code-splitting | Analyze & lazy load heavy charts |
| Map Rendering | Debounced updates | Web worker offloading (complex paths) |

## 12. Configuration & Environment Variables
| Variable | Layer | Purpose | Required | Default |
| -------- | ----- | ------- | -------- | ------- |
| DATABASE_URL | Server | Postgres connection | Yes | — |
| PORT | Server | API listen port | No | 3001 |
| SESSION_SECRET | Server | Session integrity | Yes | — |
| VITE_API_URL | Client | API base URL | Yes | http://localhost:3001 |
| VITE_MAPBOX_ACCESS_TOKEN | Client | Mapbox API calls | Yes (for optimization) | — |
| VITE_MAPBOX_LIGHT_STYLE | Client | Light theme map style | No | mapbox default |
| VITE_MAPBOX_DARK_STYLE | Client | Dark theme map style | No | mapbox default |
| VITE_HQ_NAME | Client | HQ label | No | Routegna HQ |
| VITE_HQ_LONGITUDE | Client | HQ coord | No | 38.7685… |
| VITE_HQ_LATITUDE | Client | HQ coord | No | 9.0164… |

Secret management should migrate to encrypted store (Vault / SSM) in production.

## 13. Risk Assessment & Mitigations
| Risk | Impact | Likelihood | Mitigation | Contingency |
| ---- | ------ | ---------- | ---------- | ----------- |
| Cross-tenant data leak | Severe | Low | Consistent tenant filters + tests | Emergency access revoke + audit |
| External API outage (Mapbox) | Medium | Medium | Fallback route logic | Disable optimization flag |
| Migration failure | High | Low | Pre-deploy dry run | Rollback + backup restore |
| Performance regression | Medium | Medium | Baseline perf tests | Auto rollback policy |
| Token / secret exposure | High | Low | .env in gitignore; least-privileged perms | Rotate secrets immediately |
| Scaling DB bottleneck | High | Medium | Monitor throughput | Introduce read replicas |

## 14. Roadmap & Future Enhancements
| Feature | Category | Priority |
| ------- | -------- | -------- |
| WebSocket notifications | Real-time | High |
| Redis cache layer | Performance | High |
| MFA / TOTP auth | Security | Medium |
| Rate limiting middleware | Security | Medium |
| Audit log subsystem | Compliance | High |
| Server-side route optimizer | Performance | Medium |
| SSO (OIDC/SAML) | Enterprise | Low |
| Multi-region failover | Reliability | Low |

## 15. References
Unchanged from earlier version; consolidated for quick access:
- `backend-deliverables-report.md`
- `backend-route-schedule.md`
- `backend-test-gaps.md`
- `security-auth-audit.md`
- `security-owasp-checklist.md`
- `frontend-port-plan.md`
- `feature-parity-shuttle-to-multifleet.md`
- `copilot-rules.md`

## 16. Annexes
- Annex A: (Sequence) Route Creation & Assignment (placeholder for PlantUML)
```
@startuml
actor User
participant Frontend
participant API as API
database DB
User -> Frontend: Create Route Request
Frontend -> API: POST /routes
API -> DB: Insert route + stops (transaction)
DB --> API: OK
API --> Frontend: 201 Created (routeId)
Frontend -> API: POST /routes/{id}/optimize (future)
API --> Frontend: 202 Accepted
@enduml
```

- Annex B: (Component) Map Rendering & Optimization Flow (textual)
```
[RouteSelection] -> [MapComponent] -> [RouteLayer] -> [optimizeRoute]
fallback(branch): if Mapbox fails -> heuristic path -> visual orange line
```

- Annex C: Tenant Onboarding Flow (textual)
```
Admin creates tenant -> Seed baseline data -> Invite users -> Users authenticate -> Tenant context bound to session
```

(End of SDD)

---

## 10. References
- `backend-deliverables-report.md`
- `backend-route-schedule.md`
- `backend-test-gaps.md`
- `security-auth-audit.md`
- `security-owasp-checklist.md`
- `frontend-port-plan.md`
- `feature-parity-shuttle-to-multifleet.md`
- `copilot-rules.md`

---

## 11. Annexes
- Annex A: Sequence placeholder — Route creation & assignment
- Annex B: Component placeholder — Map rendering & optimization flow
- Annex C: Tenant onboarding flow (textual)

(End of SDD)
