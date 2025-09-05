import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  Organization,
  OrganizationContextState,
  OrganizationAdapter,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationTeam,
  OrganizationRoleDescriptor
} from '@/types/organization';
import { hasPermission as evalPermission, type PermissionDomain } from '@lib/organization/permissions';
import mockAdapter, { getActiveOrgId } from '@lib/organization/adapter-mock';
import liveAdapter from '@lib/organization/adapter-live';
import { useToast } from '@contexts/ToastContext';

interface OrganizationContextValue extends OrganizationContextState {
  refresh: () => Promise<void>;
  create: (name: string) => Promise<void>;
  setActive: (id: string) => Promise<void>;
  loadMembers: () => Promise<void>;
  loadInvitations: () => Promise<void>;
  invite: (email: string, role: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  hasPermission: (domain: string, action: string) => boolean;
  loadTeams: () => Promise<void>;
  createTeam: (name: string) => Promise<void>;
  loadRoles: () => Promise<void>;
  createRole: (name: string) => Promise<void>;
  updateRole: (id: string, name: string) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  addMemberToTeam?: (teamId: string, userId: string) => Promise<void>;
  listTeamMembers?: (teamId: string) => Promise<{ id: string; userId: string }[]>;
  removeMemberFromTeam?: (membershipId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

// Helper to read env in both Vite runtime and Jest (which shims globalThis.importMetaEnv)
export function mapOrgError(raw: string): string {
  if (!raw) return 'An unexpected error occurred.';
  const lower = raw.toLowerCase();
  if (lower.includes('network')) return 'Network issue – please check your connection and retry.';
  if (lower.includes('timeout')) return 'Request timed out – try again.';
  if (lower.includes('forbidden') || lower.includes('permission')) return 'You lack permission for this action.';
  if (lower.includes('not found')) return 'Requested resource was not found.';
  if (lower.includes('duplicate') || lower.includes('exists')) return 'A record with these details already exists.';
  if (lower.includes('validation')) return 'Some inputs were invalid – review and try again.';
  if (lower.includes('rate') && lower.includes('limit')) return 'Too many requests – wait a moment.';
  return raw;
}
function readEnv(key: string): string | undefined {
  try {
    // Access import.meta in a way TypeScript understands in ESM
    const meta = eval('import.meta');
    if (meta && meta.env) return meta.env[key];
  } catch {
    // ignored
  }
  interface MetaHolder { __IMETA?: { env?: Record<string, string> }; importMetaEnv?: Record<string, string>; }
  const g = globalThis as MetaHolder;
  if (g.__IMETA && g.__IMETA.env) return g.__IMETA.env[key];
  if (g.importMetaEnv) return g.importMetaEnv[key];
  return undefined;
}

function selectAdapter(): OrganizationAdapter {
  const enabled = readEnv('VITE_ENABLE_ORGANIZATIONS') === 'true';
  if (!enabled) return mockAdapter;
  const mode = (readEnv('VITE_ORG_MODE') || 'mock') as 'mock' | 'live';
  return mode === 'live' ? liveAdapter : mockAdapter;
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const featureEnabled = readEnv('VITE_ENABLE_ORGANIZATIONS') === 'true';
  const adapter = selectAdapter();
  const { push } = useToast();
  const [state, setState] = useState<OrganizationContextState>({
    organizations: [],
    activeOrganization: null,
    members: [],
    invitations: [],
    teams: [],
    roles: [],
    isLoading: featureEnabled,
    error: null,
    status: {
      loadingOrganizations: featureEnabled,
      loadingMembers: false,
      loadingInvitations: false,
      loadingTeams: false,
      loadingRoles: false,
      switching: false,
      creating: false,
      error: null
    }
  });

  // Raw to string normalization (internal)
  const normError = (err: unknown): string => {
    if (!err) return 'unknown_error';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message || 'error';
    try { return JSON.stringify(err); } catch { return 'error'; }
  };

  // attach mapping for debugging (non-fatal)
  try { (globalThis as unknown as { __orgMapOrgError?: typeof mapOrgError }).__orgMapOrgError = mapOrgError; } catch { /* noop */ }

  // configurable debug
  const debugEnabled = ((): boolean => {
    try { return (eval('import.meta')?.env?.VITE_ORG_DEBUG) === 'true'; } catch { return false; }
  })();
  const debug = (...args: unknown[]) => { if (debugEnabled) console.debug('[org]', ...args); };

  async function backoff<T>(fn: () => Promise<T>, attempts = 1, max = 3, delay = 120): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if (attempts >= max) throw e;
      const ms = delay * Math.pow(2, attempts - 1);
      debug('retry attempt', attempts, 'waiting', ms, 'ms');
      await new Promise(r => setTimeout(r, ms));
      return backoff(fn, attempts + 1, max, delay);
    }
  }

  const load = useCallback(async () => {
    if (!featureEnabled) return;
    setState(s => ({ ...s, isLoading: true, error: null, status: { ...s.status!, loadingOrganizations: true, error: null } }));
  const { data, error } = await adapter.listOrganizations();
    if (error) {
      const msg = mapOrgError(normError(error));
      setState(s => ({ ...s, isLoading: false, error: msg, status: { ...s.status!, loadingOrganizations: false, error: msg } }));
      push(`Organizations load failed: ${msg}`,'error');
      return;
    }
    let orgs = data || [];
    if (orgs.length === 0) {
      // auto seed one organization for first-time experience / tests
      const created = await adapter.createOrganization({ name: 'My Organization' });
      if (!created.error && created.data) {
        orgs = [created.data];
      }
    }
  const activeId = getActiveOrgId();
  let active: Organization | null = null;
  if (activeId && orgs) active = orgs.find(o => o.id === activeId) || null;
  if (!active && orgs && orgs[0]) active = orgs[0];
  setState(s => ({ ...s, organizations: orgs, activeOrganization: active, isLoading: false, error: null, status: { ...s.status!, loadingOrganizations: false, error: null } }));
    try {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('org');
      if (slug && data) {
        const target = data.find(o => o.slug === slug);
        if (target && target.id !== active?.id) {
          await adapter.setActiveOrganization(target.id);
          setState(s => ({ ...s, activeOrganization: target }));
          push(`Switched to organization ${target.name}`, 'info');
        }
      }
    } catch { /* ignore */ }
  }, [featureEnabled, adapter, push]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (name: string) => {
    if (!featureEnabled) return;
    setState(s => ({ ...s, status: { ...s.status!, creating: true } }));
    const { error } = await adapter.createOrganization({ name });
    if (error) {
      const msg = mapOrgError(normError(error));
      setState(s => ({ ...s, error: msg, status: { ...s.status!, creating: false, error: msg } }));
      push(`Organization create failed: ${msg}`, 'error');
      return;
    }
    setState(s => ({ ...s, status: { ...s.status!, creating: false } }));
    push('Organization create success', 'success');
    await load();
  }, [adapter, featureEnabled, load, push]);

  const setActive = useCallback(async (id: string) => {
    if (!featureEnabled) return;
    setState(s => ({ ...s, status: { ...s.status!, switching: true } }));
    const { error } = await adapter.setActiveOrganization(id);
    if (error) {
      const msg = mapOrgError(normError(error));
      setState(s => ({ ...s, error: msg, status: { ...s.status!, switching: false, error: msg } }));
      push(`Organization switch failed: ${msg}`, 'error');
      return;
    }
    setState(s => ({ ...s, status: { ...s.status!, switching: false } }));
    push('Organization switch success', 'success');
    await load();
  }, [adapter, featureEnabled, load, push]);

  const value: OrganizationContextValue = {
    ...state,
    refresh: load,
    create,
    setActive,
    loadMembers: async () => {
      if (!state.activeOrganization || !adapter.listMembers) return;
      setState(s => ({ ...s, status: { ...s.status!, loadingMembers: true } }));
  let data: OrganizationMember[] | null | undefined;
  let error: unknown;
      try {
        const res = await backoff(() => adapter.listMembers!(state.activeOrganization!.id));
        data = res.data; error = res.error;
      } catch (e) { error = e instanceof Error ? e.message : 'error'; }
      if (error) {
        const msg = mapOrgError(normError(error));
        setState(s => ({ ...s, status: { ...s.status!, loadingMembers: false, error: msg } }));
        push(`Members load failed: ${msg}`, 'error');
        return;
      }
      setState(s => ({ ...s, members: (data as OrganizationMember[]) || [], status: { ...s.status!, loadingMembers: false, error: null } }));
    },
    loadInvitations: async () => {
      if (!state.activeOrganization || !adapter.listInvitations) return;
      setState(s => ({ ...s, status: { ...s.status!, loadingInvitations: true } }));
  let data: OrganizationInvitation[] | null | undefined;
  let error: unknown;
      try {
        const res = await backoff(() => adapter.listInvitations!(state.activeOrganization!.id));
        data = res.data; error = res.error;
      } catch (e) { error = e instanceof Error ? e.message : 'error'; }
      if (error) {
        const msg = mapOrgError(normError(error));
        setState(s => ({ ...s, status: { ...s.status!, loadingInvitations: false, error: msg } }));
        push(`Invitations load failed: ${msg}`, 'error');
        return;
      }
      setState(s => ({ ...s, invitations: (data as OrganizationInvitation[]) || [], status: { ...s.status!, loadingInvitations: false, error: null } }));
    },
    invite: async (email: string, role: string) => {
      if (!state.activeOrganization || !adapter.inviteMember) return;
      const { error } = await adapter.inviteMember({ email, role, organizationId: state.activeOrganization.id });
  if (error) { push(`Invitation create failed: ${mapOrgError(normError(error))}`, 'error'); return; }
    push('Invitation create success', 'success');
      await value.loadInvitations();
    },
    updateMemberRole: async (memberId: string, role: string) => {
      if (!adapter.updateMemberRole) return;
      const { error } = await adapter.updateMemberRole(memberId, role);
  if (error) { push(`Member role update failed: ${mapOrgError(normError(error))}`, 'error'); return; }
    push('Member role update success', 'success');
      await value.loadMembers();
    },
    removeMember: async (memberId: string) => {
      if (!adapter.removeMember) return;
      const { error } = await adapter.removeMember(memberId);
  if (error) { push(`Member remove failed: ${mapOrgError(normError(error))}`, 'error'); return; }
    push('Member remove success', 'success');
      await value.loadMembers();
    },
    loadTeams: async () => {
      if (!state.activeOrganization || !adapter.listTeams) return;
      setState(s => ({ ...s, status: { ...s.status!, loadingTeams: true } }));
  let data: OrganizationTeam[] | null | undefined;
  let error: unknown;
      try {
        const res = await backoff(() => adapter.listTeams!(state.activeOrganization!.id));
        data = res.data; error = res.error;
      } catch (e) { error = e instanceof Error ? e.message : 'error'; }
      if (error) {
        const msg = mapOrgError(normError(error));
        setState(s => ({ ...s, status: { ...s.status!, loadingTeams: false, error: msg } }));
        push(`Teams load failed: ${msg}`, 'error');
        return;
      }
      setState(s => ({ ...s, teams: (data as OrganizationTeam[]) || [], status: { ...s.status!, loadingTeams: false, error: null } }));
    },
    createTeam: async (name: string) => {
      if (!state.activeOrganization || !adapter.createTeam) return;
      const { error } = await adapter.createTeam({ name, organizationId: state.activeOrganization.id });
  if (error) { push(`Team create failed: ${mapOrgError(normError(error))}`, 'error'); return; }
      push('Team create success', 'success');
      await value.loadTeams();
    },
    loadRoles: async () => {
      if (!state.activeOrganization || !adapter.listRoles) return;
      setState(s => ({ ...s, status: { ...s.status!, loadingRoles: true } }));
  let data: OrganizationRoleDescriptor[] | null | undefined;
  let error: unknown;
      try {
        const res = await backoff(() => adapter.listRoles!(state.activeOrganization!.id));
        data = res.data; error = res.error;
      } catch (e) { error = e instanceof Error ? e.message : 'error'; }
      if (error) {
        const msg = mapOrgError(normError(error));
        setState(s => ({ ...s, status: { ...s.status!, loadingRoles: false, error: msg } }));
        push(`Roles load failed: ${msg}`, 'error');
        return;
      }
      setState(s => ({ ...s, roles: (data as OrganizationRoleDescriptor[]) || [], status: { ...s.status!, loadingRoles: false, error: null } }));
    },
    createRole: async (name: string) => {
      if (!state.activeOrganization || !adapter.createRole) return;
      const { error } = await adapter.createRole({ organizationId: state.activeOrganization.id, name });
  if (error) { push(`Role create failed: ${mapOrgError(normError(error))}`, 'error'); return; }
    push('Role create success', 'success');
      await value.loadRoles();
    },
    updateRole: async (id: string, name: string) => {
      if (!adapter.updateRole) return;
      const { error } = await adapter.updateRole(id, { name });
  if (error) { push(`Role update failed: ${mapOrgError(normError(error))}`, 'error'); return; }
    push('Role update success', 'success');
      await value.loadRoles();
    },
    deleteRole: async (id: string) => {
      if (!adapter.deleteRole) return;
      const { error } = await adapter.deleteRole(id);
  if (error) { push(`Role delete failed: ${mapOrgError(normError(error))}`, 'error'); return; }
    push('Role delete success', 'success');
      await value.loadRoles();
    },
    addMemberToTeam: async (teamId: string, userId: string) => {
      if (!state.activeOrganization || !adapter.addMemberToTeam) return;
      const { error } = await adapter.addMemberToTeam({ organizationId: state.activeOrganization.id, teamId, userId });
  if (error) push(`Team member add failed: ${mapOrgError(normError(error))}`, 'error'); else push('Team member add success', 'success');
    },
    listTeamMembers: async (teamId: string) => {
      if (!state.activeOrganization || !adapter.listTeamMemberships) return [];
      const { data } = await adapter.listTeamMemberships(state.activeOrganization.id, teamId);
      type TM = { id: string; userId: string };
      return ((data || []) as TM[]).map(m => ({ id: m.id, userId: m.userId }));
    },
    removeMemberFromTeam: async (membershipId: string) => {
      if (!adapter.removeMemberFromTeam) return;
      const { error } = await adapter.removeMemberFromTeam(membershipId);
  if (error) push(`Team member remove failed: ${mapOrgError(normError(error))}`, 'error'); else push('Team member remove success', 'success');
    },
    hasPermission: (domain: string, action: string) => {
      const activeMember = state.members.find(m => m.userId === 'current-user');
      const roles = activeMember ? [activeMember.role] : [];
      interface DynamicPermissions { [role: string]: { [d: string]: string[] } }
      let dynamic: DynamicPermissions | undefined;
      if (state.roles && state.roles.length) {
        dynamic = state.roles.reduce<DynamicPermissions>((acc, r) => {
          if (!acc[r.name]) acc[r.name] = {};
          return acc;
        }, {} as DynamicPermissions);
      }
      return evalPermission(roles, domain as PermissionDomain, action, dynamic);
    }
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizations() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganizations must be used within OrganizationProvider');
  return ctx;
}

export default OrganizationContext;
