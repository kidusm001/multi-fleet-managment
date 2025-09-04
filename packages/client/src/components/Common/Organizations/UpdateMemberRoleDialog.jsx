import React, { useState } from 'react';
export default function UpdateMemberRoleDialog({ open, onClose, member, onUpdate }) {
  const [role, setRole] = useState(member?.role || 'member');
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-80">
        <h3 className="font-semibold mb-3 text-sm">Update Role</h3>
        <div className="mb-2 text-xs opacity-70">{member?.userId}</div>
        <select value={role} onChange={e => setRole(e.target.value)} className="w-full mb-4 px-2 py-1 border rounded">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-2 py-1 text-sm border rounded">Cancel</button>
          <button onClick={() => { onUpdate(role); onClose(); }} className="px-2 py-1 text-sm bg-orange-500 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}