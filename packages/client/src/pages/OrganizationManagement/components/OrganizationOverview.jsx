import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { Building2, Users, Calendar, Crown, Loader2, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/Common/UI/Card';
import { Button } from '@components/Common/UI/Button';
import { Badge } from '@components/Common/UI/Badge';
import { Skeleton } from '@components/Common/UI/skeleton';
import { format } from 'date-fns';

export default function OrganizationOverview() {
  const { useActiveOrganization, useListOrganizations } = authClient;
  const { data: activeOrg, isLoading: activeOrgLoading } = useActiveOrganization();
  const { data: organizations, isLoading: orgsLoading } = useListOrganizations();
  
  const [fullOrgData, setFullOrgData] = useState(null);
  const [activeMember, setActiveMember] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [lastFetchedOrgId, setLastFetchedOrgId] = useState(null);

  // Get current organization details
  const currentOrg = activeOrg || (organizations && organizations[0]);
  const isLoading = activeOrgLoading || orgsLoading || isLoadingDetails;

  // Memoized fetch function to prevent recreating on every render
  const fetchOrganizationDetails = useCallback(async (orgId) => {
    if (!orgId || isLoadingDetails || lastFetchedOrgId === orgId) return;
    
    console.log('Fetching organization details for:', orgId);
    setIsLoadingDetails(true);
    setLastFetchedOrgId(orgId);
    
    try {
      // Fetch full organization data
      const { data: fullOrg, error: orgError } = await authClient.organization.getFullOrganization({
        organizationId: orgId
      });

      if (orgError) {
        console.error('Failed to fetch full organization:', orgError);
      } else {
        setFullOrgData(fullOrg);
      }

      // Fetch active member data to get the user's role
      const { data: memberData, error: memberError } = await authClient.organization.getActiveMember();
      
      if (memberError) {
        console.error('Failed to fetch active member:', memberError);
      } else {
        setActiveMember(memberData);
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [isLoadingDetails, lastFetchedOrgId]);

  // Fetch organization details when organization changes
  useEffect(() => {
    if (currentOrg?.id && currentOrg.id !== lastFetchedOrgId && !isLoadingDetails) {
      fetchOrganizationDetails(currentOrg.id);
    }
  }, [currentOrg?.id, fetchOrganizationDetails, lastFetchedOrgId, isLoadingDetails]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="p-6 text-center">
        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Organization Selected</h3>
        <p className="text-muted-foreground mb-4">
          You need to select or create an organization to manage.
        </p>
        <Button onClick={() => window.location.href = '/organizations'}>
          <Building2 className="w-4 h-4 mr-2" />
          Manage Organizations
        </Button>
      </div>
    );
  }

  // Real organization stats from fetched data
  const stats = {
    totalMembers: fullOrgData?.members?.length || currentOrg?.members?.length || 0,
    totalRoutes: 12, // This would come from your routes API
    activeVehicles: 8, // This would come from your vehicles API
    totalEmployees: 45, // This would come from your employees API
  };

  // Get user's actual role from active member data
  const userRole = activeMember?.role || 'member';

  return (
    <div className="p-6 space-y-6">
      {/* Organization Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{currentOrg.name}</h2>
              <Badge variant="secondary">Active</Badge>
            </div>
            <p className="text-muted-foreground">@{currentOrg.slug}</p>
            {currentOrg.createdAt && (
              <p className="text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 inline mr-1" />
                Created {format(new Date(currentOrg.createdAt), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Organization
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Organization members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoutes}</div>
            <p className="text-xs text-muted-foreground">
              Transportation routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Fleet vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              All employees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
              <p className="font-medium">{currentOrg.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Organization Slug</label>
              <p className="font-medium">@{currentOrg.slug}</p>
            </div>
            {currentOrg.description && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{currentOrg.description}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Your Role</label>
              <div className="flex items-center gap-2">
                {userRole === 'owner' ? (
                  <Crown className="w-4 h-4 text-yellow-500" />
                ) : userRole === 'admin' ? (
                  <Crown className="w-4 h-4 text-primary" />
                ) : (
                  <Users className="w-4 h-4 text-primary" />
                )}
                <span className="font-medium capitalize">{userRole}</span>
              </div>
            </div>
            {currentOrg.createdAt && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                <p className="font-medium">{format(new Date(currentOrg.createdAt), 'MMMM dd, yyyy')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - Placeholder for future implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Recent organization activity will appear here</p>
            <p className="text-sm">This feature is coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}