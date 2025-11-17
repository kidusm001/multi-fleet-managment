import React from 'react';
import { useOrganizations } from '@contexts/OrganizationContext';

interface ErrorBannerProps {
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ className }) => {
  const { error, status, refresh, loadMembers, loadInvitations, loadTeams, loadRoles } = useOrganizations();
  const sliceError = status?.error || error;
  if (!sliceError) return null;

  const retries: { label: string; fn: (() => Promise<void>) | undefined; key: string; loading?: boolean }[] = [
    { label: 'Organizations', fn: refresh, key: 'organizations', loading: status?.loadingOrganizations },
    { label: 'Members', fn: loadMembers, key: 'members', loading: status?.loadingMembers },
    { label: 'Invitations', fn: loadInvitations, key: 'invitations', loading: status?.loadingInvitations },
    { label: 'Teams', fn: loadTeams, key: 'teams', loading: status?.loadingTeams },
    { label: 'Roles', fn: loadRoles, key: 'roles', loading: status?.loadingRoles }
  ];

  return (
    <div
      data-testid="org-error-banner"
      className={`mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 flex flex-col gap-2 ${className || ''}`}
    >
      <div className="font-medium">Organization Feature Error</div>
      <div>{sliceError}</div>
      <div className="flex flex-wrap gap-2">
        {retries.map(r => r.fn && (
          <button
            key={r.key}
            onClick={() => !r.loading && r.fn && r.fn()}
            disabled={r.loading}
            className={`rounded px-2 py-1 text-xs border border-red-300/60 ${r.loading ? 'bg-red-200 text-red-500 cursor-not-allowed' : 'bg-red-600/10 text-red-700 hover:bg-red-600/20'}`}
            type="button"
            data-testid={`retry-${r.key}`}
          >{r.loading ? `Loading ${r.label}...` : `Retry ${r.label}`}</button>
        ))}
      </div>
    </div>
  );
};

export default ErrorBanner;