import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';
import { ToastProvider } from '@/contexts/ToastContext';

function RolesLoader() {
  const { loadRoles, roles, loadTeams, teams } = useOrganizations();
  React.useEffect(() => { loadRoles(); loadTeams(); }, [loadRoles, loadTeams]);
  return <div data-testid="roles-count">{roles?.length ?? 0}:{teams?.length ?? 0}</div>;
}

describe('Organization extended behaviors', () => {
  beforeEach(() => {
    import.meta.env = { ...(import.meta.env || {}), VITE_ENABLE_ORGANIZATIONS: 'true', VITE_ORG_DYNAMIC_ROLES_ENABLED: 'true', VITE_ORG_TEAMS_ENABLED: 'true' };
    localStorage.clear();
  });

  it('loads roles & teams without crashing', async () => {
  render(<ToastProvider><OrganizationProvider><RolesLoader /></OrganizationProvider></ToastProvider>);
    await waitFor(() => expect(screen.getByTestId('roles-count').textContent).toMatch(/:/));
  });
});
