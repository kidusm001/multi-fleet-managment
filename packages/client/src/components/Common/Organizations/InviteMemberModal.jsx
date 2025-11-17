import React, { useState } from 'react';
export default function InviteMemberModal({ open, onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  function validateEmail(e) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  }
  function handleInvite() {
    if (!validateEmail(email)) { setError('Invalid email'); return; }
    if (!role) { setError('Role required'); return; }
    setError('');
    onInvite(email, role);
    setEmail(''); setRole('member');
    onClose();
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
        <h3 className="font-semibold mb-2">Invite Member</h3>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full mb-2 px-2 py-1 border rounded" />
        <select value={role} onChange={e => setRole(e.target.value)} className="w-full mb-2 px-2 py-1 border rounded">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-2 py-1 text-sm border rounded">Cancel</button>
          <button onClick={handleInvite} className="px-2 py-1 text-sm bg-orange-500 text-white rounded">Invite</button>
        </div>
      </div>
    </div>
  );
}