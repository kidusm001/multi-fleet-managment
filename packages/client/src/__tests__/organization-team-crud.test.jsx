import React from 'react';
// Ensure env flags visible to flags.ts before context logic executes
beforeAll(() => {
  (globalThis).importMetaEnv = {
    VITE_ENABLE_ORGANIZATIONS: 'true',
    VITE_ORG_TEAMS_ENABLED: 'true',
    VITE_ORG_MODE: 'mock',
    VITE_ORG_DYNAMIC_ROLES_ENABLED: 'false'
  };
});
import { render, screen, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';
import { ToastProvider } from '@/contexts/ToastContext';

function TeamCrudHarness() {
  const { loadTeams, createTeam, teams, activeOrganization } = useOrganizations();
  React.useEffect(() => {
    if (!activeOrganization) return; // wait until org seeded
    (async () => {
      await createTeam('Alpha');
      await loadTeams();
    })();
  }, [activeOrganization, createTeam, loadTeams]);
  return <div data-testid="teams-count">{teams?.length ?? 0}</div>;
}

describe('Organization teams CRUD (mock)', () => {
  beforeEach(() => { localStorage.clear(); });
  it('creates a team and lists it', async () => {
    render(<ToastProvider><OrganizationProvider><TeamCrudHarness /></OrganizationProvider></ToastProvider>);
    await waitFor(() => {
      const count = Number(screen.getByTestId('teams-count').textContent);
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});
