import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authClient, useSession } from '@/lib/auth-client';

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
  organizations: any[];
  activeOrganization: any | null;
  
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
  createOrganization: (data: { name: string; slug?: string }) => Promise<any>;
  setActiveOrganization: (organizationId: string) => Promise<void>;
  updateOrganization: (organizationId: string, data: { name?: string; slug?: string }) => Promise<any>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  
  // Members
  members: any[];
  listMembers: (organizationId?: string) => Promise<any[]>;
  inviteMember: (data: { email: string; role: string; organizationId?: string }) => Promise<any>;
  removeMember: (memberIdOrEmail: string, organizationId?: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string, organizationId?: string) => Promise<void>;
  loadMembers: () => Promise<void>;
  
  // Invitations
  invitations: any[];
  listInvitations: (organizationId?: string) => Promise<any[]>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  loadInvitations: () => Promise<void>;
  
  // Teams
  teams: any[];
  loadTeams: () => Promise<void>;
  
  // Roles
  roles: any[];
  loadRoles: () => Promise<void>;
  
  // Permissions
  hasPermission: (domain: string, action: string) => boolean;
  
  // Roles management (dynamic roles)
  createRole?: (name: string) => Promise<any>;
  updateRole?: (id: string, name: string) => Promise<any>;
  deleteRole?: (id: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { data: session } = useSession();
  
  // Use better-auth organization hooks
  const { data: organizations, isPending: isLoadingOrganizations, refetch: refetchOrganizations } = authClient.useListOrganizations();
  const { data: activeOrganization, isPending: isLoadingActiveOrg } = authClient.useActiveOrganization();
  
  // Local state for additional data
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState({
    loadingOrganizations: isLoadingOrganizations,
    loadingMembers: false,
    loadingInvitations: false,
    loadingTeams: false,
    loadingRoles: false,
    switching: false,
    creating: false,
    error: null as string | null,
  });
  
  const isLoading = isLoadingOrganizations || isLoadingActiveOrg;

  // Update loading status
  useEffect(() => {
    setStatus(prev => ({ ...prev, loadingOrganizations: isLoadingOrganizations }));
  }, [isLoadingOrganizations]);

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
      
      await refetchOrganizations();
      return result.data;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to create organization';
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    } finally {
      setStatus(prev => ({ ...prev, creating: false }));
    }
  };

  const setActiveOrganization = async (organizationId: string) => {
    setStatus(prev => ({ ...prev, switching: true, error: null }));
    try {
      const result = await authClient.organization.setActive({
        organizationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to set active organization';
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
      
      await refetchOrganizations();
      return result.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update organization');
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
      
      await refetchOrganizations();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete organization');
    }
  };

  const refresh = async () => {
    setError(null);
    setStatus(prev => ({ ...prev, error: null }));
    try {
      await refetchOrganizations();
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to refresh organizations';
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
    }
  };

  // Member actions
  const listMembers = async (organizationId?: string) => {
    try {
      const result = await authClient.organization.listMembers({
        organizationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.data?.members || [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to list members');
    }
  };

  const loadMembers = async () => {
    setStatus(prev => ({ ...prev, loadingMembers: true, error: null }));
    try {
      const membersList = await listMembers();
      setMembers(membersList);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load members';
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
        role: data.role,
        organizationId: data.organizationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadInvitations(); // Refresh invitations
      return result.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to invite member');
    }
  };

  const removeMember = async (memberIdOrEmail: string, organizationId?: string) => {
    try {
      const result = await authClient.organization.removeMember({
        memberIdOrEmail,
        organizationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadMembers(); // Refresh members
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove member');
    }
  };

  const updateMemberRole = async (memberId: string, role: string, organizationId?: string) => {
    try {
      const result = await authClient.organization.updateMemberRole({
        memberId,
        role,
        organizationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      await loadMembers(); // Refresh members
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update member role');
    }
  };

  // Invitation actions
  const listInvitations = async (organizationId?: string) => {
    try {
      const result = await authClient.organization.listInvitations({
        organizationId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return result.data || [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to list invitations');
    }
  };

  const loadInvitations = async () => {
    setStatus(prev => ({ ...prev, loadingInvitations: true, error: null }));
    try {
      const invitationsList = await listInvitations();
      setInvitations(invitationsList);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load invitations';
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
    } catch (error: any) {
      throw new Error(error.message || 'Failed to accept invitation');
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
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel invitation');
    }
  };

  // Teams (placeholder implementations)
  const loadTeams = async () => {
    setStatus(prev => ({ ...prev, loadingTeams: true, error: null }));
    try {
      // TODO: Implement when teams are enabled
      setTeams([]);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load teams';
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
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load roles';
      setError(errorMsg);
      setStatus(prev => ({ ...prev, error: errorMsg }));
    } finally {
      setStatus(prev => ({ ...prev, loadingRoles: false }));
    }
  };

  // Permission checking (simplified - may need to match specific expected behavior)
  const hasPermission = (domain: string, action: string) => {
    // This is a simplified implementation
    // The real implementation should check better-auth permissions
    try {
      // For now, return true - this should be replaced with actual permission checking
      return true;
    } catch (error) {
      return false;
    }
  };

  // Dynamic roles management (placeholder implementations)
  const createRole = async (name: string) => {
    // TODO: Implement dynamic role creation when needed
    throw new Error('Dynamic roles are not yet implemented');
  };

  const updateRole = async (id: string, name: string) => {
    // TODO: Implement dynamic role updating when needed
    throw new Error('Dynamic roles are not yet implemented');
  };

  const deleteRole = async (id: string) => {
    // TODO: Implement dynamic role deletion when needed
    throw new Error('Dynamic roles are not yet implemented');
  };

  const value: OrganizationContextType = {
    // Data
    organizations: organizations || [],
    activeOrganization,
    members,
    invitations,
    teams,
    roles,
    
    // Loading states
    isLoading,
    isLoadingOrganizations,
    isLoadingActiveOrg,
    
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