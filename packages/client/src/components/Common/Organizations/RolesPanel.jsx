import React, { useEffect, useState } from 'react';
import { useOrganizations } from '@/contexts/OrganizationContext';
import { ListSkeleton } from './Skeletons';
import { dynamicRolesEnabled } from '@lib/organization/flags';

export default function RolesPanel() {
  const { activeOrganization, roles = [], loadRoles, createRole, updateRole, deleteRole, hasPermission, status } = useOrganizations();
  const [newRoleName, setNewRoleName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => { if (activeOrganization && dynamicRolesEnabled()) loadRoles(); }, [activeOrganization, loadRoles]);
  if (!activeOrganization) return null;
  if (!dynamicRolesEnabled()) return null;

  const canManage = hasPermission('role', 'create') || hasPermission('role', 'update');

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Roles</h3>
      </div>
      {canManage && (
        <form onSubmit={async e => { e.preventDefault(); if (!newRoleName.trim()) return; await createRole(newRoleName.trim()); setNewRoleName(''); }} className="flex gap-2">
          <input className="border px-2 py-1 text-sm flex-1" placeholder="New role name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
          <button type="submit" className="text-sm px-3 py-1 bg-blue-600 text-white rounded">Add</button>
        </form>
      )}
      {status?.loadingRoles && <ListSkeleton count={3} />}
      {!status?.loadingRoles && (
      <ul className="space-y-2">
        {roles.map(r => (
          <li key={r.id} className="flex items-center gap-2">
            {editing === r.id ? (
              <>
                <input className="border px-2 py-1 text-sm flex-1" value={editingName} onChange={e => setEditingName(e.target.value)} />
                <button onClick={async () => { if (editingName.trim()) await updateRole(r.id, editingName.trim()); setEditing(null); }} className="text-xs px-2 py-1 bg-green-600 text-white rounded">Save</button>
                <button onClick={() => setEditing(null)} className="text-xs px-2 py-1 border rounded">Cancel</button>
              </>
            ) : (
              <>
                <span className="text-sm flex-1">{r.name}</span>
                {canManage && <button onClick={() => { setEditing(r.id); setEditingName(r.name); }} className="text-xs px-2 py-1 border rounded">Edit</button>}
                {hasPermission('role', 'delete') && <button onClick={async () => { await deleteRole(r.id); }} className="text-xs px-2 py-1 border rounded text-red-600">Delete</button>}
              </>
            )}
          </li>
        ))}
        {roles.length === 0 && <li className="text-xs text-gray-500">No roles defined.</li>}
      </ul>
      )}
    </div>
  );
}
