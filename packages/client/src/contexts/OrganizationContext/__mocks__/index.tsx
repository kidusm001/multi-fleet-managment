import React, { createContext, useContext, ReactNode } from 'react';

// Mock context value
const mockContextValue = {
  // Organization data
  organizations: [
    { id: 'org1', name: 'Test Org 1', slug: 'test-org-1' },
    { id: 'org2', name: 'Test Org 2', slug: 'test-org-2' }
  ],
  activeOrganization: { id: 'org1', name: 'Test Org 1', slug: 'test-org-1' },
  
  // Loading states
  isLoading: false,
  isLoadingOrganizations: false,
  isLoadingActiveOrg: false,
  
  // Error states
  error: null,
  status: {
    loadingOrganizations: false,
    loadingMembers: false,
    loadingInvitations: false,
    loadingTeams: false,
    loadingRoles: false,
    switching: false,
    creating: false,
    error: null,
  },
  
  // Actions
  createOrganization: jest.fn().mockResolvedValue({ id: 'new-org', name: 'New Org' }),
  setActiveOrganization: jest.fn().mockResolvedValue(undefined),
  updateOrganization: jest.fn().mockResolvedValue({ id: 'org1', name: 'Updated Org' }),
  deleteOrganization: jest.fn().mockResolvedValue(undefined),
  refresh: jest.fn().mockResolvedValue(undefined),
  
  // Members
  members: [
    { id: 'member1', userId: 'user1', email: 'user1@test.com', role: 'owner' },
    { id: 'member2', userId: 'user2', email: 'user2@test.com', role: 'member' }
  ],
  listMembers: jest.fn().mockResolvedValue([
    { id: 'member1', userId: 'user1', email: 'user1@test.com', role: 'owner' },
    { id: 'member2', userId: 'user2', email: 'user2@test.com', role: 'member' }
  ]),
  inviteMember: jest.fn().mockResolvedValue({ id: 'inv1', email: 'new@test.com' }),
  addMember: jest.fn().mockResolvedValue({ id: 'member3', userId: 'user3' }),
  removeMember: jest.fn().mockResolvedValue(undefined),
  updateMemberRole: jest.fn().mockResolvedValue(undefined),
  loadMembers: jest.fn().mockResolvedValue(undefined),
  
  // Invitations
  invitations: [
    { id: 'inv1', email: 'pending@test.com', status: 'pending' }
  ],
  listInvitations: jest.fn().mockResolvedValue([
    { id: 'inv1', email: 'pending@test.com', status: 'pending' }
  ]),
  acceptInvitation: jest.fn().mockResolvedValue(undefined),
  cancelInvitation: jest.fn().mockResolvedValue(undefined),
  loadInvitations: jest.fn().mockResolvedValue(undefined),
  
  // Teams
  teams: [
    { id: 'team1', name: 'Engineering' },
    { id: 'team2', name: 'Design' }
  ],
  loadTeams: jest.fn().mockResolvedValue(undefined),
  
  // Roles
  roles: [
    { id: 'role1', name: 'admin', permissions: ['member:create', 'organization:delete'] },
    { id: 'role2', name: 'member', permissions: ['member:read'] }
  ],
  loadRoles: jest.fn().mockResolvedValue(undefined),
  createRole: jest.fn().mockResolvedValue({ id: 'role3', name: 'custom' }),
  updateRole: jest.fn().mockResolvedValue({ id: 'role1', name: 'updated' }),
  deleteRole: jest.fn().mockResolvedValue(undefined),
  
  // Permissions - owner has all permissions
  hasPermission: jest.fn((_domain: string, _action: string) => {
    // Owner role has all permissions
    return true;
  }),
  
  // Team operations
  createTeam: jest.fn().mockResolvedValue({ id: 'team3', name: 'New Team' }),
  addMemberToTeam: jest.fn().mockResolvedValue(undefined),
  listTeamMembers: jest.fn().mockResolvedValue([]),
  removeMemberFromTeam: jest.fn().mockResolvedValue(undefined),
};

const OrganizationContext = createContext(mockContextValue);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  return (
    <OrganizationContext.Provider value={mockContextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizations() {
  return useContext(OrganizationContext);
}

// Mock implementation of mapOrgError
export function mapOrgError(error: string): string {
  if (!error || error.trim() === '') return 'An unexpected error occurred';
  const lower = error.toLowerCase();
  if (lower.includes('network') || lower.includes('unreachable')) return 'Network issue – please check your connection and retry.';
  if (lower.includes('timeout') || lower.includes('timed out')) return 'Request timed out – try again.';
  if (lower.includes('forbidden') || lower.includes('permission')) return 'You lack permission for this action.';
  if (lower.includes('not found')) return 'Requested resource was not found.';
  if (lower.includes('duplicate')) return 'A record with these details already exists.';
  if (lower.includes('validation') || lower.includes('invalid')) return 'Some inputs were invalid – review and try again.';
  if (lower.includes('rate limit')) return 'Too many requests – wait a moment.';
  return error;
}
