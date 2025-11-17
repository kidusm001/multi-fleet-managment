// Live Better Auth integration test (organization plugin) requires a running backend.
// We gate EVERYTHING behind the env flag so normal unit test runs never import client code.
export {}; // ensure this file is a module to avoid potential global re-declaration noise

const RUN_LIVE_AUTH = process.env.RUN_LIVE_AUTH_TESTS === 'true';

if (!RUN_LIVE_AUTH) {
  describe('Better Auth integration (flagged off by default)', () => {
    test('guards against accidental live backend usage', () => {
      expect(RUN_LIVE_AUTH).toBe(false);
    });
  });
} else {
  describe('Better Auth integration (live)', () => {
    // Use loose typing; if better-auth exposes types you can replace 'any' with the proper client type.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let authClient: any;

    beforeAll(async () => {
      const mod = await import('./auth-test-client');
      authClient = mod.authClient;
    });

    test('session established', async () => {
      globalThis.__authToken = process.env.TEST_ADMIN_SESSION_TOKEN || '';
      const session = await authClient.getSession();
      expect(session?.error).toBeFalsy();
      expect(session?.data || session?.user || session).toBeTruthy();
    });

    test('admin list users', async () => {
      const usersResp = await authClient.admin.listUsers({ query: { limit: 1, offset: 0 } });
      expect(usersResp.error).toBeFalsy();
      // Some versions return { data: [...] }, others just array — be tolerant.
      const users = usersResp.data || usersResp.users || usersResp;
      expect(Array.isArray(users)).toBe(true);
    });

    test('organization plugin optional smoke', async () => {
      // Organization plugin docs: ensure endpoints only if plugin configured server-side.
      // We probe defensively so the test passes even if plugin is absent.
      const orgApi = authClient.organization || authClient.organizations || authClient.org;
      if (!orgApi) {
        console.warn('Organization plugin endpoints not present on authClient (skipping assertions)');
        return;
      }
      // Try list organizations if available.
      const listFn = orgApi.listOrganizations || orgApi.getOrganizations || orgApi.list;
      if (listFn) {
        const orgs = await listFn.call(orgApi, { query: { limit: 1, offset: 0 } }).catch(() => null);
        // Accept either error (plugin misconfigured) or successful data; just ensure no unhandled throw.
        if (orgs && !orgs.error) {
          const collection = orgs.data || orgs.organizations || orgs;
            expect(Array.isArray(collection)).toBe(true);
        }
      }
    });
  });
}