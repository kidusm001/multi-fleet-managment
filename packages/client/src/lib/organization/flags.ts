function getEnv() {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string,string> })?.env || {};
    interface MetaLike { importMetaEnv?: Record<string,string>; __IMETA?: { env?: Record<string,string> } }
    const g = globalThis as unknown as MetaLike;
    const globalEnv = { ...(g.importMetaEnv || {}), ...(g.__IMETA?.env || {}) };
    return { ...metaEnv, ...globalEnv }; // allow test overrides to fill missing vars
  } catch {
    interface MetaLike { importMetaEnv?: Record<string,string>; __IMETA?: { env?: Record<string,string> } }
    const g = globalThis as unknown as MetaLike;
    return (g.importMetaEnv || g.__IMETA?.env || {});
  }
}

export function orgsEnabled() {
  const env = getEnv();
  return env.VITE_ENABLE_ORGANIZATIONS === 'true';
}

export function orgMode(): 'mock' | 'live' {
  const env = getEnv();
  return (env.VITE_ORG_MODE || 'mock') === 'live' ? 'live' : 'mock';
}

export function teamsEnabled() {
  const env = getEnv();
  return env.VITE_ORG_TEAMS_ENABLED === 'true';
}

export function dynamicRolesEnabled() {
  const env = getEnv();
  return env.VITE_ORG_DYNAMIC_ROLES_ENABLED === 'true';
}
