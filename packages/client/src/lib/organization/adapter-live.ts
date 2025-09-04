import {
  OrganizationAdapter,
  OrganizationAdapterResult,
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '@/types/organization';

function readEnv(key: string): string | undefined {
  try {
    const meta = eval('import.meta');
    if (meta && meta.env) return meta.env[key];
  } catch {/* ignored */}
  interface MetaHolder { __IMETA?: { env?: Record<string, string> }; importMetaEnv?: Record<string, string> }
  const g = globalThis as MetaHolder;
  if (g.__IMETA && g.__IMETA.env) return g.__IMETA.env[key];
  if (g.importMetaEnv) return g.importMetaEnv[key];
  return undefined;
}

const API_BASE = (readEnv('VITE_API_URL') || '').replace(/\/$/, '');

async function json<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function err<T>(message: string): OrganizationAdapterResult<T> { return { data: null, error: message }; }

const liveAdapter: OrganizationAdapter = {
  async listOrganizations() {
    try {
      const res = await fetch(`${API_BASE}/organizations`, { credentials: 'include' });
      const data = await json<{ organizations: Organization[] }>(res);
      return { data: data.organizations, error: null };
  } catch (e) { return err(e instanceof Error ? e.message : 'Unknown error'); }
  },
  async createOrganization(input: CreateOrganizationInput) {
    try {
      const res = await fetch(`${API_BASE}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      const data = await json<{ organization: Organization }>(res);
      return { data: data.organization, error: null };
  } catch (e) { return err(e instanceof Error ? e.message : 'Unknown error'); }
  },
  async getOrganization(id: string) {
    try {
      const res = await fetch(`${API_BASE}/organizations/${id}`, { credentials: 'include' });
      const data = await json<{ organization: Organization }>(res);
      return { data: data.organization, error: null };
  } catch (e) { return err(e instanceof Error ? e.message : 'Unknown error'); }
  },
  async setActiveOrganization(id: string) {
    try {
      const res = await fetch(`${API_BASE}/organizations/${id}/active`, { method: 'POST', credentials: 'include' });
      const data = await json<{ organization: Organization }>(res);
      return { data: data.organization, error: null };
  } catch (e) { return err(e instanceof Error ? e.message : 'Unknown error'); }
  },
  async updateOrganization(id: string, input: UpdateOrganizationInput) {
    try {
      const res = await fetch(`${API_BASE}/organizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      const data = await json<{ organization: Organization }>(res);
      return { data: data.organization, error: null };
  } catch (e) { return err(e instanceof Error ? e.message : 'Unknown error'); }
  },
  async deleteOrganization(id: string) {
    try {
      const res = await fetch(`${API_BASE}/organizations/${id}`, { method: 'DELETE', credentials: 'include' });
      await json<{ id: string }>(res);
      return { data: { id }, error: null };
  } catch (e) { return err(e instanceof Error ? e.message : 'Unknown error'); }
  },
};

export default liveAdapter;
