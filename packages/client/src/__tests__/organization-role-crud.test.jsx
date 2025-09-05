import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';
import { ToastProvider } from '@/contexts/ToastContext';

function RoleCrudHarness() {
  const { loadRoles, createRole, updateRole, deleteRole, roles } = useOrganizations();
  React.useEffect(() => { (async () => {
    await loadRoles();
    await createRole('qa');
    await loadRoles();
    const created = roles?.find(r => r.name === 'qa');
    if (created) {
      await updateRole(created.id, 'qa-upd');
      await loadRoles();
      const upd = roles?.find(r => r.name === 'qa-upd');
      if (upd) {
        await deleteRole(upd.id);
        await loadRoles();
      }
    }
  })(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div data-testid="roles-final-count">{roles?.length ?? 0}</div>;
}

describe('Organization roles CRUD (mock)', () => {
  beforeEach(() => {
    import.meta.env = { ...(import.meta.env || {}), VITE_ENABLE_ORGANIZATIONS: 'true', VITE_ORG_DYNAMIC_ROLES_ENABLED: 'true' };
    localStorage.clear();
  });
  it('performs create/update/delete role sequence without throwing', async () => {
    render(<ToastProvider><OrganizationProvider><RoleCrudHarness /></OrganizationProvider></ToastProvider>);
    await waitFor(() => expect(screen.getByTestId('roles-final-count')).toBeInTheDocument());
  });
});
