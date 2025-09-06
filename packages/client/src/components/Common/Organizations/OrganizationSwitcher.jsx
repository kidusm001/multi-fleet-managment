import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, ChevronDown, ChevronUp, Loader2, Building2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { cn } from '@lib/utils';

export default function OrganizationSwitcher({ isDark }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [switching, setSwitching] = useState(false);
  
  // Use better-auth organization hooks
  const { useListOrganizations, useActiveOrganization } = authClient;
  const { data: organizations = [], isLoading } = useListOrganizations();
  const { data: activeOrganization } = useActiveOrganization();
  
  const filtered = useMemo(() => {
    if (!filter) return organizations;
    return organizations.filter(o => o.name.toLowerCase().includes(filter.toLowerCase()));
  }, [organizations, filter]);

  const handleSwitch = async (orgId) => {
    if (switching || orgId === activeOrganization?.id) return;
    setSwitching(true);
    try {
      await authClient.organization.setActive({
        organizationId: orgId
      });
      setOpen(false);
      // Optionally refresh or redirect
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setSwitching(false);
    }
  };

  const handleManageOrganizations = () => {
    navigate('/organizations');
    setOpen(false);
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
              onClick={handleManageOrganizations}
              title="Manage organizations"
              className={cn('p-1.5 rounded-md border', isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-black/10 hover:bg-black/10 text-black')}
            >
              <Building2 className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto pr-1 space-y-1">
            {filtered.map(org => {
              const active = activeOrganization?.id === org.id;
              return (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  disabled={switching}
                  className={cn(
                    'w-full flex items-center justify-between text-left px-2 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50',
                    active ? (isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-500/15 text-orange-700') : (isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black')
                  )}
                  role="option"
                  aria-selected={active}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{org.name}</div>
                    <div className={cn("text-xs truncate", isDark ? "text-white/60" : "text-black/60")}>
                      @{org.slug}
                    </div>
                  </div>
                  {switching && active ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : active ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                </button>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <div className={cn('text-xs px-2 py-4 text-center rounded-md border', isDark ? 'border-white/10 text-white/50' : 'border-black/10 text-black/50')}>
                {filter ? 'No matching organizations' : 'No organizations found'}
              </div>
            )}
            {!organizations.length && !isLoading && (
              <button
                onClick={handleManageOrganizations}
                className={cn(
                  'w-full flex items-center gap-2 justify-center px-2 py-3 rounded-md border text-sm transition-colors',
                  isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-black/10 hover:bg-black/5 text-black'
                )}
              >
                <Plus className="h-4 w-4" />
                Create your first organization
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
