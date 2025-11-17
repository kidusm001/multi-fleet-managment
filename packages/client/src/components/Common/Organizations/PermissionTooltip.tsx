import React from 'react';
import { useOrganizations } from '@contexts/OrganizationContext';

interface PermissionTooltipProps {
  domain: string;
  action: string;
  reason?: string;
  children: React.ReactElement;
}

export const PermissionTooltip: React.FC<PermissionTooltipProps> = ({ domain, action, reason, children }) => {
  const { hasPermission } = useOrganizations();
  const allowed = hasPermission(domain, action);
  if (allowed) return children;
  return (
    <span className="relative group inline-block" aria-disabled="true">
      {React.cloneElement(children, { disabled: true, 'aria-disabled': true })}
      <span className="pointer-events-none absolute z-10 bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity" role="tooltip">
        {reason || 'You lack permission for this action.'}
      </span>
    </span>
  );
};

export default PermissionTooltip;
