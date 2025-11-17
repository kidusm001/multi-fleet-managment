export interface Organization {
  id: string;
  name: string;
  slug?: string | null;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown> | null;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  createdAt?: string;
  expiresAt?: string;
  status?: 'pending' | 'accepted' | 'revoked';
}

export interface OrganizationTeam {
  id: string;
  organizationId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// Dynamic / runtime role descriptor (Phase 5)
export interface OrganizationRoleDescriptor {
  id: string; // stable id (uuid)
  organizationId: string;
  name: string; // human readable role name
  // permissions: domain -> actions[] (e.g., { member: ['create','update'] })
  permissions: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationTeamMembership {
  id: string;
  organizationId: string;
  teamId: string;
  userId: string; // for mock: email or user id
  createdAt?: string;
}

export interface OrganizationContextState {
  organizations: Organization[];
  activeOrganization: Organization | null;
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
  teams: OrganizationTeam[];
  activeTeam?: OrganizationTeam | null; // optional until implemented
  roles?: OrganizationRoleDescriptor[]; // dynamic roles (Phase 5)
  isLoading: boolean;
  error: string | null;
  // granular status slice (optional; legacy isLoading retained for backward compatibility)
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
}

export interface CreateOrganizationInput {
  name: string;
  slug?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  metadata?: Record<string, unknown> | null;
}

export interface OrganizationAdapterResult<T> {
  data: T | null;
  error: string | null;
}

export interface OrganizationAdapter {
  listOrganizations(): Promise<OrganizationAdapterResult<Organization[]>>;
  createOrganization(input: CreateOrganizationInput): Promise<OrganizationAdapterResult<Organization>>;
  getOrganization(id: string): Promise<OrganizationAdapterResult<Organization>>;
  setActiveOrganization(id: string): Promise<OrganizationAdapterResult<Organization>>;
  updateOrganization(id: string, input: UpdateOrganizationInput): Promise<OrganizationAdapterResult<Organization>>;
  deleteOrganization(id: string): Promise<OrganizationAdapterResult<{ id: string }>>;
  listMembers?(organizationId: string): Promise<OrganizationAdapterResult<OrganizationMember[]>>;
  listInvitations?(organizationId: string): Promise<OrganizationAdapterResult<OrganizationInvitation[]>>;
  listTeams?(organizationId: string): Promise<OrganizationAdapterResult<OrganizationTeam[]>>;
  inviteMember?(args: { email: string; role: string; organizationId: string }): Promise<OrganizationAdapterResult<OrganizationInvitation>>;
  acceptInvitation?(id: string): Promise<OrganizationAdapterResult<{ id: string }>>;
  rejectInvitation?(id: string): Promise<OrganizationAdapterResult<{ id: string }>>;
  cancelInvitation?(id: string): Promise<OrganizationAdapterResult<{ id: string }>>;
  removeMember?(memberId: string): Promise<OrganizationAdapterResult<{ id: string }>>;
  updateMemberRole?(memberId: string, role: string): Promise<OrganizationAdapterResult<OrganizationMember>>;
  addMember?(args: { userId: string; role: string; organizationId: string }): Promise<OrganizationAdapterResult<OrganizationMember>>;
  createTeam?(args: { name: string; organizationId: string }): Promise<OrganizationAdapterResult<OrganizationTeam>>;
  updateTeam?(id: string, args: { name?: string }): Promise<OrganizationAdapterResult<OrganizationTeam>>;
  deleteTeam?(id: string): Promise<OrganizationAdapterResult<{ id: string }>>;
  // Dynamic roles (Phase 5)
  listRoles?(organizationId: string): Promise<OrganizationAdapterResult<OrganizationRoleDescriptor[]>>;
  createRole?(args: { organizationId: string; name: string; permissions?: Record<string, string[]> }): Promise<OrganizationAdapterResult<OrganizationRoleDescriptor>>;
  updateRole?(id: string, args: { name?: string; permissions?: Record<string, string[]> }): Promise<OrganizationAdapterResult<OrganizationRoleDescriptor>>;
  deleteRole?(id: string): Promise<OrganizationAdapterResult<{ id: string }>>;
  // Team membership (Phase 4 extension)
  addMemberToTeam?(args: { organizationId: string; teamId: string; userId: string }): Promise<OrganizationAdapterResult<{ id: string }>>;
  removeMemberFromTeam?(id: string): Promise<OrganizationAdapterResult<{ id: string }>>;
  listTeamMemberships?(organizationId: string, teamId: string): Promise<OrganizationAdapterResult<OrganizationTeamMembership[]>>;
}

export type OrgMode = 'mock' | 'live';
