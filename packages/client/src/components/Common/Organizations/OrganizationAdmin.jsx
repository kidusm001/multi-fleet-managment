import React from 'react';
import MembersPanel from './MembersPanel';
import InvitationsPanel from './InvitationsPanel';
import TeamsPanel from './TeamsPanel';
import RolesPanel from './RolesPanel';
import { teamsEnabled, dynamicRolesEnabled } from '@lib/organization/flags';

export default function OrganizationAdmin() {
  return (
    <div className="grid gap-6 md:grid-cols-2 p-2">
      <div className="space-y-4">
        <MembersPanel />
        <InvitationsPanel />
      </div>
      <div className="space-y-4">
        {teamsEnabled() && <TeamsPanel />}
        {dynamicRolesEnabled() && <RolesPanel />}
      </div>
    </div>
  );
}
