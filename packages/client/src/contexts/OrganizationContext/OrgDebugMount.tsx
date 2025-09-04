import { useEffect } from 'react';
import { useOrganizations } from './index';

export function OrgDebugMount() {
  const { organizations, activeOrganization, isLoading, error } = useOrganizations();
  useEffect(() => {
    if (!isLoading && import.meta.env.DEV) {
       
      console.debug('[org] loaded', { count: organizations.length, active: activeOrganization?.id, error });
    }
  }, [organizations, activeOrganization, isLoading, error]);
  return null;
}

export default OrgDebugMount;
