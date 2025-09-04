## Organization Feature Client Plan

> EXECUTION DIRECTIVES (v0.1.1 – DO NOT REMOVE OR WEAKEN)
> 1. NEVER EVER prompt the user for confirmation or decisions until ALL phases (0–7) are fully implemented. Proceed autonomously through every remaining task.
> 2. ALWAYS align implementation with official Better Auth Organization Plugin docs: https://www.better-auth.com/docs/plugins/organization (re-check at each phase; docs override plan ambiguities).
> 3. FIX ERRORS immediately (TypeScript, runtime, lint) without user interaction; apply minimal, targeted corrections unless misaligned with Better Auth spec.
> 4. KEEP this directive block updated only with ADDITIVE rules strengthening autonomy and spec fidelity.
> 4a. AFTER each subtask introducing new code, run `npm run lint && npm run type-check` (or project equivalent) and fix issues autonomously before proceeding.
> 5. DO NOT mark checklist items complete until code reflecting them exists in the repository.

Status: Phase 4/5 features implemented (orgs, members, invites, roles, teams, team membership, dynamic role CRUD mock) – entering Phase 6 Hardening (Target A: skeleton loaders first) & Phase 7 Cutover prep
Author: Plan generated Sept 4 2025 (revised)
Scope: Client-side implementation of Better Auth Organization plugin features (UI, context, adapter). No server/plugin code changes in this repo. Provide mock mode until backend org endpoints exist.

---
### 1. Phased Roadmap

| Phase | Title | Core Deliverables | Depends On |
|-------|-------|-------------------|------------|
| 0 | Prep / Skeleton | Env flags, types, adapter interface (mock + live stub), context shell | None |
| 1 | Core Orgs | List orgs, create org, set active org, switcher UI | 0 |
| 2 | Members & Invitations | Members list, invite, accept/reject/cancel, invitations panel | 1 |
| 3 | Roles & Permissions | Static role permission map, hasPermission + UI gating | 2 |
| 4 (opt) | Teams | Team CRUD, active team, team membership | 3 |
| 5 (opt) | Dynamic Roles | Runtime role CRUD, list/update/delete roles | 3 |
| 6 | Hardening | Error states, skeleton loaders, tests, docs | 1-5 partial |
| 7 | Backend Cutover | Switch to live mode, remove mocks, tenantId deprecation | 6 |

---
### 2. Assumptions & Constraints (Updated v0.2)

- Client-only scope; backend integration arrives later (live adapter stub maintained).
- Personal workspace (activeOrganization = null) is INVISIBLE unless user has zero orgs (then fallback synthetic org logic remains). No dedicated UI for “personal workspace”.
- Invitation auto-expiry UI (badge vs prune) deferred; current behavior: prune on listing is acceptable.
- Organization metadata & logo upload deferred; MVP surfaces only name (slug auto-generated) – optional future avatar placeholder acceptable.
- Legacy `tenantId` ignored; no dependency introduced.
- Mock mode remains first-class until production endpoints cutover; runtime flags guard progressively (teams & dynamic roles may be disabled independently).
- Dynamic roles & team membership implemented in mock; production parity will be validated at cutover.

---
### 3. Environment & Feature Flags

Add to client `.env` / documentation:
```
VITE_ENABLE_ORGANIZATIONS=true
VITE_ORG_MODE=mock          # mock | live
VITE_ORG_TEAMS_ENABLED=false
VITE_ORG_DYNAMIC_ROLES_ENABLED=false
```

Fallback defaults: if flag absent treat as disabled (single synthetic org view).

---
### 4. Data Models (Client Types)

```ts
interface Organization { id: string; name: string; slug: string; logo?: string; metadata?: Record<string, any>; createdAt: string; }
interface Member { id: string; userId: string; organizationId: string; role: string; createdAt: string; }
interface Invitation { id: string; email: string; inviterId: string; organizationId: string; role: string; status: string; expiresAt: string; teamId?: string; }
interface Team { id: string; name: string; organizationId: string; createdAt: string; updatedAt?: string; }
interface OrgRoleDescriptor { roleName: string; permissions: Record<string,string[]> }
interface SessionAugment { activeOrganizationId?: string|null; activeTeamId?: string|null }
```

UI Aux Types: `OrgOption`, `PermissionCheckResult`.

---
### 5. API Adapter Strategy

File: `src/lib/org-api/organizationClientAdapter.ts`.

Interface (subset, aligned with Better Auth; strictly client consumption):
```
listOrganizations()
createOrganization({ name, slug, logo?, metadata?, keepCurrentActiveOrganization? })
setActiveOrganization({ organizationId?, organizationSlug? })
getFullOrganization({ organizationId?, organizationSlug?, membersLimit? })
listMembers({ organizationId?, ...pagination/filter })
inviteMember({ email, role, organizationId?, teamId?, resend? })
listInvitations({ organizationId? })
getInvitation({ id })
acceptInvitation({ invitationId })
rejectInvitation({ invitationId })
cancelInvitation({ invitationId })
removeMember({ memberIdOrEmail, organizationId? })
updateMemberRole({ memberId, role, organizationId? })
getActiveMember()
hasPermission({ permissions })
checkRolePermission({ permissions, role })
// Optional later: teams, dynamic roles
```

Modes:
- `mock`: in-memory + localStorage persistence key `org_mock_state_v1` (default when endpoints unavailable).
- `live`: calls Better Auth organization endpoints (expected under `/auth/organization/...`). Fallback to mock on 404 / network error.

Return shape: `{ data, error?: { message, code? } }` (never throw inside adapter).

---
### 6. Organization Context

Dir: `src/contexts/OrganizationContext/`.

State:
```
organizations: Organization[]
activeOrganization: Organization | null
activeMember: Member | null
members: Member[]
invitations: Invitation[]
teams?: Team[]
roles?: OrgRoleDescriptor[] (dynamic roles – behind flag)
status: granular slice implemented: loadingOrganizations, loadingMembers, loadingInvitations, loadingTeams, loadingRoles, switching, creating, error
```

Additional loader flag for skeleton coordination:
```ts
interface OrgContextState {
  organizations: Organization[];
  activeOrganization: Organization | null;
  members: Member[];
  invitations: Invitation[];
  loading: boolean; // unified high-level loading (supplements granular status flags)
  error?: string;
}
```

Actions:
`refreshOrganizations, createOrganization, setActiveOrganization, loadMembers, inviteMember, removeMember, updateMemberRole, loadInvitations, acceptInvitation, rejectInvitation, cancelInvitation, hasPermission, checkRolePermission`.

Deferred: `loadTeams`, team CRUD, dynamic roles CRUD.

Derived helpers: `isOwner`, `isAdmin`, `canManageMembers`, `canManageOrg`.

---
### 7. Hooks

`useOrganizations`, `useActiveOrganization`, `useOrgMembers`, `useOrgInvitations`, `useOrgPermission(resource, actions[])`, `useOrgRole`, (later) `useTeams`.

---
### 8. Permission Model (Phase 3)

Static baseline mapping:
```ts
const defaultRolePermissions = {
  owner: { organization: ['update','delete'], member: ['create','update','delete'], invitation: ['create','cancel'] },
  admin: { organization: ['update'], member: ['create','update','delete'], invitation: ['create','cancel'] },
  member: {}
};
```
Evaluation order: if live -> ask API `hasPermission`; fallback to local. Multi-role union (if backend returns comma-separated roles) – split and union actions.

Dynamic roles (Phase 5): Extend with runtime roles listing & CRUD; union with static.

---
### 9. UI Components

Global Navigation:
- `OrganizationSwitcher` (popover / command palette style): list, active indicator, create button, leave action, search filter.

Settings Panels (existing `Settings` page extension):
- `OrganizationOverviewPanel`
- `MembersPanel`
- `InvitationsPanel`
- (Optional) `TeamsPanel`
- (Optional) `RolesPanel` (dynamic roles)

Modals / Dialogs:
- `CreateOrganizationModal`
- `InviteMemberModal`
- `UpdateMemberRoleDialog`
- `ConfirmLeaveOrganizationDialog`
- (Optional) `CreateTeamModal`

UX Patterns:
- Skeleton loaders for lists.
- Toast feedback (success/failure).
- Disabled buttons with permission tooltip messages.

---
### 10. Routing & Deep Linking

No new routes initially. Optional query param `?org=slug` processed on mount to set active org (Phase 6). Potential future route `/organizations/:slug` for direct deep links.

---
### 11. Mock Mode Behavior

Seed: On first load if empty, create primary org with current user as owner.
Persistence: localStorage (orgs, members, invitations, roles, teams) if feature flag enabled.
Simulated invitation expiry: prune on `listInvitations` call.
Constraints: Prevent deleting sole remaining org. Leaving last org returns to personal workspace (active null).

---
### 12. Migration to Live Backend (Client Perspective)

Cutover Steps:
1. Confirm backend organization endpoints deployed.
2. Switch `VITE_ORG_MODE=live`.
3. Health probe: `listOrganizations`; fallback to mock if 404.
4. Remove any temporary normalizations (none if we never depended on tenantId).
5. Optionally retain mock mode for local/offline development.

Backward Compatibility: If no organizations returned -> treat as personal workspace (active null allowed).

---
### 13. Error / Loading Handling

Central `status` slices. Each async action sets pending flag and resets on settle. Errors stored + surfaced via alert banner and toast. Permission errors standardized (`code: 'FORBIDDEN'`).

---
### 14. Testing Strategy

Unit (Jest):
- Adapter mock logic (create -> list invariants)
- Permission evaluation (role matrices)
- Context state transitions (switch, create, invite, accept)

Component Tests:
- Switcher interactions (create, switch, disallowed actions)
- MembersPanel role update gating

Future E2E: Multi-user scenario invitation accept (Cypress) using separate localStorage namespace.

---
### 15. Security Considerations

- Client MUST NOT assume permission for destructive ops; server required later to enforce.
- Validate slug locally (`^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`).
- Avoid exposing internal metadata editing until server validation is ready.

---
### 16. Accessibility

- Keyboard navigable switcher (arrow + enter, aria-activedescendant).
- Proper role=dialog for modals; focus trap.
- Semantic table headers in members/invitations.

---
### 17. Telemetry (Phase 6 Optional)

Event names: `org:create`, `org:switch`, `org:invite`, `org:invitation_accept`, `org:role_update`.
Abstraction: simple `emitOrgEvent(name, payload)` no-op until analytics integrated.

---
### 18. Implementation Task Breakdown (Granular, Updated v0.2)

Phase 0 (Prep) – COMPLETE
1. Env flags & README snippet ✅ (README snippet pending final polish) 
2. Core types file ✅
3. Adapter interface (mock + live stub) ✅
4. OrganizationContext shell ✅
5. Root provider injection behind flag ✅
6. Basic smoke test (initial seeding & active org) ✅

Phase 1 (Core Orgs) – COMPLETE
7. Mock list/create/setActive ✅
8. Seed default org + owner member ✅
9. OrganizationSwitcher UI ✅
10. Create organization modal ✅ (slug auto-generation; uniqueness relaxed)
11. LocalStorage persistence + hydration ✅

Phase 2 (Members & Invitations) – COMPLETE (enhancements pending)
12. Members & invitations adapter methods ✅
13. MembersPanel / InvitationsPanel ✅
14. InviteMemberModal with validation ✅
15. Accept/Reject/Cancel flows ✅ (UI still minimal; optimistic state improvements deferred) 
16. Active member derivation (current-user placeholder) ✅

Phase 3 (Roles & Permissions) – COMPLETE
17. Static permission map ✅
18. `useOrgPermission` hook ✅
19. Permission gating on member role change/invite actions ✅ (additional gating TODO: team & role CRUD buttons) ⏱
20. UpdateMemberRoleDialog ✅

Phase 4 (Teams) – COMPLETE (refinements pending)
21. Team data structures + CRUD (create/list/update/delete) ✅
22. TeamsPanel basic UI ✅
23. Team membership add/remove & listing ✅
24. Active team selection (NOT implemented – decision: defer until server semantics clarified) ⏱

Phase 5 (Dynamic Roles) – COMPLETE (mock scope)
25. Dynamic roles storage & CRUD in mock adapter ✅
26. RolesPanel (list/create/update/delete) ✅
27. Integrate dynamic roles into permission evaluation (union with static) ✅

Phase 6 (Hardening) – IN PROGRESS
28. Skeleton loaders for each panel (organizations/members/invitations/teams/roles) ✅
29. Toast provider ✅
  29a. Audit all adapter call sites ensure success & error toasts (UNIFIED: "{entity} {action} {result}") ⏱
  29b. Add missing success toasts for role/team CRUD (verify) ⏱
  29c. Add error toast fallbacks where only banner presently shown ⏱
30. Error banner & standardized error mapping (FOUNDATION IMPLEMENTED)
  30a. Introduce error code mapping layer (adapter -> friendly message) ✅
  30b. Central `mapOrgError(code, raw)` utility exported for tests ✅
  30c. Replace inline `normError` usage in banner with mapped message ✅
  30d. Add unit tests for mapping (TODO) ⏱
31. Retry patterns (idempotent re-fetch buttons)
  31a. Disable retry buttons while target slice is loading ✅
  31b. Clear slice error on successful retry ✅
  31c. Add exponential backoff helper (optional/deferred) ⏱
  31d. Log retry attempts (console.debug hook) ⏱
32. Expanded tests
  32a. Role CRUD happy path ⏱
  32b. Team CRUD + membership ⏱
  32c. Permission gating (negative + positive) ⏱
  32d. Error + retry flow (force adapter error then recover) ⏱
  32e. Deep link `?org=slug` activation ⏱
  32f. Error mapping utility unit tests ⏱
33. Documentation `docs/organization-client.md` (usage + flag matrix) ⏱
34. Additional gating: hide team/role UI if flags disabled ✅ (flags used)
  34a. Permission tooltips for disabled buttons ⏱
35. Query param `?org=slug` activation (deep link) ✅

Phase 7 (Cutover) – NOT STARTED
36. Live adapter endpoints alignment & normalization ⏱
37. Health probe + automatic fallback (mock if 404/network) ⏱
38. Remove outdated mock-only edge cases from docs ⏱
39. End-to-end permission verification against live backend ⏱
40. Performance review (localStorage size, render passes) ⏱

Post-Cutover Enhancements (Backlog – not blocking core delivery)
41. Active team selection semantics (server contract) ⏱
42. Invitation expiry badge (if backend exposes) ⏱
43. Org logo/avatar support (upload or generated initials) ⏱
44. Metadata editing (once validated server-side) ⏱

Key Outstanding Items (Next Execution Order)
 A. Skeleton loaders (Task 28)
 B. Integrate toast calls into adapter action wrappers (Task 29)
 C. Error banner & retry affordances (Tasks 30–31)
 D. Tests expansion (Task 32)
 E. Usage/documentation file (Task 33)
 F. Deep link ?org=slug handling (Task 35)
 G. Begin cutover prep: health probe design (Task 37)

---
### 19. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend delay | Feature unusable | Robust mock mode fully functional |
| Permission mismatch on cutover | UI exposes disallowed actions | Always re-check server errors / hide actions based on server hasPermission once live |
| LocalStorage bloat | Performance degrade | Namespace + version key; limit stored fields |
| Role complexity early | Scope creep | Defer dynamic roles until stable static roles |
| State desync after actions | Stale UI | Central refresh + targeted local updates on success |

---
### 20. Deliverables Summary

- Code: adapter, context, hooks, UI components
- Types: `types/organization.ts`
- Env updates & README snippet
- Docs: this plan + future usage doc
- Tests: unit + component
- Feature flags: gating all new UI safely

---
### 21. Immediate Next Steps

- **Target A:** Implement skeleton loaders in all major panels (organization switcher, member list, invitations list).
- **Target B:** Add toasts for invitation acceptance/rejection + error conditions.
- **Target C:** Finalize docs + migration guide with mock/live adapter notes.

---
### 22. Cutover Checklist (Future)

1. Backend endpoints available & documented
2. Switch `VITE_ORG_MODE=live`
3. Confirm `listOrganizations` returns >0 or fallback to mock
4. Validate permission checks vs server
5. Run regression tests

---
### 23. Appendix: Slug & Validation Rules

Slug regex: `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`
Name length: 2–60 chars (enforce client side)
Email invites: must not already belong as member (case-insensitive) or active invitation unless resend=true.

---
### 24. Resolved Questions

1. Personal workspace visibility: Invisible unless zero orgs – implemented assumption.
2. Invitation expiry UI: Deferred (prune acceptable temporarily).
3. Metadata fields: Deferred – omit from MVP.
4. Logo/upload: Deferred – name only (optional future avatar placeholder).

---
### 25. Change Log (for this Plan Doc)

- v0.1 Initial comprehensive plan created.
- v0.1.1 Added autonomous execution + Better Auth adherence directives; error auto-fix policy.
- v0.2 Incorporated clarified product decisions (workspace invisibility, expiry deferment, metadata/logo deferral); updated task status through Phase 5; added Phase 6/7 granular tasks & backlog.
- v0.2.2 Added skeleton loader Target A kickoff, new OrgContext `loading` flag, directive 4a lint/type-check enforcement.
