import { useOrganizations } from '@/contexts/OrganizationContext';

export function useOrgPermission(domain: string, action: string) {
  const { hasPermission } = useOrganizations();
  return hasPermission(domain, action);
}
