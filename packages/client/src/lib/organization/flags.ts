export function orgsEnabled() {
  return import.meta.env.VITE_ENABLE_ORGANIZATIONS === 'true';
}

export function orgMode(): 'mock' | 'live' {
  return (import.meta.env.VITE_ORG_MODE || 'mock') === 'live' ? 'live' : 'mock';
}

export function teamsEnabled() {
  return import.meta.env.VITE_ORG_TEAMS_ENABLED === 'true';
}

export function dynamicRolesEnabled() {
  return import.meta.env.VITE_ORG_DYNAMIC_ROLES_ENABLED === 'true';
}
