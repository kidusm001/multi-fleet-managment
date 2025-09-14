import React, { useEffect, useState } from 'react';
import { useOrganizations } from '@/contexts/OrganizationContext';
import { ListSkeleton } from './Skeletons';
import UpdateMemberRoleDialog from './UpdateMemberRoleDialog';
import AddMemberModal from './AddMemberModal';

export default function MembersPanel() {
  const { activeOrganization, members, loadMembers, hasPermission, updateMemberRole, addMember, status } = useOrganizations();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  
  useEffect(() => { loadMembers(); }, [activeOrganization, loadMembers]);
  
  if (!activeOrganization) return <div className="text-sm">No active organization.</div>;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Members ({members.length})</h3>
        {hasPermission('member','create') && (
          <button 
            onClick={() => setAddMemberModalOpen(true)} 
            className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            Add Member
          </button>
        )}
      </div>
      
      {status?.loadingMembers && <ListSkeleton count={3} />}
      
      {!status?.loadingMembers && (
        <ul className="space-y-1 text-sm">
          {members.map(m => (
            <li key={m.id} className="flex items-center justify-between border rounded px-2 py-1">
              <span>{m.userId} <span className="opacity-60">({m.role})</span></span>
              {hasPermission('member','update') && (
                <button 
                  className="text-xs underline hover:text-orange-600" 
                  onClick={() => { 
                    setSelected(m); 
                    setRoleDialogOpen(true); 
                  }}
                >
                  Change Role
                </button>
              )}
            </li>
          ))}
          {members.length === 0 && <li className="text-xs opacity-70">No members</li>}
        </ul>
      )}
      
      <UpdateMemberRoleDialog 
        open={roleDialogOpen} 
        member={selected} 
        onClose={() => setRoleDialogOpen(false)} 
        onUpdate={(role) => updateMemberRole(selected.id, role)} 
      />
      
      <AddMemberModal
        open={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        onAddMember={addMember}
      />
    </div>
  );
}
