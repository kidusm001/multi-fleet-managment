import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';

jest.mock('@/contexts/OrganizationContext');

function RolesLoader() {
  const { roles, teams } = useOrganizations();
  return <div data-testid="roles-count">{roles?.length ?? 0}:{teams?.length ?? 0}</div>;
}

describe('Organization extended behaviors', () => {
  it('loads roles & teams without crashing', () => {
    render(<OrganizationProvider><RolesLoader /></OrganizationProvider>);
    expect(screen.getByTestId('roles-count').textContent).toBe('2:2');
  });
});
