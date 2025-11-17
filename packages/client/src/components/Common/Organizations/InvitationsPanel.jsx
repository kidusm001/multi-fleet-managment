import React, { useEffect, useState } from 'react';
import { useOrganizations } from '@/contexts/OrganizationContext';
import { ListSkeleton } from './Skeletons';
import InviteMemberModal from './InviteMemberModal';

export default function InvitationsPanel() {
  const { activeOrganization, invitations, loadInvitations, invite, status } = useOrganizations();
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => { loadInvitations(); }, [activeOrganization, loadInvitations]);
  if (!activeOrganization) return <div className="text-sm">No active organization.</div>;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Invitations ({invitations.length})</h3>
        <button onClick={() => setModalOpen(true)} className="px-2 py-1 text-xs bg-orange-500 text-white rounded">Invite Member</button>
      </div>
      {status?.loadingInvitations && <ListSkeleton count={2} />}
      {!status?.loadingInvitations && (
      <ul className="space-y-1 text-sm">
        {invitations.map(i => (
          <li key={i.id} className="flex items-center justify-between border rounded px-2 py-1">
            <span>{i.email} <span className="opacity-60">({i.role})</span></span>
            <span className="text-xs opacity-60">pending</span>
          </li>
        ))}
        {invitations.length === 0 && <li className="text-xs opacity-70">No pending invitations</li>}
      </ul>
      )}
      <InviteMemberModal open={modalOpen} onClose={() => setModalOpen(false)} onInvite={invite} />
    </div>
  );
}
