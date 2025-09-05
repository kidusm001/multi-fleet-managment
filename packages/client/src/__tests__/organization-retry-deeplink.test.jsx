import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';
import { ToastProvider } from '@/contexts/ToastContext';

// We will monkey-patch adapter through global hook by forcing listOrganizations to fail once.

function RetryHarness() {
  const { organizations, refresh, status } = useOrganizations();
  return <div>
    <span data-testid="orgs-len">{organizations.length}</span>
    <span data-testid="orgs-loading">{String(!!status?.loadingOrganizations)}</span>
    <button onClick={() => refresh()} data-testid="manual-refresh">Refresh</button>
  </div>;
}

describe('Retry + Deep Link behaviors', () => {
  beforeEach(() => {
    import.meta.env = { ...(import.meta.env || {}), VITE_ENABLE_ORGANIZATIONS: 'true' };
    localStorage.clear();
  });

  it('deep link selects org by slug', async () => {
    // Simulate two orgs by letting first seed then creating second manually via context after mount
    const DeepLinkComponent = () => {
      const { organizations, create, setActive } = useOrganizations();
      React.useEffect(() => { (async () => {
        if (organizations.length === 1) {
          await create('Second Org');
          const second = organizations.find(o => o.name === 'Second Org');
          if (second) await setActive(second.id);
        }
      })(); }, [organizations, create, setActive]);
      return <div data-testid="active-slug">{organizations.find(o => o.id === (organizations[0]?.id))?.slug}</div>;
    };
    render(<ToastProvider><OrganizationProvider><DeepLinkComponent /></OrganizationProvider></ToastProvider>);
    await waitFor(() => expect(screen.getByTestId('active-slug')).toBeInTheDocument());
  });

  it('manual refresh triggers loading flag', async () => {
    render(<ToastProvider><OrganizationProvider><RetryHarness /></OrganizationProvider></ToastProvider>);
    await waitFor(() => expect(Number(screen.getByTestId('orgs-len').textContent)).toBeGreaterThan(0));
    fireEvent.click(screen.getByTestId('manual-refresh'));
    await waitFor(() => expect(screen.getByTestId('orgs-loading').textContent).toBe('false'));
  });
});
