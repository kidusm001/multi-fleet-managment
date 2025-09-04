import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';
import { ToastProvider } from '@/contexts/ToastContext';

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
  beforeAll(() => {
    import.meta.env = { ...(import.meta.env || {}), VITE_ENABLE_ORGANIZATIONS: 'true' };
    // clear localStorage between runs
    localStorage.clear();
  });

  it('seeds first organization and sets active', async () => {
  render(<ToastProvider><OrganizationProvider><Consumer /></OrganizationProvider></ToastProvider>);
    await waitFor(() => expect(screen.getByTestId('org-count').textContent).not.toBe('0'));
    expect(screen.getByTestId('active-org').textContent).not.toBe('none');
  });
});
