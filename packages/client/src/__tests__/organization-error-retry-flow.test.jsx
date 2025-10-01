import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';
import { ToastProvider } from '@contexts/ToastContext';

// Simulate transient failure on first listMembers call via monkey patch
function RetryHarness() {
  const { loadMembers, members, loadInvitations } = useOrganizations();
  React.useEffect(() => { (async () => {
    await loadMembers();
    await loadInvitations();
  })();  
  }, [loadMembers, loadInvitations]);
  return <div data-testid="members-count">{members.length}</div>;
}

describe('Organization retry flow', () => {
  let restore = null;
  beforeAll(async () => {
    (globalThis).importMetaEnv = { VITE_ENABLE_ORGANIZATIONS: 'true' };
  });
  beforeEach(async () => {
    localStorage.clear();
    const mod = await import('@/lib/organization/adapter-mock');
  const mock = mod.default;
    const original = mock.listMembers;
    let first = true;
  mock.listMembers = async (orgId) => {
      if (first) { first = false; return { data: null, error: 'network temporary' }; }
      return original(orgId);
    };
    restore = () => { mock.listMembers = original; };
  });
  afterEach(() => { if (restore) restore(); });
  it('recovers after retrying members load', async () => {
    render(<ToastProvider><OrganizationProvider><RetryHarness /></OrganizationProvider></ToastProvider>);
    await waitFor(() => expect(screen.getByTestId('members-count').textContent).toBe('1'));
  });
});
