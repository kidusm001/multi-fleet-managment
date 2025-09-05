import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';
import { ToastProvider } from '@contexts/ToastContext';

function DeepLinkHarness() {
  const { activeOrganization, create, refresh, organizations } = useOrganizations();
  React.useEffect(() => { (async () => {
    if (organizations.length === 1) {
      await create('Second Org');
      await refresh();
    }
  })(); }, [organizations, create, refresh]);
  return <div data-testid="active-slug">{activeOrganization?.slug || ''}</div>;
}

describe('Organization deep link activation', () => {
  beforeAll(() => {
    (globalThis).importMetaEnv = { VITE_ENABLE_ORGANIZATIONS: 'true' };
    Object.defineProperty(window, 'location', { value: new URL('http://localhost/?org=second-org') });
  });
  beforeEach(() => { localStorage.clear(); });
  it('activates organization matching ?org slug', async () => {
    render(<ToastProvider><OrganizationProvider><DeepLinkHarness /></OrganizationProvider></ToastProvider>);
    await waitFor(() => expect(screen.getByTestId('active-slug').textContent).toBe('second-org'));
  });
});
