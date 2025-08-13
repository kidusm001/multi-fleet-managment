# OWASP Top 10 Checklist (Server)

This checklist tracks security considerations for the backend API. Mark each item as you address it in code or tests.

- [x] Injection: Use parameterized queries via Prisma, validate and sanitize inputs (express-validator).
- [ ] Broken Authentication: JWT handling, token expiration, secure storage, no secrets in repo.
- [ ] Sensitive Data Exposure: Avoid returning secrets, use HTTPS in production, mask PII as needed.
- [x] XML External Entities (XXE): Not applicable (no XML parsers used).
- [x] Broken Access Control: Enforce RBAC (requireRoles), tenantId scoping on every query.
- [ ] Security Misconfiguration: Disable stack traces in prod, set CORS properly, rate limits where applicable.
- [ ] XSS: Return JSON, validate user-provided strings; escape content in any server-rendered templates.
- [x] Insecure Deserialization: Not applicable (no unsafe deserialization).
- [ ] Using Components with Known Vulnerabilities: Keep dependencies updated; run `pnpm audit` in CI.
- [ ] Insufficient Logging & Monitoring: Log auth failures, critical actions; avoid leaking sensitive data in logs.

Additional multi-tenant specifics:
- [ ] All CRUD operations filter by tenantId.
- [ ] Cross-tenant data access tests exist and pass.
- [ ] WebSocket channels (when added) authenticate and scope to tenant.

Notes:
- Relevant middleware: `middleware/auth.ts`, `middleware/requireRole.ts`, `middleware/validation.ts`.
- Relevant tests: add RBAC and tenant isolation tests under `packages/server/src/tests/`.

Verification evidence (current state):
- RBAC enforced on critical routes (drivers, shifts, categories, vehicles/requests) and exercised in tests.
- Tenant-aware guards on category initialization; seed populates default tenant; most queries scope by tenantId.
- Input validation centralized via express-validator; IDs are cuid strings; added routeId/categoryId validators.
- No XML or unsafe deserialization libraries used.

Open items before ticking remaining boxes:
- Add cross-tenant access tests to prove isolation across all CRUD routes.
- Review CORS, rate limiting, and production error handling toggles; document and test.
- Add dependency audit to CI and address findings.
- Add structured logging and minimal audit logs for sensitive actions.
