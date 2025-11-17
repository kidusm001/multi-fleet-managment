import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrganizationProvider, useOrganizations } from '@/contexts/OrganizationContext';

jest.mock('@/contexts/OrganizationContext');

function RoleCrudHarness() {
  const { roles } = useOrganizations();
  return <div data-testid="roles-final-count">{roles?.length ?? 0}</div>;
}

describe('Organization roles CRUD (mock)', () => {
  it('displays roles from context', () => {
    render(<OrganizationProvider><RoleCrudHarness /></OrganizationProvider>);
    expect(screen.getByTestId('roles-final-count').textContent).toBe('2');
  });
});
