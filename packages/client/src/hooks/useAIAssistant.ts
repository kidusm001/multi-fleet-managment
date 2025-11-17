import { useRole } from '@/contexts/RoleContext';
import { ROLES } from '@/data/constants';

/**
 * Hook to determine if AI Assistant should be shown for the current user
 */
export function useAIAssistant() {
  const { role, isReady } = useRole();

  // Show AI assistant for all privileged roles
  const shouldShow = isReady && role && [
    ROLES.SUPERADMIN,
    ROLES.OWNER,
    ROLES.ADMIN,
    ROLES.MANAGER,
  ].includes(role);

  // Get the role string for the AI - role is already a string from ROLES constants
  const roleString = role || 'user';

  return {
    shouldShow,
    userRole: roleString,
    isReady,
  };
}
