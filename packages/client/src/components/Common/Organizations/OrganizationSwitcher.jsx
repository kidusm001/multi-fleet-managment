import React, { useState, useMemo } from 'react';
import { Plus, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useOrganizations } from '@/contexts/OrganizationContext';
import { cn } from '@lib/utils';

export default function OrganizationSwitcher({ isDark }) {
  const { organizations, activeOrganization, setActive, create, isLoading, error } = useOrganizations();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const filtered = useMemo(() => {
    if (!filter) return organizations;
    return organizations.filter(o => o.name.toLowerCase().includes(filter.toLowerCase()));
  }, [organizations, filter]);

  const handleCreate = async () => {
    if (creating) return;
    const name = prompt('Organization name');
    if (!name || !name.trim()) return;
    setCreating(true);
    await create(name.trim());
    setCreating(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors',
          isDark ? 'bg-white/10 hover:bg-white/15 border-white/10 text-white' : 'bg-black/5 hover:bg-black/10 border-black/10 text-black'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <span className="font-medium max-w-[140px] truncate">{activeOrganization?.name || 'No Organization'}</span>
            {open ? <ChevronUp className="h-4 w-4 opacity-70" /> : <ChevronDown className="h-4 w-4 opacity-70" />}
          </>
        )}
      </button>
      {open && (
        <div
          className={cn(
            'absolute mt-2 w-72 shadow-lg rounded-md border z-50 p-2 backdrop-blur-xl',
            isDark ? 'bg-[#0c1222]/95 border-white/10' : 'bg-white/95 border-black/10'
          )}
          role="listbox"
        >
          <div className="flex items-center gap-2 mb-2">
            <input
              placeholder="Filter organizations"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className={cn('w-full text-sm px-2 py-1 rounded-md border outline-none', isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-black/5 border-black/10 text-black placeholder:text-black/40')}
            />
            <button
              onClick={handleCreate}
              title="Create organization"
              className={cn('p-1.5 rounded-md border', isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-black/10 hover:bg-black/10 text-black')}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto pr-1 space-y-1">
            {filtered.map(org => {
              const active = activeOrganization?.id === org.id;
              return (
                <button
                  key={org.id}
                  onClick={async () => { if (!active) await setActive(org.id); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center justify-between text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                    active ? (isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-500/15 text-orange-700') : (isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black')
                  )}
                  role="option"
                  aria-selected={active}
                >
                  <span className="truncate">{org.name}</span>
                  {active && <Check className="h-4 w-4" />}
                </button>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <div className={cn('text-xs px-2 py-4 text-center rounded-md border', isDark ? 'border-white/10 text-white/50' : 'border-black/10 text-black/50')}>No organizations</div>
            )}
            {error && (
              <div className="text-xs text-red-500 px-2 py-1">{error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
