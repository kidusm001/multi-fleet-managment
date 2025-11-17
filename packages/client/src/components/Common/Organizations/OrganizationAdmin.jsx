import React from 'react';
import NewMembersPanel from './NewMembersPanel';
import InvitationsPanel from './InvitationsPanel';
import TeamsPanel from './TeamsPanel';
import RolesPanel from './RolesPanel';
import { teamsEnabled, dynamicRolesEnabled } from '@lib/organization/flags';

export default function OrganizationAdmin() {
  return (
    <div className="w-full">
      {/* New full-width members panel */}
      <NewMembersPanel />
      
      {/* Keep other panels in grid layout if enabled */}
      {(teamsEnabled() || dynamicRolesEnabled()) && (
        <div className="grid gap-6 md:grid-cols-2 p-2 mt-6">
          <div className="space-y-4">
            <InvitationsPanel />
          </div>
          <div className="space-y-4">
            {teamsEnabled() && <TeamsPanel />}
            {dynamicRolesEnabled() && <RolesPanel />}
          </div>
        </div>
      )}
    </div>
  );
}
