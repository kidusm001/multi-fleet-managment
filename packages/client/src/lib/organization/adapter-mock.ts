import {
  OrganizationAdapter,
  OrganizationAdapterResult,
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationTeam,
  OrganizationRoleDescriptor,
  OrganizationTeamMembership,
} from '@/types/organization';
import { teamsEnabled, dynamicRolesEnabled } from '@lib/organization/flags';

const ORGS_KEY = 'mf__orgs';
const ACTIVE_KEY = 'mf__active_org';
const MEMBERS_KEY = 'mf__org_members';
const INVITES_KEY = 'mf__org_invites';
const TEAMS_KEY = 'mf__org_teams';
const TEAM_MEMBERS_KEY = 'mf__org_team_members';
const ROLES_KEY = 'mf__org_roles';

interface StoredMember { id: string; organizationId: string; userId: string; role: string; createdAt: string; }
interface StoredInvite { id: string; organizationId: string; email: string; role: string; createdAt: string; expiresAt: string; status: 'pending'; }
interface StoredTeam { id: string; organizationId: string; name: string; createdAt: string; updatedAt?: string; }
interface StoredTeamMembership { id: string; organizationId: string; teamId: string; userId: string; createdAt: string; }
interface StoredRole { id: string; organizationId: string; name: string; permissions: Record<string, string[]>; createdAt: string; updatedAt?: string; }

function now() { return new Date().toISOString(); }

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

const mockAdapter: OrganizationAdapter = {
  async listOrganizations(): Promise<OrganizationAdapterResult<Organization[]>> {
    const orgs = load<Organization[]>(ORGS_KEY, []);
    return { data: orgs, error: null };
  },
  async listMembers(organizationId: string): Promise<OrganizationAdapterResult<OrganizationMember[]>> {
    const members = load<StoredMember[]>(MEMBERS_KEY, []).filter(m => m.organizationId === organizationId);
    const mapped: OrganizationMember[] = members.map(m => ({ ...m, updatedAt: m.createdAt }));
    return { data: mapped, error: null };
  },
  async listInvitations(organizationId: string): Promise<OrganizationAdapterResult<OrganizationInvitation[]>> {
    const invites = load<StoredInvite[]>(INVITES_KEY, []).filter(i => i.organizationId === organizationId && i.status === 'pending');
    const mapped: OrganizationInvitation[] = invites.map(i => ({ ...i }));
    return { data: mapped, error: null };
  },
  async listTeams(organizationId: string): Promise<OrganizationAdapterResult<OrganizationTeam[]>> {
    if (!teamsEnabled()) return { data: [], error: null };
    const teams = load<StoredTeam[]>(TEAMS_KEY, []).filter(t => t.organizationId === organizationId);
    const mapped: OrganizationTeam[] = teams.map(t => ({ ...t }));
    return { data: mapped, error: null };
  },
  async listRoles(organizationId: string): Promise<OrganizationAdapterResult<OrganizationRoleDescriptor[]>> {
    if (!dynamicRolesEnabled()) return { data: [], error: null };
    const roles = load<StoredRole[]>(ROLES_KEY, []).filter(r => r.organizationId === organizationId);
    return { data: roles.map(r => ({ ...r })), error: null };
  },
  async createOrganization(input: CreateOrganizationInput) {
    const orgs = load<Organization[]>(ORGS_KEY, []);
    const newOrg: Organization = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      slug: input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
      createdAt: now(),
      updatedAt: now(),
      metadata: null,
    };
    orgs.push(newOrg);
    save(ORGS_KEY, orgs);
    if (orgs.length === 1) {
      save(ACTIVE_KEY, newOrg.id);
      // Seed owner membership placeholder list (Phase 2 will formalize)
      const members = load<StoredMember[]>(MEMBERS_KEY, []);
      members.push({ id: crypto.randomUUID(), organizationId: newOrg.id, userId: 'current-user', role: 'owner', createdAt: now() });
      save(MEMBERS_KEY, members);
    }
    return { data: newOrg, error: null };
  },
  async setActiveOrganization(id: string) {
    const orgs = load<Organization[]>(ORGS_KEY, []);
    const org = orgs.find(o => o.id === id) || null;
    if (!org) return { data: null, error: 'Not found' };
    save(ACTIVE_KEY, id);
    return { data: org, error: null };
  },
  async inviteMember({ email, role, organizationId }: { email: string; role: string; organizationId: string; }): Promise<OrganizationAdapterResult<OrganizationInvitation>> {
    const invites = load<StoredInvite[]>(INVITES_KEY, []);
    const existing = invites.find(i => i.organizationId === organizationId && i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending');
    if (existing) return { data: null, error: 'Invitation already pending' };
    const members = load<StoredMember[]>(MEMBERS_KEY, []).filter(m => m.organizationId === organizationId);
    if (members.some(m => m.userId === email)) return { data: null, error: 'Already a member' };
    const inv: StoredInvite = { id: crypto.randomUUID(), organizationId, email, role, createdAt: now(), expiresAt: now(), status: 'pending' };
    invites.push(inv); save(INVITES_KEY, invites);
    return { data: inv, error: null };
  },
  async acceptInvitation(id: string) {
    const invites = load<StoredInvite[]>(INVITES_KEY, []);
    const invite = invites.find(i => i.id === id);
    if (!invite) return { data: null, error: 'Not found' };
    invite.status = 'pending'; // treat accept as immediate membership creation
    // remove invite
    const remaining = invites.filter(i => i.id !== id);
    save(INVITES_KEY, remaining);
    const members = load<StoredMember[]>(MEMBERS_KEY, []);
    members.push({ id: crypto.randomUUID(), organizationId: invite.organizationId, userId: invite.email, role: invite.role, createdAt: now() });
    save(MEMBERS_KEY, members);
    return { data: { id }, error: null };
  },
  async rejectInvitation(id: string) {
    const invites = load<StoredInvite[]>(INVITES_KEY, []);
    const remaining = invites.filter(i => i.id !== id);
    if (remaining.length === invites.length) return { data: null, error: 'Not found' };
    save(INVITES_KEY, remaining);
    return { data: { id }, error: null };
  },
  async cancelInvitation(id: string) { return this.rejectInvitation!(id); },
  async removeMember(memberId: string) {
    const members = load<StoredMember[]>(MEMBERS_KEY, []);
    const next = members.filter(m => m.id !== memberId);
    if (next.length === members.length) return { data: null, error: 'Not found' };
    save(MEMBERS_KEY, next);
    return { data: { id: memberId }, error: null };
  },
  async updateMemberRole(memberId: string, role: string): Promise<OrganizationAdapterResult<OrganizationMember>> {
    const members = load<StoredMember[]>(MEMBERS_KEY, []);
    const idx = members.findIndex(m => m.id === memberId);
    if (idx === -1) return { data: null, error: 'Not found' };
    members[idx] = { ...members[idx], role };
    save(MEMBERS_KEY, members);
    return { data: { ...members[idx], updatedAt: now() }, error: null };
  },
  async createTeam({ name, organizationId }: { name: string; organizationId: string; }): Promise<OrganizationAdapterResult<OrganizationTeam>> {
    if (!teamsEnabled()) return { data: null, error: 'Teams disabled' };
    const teams = load<StoredTeam[]>(TEAMS_KEY, []);
    const team: StoredTeam = { id: crypto.randomUUID(), organizationId, name: name.trim(), createdAt: now() };
    teams.push(team); save(TEAMS_KEY, teams);
    return { data: { ...team }, error: null };
  },
  async updateTeam(id: string, { name }: { name?: string }): Promise<OrganizationAdapterResult<OrganizationTeam>> {
    if (!teamsEnabled()) return { data: null, error: 'Teams disabled' };
    const teams = load<StoredTeam[]>(TEAMS_KEY, []);
    const idx = teams.findIndex(t => t.id === id);
    if (idx === -1) return { data: null, error: 'Not found' };
    if (name) teams[idx] = { ...teams[idx], name: name.trim(), updatedAt: now() };
    save(TEAMS_KEY, teams);
    return { data: { ...teams[idx] }, error: null };
  },
  async deleteTeam(id: string): Promise<OrganizationAdapterResult<{ id: string }>> {
    if (!teamsEnabled()) return { data: null, error: 'Teams disabled' };
    const teams = load<StoredTeam[]>(TEAMS_KEY, []);
    const next = teams.filter(t => t.id !== id);
    if (next.length === teams.length) return { data: null, error: 'Not found' };
    save(TEAMS_KEY, next);
    return { data: { id }, error: null };
  },
  async addMemberToTeam({ organizationId, teamId, userId }: { organizationId: string; teamId: string; userId: string; }): Promise<OrganizationAdapterResult<{ id: string }>> {
    if (!teamsEnabled()) return { data: null, error: 'Teams disabled' };
    const memberships = load<StoredTeamMembership[]>(TEAM_MEMBERS_KEY, []);
    if (memberships.some(m => m.teamId === teamId && m.userId === userId)) return { data: null, error: 'Already in team' };
    const record: StoredTeamMembership = { id: crypto.randomUUID(), organizationId, teamId, userId, createdAt: now() };
    memberships.push(record); save(TEAM_MEMBERS_KEY, memberships);
    return { data: { id: record.id }, error: null };
  },
  async removeMemberFromTeam(id: string): Promise<OrganizationAdapterResult<{ id: string }>> {
    if (!teamsEnabled()) return { data: null, error: 'Teams disabled' };
    const memberships = load<StoredTeamMembership[]>(TEAM_MEMBERS_KEY, []);
    const next = memberships.filter(m => m.id !== id);
    if (next.length === memberships.length) return { data: null, error: 'Not found' };
    save(TEAM_MEMBERS_KEY, next);
    return { data: { id }, error: null };
  },
  async listTeamMemberships(organizationId: string, teamId: string): Promise<OrganizationAdapterResult<OrganizationTeamMembership[]>> {
    if (!teamsEnabled()) return { data: [], error: null };
    const memberships = load<StoredTeamMembership[]>(TEAM_MEMBERS_KEY, []).filter(m => m.organizationId === organizationId && m.teamId === teamId);
    return { data: memberships.map(m => ({ ...m })), error: null };
  },
  async createRole({ organizationId, name, permissions }: { organizationId: string; name: string; permissions?: Record<string, string[]>; }): Promise<OrganizationAdapterResult<OrganizationRoleDescriptor>> {
    if (!dynamicRolesEnabled()) return { data: null, error: 'Dynamic roles disabled' };
    const roles = load<StoredRole[]>(ROLES_KEY, []);
    if (roles.some(r => r.organizationId === organizationId && r.name.toLowerCase() === name.toLowerCase())) {
      return { data: null, error: 'Role name exists' };
    }
    const role: StoredRole = { id: crypto.randomUUID(), organizationId, name: name.trim(), permissions: permissions || {}, createdAt: now() };
    roles.push(role); save(ROLES_KEY, roles);
    return { data: { ...role }, error: null };
  },
  async updateRole(id: string, { name, permissions }: { name?: string; permissions?: Record<string, string[]> }): Promise<OrganizationAdapterResult<OrganizationRoleDescriptor>> {
    if (!dynamicRolesEnabled()) return { data: null, error: 'Dynamic roles disabled' };
    const roles = load<StoredRole[]>(ROLES_KEY, []);
    const idx = roles.findIndex(r => r.id === id);
    if (idx === -1) return { data: null, error: 'Not found' };
    if (name) roles[idx].name = name.trim();
    if (permissions) roles[idx].permissions = permissions;
    roles[idx].updatedAt = now();
    save(ROLES_KEY, roles);
    return { data: { ...roles[idx] }, error: null };
  },
  async deleteRole(id: string): Promise<OrganizationAdapterResult<{ id: string }>> {
    if (!dynamicRolesEnabled()) return { data: null, error: 'Dynamic roles disabled' };
    const roles = load<StoredRole[]>(ROLES_KEY, []);
    const next = roles.filter(r => r.id !== id);
    if (next.length === roles.length) return { data: null, error: 'Not found' };
    save(ROLES_KEY, next);
    return { data: { id }, error: null };
  },
  async getOrganization(id: string) {
    const orgs = load<Organization[]>(ORGS_KEY, []);
    const org = orgs.find(o => o.id === id) || null;
    return { data: org, error: org ? null : 'Not found' };
  },
  async updateOrganization(id: string, input: UpdateOrganizationInput) {
    const orgs = load<Organization[]>(ORGS_KEY, []);
    const idx = orgs.findIndex(o => o.id === id);
    if (idx === -1) return { data: null, error: 'Not found' };
    const updated: Organization = { ...orgs[idx], ...input, updatedAt: now() };
    orgs[idx] = updated;
    save(ORGS_KEY, orgs);
    return { data: updated, error: null };
  },
  async deleteOrganization(id: string) {
    const orgs = load<Organization[]>(ORGS_KEY, []);
    const next = orgs.filter(o => o.id !== id);
    if (next.length === orgs.length) return { data: null, error: 'Not found' };
    save(ORGS_KEY, next);
    const activeId = load<string | null>(ACTIVE_KEY, null);
    if (activeId === id) {
      if (next[0]) save(ACTIVE_KEY, next[0].id); else localStorage.removeItem(ACTIVE_KEY);
    }
    return { data: { id }, error: null };
  },
};

export function getActiveOrgId(): string | null {
  try { return load<string | null>(ACTIVE_KEY, null); } catch { return null; }
}

export default mockAdapter;
