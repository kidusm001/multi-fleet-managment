import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';
import { ToastProvider } from '@/contexts/ToastContext';

function PermissionProbe() {
  const { loadMembers, hasPermission, members } = useOrganizations();
  React.useEffect(() => { loadMembers(); }, [loadMembers]);
  const canCreateMember = hasPermission('member','create');
  const canDeleteOrg = hasPermission('organization','delete');
  return <div>
    <span data-testid="members-len">{members.length}</span>
    <span data-testid="perm-create-member">{String(canCreateMember)}</span>
    <span data-testid="perm-delete-org">{String(canDeleteOrg)}</span>
  </div>;
}

describe('Permission gating (default owner)', () => {
  beforeEach(() => {
    import.meta.env = { ...(import.meta.env || {}), VITE_ENABLE_ORGANIZATIONS: 'true' };
    localStorage.clear();
  });
  it('owner seeded should have member:create and organization:delete', async () => {
    render(<ToastProvider><OrganizationProvider><PermissionProbe /></OrganizationProvider></ToastProvider>);
    await waitFor(() => expect(screen.getByTestId('members-len').textContent).not.toBe('0'));
    expect(screen.getByTestId('perm-create-member').textContent).toBe('true');
    expect(screen.getByTestId('perm-delete-org').textContent).toBe('true');
  });
});
