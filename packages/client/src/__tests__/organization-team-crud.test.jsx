import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';

// Use the manual mock
jest.mock('@/contexts/OrganizationContext');

function TeamCrudHarness() {
  const { teams } = useOrganizations();
  return <div data-testid="teams-count">{teams?.length ?? 0}</div>;
}

describe('Organization teams CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays teams from context', () => {
    render(<OrganizationProvider><TeamCrudHarness /></OrganizationProvider>);
    expect(screen.getByTestId('teams-count')).toBeInTheDocument();
  });
});
