import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ChevronDownIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';

interface OrganizationSelectorProps {
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export function OrganizationSelector({ 
  showCreateButton = true, 
  onCreateClick 
}: OrganizationSelectorProps) {
  const { 
    organizations, 
    activeOrganization, 
    setActiveOrganization, 
    isLoading 
  } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleOrganizationChange = async (organizationId: string) => {
    if (isChanging || activeOrganization?.id === organizationId) return;
    
    setIsChanging(true);
    try {
      await setActiveOrganization(organizationId);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to change organization:', error.message);
    } finally {
      setIsChanging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  if (!organizations?.length) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">No organizations</span>
        {showCreateButton && onCreateClick && (
          <button
            onClick={onCreateClick}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <span className="truncate">
            {isChanging ? 'Switching...' : (activeOrganization?.name || 'Select Organization')}
          </span>
        </div>
        <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrganizationChange(org.id)}
                  disabled={isChanging}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="truncate">{org.name}</span>
                  </div>
                  {activeOrganization?.id === org.id && (
                    <CheckIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            
            {showCreateButton && onCreateClick && (
              <>
                <div className="border-t border-gray-100"></div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      onCreateClick();
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Create new organization</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default OrganizationSelector;