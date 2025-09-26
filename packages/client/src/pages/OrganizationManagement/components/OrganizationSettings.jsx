import React, { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Building2, Save, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/Common/UI/Card';
import { Button } from '@components/Common/UI/Button';
import { Input } from '@components/Common/UI/Input';
import { Label } from '@components/Common/UI/Label';
import { Textarea } from '@components/Common/UI/Textarea';
import { Badge } from '@components/Common/UI/Badge';
import { Skeleton } from '@components/Common/UI/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@components/Common/UI/alert-dialog';
import { toast } from 'sonner';

export default function OrganizationSettings() {
  const { useActiveOrganization } = authClient;
  const { data: activeOrg, isLoading } = useActiveOrganization();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: activeOrg?.name || '',
    slug: activeOrg?.slug || '',
    description: activeOrg?.description || '',
  });

  // Update form data when active org loads
  React.useEffect(() => {
    if (activeOrg) {
      setFormData({
        name: activeOrg.name || '',
        slug: activeOrg.slug || '',
        description: activeOrg.description || '',
      });
    }
  }, [activeOrg]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!activeOrg) return;
    
    setIsSaving(true);
    try {
      // Here you would call the API to update the organization
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Organization settings updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error('Failed to update organization settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (activeOrg) {
      setFormData({
        name: activeOrg.name || '',
        slug: activeOrg.slug || '',
        description: activeOrg.description || '',
      });
    }
    setIsEditing(false);
  };

  const handleDeleteOrganization = async () => {
    if (!activeOrg) return;
    
    try {
      // Here you would call the API to delete the organization
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Organization deleted successfully');
      // Redirect to organizations page
      window.location.href = '/organizations';
    } catch (error) {
      console.error('Failed to delete organization:', error);
      toast.error('Failed to delete organization');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeOrg) {
    return (
      <div className="p-6 text-center">
        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Organization Selected</h3>
        <p className="text-muted-foreground">
          You need to select an organization to manage its settings.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>General Settings</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your organization's basic information
            </p>
          </div>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Organization Slug</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                  @
                </span>
                <Input
                  id="org-slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  disabled={!isEditing}
                  placeholder="organization-slug"
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for organization identification and URLs
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              placeholder="Describe your organization (optional)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Organization Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Statistics</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current usage and limits for your organization
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Members</span>
                <Badge variant="secondary">{activeOrg.members?.length || 0} / ∞</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: '20%' }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Used</span>
                <Badge variant="outline">Not Available</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-muted-foreground/30 h-2 rounded-full" 
                  style={{ width: '0%' }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Calls</span>
                <Badge variant="outline">Not Available</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-muted-foreground/30 h-2 rounded-full" 
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Irreversible and destructive actions
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDangerZone(!showDangerZone)}
          >
            {showDangerZone ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </CardHeader>
        {showDangerZone && (
          <CardContent className="space-y-4">
            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-destructive mb-1">Delete Organization</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete this organization and all of its data. This cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Organization
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the{' '}
                          <strong>{activeOrg.name}</strong> organization and remove all of its data
                          from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteOrganization}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Organization
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}