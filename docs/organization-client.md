# Organization Client Feature Documentation

Version: 0.1.0 (Initial Draft)
Status: Phase 6 Hardening – Test & UX normalization in progress
Scope: Frontend-only implementation of Better Auth Organization Plugin client features with mock + live adapter strategy.

## Overview
The Organization Client module enables multi-organization functionality inside the application while remaining backend-agnostic until live endpoints are available. A feature-flag driven context (`OrganizationProvider`) supplies organizational state (organizations, members, invitations, teams, roles) plus action wrappers, permission evaluation, and error/retry UX.

## Architecture
- Adapter Layer: `@lib/organization/adapter-mock` (fully functional mock with localStorage persistence) and `@lib/organization/adapter-live` (stub – aligns with future Better Auth endpoints).
- Context: `src/contexts/OrganizationContext` centralizes async flows, granular status flags, permissions, seeding, deep linking (`?org=slug`), and error normalization.
- Permission Model: Static baseline in `permissions.ts` (`defaultRolePermissions`) + optional dynamic roles union from mock adapter role CRUD.
- UI Integration: Panels (Members, Invitations, Teams, Roles), organization switcher, action dialogs/modals (create org, invite, update role), global `ErrorBanner` + toast feedback.
- Feature Flags (Vite env):
  - `VITE_ENABLE_ORGANIZATIONS` (gate entire feature)
  - `VITE_ORG_MODE` (`mock` | `live`)
  - `VITE_ORG_TEAMS_ENABLED`
  - `VITE_ORG_DYNAMIC_ROLES_ENABLED`

## Feature Flags Matrix
| Flag | Default | Effect |
|------|---------|--------|
| VITE_ENABLE_ORGANIZATIONS | false | Disables provider & UI entirely when not 'true'. |
| VITE_ORG_MODE | mock | Chooses adapter (mock/live). |
| VITE_ORG_TEAMS_ENABLED | false | Hides Teams panel & team actions. |
| VITE_ORG_DYNAMIC_ROLES_ENABLED | false | Hides dynamic Roles CRUD panel. |

## Auto-Seed Logic
On first load (no organizations returned) the context seeds a default organization "My Organization" (mock adapter) ensuring UI/tests have an active org baseline. Active selection chooses persisted active id (localStorage) or first organization fallback. Deep link `?org=slug` overrides if present.

## Adapter Contract (Current Subset)
All adapter methods resolve to `{ data?: T; error?: string }` (never throw). Error strings are mapped through `mapOrgError(raw)` for user-friendly messaging.

| Method | Params | Returns | Notes |
|--------|--------|---------|-------|
| listOrganizations() | – | `{ data: Organization[] }` | Primary hydration; triggers auto-seed when empty (context side). |
| createOrganization({ name }) | name | `{ data: Organization }` | Slug auto-generation occurs in adapter. |
| setActiveOrganization(id) | id | `{ data?: void }` | Persists active org id (mock). |
| listMembers(orgId) | orgId | `{ data: Member[] }` | Owner/admin/member roles. |
| inviteMember({ email, role, organizationId }) | object | `{ data: Invitation }` | Duplicate prevention handled inside adapter. |
| listInvitations(orgId) | orgId | `{ data: Invitation[] }` | Expired invitations pruned. |
| removeMember(memberId) | id | `{}` | Prevent removing last owner (future). |
| updateMemberRole(memberId, role) | ids | `{}` | Safety validations minimal in mock. |
| listTeams(orgId) | orgId | `{ data: Team[] }` | Flag gated. |
| createTeam({ name, organizationId }) | object | `{ data: Team }` | Name uniqueness soft enforced in mock. |
| listRoles(orgId) | orgId | `{ data: RoleDescriptor[] }` | Dynamic roles (flag). |
| createRole({ organizationId, name }) | object | `{ data: RoleDescriptor }` | Permissions optional; defaults empty map. |
| updateRole(id, { name }) | object | `{ data: RoleDescriptor }` | Partial updates. |
| deleteRole(id) | id | `{}` | Removes from dynamic map. |

## Error Handling
- Error Mapping: `mapOrgError(raw: string)` converts raw/technical strings (network, timeout, forbidden, duplicate, validation, rate limit) to user-friendly messages.
- Banner: `ErrorBanner` surfaces highest-level slice error with retry buttons per domain. Buttons disabled while associated slice loading.
- Toasts: Immediate feedback for success/failure of discrete actions (create, invite, role updates, team operations). Pending audit to unify phrasing.

## Retry UX
Each retry button invokes the relevant loader (organizations, members, invitations, teams, roles). On success the slice-level `error` is cleared. Future enhancement: exponential backoff & attempt logging.

## Permission Evaluation
`hasPermission(domain, action)` merges static + dynamic role maps. Dynamic roles (mock) extend available permissions; live adapter will defer to server authoritative responses later (cutover phase).

## Deep Linking
Query parameter `?org=slug` applied after initial organization fetch; if slug matches a different org than active, active is switched and a toast is emitted.

## Testing Strategy (Planned Expansion)
- CRUD flows (role & team) including UI state transitions.
- Permission gating (buttons disabled or hidden for member vs admin/owner).
- Error injection & retry recovery clearing banner.
- Deep link activation test verifying active org switch.
- Error mapping unit tests for representative raw strings.

## Roadmap (Remaining Phase 6/7 Highlights)
- Unified toast message audit & permission tooltips.
- Expanded test suite (see tasks 32a–32f in plan).
- Live adapter endpoint alignment + health probe fallback (Phase 7).

## Integration Instructions
1. Ensure flags added to `.env` (see Feature Flags Matrix).
2. Wrap app root with `OrganizationProvider` conditionally (feature flag).
3. Render `ErrorBanner` near top-level layout to surface cross-panel errors.
4. Use provided hooks (`useOrganizations`) or future granular hooks (to be added) for panel implementations.

## Future Considerations
- Active team semantics after backend contract stabilization.
- Invitation expiry UI badge once server surfaces status metadata.
- Organization avatar/logo support.

---
Generated automatically (draft). Update alongside implementation changes. Do not manually inline server endpoint specifics until Phase 7 cutover.
