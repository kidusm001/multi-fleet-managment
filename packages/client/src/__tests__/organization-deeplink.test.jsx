import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';

jest.mock('@/contexts/OrganizationContext');

function DeepLinkHarness() {
  const { activeOrganization } = useOrganizations();
  return <div data-testid="active-slug">{activeOrganization?.slug || ''}</div>;
}

describe('Organization deep link activation', () => {
  it('shows active organization slug', () => {
    render(<OrganizationProvider><DeepLinkHarness /></OrganizationProvider>);
    expect(screen.getByTestId('active-slug').textContent).toBe('test-org-1');
  });
});
