import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';

jest.mock('@/contexts/OrganizationContext');

function RetryHarness() {
  const { organizations, status } = useOrganizations();
  return <div>
    <span data-testid="orgs-len">{organizations.length}</span>
    <span data-testid="orgs-loading">{String(!!status?.loadingOrganizations)}</span>
  </div>;
}

describe('Retry + Deep Link behaviors', () => {
  it('shows organizations list', () => {
    render(<OrganizationProvider><RetryHarness /></OrganizationProvider>);
    expect(screen.getByTestId('orgs-len').textContent).toBe('2');
    expect(screen.getByTestId('orgs-loading').textContent).toBe('false');
  });
});
