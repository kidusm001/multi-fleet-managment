import React, { useEffect, useState } from 'react';
import { useOrganizations } from '@/contexts/OrganizationContext';
import { ListSkeleton } from './Skeletons';

export default function TeamsPanel() {
  const { activeOrganization, teams, loadTeams, createTeam, hasPermission, members, addMemberToTeam, listTeamMembers, removeMemberFromTeam, status } = useOrganizations();
  const [name, setName] = useState('');
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState({});
  const [addUserId, setAddUserId] = useState('');
  useEffect(() => { loadTeams(); }, [activeOrganization, loadTeams]);
  if (!activeOrganization) return <div className="text-sm">No active organization.</div>;
  const canCreate = hasPermission('team','create');
  const canModify = hasPermission('team','update');

  const toggleExpand = async (teamId) => {
    if (expandedTeam === teamId) { setExpandedTeam(null); return; }
    setExpandedTeam(teamId);
    if (!listTeamMembers) return;
    const list = await listTeamMembers(teamId);
    setTeamMembers(s => ({ ...s, [teamId]: list }));
  };

  const handleAdd = async (teamId) => {
    if (!addUserId.trim()) return;
    if (!addMemberToTeam) return;
    await addMemberToTeam(teamId, addUserId.trim());
    if (listTeamMembers) {
      const list = await listTeamMembers(teamId);
      setTeamMembers(s => ({ ...s, [teamId]: list }));
    }
    setAddUserId('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Teams ({teams.length})</h3>
        {canCreate && (
          <form onSubmit={e => { e.preventDefault(); if (!name.trim()) return; createTeam(name.trim()); setName(''); }} className="flex items-center gap-1">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Team name" className="px-2 py-1 text-xs border rounded" />
            <button type="submit" className="px-2 py-1 text-xs bg-orange-500 text-white rounded">Add</button>
          </form>
        )}
      </div>
      {status?.loadingTeams && <ListSkeleton count={3} />}
      {!status?.loadingTeams && (
      <ul className="space-y-1 text-sm">
        {teams.map(t => {
          const membersForTeam = teamMembers[t.id] || [];
          return (
            <li key={t.id} className="border rounded px-2 py-1">
              <div className="flex items-center justify-between">
                <button className="text-left flex-1" onClick={() => toggleExpand(t.id)}>
                  {t.name}
                </button>
                <span className="text-xs opacity-60">{membersForTeam.length} members</span>
              </div>
              {expandedTeam === t.id && (
                <div className="mt-2 space-y-2">
                  <ul className="space-y-1">
                    {membersForTeam.map(tm => (
                      <li key={tm.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                        <span>{tm.userId}</span>
                        {canModify && removeMemberFromTeam && (
                          <button onClick={async () => { await removeMemberFromTeam(tm.id); if (listTeamMembers) { const list = await listTeamMembers(t.id); setTeamMembers(s => ({ ...s, [t.id]: list })); } }} className="underline">Remove</button>
                        )}
                      </li>
                    ))}
                    {membersForTeam.length === 0 && <li className="text-xs opacity-60">No members</li>}
                  </ul>
                  {canModify && addMemberToTeam && (
                    <form onSubmit={e => { e.preventDefault(); handleAdd(t.id); }} className="flex gap-1 items-center">
                      <select value={addUserId} onChange={e => setAddUserId(e.target.value)} className="border text-xs px-1 py-1 rounded flex-1">
                        <option value="">Select member</option>
                        {members.filter(m => !membersForTeam.some(tm => tm.userId === m.userId)).map(m => (
                          <option key={m.id} value={m.userId}>{m.userId}</option>
                        ))}
                      </select>
                      <button type="submit" className="text-xs px-2 py-1 bg-blue-600 text-white rounded">Add</button>
                    </form>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {teams.length === 0 && <li className="text-xs opacity-70">No teams</li>}
      </ul>
      )}
    </div>
  );
}