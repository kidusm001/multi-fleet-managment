# Security & Authentication Audit (Task 2)

Date: 2025-08-08
Scope: Server authentication layer (email/password sign-up & sign-in, session issuance, middleware, tenant isolation primitives)

## Architecture Summary
- Auth Model: Email + password (bcrypt hashed, cost=10) per user; session token (32-byte hex) stored server-side in `Session` table.
- Sessions: Stored with `expiresAt` (7 days). Token delivered via httpOnly, SameSite=Lax cookie `session`.
- Multi-Tenancy: Isolation is per deployment (single tenant DB). `tenantId` kept on `User` to future-proof; route tests ensure tenant association on sign-up.
- RBAC: Role field exists (enum). Middleware scaffolding added (`requireRoles`) but not yet applied to domain routes (pending future tasks).

## Implemented Controls
- Password hashing: bcrypt with salt rounds=10; no plain text stored.
- Banned users: Central check in sign-in handler + RBAC middleware (403).
- Session expiration enforced on access (expired sessions deleted lazily).
- Duplicate email prevention: Unique constraint + 409 conflict handled.
- Tenant validation: Sign-up checks provided tenant exists.
- Input validation: Presence checks for required fields.
- Error handling: Generic messages for invalid credentials (prevent user enumeration).
- Logging: Temporary route debug logging (to be gated/removed in production).

## Gaps / Risks & Mitigations
| Area | Risk | Current State | Recommended Mitigation |
|------|------|---------------|------------------------|
| Password Policy | Weak passwords accepted | No complexity enforcement | Add zxcvbn-based strength check + min length 10 |
| Rate Limiting | Brute force on /sign-in | None | Introduce IP + identifier based limiter (e.g., sliding window in Redis) |
| Session Hijack | Token theft via transport | Cookie is httpOnly, but no Secure flag in dev | Set `Secure` in production + enable TLS |
| Session Fixation | Reuse of old token after privilege change | New token per sign-in only | Rotate session on role change & sensitive actions |
| CSRF | Session cookie could be sent cross-site | SameSite=Lax; no state-changing GETs | For future non-API browser forms, add CSRF token middleware |
| Enumeration | Distinguish duplicate email | 409 reveals email taken | Consider generic 400 for existing email if enumeration threat high |
| Logging | Sensitive data logging | Minimal (only method & path) | Ensure no password/session token logging added later |
| Expired Session Cleanup | Growth of stale sessions | Lazy deletion only | Add scheduled cleanup job (cron) |
| Secrets | Hardcoded secret absence | Using random session tokens (no secret required) | If future JWT, store secret in env + rotation policy |
| Tenant Enforcement | Cross-tenant data leakage | Single-tenant deployment for now | Maintain tenant scoping discipline when adding shared infra |

## Test Coverage Added
Integration tests: sign-up, sign-in (banned & unbanned), /auth/me, protected route without session. (See `src/tests/auth.integration.test.ts`.)
Session middleware extracted to `middleware/auth.ts` and auto-loaded in `app.ts`.

## Items Deferred (Documented)
- Rate limiting, password strength validation, Secure cookie flag gating, scheduled session cleanup, CSRF tokens for state-changing browser forms.

## Next Hardening Steps
1. Implement rate limiter (Redis or in-memory fallback) for sign-in + sign-up. 
2. Introduce password strength validation (e.g., zxcvbn) & rejection threshold. 
3. Add `SECURE_COOKIES` env toggle; set `Secure` + `SameSite=Strict` in prod. 
4. Session rotation endpoint (/auth/refresh) & revoke all sessions endpoint for user. 
5. Add unit tests for middleware edge cases (expired, banned, role mismatch). 
6. Implement background cleanup: DELETE sessions where `expiresAt < now()` daily. 

## Conclusion
Core session-based authentication with tenant association is in place, tests are green, and foundational middleware for future RBAC is prepared. Security posture is acceptable for early development; prioritize mitigations above before production exposure.
