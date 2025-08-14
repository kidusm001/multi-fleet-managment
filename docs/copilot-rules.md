---
description: Guardrails for code changes made by AI assistant in this repo
---

- Preserve UI/UX: Do not remove or downgrade designs/components. If a component has missing deps, add minimal adapters/shims or install the dependency rather than deleting or simplifying the UI.
	- Recovery protocol: If a prior change stripped UI, restore the original component file(s) from VCS or reintroduce the subcomponents and adapters so the design renders unchanged before proceeding with logic fixes.
	- Never replace complex views with placeholders without written approval. Prefer stubbing data with the same props contract or adding a thin compatibility layer.
- Non-destructive fixes: Prefer additive, compatibility layers over stripping features. If pruning is required, get explicit approval first.
- Path aliases: Honor existing import aliases. If aliases are missing, add Vite + TS path mappings to match component imports.
- Seed logins: Keep `prisma/seed.ts` with valid, working credentials and document them here and in README for local dev.
	- Default tenant IDs: `default-tenant` and `acme-tenant` exist in seed. Unless specified, use `default-tenant` for local sign-in.
	- Demo credentials (local):
		- Admin: email `admin@demofleet.com`, password `Routegna123!`, tenant `default-tenant`
		- Manager: email `manager@acme.com`, password `Routegna123!`, tenant `acme-tenant`
- Auth consistency: Match frontend `/auth/*` calls to backend routes. If better-auth is unused, keep custom email/password endpoints.
- Minimal external deps: Only add packages when necessary. For shared UI, create thin wrappers under `src/components/Common/UI/*` to satisfy design imports.
	- Import aliases required by design: map `@components`, `@/components`, `@lib`, `@/lib`, `@services`, `@contexts` to `src/*` using both TS config and Vite `resolve.alias`.
	- If design imports `prop-types` or `framer-motion`, install them instead of removing propTypes/animations.

- Frontend non-removal rule (hard requirement):
	- You are not allowed to remove designs. Any fix must preserve styles, layout, and interactions. Add missing building blocks (UI primitives, context providers, utilities) to make existing components work.
	- If a large refactor is needed, first land a compatibility layer that keeps the UI intact, then refactor behind the scenes.
- Tests and type safety: Run `pnpm -C packages/server test` and `pnpm -C packages/client typecheck` after changes. Fix only related failures.
- Docs first: Update `docs/frontend-port-plan.tmp.md` when port plan changes; record deviations and rationale.
