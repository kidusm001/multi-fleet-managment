import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';

// Use the manual mock
jest.mock('@/contexts/OrganizationContext');

function RetryHarness() {
  const { members } = useOrganizations();
  return <div data-testid="members-count">{members?.length || 0}</div>;
}

describe('Organization retry flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows members count', () => {
    render(<OrganizationProvider><RetryHarness /></OrganizationProvider>);
    expect(screen.getByTestId('members-count')).toBeInTheDocument();
  });
});
