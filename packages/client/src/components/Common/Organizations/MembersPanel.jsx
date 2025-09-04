import React, { useEffect, useState } from 'react';
import { useOrganizations } from '@/contexts/OrganizationContext';
import { ListSkeleton } from './Skeletons';
import UpdateMemberRoleDialog from './UpdateMemberRoleDialog';

export default function MembersPanel() {
  const { activeOrganization, members, loadMembers, hasPermission, updateMemberRole, status } = useOrganizations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  useEffect(() => { loadMembers(); }, [activeOrganization, loadMembers]);
  if (!activeOrganization) return <div className="text-sm">No active organization.</div>;
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Members ({members.length})</h3>
      {status?.loadingMembers && <ListSkeleton count={3} />}
      {!status?.loadingMembers && (
      <ul className="space-y-1 text-sm">
        {members.map(m => (
          <li key={m.id} className="flex items-center justify-between border rounded px-2 py-1">
            <span>{m.userId} <span className="opacity-60">({m.role})</span></span>
            {hasPermission('member','update') && (
              <button className="text-xs underline" onClick={() => { setSelected(m); setDialogOpen(true); }}>Change Role</button>
            )}
          </li>
        ))}
        {members.length === 0 && <li className="text-xs opacity-70">No members</li>}
      </ul>
      )}
      <UpdateMemberRoleDialog open={dialogOpen} member={selected} onClose={() => setDialogOpen(false)} onUpdate={(role) => updateMemberRole(selected.id, role)} />
    </div>
  );
}
