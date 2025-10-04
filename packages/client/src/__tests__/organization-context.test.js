import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';

jest.mock('@/contexts/OrganizationContext');

function Consumer() {
  const { organizations, activeOrganization } = useOrganizations();
  return (
    <div>
      <div data-testid="org-count">{organizations.length}</div>
      <div data-testid="active-org">{activeOrganization?.id || 'none'}</div>
    </div>
  );
}

describe('OrganizationProvider', () => {
  it('provides organizations and active organization', () => {
    render(<OrganizationProvider><Consumer /></OrganizationProvider>);
    expect(screen.getByTestId('org-count').textContent).toBe('2');
    expect(screen.getByTestId('active-org').textContent).toBe('org1');
  });
});
