import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Common/UI/Card';
import { Button } from '@/components/Common/UI/Button';
import { Input } from '@/components/Common/UI/Input';
import { Skeleton } from '@/components/Common/UI/skeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Building2, 
  Plus, 
  Search, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Use auth hooks from the configured client
const { useSession, useListOrganizations, useActiveOrganization } = authClient;

/**
 * Organization Selection Page
 * 
 * Allows users to view, select, and manage their organizations using better-auth
 * organization plugin functionality.
 */
export default function OrganizationSelection() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Auth hooks
  const { data: session } = useSession();
  const { data: organizations, isLoading: orgsLoading, error: orgsError, refetch: refetchOrganizations } = useListOrganizations();
  const { data: activeOrganization, isLoading: activeOrgLoading, refetch: refetchActiveOrg } = useActiveOrganization();

  // Debug logging for troubleshooting (can be removed in production)
  useEffect(() => {
    if (organizations || activeOrganization) {
      console.log('OrganizationSelection - Active org status:', {
        organizationsCount: organizations?.length || 0,
        activeOrganization: activeOrganization?.name || 'None',
        activeOrgId: activeOrganization?.id || 'None'
      });
    }
  }, [organizations, activeOrganization]);

  // Check if this is the user's first organization
  const isFirstOrganization = !orgsLoading && (!organizations || organizations.length === 0);
  
  // Show organizations list if not loading and organizations exist
  const shouldShowOrganizations = !orgsLoading && organizations && organizations.length > 0;

  // Auto-retry loading if no organizations are loaded after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!orgsLoading && !organizations && !orgsError && session) {
        console.log('Auto-retrying organization fetch...');
        refetchOrganizations?.();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [orgsLoading, organizations, orgsError, session, refetchOrganizations]);

  // Force initial fetch if needed
  useEffect(() => {
    if (session && !orgsLoading && !organizations && !orgsError && refetchOrganizations) {
      console.log('Force initial organization fetch...');
      refetchOrganizations();
    }
  }, [session, organizations, orgsError, orgsLoading, refetchOrganizations]);

  // Refetch active organization when organizations are loaded
  useEffect(() => {
    if (organizations && organizations.length > 0 && !activeOrgLoading && !activeOrganization && refetchActiveOrg) {
      console.log('Refetching active organization...');
      refetchActiveOrg();
    }
  }, [organizations, activeOrgLoading, activeOrganization, refetchActiveOrg]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchOrganizations?.(),
        refetchActiveOrg?.()
      ]);
      console.log('Refreshed organizations and active organization');
    } catch (error) {
      console.error('Failed to refresh organizations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (newOrgName) {
      const slug = newOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setNewOrgSlug(slug);
    } else {
      setNewOrgSlug('');
    }
  }, [newOrgName]);

  // Filter organizations based on search
  const filteredOrganizations = organizations?.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Determine which organization should be considered active
  // If no explicit active organization, consider the first one as potentially active
  const effectiveActiveOrg = activeOrganization || (organizations && organizations.length > 0 ? organizations[0] : null);

  // Handle organization selection
  const handleSelectOrganization = async (org) => {
    try {
      const isAlreadyActive = activeOrganization && (
        activeOrganization.id === org.id || 
        String(activeOrganization.id) === String(org.id)
      );

      if (isAlreadyActive) {
        console.log(`Organization ${org.name} is already active, navigating to dashboard...`);
      } else {
        console.log(`Setting organization ${org.name} (${org.id}) as active...`);
        
        // Set the selected organization as active
        await authClient.organization.setActive({
          organizationId: org.id
        });
        
        console.log('Organization set as active, navigating to dashboard...');
      }
      
      // Navigate to dashboard regardless of whether it was already active
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to set active organization:', error);
      // Optional: Show a toast notification about the error
    }
  };

  // Handle creating new organization
    const handleCreateOrganization = async (e) => {
    e.preventDefault();
    
    if (!newOrgName.trim() || !newOrgSlug.trim()) {
      setCreateError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      // Create the organization using better-auth
      const metadata = { 
        createdAt: new Date().toISOString()
      };

      const { data: _data, error } = await authClient.organization.create({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim(),
        metadata,
        keepCurrentActiveOrganization: false,
      });

      if (error) {
        setCreateError(error.message || 'Failed to create organization');
        return;
      }

      // Reset form
      setNewOrgName('');
      setNewOrgSlug('');

      // Refresh organizations list
      window.location.reload();
    } catch (error) {
      console.error('Error creating organization:', error);
      setCreateError(error.message || 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                You need to be logged in to view organizations.
              </p>
              <Button onClick={() => navigate('/auth/login')}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      isDark ? "bg-slate-900" : "bg-gray-50"
    )}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Sign Out Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">
            {isFirstOrganization ? 'Welcome to Fleet Management!' : 'Select Organization'}
          </h1>
          <p className="text-muted-foreground">
            {isFirstOrganization 
              ? 'Let\'s create your first organization to get started'
              : 'Choose an organization to continue or create a new one'
            }
          </p>
          {/* Active Organization Status */}
          {activeOrgLoading ? (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading active organization...</span>
            </div>
          ) : effectiveActiveOrg ? (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <Building2 className="w-4 h-4" />
              <span>Current: {effectiveActiveOrg.name}</span>
            </div>
          ) : organizations && organizations.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-full text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>No active organization set</span>
            </div>
          )}
        </div>

        {/* Search and Refresh - Show when we have or expect organizations */}
        {(shouldShowOrganizations || (!orgsLoading && !isFirstOrganization)) && (
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={handleRefresh}
              disabled={refreshing || orgsLoading}
              className="flex items-center space-x-2"
            >
              <Loader2 className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        )}

        {/* Organizations List - Show when we have or expect organizations */}
        {(shouldShowOrganizations || (!orgsLoading && !isFirstOrganization)) && (
          <div className="space-y-4 mb-8">
          {orgsLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="w-full">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="w-24 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : orgsError ? (
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error Loading Organizations</h3>
                  <p className="text-muted-foreground mb-4">
                    {orgsError.message || 'Failed to load organizations'}
                  </p>
                  <Button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center space-x-2"
                  >
                    <Loader2 className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Try Again</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : !organizations ? (
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Organizations Not Loaded</h3>
                  <p className="text-muted-foreground mb-4">
                    Organization data failed to load. This might be a network issue.
                  </p>
                  <Button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center space-x-2"
                  >
                    <Loader2 className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Load Organizations</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredOrganizations.length === 0 ? (
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm ? 'No organizations found' : 'No organizations yet'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : 'Create your first organization to get started'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredOrganizations.map((org) => {
              // More robust active organization comparison
              const isActive = effectiveActiveOrg && org && (
                effectiveActiveOrg.id === org.id || 
                String(effectiveActiveOrg.id) === String(org.id)
              );
              


              return (
                <Card 
                  key={org.id} 
                  className={cn(
                    "w-full cursor-pointer transition-all duration-200 hover:shadow-lg",
                    isActive && "ring-2 ring-primary bg-primary/5 border-primary/20"
                  )}
                  onClick={() => handleSelectOrganization(org)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Organization Avatar */}
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          isDark ? "bg-slate-700" : "bg-gray-100"
                        )}>
                          {org.logo ? (
                            <img 
                              src={org.logo} 
                              alt={org.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>

                        {/* Organization Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{org.name}</h3>
                            {isActive && (
                              <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            @{org.slug}
                          </p>

                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-4 text-sm">
                        {!isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOrganization(org);
                            }}
                            className="text-xs"
                          >
                            Set Active
                          </Button>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          </div>
        )}

        {/* Create New Organization */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>
                {isFirstOrganization ? 'Create Your Organization' : 'Create New Organization'}
              </span>
            </CardTitle>
            {isFirstOrganization && (
              <p className="text-sm text-muted-foreground mt-2">
                This will be your main organization for managing your fleet operations.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Organization Name *
                  </label>
                  <Input
                    placeholder="Enter organization name"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Slug *
                  </label>
                  <Input
                    placeholder="organization-slug"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be used in URLs and must be unique
                  </p>
                </div>
              </div>

              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{createError}</p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isCreating || !newOrgName.trim() || !newOrgSlug.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {isFirstOrganization ? 'Create Organization & Get Started' : 'Create Organization'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
