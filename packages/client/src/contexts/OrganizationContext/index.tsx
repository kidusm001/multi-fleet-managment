import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authClient, useSession } from '@/lib/auth-client';

// Type definitions
interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt?: Date;
  logo?: string | null;
  metadata?: Record<string, unknown>;
}

interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'canceled';
  expiresAt: Date;
  createdAt?: Date;
  inviterId?: string;
  organization?: Organization;
}

interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Role {
  id: string;
  name: string;
  organizationId?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Error mapping function
export function mapOrgError(error: string): string {
  const errorMappings: Record<string, string> = {
    'Network unreachable': 'Network issue – please check your connection and retry.',
    'Network failure': 'Network issue – please check your connection and retry.',
    'Timeout while fetching': 'Request timed out – try again.',
    'timeout exceeded': 'Request timed out – try again.',
    'FORBIDDEN action': 'You lack permission for this action.',
    'Permission denied': 'You lack permission for this action.',
    'Resource not found': 'Requested resource was not found.',
    'Not Found': 'Requested resource was not found.',
    'Duplicate entry exists': 'A record with these details already exists.',
    'duplicate key': 'A record with these details already exists.',
    'Validation failed for field': 'Some inputs were invalid – review and try again.',
    'Rate limit exceeded': 'Too many requests – wait a moment.',
    'RATE LIMIT reached': 'Too many requests – wait a moment.',
  };

  // Check for exact matches first
  if (errorMappings[error]) {
    return errorMappings[error];
  }

  // Check for partial matches (case insensitive)
  const lowerError = error.toLowerCase();
  for (const [key, value] of Object.entries(errorMappings)) {
    if (lowerError.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Return original error if no mapping found, or default message if empty
  return error || 'An unexpected error occurred.';
}

interface OrganizationContextType {
  // Organization data
  organizations: Organization[];
  activeOrganization: Organization | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingOrganizations: boolean;
  isLoadingActiveOrg: boolean;
  
  // Error states
  error: string | null;
  status?: {
    loadingOrganizations: boolean;
    loadingMembers: boolean;
    loadingInvitations: boolean;
    loadingTeams: boolean;
    loadingRoles: boolean;
    switching: boolean;
    creating: boolean;
    error?: string | null;
  };
  
  // Actions
  createOrganization: (data: { name: string; slug?: string }) => Promise<Organization>;
  setActiveOrganization: (organizationId: string) => Promise<void>;
  updateOrganization: (organizationId: string, data: { name?: string; slug?: string }) => Promise<Organization>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  
  // Members
  members: Member[];
  listMembers: () => Promise<Member[]>;
  inviteMember: (data: { email: string; role: string; organizationId?: string }) => Promise<Invitation>;
  addMember: (data: { userId: string; role: string; organizationId?: string; teamId?: string }) => Promise<Member>;
  removeMember: (memberIdOrEmail: string, organizationId?: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string, organizationId?: string) => Promise<void>;
  loadMembers: () => Promise<void>;
  
  // Invitations
  invitations: Invitation[];
  listInvitations: (organizationId?: string) => Promise<Invitation[]>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  loadInvitations: () => Promise<void>;
  
  // Teams
  teams: Team[];
  loadTeams: () => Promise<void>;
  
  // Roles
  roles: Role[];
  loadRoles: () => Promise<void>;
  
  // Permissions
  hasPermission: (domain: string, action: string) => boolean;
  
  // Roles management (dynamic roles)
  createRole?: (name: string) => Promise<Role>;
  updateRole?: (id: string, name: string) => Promise<Role>;
  deleteRole?: (id: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);
const ACTIVE_ORG_STORAGE_KEY = 'mf-active-organization';

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { data: session } = useSession();
  
  // Always call the hooks - better-auth handles authentication internally
  const { data: organizations, isPending: isLoadingOrganizations, refetch: refetchOrganizations } = authClient.useListOrganizations();
  const { data: activeOrganization, isPending: isLoadingActiveOrg } = authClient.useActiveOrganization();
  
  // Only use the data when user is authenticated
  const shouldFetchOrganizations = !!session?.user;
  const effectiveOrganizations = shouldFetchOrganizations ? (organizations || []) : [];
  const effectiveActiveOrganization = shouldFetchOrganizations ? activeOrganization : null;
  const effectiveIsLoadingOrganizations = shouldFetchOrganizations ? isLoadingOrganizations : false;
  const effectiveIsLoadingActiveOrg = shouldFetchOrganizations ? isLoadingActiveOrg : false;
  const effectiveRefetchOrganizations = useCallback(() => {
    if (shouldFetchOrganizations && refetchOrganizations) {
      return refetchOrganizations();
    }
    return Promise.resolve();
  }, [shouldFetchOrganizations, refetchOrganizations]);
  
  // Local state for additional data
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState({
    loadingOrganizations: effectiveIsLoadingOrganizations,
    loadingMembers: false,
    loadingInvitations: false,
    loadingTeams: false,
    loadingRoles: false,
    switching: false,
    creating: false,
    error: null as string | null,
  });
  const [hasAutoSelectedOrg, setHasAutoSelectedOrg] = useState(false);

  useEffect(() => {
    setHasAutoSelectedOrg(false);
  }, [session?.user?.id]);

  const markAutoSelected = useCallback(() => {
    setHasAutoSelectedOrg(true);
  }, []);
  
  const isLoading = shouldFetchOrganizations && (effectiveIsLoadingOrganizations || effectiveIsLoadingActiveOrg);

  // Update loading status - only when authenticated
  useEffect(() => {
    if (shouldFetchOrganizations) {
      setStatus(prev => ({ ...prev, loadingOrganizations: effectiveIsLoadingOrganizations }));
    } else {
      setStatus(prev => ({ ...prev, loadingOrganizations: false }));
    }
  }, [effectiveIsLoadingOrganizations, shouldFetchOrganizations]);

  // Refetch organizations when user logs in
  useEffect(() => {
    if (shouldFetchOrganizations && effectiveRefetchOrganizations) {
      effectiveRefetchOrganizations();
    }
  }, [shouldFetchOrganizations, effectiveRefetchOrganizations]);

  // Organization actions
  const createOrganization = async (data: { name: string; slug?: string }) => {
    setStatus(prev => ({ ...prev, creating: true, error: null }));
    try {
      const result = await authClient.organization.create({
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await effectiveRefetchOrganizations();
      return result.data;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create organization';
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    } finally {
      setStatus(prev => ({ ...prev, creating: false }));
    }
  };

  const setActiveOrganization = async (organizationId: string) => {
    console.log('🔄 Setting active organization:', organizationId);
    setStatus(prev => ({ ...prev, switching: true, error: null }));
    try {
      const result = await authClient.organization.setActive({
        organizationId,
      });
      
      if (result.error) {
        console.error('❌ Failed to set active organization:', result.error);
        throw new Error(result.error.message);
      }
      
      console.log('✅ Active organization set successfully:', result.data);
      
      // CRITICAL: Force session refresh to update activeOrganizationId in client
      // This is required for getActiveMember() to work correctly
      console.log('🔄 Refreshing session to sync activeOrganizationId...');
      try {
        const sessionResponse = await authClient.getSession({
          query: { disableCookieCache: true }
        });
        console.log('✅ Session refresh response received');
        console.log('✅ Session refresh full response:', JSON.stringify(sessionResponse, null, 2));
      } catch (sessionError) {
        console.error('❌ Session refresh failed:', sessionError);
        throw new Error('Session refresh failed after setting active organization');
      }
      
      // Small delay for React Query cache to update
      await new Promise(resolve => setTimeout(resolve, 150));
      console.log('✅ Session refreshed successfully');

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, organizationId);
      }
      
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to set active organization';
      console.error('❌ Error setting active organization:', errorMsg);
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    } finally {
      setStatus(prev => ({ ...prev, switching: false }));
    }
  };

  const updateOrganization = async (organizationId: string, data: { name?: string; slug?: string }) => {
    try {
      const result = await authClient.organization.update({
        organizationId,
        data,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await effectiveRefetchOrganizations();
      return result.data;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update organization');
    }
  };

  const deleteOrganization = async (organizationId: string) => {
    try {
      const result = await authClient.organization.delete({
        organizationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await effectiveRefetchOrganizations();
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete organization');
    }
  };

  const refresh = async () => {
    setError(null);
    setStatus(prev => ({ ...prev, error: null }));
    try {
      await effectiveRefetchOrganizations();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to refresh organizations';
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
    }
  };

  // Member actions
  const listMembers = async () => {
    try {
      // Use custom endpoint instead of better-auth client to avoid the 500 error
      const response = await fetch('/api/organization/list-members', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to list members');
      }

      const result = await response.json();
      return result.data?.members || [];
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to list members');
    }
  };

  const loadMembers = async () => {
    setStatus(prev => ({ ...prev, loadingMembers: true, error: null }));
    try {
      const membersList = await listMembers();
      setMembers(membersList);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load members';
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setStatus(prev => ({ ...prev, loadingMembers: false }));
    }
  };

  const inviteMember = async (data: { email: string; role: string; organizationId?: string }) => {
    try {
      const result = await authClient.organization.inviteMember({
        email: data.email,
        role: data.role as "admin" | "employee" | "driver" | "owner" | "manager",
        organizationId: data.organizationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadInvitations(); // Refresh invitations
      return result.data;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to invite member');
    }
  };

  const removeMember = async (memberIdOrEmail: string, organizationId?: string) => {
    try {
      const result = await authClient.organization.removeMember({
        memberIdOrEmail,
        organizationId: organizationId || effectiveActiveOrganization?.id || '',
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadMembers(); // Refresh members
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const updateMemberRole = async (memberId: string, role: string, organizationId?: string) => {
    try {
      const result = await authClient.organization.updateMemberRole({
        memberId,
        role: role as "admin" | "employee" | "driver" | "owner" | "manager",
        organizationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadMembers(); // Refresh members
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update member role');
    }
  };

  const addMember = async (data: { userId: string; role: string; organizationId?: string; teamId?: string }) => {
    try {
      // Since addMember is server-only according to the documentation, 
      // we'll need to make a direct API call to our backend
      const response = await fetch('/api/organization/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: data.userId,
          role: data.role,
          organizationId: data.organizationId || effectiveActiveOrganization?.id,
          teamId: data.teamId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add member');
      }

      const result = await response.json();
      await loadMembers(); // Refresh members
      return result;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add member');
    }
  };

  // Invitation actions
  const listInvitations = async (organizationId?: string) => {
    try {
      const result = await authClient.organization.listInvitations({
        query: organizationId ? { organizationId } : undefined,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.data || [];
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to list invitations');
    }
  };

  const loadInvitations = async () => {
    setStatus(prev => ({ ...prev, loadingInvitations: true, error: null }));
    try {
      const invitationsList = await listInvitations();
      setInvitations(invitationsList);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load invitations';
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setStatus(prev => ({ ...prev, loadingInvitations: false }));
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadInvitations(); // Refresh invitations
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to accept invitation');
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const result = await authClient.organization.cancelInvitation({
        invitationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadInvitations(); // Refresh invitations
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to cancel invitation');
    }
  };

  // Teams (placeholder implementations)
  const loadTeams = async () => {
    setStatus(prev => ({ ...prev, loadingTeams: true, error: null }));
    try {
      // TODO: Implement when teams are enabled
      setTeams([]);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load teams';
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setStatus(prev => ({ ...prev, loadingTeams: false }));
    }
  };

  // Roles (placeholder implementations)
  const loadRoles = async () => {
    setStatus(prev => ({ ...prev, loadingRoles: true, error: null }));
    try {
      // TODO: Implement dynamic roles if needed
      setRoles([]);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load roles';
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setStatus(prev => ({ ...prev, loadingRoles: false }));
    }
  };

  // Permission checking (simplified - may need to match specific expected behavior)
  const hasPermission = (_domain: string, _action: string) => {
    // This is a simplified implementation
    // The real implementation should check better-auth permissions
    // For now, return true - this should be replaced with actual permission checking
    return true;
  };

  // Dynamic roles management (placeholder implementations)
  const createRole = async (_name: string) => {
    // TODO: Implement dynamic role creation when needed
    throw new Error('Dynamic roles are not yet implemented');
  };

  const updateRole = async (_id: string, _name: string) => {
    // TODO: Implement dynamic role updating when needed
    throw new Error('Dynamic roles are not yet implemented');
  };

  const deleteRole = async (_id: string) => {
    // TODO: Implement dynamic role deletion when needed
    throw new Error('Dynamic roles are not yet implemented');
  };

  useAutoSelectOrganization({
    shouldFetch: shouldFetchOrganizations,
    organizations: effectiveOrganizations,
    activeOrganization: effectiveActiveOrganization,
    isLoadingOrganizations: effectiveIsLoadingOrganizations,
    isLoadingActiveOrg: effectiveIsLoadingActiveOrg,
    setActiveOrganization,
    hasAutoSelected: hasAutoSelectedOrg,
    markAutoSelected,
  });

  const value: OrganizationContextType = {
    // Data
    organizations: effectiveOrganizations || [],
    activeOrganization: effectiveActiveOrganization,
    members,
    invitations,
    teams,
    roles,
    
    // Loading states
    isLoading,
    isLoadingOrganizations: effectiveIsLoadingOrganizations,
    isLoadingActiveOrg: effectiveIsLoadingActiveOrg,
    
    // Error states
    error,
    status,
    
    // Actions
    createOrganization,
    setActiveOrganization,
    updateOrganization,
    deleteOrganization,
    refresh,
    
    // Members
    listMembers,
    inviteMember,
    addMember,
    removeMember,
    updateMemberRole,
    loadMembers,
    
    // Invitations
    listInvitations,
    acceptInvitation,
    cancelInvitation,
    loadInvitations,
    
    // Teams
    loadTeams,
    
    // Roles
    loadRoles,
    
    // Permissions
    hasPermission,
    
    // Dynamic roles (optional)
    createRole,
    updateRole,
    deleteRole,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// Automatically restore the last active organization for returning users.
function useAutoSelectOrganization(
  opts: {
    shouldFetch: boolean;
    organizations: Organization[];
    activeOrganization: Organization | null;
    isLoadingOrganizations: boolean;
    isLoadingActiveOrg: boolean;
    setActiveOrganization: (id: string) => Promise<void>;
    hasAutoSelected: boolean;
    markAutoSelected: () => void;
  }
) {
  const {
    shouldFetch,
    organizations,
    activeOrganization,
    isLoadingOrganizations,
    isLoadingActiveOrg,
    setActiveOrganization,
    hasAutoSelected,
    markAutoSelected,
  } = opts;

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    if (hasAutoSelected) {
      return;
    }

    if (isLoadingOrganizations || isLoadingActiveOrg) {
      return;
    }

    if (activeOrganization) {
      markAutoSelected();
      return;
    }

    if (!organizations.length) {
      return;
    }

    let cancelled = false;

    const pickOrganization = async () => {
      try {
        const storedId = typeof window !== 'undefined'
          ? window.localStorage.getItem(ACTIVE_ORG_STORAGE_KEY)
          : null;
        const fallback = organizations[0]?.id;
        const targetId = organizations.find(org => org.id === storedId)?.id || fallback;

        if (!targetId) {
          return;
        }

        await setActiveOrganization(targetId);
      } catch (error) {
        console.error('Auto-select organization failed', error);
      } finally {
        if (!cancelled) {
          markAutoSelected();
        }
      }
    };

    void pickOrganization();

    return () => {
      cancelled = true;
    };
  }, [
    shouldFetch,
    hasAutoSelected,
    organizations,
    activeOrganization,
    isLoadingOrganizations,
    isLoadingActiveOrg,
    setActiveOrganization,
    markAutoSelected,
  ]);
}

export function useOrganizations() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizations must be used within an OrganizationProvider');
  }
  return context;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

export default OrganizationContext;