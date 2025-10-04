import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { OrganizationProvider, useOrganizations, mapOrgError } from '../index';
import { authClient } from '@/lib/auth-client';

// Mock auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useListOrganizations: jest.fn(),
    useActiveOrganization: jest.fn(),
    organization: {
      create: jest.fn(),
      setActive: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      listMembers: jest.fn(),
      inviteMember: jest.fn(),
      removeMember: jest.fn(),
      updateMemberRole: jest.fn(),
      listInvitations: jest.fn(),
      acceptInvitation: jest.fn(),
      cancelInvitation: jest.fn(),
    },
  },
  useSession: jest.fn(() => ({ data: { user: { id: '1', email: 'test@example.com' } } })),
}));

describe('OrganizationContext', () => {
  const mockOrganizations = [
    { id: 'org1', name: 'Organization 1', slug: 'org-1' },
    { id: 'org2', name: 'Organization 2', slug: 'org-2' },
  ];

  const mockMembers = [
    { id: 'member1', userId: 'user1', role: 'admin', email: 'admin@example.com' },
    { id: 'member2', userId: 'user2', role: 'member', email: 'member@example.com' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    (authClient.useListOrganizations as jest.Mock).mockReturnValue({
      data: mockOrganizations,
      isPending: false,
      refetch: jest.fn(),
    });

    (authClient.useActiveOrganization as jest.Mock).mockReturnValue({
      data: mockOrganizations[0],
      isPending: false,
    });
  });

  describe('mapOrgError', () => {
    it('should map network errors correctly', () => {
      expect(mapOrgError('Network unreachable')).toBe('Network issue – please check your connection and retry.');
      expect(mapOrgError('Network failure')).toBe('Network issue – please check your connection and retry.');
    });

    it('should map timeout errors correctly', () => {
      expect(mapOrgError('Timeout while fetching')).toBe('Request timed out – try again.');
      expect(mapOrgError('timeout exceeded')).toBe('Request timed out – try again.');
    });

    it('should map permission errors correctly', () => {
      expect(mapOrgError('FORBIDDEN action')).toBe('You lack permission for this action.');
      expect(mapOrgError('Permission denied')).toBe('You lack permission for this action.');
    });

    it('should map not found errors correctly', () => {
      expect(mapOrgError('Resource not found')).toBe('Requested resource was not found.');
      expect(mapOrgError('Not Found')).toBe('Requested resource was not found.');
    });

    it('should map duplicate errors correctly', () => {
      expect(mapOrgError('Duplicate entry exists')).toBe('A record with these details already exists.');
      expect(mapOrgError('duplicate key')).toBe('A record with these details already exists.');
    });

    it('should map validation errors correctly', () => {
      expect(mapOrgError('Validation failed for field')).toBe('Some inputs were invalid – review and try again.');
    });

    it('should map rate limit errors correctly', () => {
      expect(mapOrgError('Rate limit exceeded')).toBe('Too many requests – wait a moment.');
      expect(mapOrgError('RATE LIMIT reached')).toBe('Too many requests – wait a moment.');
    });

    it('should handle case-insensitive partial matches', () => {
      expect(mapOrgError('network unreachable')).toBe('Network issue – please check your connection and retry.');
      expect(mapOrgError('NETWORK FAILURE')).toBe('Network issue – please check your connection and retry.');
    });

    it('should return original error for unknown errors', () => {
      expect(mapOrgError('Unknown error')).toBe('Unknown error');
    });

    it('should return default message for empty error', () => {
      expect(mapOrgError('')).toBe('An unexpected error occurred.');
    });
  });

  describe('Provider initialization', () => {
    it('should provide organizations from auth client', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      expect(result.current.organizations).toEqual(mockOrganizations);
      expect(result.current.activeOrganization).toEqual(mockOrganizations[0]);
    });

    it('should indicate loading state correctly', () => {
      (authClient.useListOrganizations as jest.Mock).mockReturnValue({
        data: [],
        isPending: true,
        refetch: jest.fn(),
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isLoadingOrganizations).toBe(true);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useOrganizations());
      }).toThrow('useOrganizations must be used within an OrganizationProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Organization CRUD operations', () => {
    it('should create organization successfully', async () => {
      const newOrg = { id: 'org3', name: 'New Organization', slug: 'new-org' };
      const mockRefetch = jest.fn();

      (authClient.useListOrganizations as jest.Mock).mockReturnValue({
        data: mockOrganizations,
        isPending: false,
        refetch: mockRefetch,
      });

      (authClient.organization.create as jest.Mock).mockResolvedValue({
        data: newOrg,
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        const created = await result.current.createOrganization({
          name: 'New Organization',
          slug: 'new-org',
        });
        expect(created).toEqual(newOrg);
      });

      expect(authClient.organization.create).toHaveBeenCalledWith({
        name: 'New Organization',
        slug: 'new-org',
      });
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should update organization successfully', async () => {
      const updatedOrg = { ...mockOrganizations[0], name: 'Updated Name' };
      const mockRefetch = jest.fn();

      (authClient.useListOrganizations as jest.Mock).mockReturnValue({
        data: mockOrganizations,
        isPending: false,
        refetch: mockRefetch,
      });

      (authClient.organization.update as jest.Mock).mockResolvedValue({
        data: updatedOrg,
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        const updated = await result.current.updateOrganization('org1', {
          name: 'Updated Name',
        });
        expect(updated).toEqual(updatedOrg);
      });

      expect(authClient.organization.update).toHaveBeenCalledWith({
        organizationId: 'org1',
        data: { name: 'Updated Name' },
      });
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should delete organization successfully', async () => {
      const mockRefetch = jest.fn();

      (authClient.useListOrganizations as jest.Mock).mockReturnValue({
        data: mockOrganizations,
        isPending: false,
        refetch: mockRefetch,
      });

      (authClient.organization.delete as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        await result.current.deleteOrganization('org2');
      });

      expect(authClient.organization.delete).toHaveBeenCalledWith({
        organizationId: 'org2',
      });
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should set active organization successfully', async () => {
      (authClient.organization.setActive as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        await result.current.setActiveOrganization('org2');
      });

      expect(authClient.organization.setActive).toHaveBeenCalledWith({
        organizationId: 'org2',
      });
    });
  });

  describe('Member management', () => {
    it('should list members successfully', async () => {
      (authClient.organization.listMembers as jest.Mock).mockResolvedValue({
        data: { members: mockMembers },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        const members = await result.current.listMembers('org1');
        expect(members).toEqual(mockMembers);
      });

      expect(authClient.organization.listMembers).toHaveBeenCalledWith({
        query: { organizationId: 'org1' },
      });
    });

    it('should invite member successfully', async () => {
      const newInvitation = { id: 'inv1', email: 'new@example.com', role: 'member' };
      
      (authClient.organization.inviteMember as jest.Mock).mockResolvedValue({
        data: newInvitation,
        error: null,
      });

      (authClient.organization.listInvitations as jest.Mock).mockResolvedValue({
        data: [newInvitation],
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        const invitation = await result.current.inviteMember({
          email: 'new@example.com',
          role: 'member',
        });
        expect(invitation).toEqual(newInvitation);
      });

      expect(authClient.organization.inviteMember).toHaveBeenCalledWith({
        email: 'new@example.com',
        role: 'member',
        organizationId: undefined,
      });
    });

    it('should remove member successfully', async () => {
      (authClient.organization.removeMember as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      (authClient.organization.listMembers as jest.Mock).mockResolvedValue({
        data: { members: mockMembers.slice(1) },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        await result.current.removeMember('member1');
      });

      expect(authClient.organization.removeMember).toHaveBeenCalledWith({
        memberIdOrEmail: 'member1',
        organizationId: 'org1',
      });
    });

    it('should update member role successfully', async () => {
      (authClient.organization.updateMemberRole as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      (authClient.organization.listMembers as jest.Mock).mockResolvedValue({
        data: { members: mockMembers },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        await result.current.updateMemberRole('member2', 'admin');
      });

      expect(authClient.organization.updateMemberRole).toHaveBeenCalledWith({
        memberId: 'member2',
        role: 'admin',
        organizationId: undefined,
      });
    });

    it('should load members and update state', async () => {
      (authClient.organization.listMembers as jest.Mock).mockResolvedValue({
        data: { members: mockMembers },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        await result.current.loadMembers();
      });

      await waitFor(() => {
        expect(result.current.members).toEqual(mockMembers);
      });
    });
  });

  describe('Invitation management', () => {
    const mockInvitations = [
      { id: 'inv1', email: 'invite1@example.com', status: 'pending' },
      { id: 'inv2', email: 'invite2@example.com', status: 'pending' },
    ];

    it('should list invitations successfully', async () => {
      (authClient.organization.listInvitations as jest.Mock).mockResolvedValue({
        data: mockInvitations,
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        const invitations = await result.current.listInvitations('org1');
        expect(invitations).toEqual(mockInvitations);
      });
    });

    it('should accept invitation successfully', async () => {
      (authClient.organization.acceptInvitation as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      (authClient.organization.listInvitations as jest.Mock).mockResolvedValue({
        data: mockInvitations.slice(1),
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        await result.current.acceptInvitation('inv1');
      });

      expect(authClient.organization.acceptInvitation).toHaveBeenCalledWith({
        invitationId: 'inv1',
      });
    });

    it('should cancel invitation successfully', async () => {
      (authClient.organization.cancelInvitation as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      (authClient.organization.listInvitations as jest.Mock).mockResolvedValue({
        data: mockInvitations.slice(1),
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        await result.current.cancelInvitation('inv2');
      });

      expect(authClient.organization.cancelInvitation).toHaveBeenCalledWith({
        invitationId: 'inv2',
      });
    });

    it('should load invitations and update state', async () => {
      (authClient.organization.listInvitations as jest.Mock).mockResolvedValue({
        data: mockInvitations,
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        await result.current.loadInvitations();
      });

      await waitFor(() => {
        expect(result.current.invitations).toEqual(mockInvitations);
      });
    });
  });

  describe('Permissions', () => {
    it('should check permissions (simplified implementation)', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      // Current implementation always returns true
      expect(result.current.hasPermission('routes', 'create')).toBe(true);
      expect(result.current.hasPermission('users', 'delete')).toBe(true);
    });
  });

  describe('Error handling and status', () => {
    it('should clear error on refresh', async () => {
      const mockRefetch = jest.fn().mockResolvedValue({});

      (authClient.useListOrganizations as jest.Mock).mockReturnValue({
        data: mockOrganizations,
        isPending: false,
        refetch: mockRefetch,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeNull();
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should track creating status', async () => {
      let resolveCreate: (value: unknown) => void;
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });

      (authClient.organization.create as jest.Mock).mockReturnValue(createPromise);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      act(() => {
        result.current.createOrganization({ name: 'Test' });
      });

      // Should be creating
      await waitFor(() => {
        expect(result.current.status?.creating).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolveCreate!({ data: { id: 'new' }, error: null });
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should no longer be creating
      await waitFor(() => {
        expect(result.current.status?.creating).toBe(false);
      });
    });

    it('should track switching status', async () => {
      let resolveSwitch: (value: unknown) => void;
      const switchPromise = new Promise((resolve) => {
        resolveSwitch = resolve;
      });

      (authClient.organization.setActive as jest.Mock).mockReturnValue(switchPromise);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OrganizationProvider>{children}</OrganizationProvider>
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      act(() => {
        result.current.setActiveOrganization('org2');
      });

      // Should be switching
      await waitFor(() => {
        expect(result.current.status?.switching).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolveSwitch!({ data: {}, error: null });
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should no longer be switching
      await waitFor(() => {
        expect(result.current.status?.switching).toBe(false);
      });
    });
  });
});
