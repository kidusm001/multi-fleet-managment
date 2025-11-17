import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';

jest.mock('@/contexts/OrganizationContext');

function PermissionProbe() {
  const { hasPermission, members } = useOrganizations();
  const canCreateMember = hasPermission('member','create');
  const canDeleteOrg = hasPermission('organization','delete');
  return <div>
    <span data-testid="members-len">{members.length}</span>
    <span data-testid="perm-create-member">{String(canCreateMember)}</span>
    <span data-testid="perm-delete-org">{String(canDeleteOrg)}</span>
  </div>;
}

describe('Permission gating (default owner)', () => {
  beforeAll(() => {
    globalThis.__IMETA = globalThis.__IMETA || {};
    globalThis.__IMETA.env = { ...globalThis.__IMETA.env, VITE_ENABLE_ORGANIZATIONS: 'true' };
  });
  
  it('owner seeded should have member:create and organization:delete', () => {
    render(<OrganizationProvider><PermissionProbe /></OrganizationProvider>);
    expect(screen.getByTestId('members-len').textContent).toBe('2');
    expect(screen.getByTestId('perm-create-member').textContent).toBe('true');
    expect(screen.getByTestId('perm-delete-org').textContent).toBe('true');
  });
});
