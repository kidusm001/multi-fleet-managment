export type PermissionDomain = 'organization' | 'member' | 'invitation' | 'team' | 'role';

export interface RolePermissions {
  [domain: string]: string[]; // action list
}

export const defaultRolePermissions: Record<string, RolePermissions> = {
  owner: {
    organization: ['update', 'delete'],
    member: ['create', 'update', 'delete'],
    invitation: ['create', 'cancel'],
    team: ['create', 'update', 'delete'],
    role: ['create', 'update', 'delete']
  },
  admin: {
    organization: ['update'],
    member: ['create', 'update', 'delete'],
    invitation: ['create', 'cancel'],
    team: ['create', 'update'],
  },
  member: {}
};

export function hasPermission(roles: string[] | undefined, domain: PermissionDomain, action: string, dynamic?: Record<string, RolePermissions>): boolean {
  if (!roles || roles.length === 0) return false;
  const maps: Record<string, RolePermissions>[] = [defaultRolePermissions];
  if (dynamic) maps.push(dynamic);
  return roles.some(role => {
    for (const m of maps) {
      const perms = m[role];
      if (perms && perms[domain] && perms[domain].includes(action)) return true;
    }
    return false;
  });
}
