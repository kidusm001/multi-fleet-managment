import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Edit3, Trash2, Users, Route, AlertTriangle, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@components/Common/UI/Card';
import { Button } from '@components/Common/UI/Button';
import { Input } from '@components/Common/UI/Input';
import { Label } from '@components/Common/UI/Label';
import { Badge } from '@components/Common/UI/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@components/Common/UI/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/Common/UI/Select';
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
import { locationService } from '@/services/locationService';

const LOCATION_TYPES = [
  { value: 'BRANCH', label: 'Branch Office', color: 'bg-blue-100 text-blue-800' },
  { value: 'HQ', label: 'Headquarters', color: 'bg-purple-100 text-purple-800' }
];

export default function LocationManagement() {
  const { useActiveOrganization } = authClient;
  const { data: activeOrg, isLoading: orgLoading } = useActiveOrganization();
  
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentOrgId, setCurrentOrgId] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [formData, setFormData] = useState({
    address: '',
    latitude: '',
    longitude: '',
    type: 'BRANCH'
  });

  // Debug logging
  console.log('LocationManagement render:', {
    activeOrg: activeOrg?.id,
    currentOrgId,
    orgLoading,
    locationsCount: locations.length,
    forceRefresh
  });

  const loadLocations = useCallback(async () => {
    const currentActiveOrgId = activeOrg?.id;
    console.log('loadLocations called for organization:', currentActiveOrgId);
    
    if (!currentActiveOrgId) {
      console.log('No active organization, skipping location load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Add a small delay to ensure backend session is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Fetching locations for org:', currentActiveOrgId);
      const data = await locationService.getLocations();
      
      console.log('Received locations:', data.length, 'items for org:', currentActiveOrgId);
      
      // Double-check we're still on the same organization
      if (activeOrg?.id === currentActiveOrgId) {
        setLocations(data);
        console.log('Successfully set locations for org:', currentActiveOrgId);
      } else {
        console.log('Organization changed during fetch, discarding results');
      }
    } catch (err) {
      console.error('Failed to load locations for org:', currentActiveOrgId, err);
      setError('Failed to load locations');
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  // Load locations when component mounts or organization changes
  useEffect(() => {
    console.log('useEffect triggered:', { 
      activeOrgId: activeOrg?.id, 
      currentOrgId, 
      orgLoading,
      hasActiveOrg: !!activeOrg 
    });

    // Don't proceed if organization is still loading
    if (orgLoading) {
      console.log('Organization still loading, waiting...');
      return;
    }

    if (activeOrg?.id) {
      // If organization changed, clear cache and reload
      if (currentOrgId && currentOrgId !== activeOrg.id) {
        console.log(`Organization changed from ${currentOrgId} to ${activeOrg.id}, clearing cache and reloading`);
        locationService.clearCache();
        setLocations([]); // Clear previous data immediately
        setError(null); // Clear any previous errors
        setForceRefresh(prev => prev + 1); // Force a refresh
      }
      
      if (currentOrgId !== activeOrg.id) {
        setCurrentOrgId(activeOrg.id);
      }
      
      console.log('Loading locations for organization:', activeOrg.id);
      loadLocations();
    } else if (activeOrg === null && !orgLoading) {
      // No active organization and not loading, clear data
      console.log('No active organization, clearing data');
      setLocations([]);
      setCurrentOrgId(null);
      setLoading(false);
      setError('No active organization selected');
    }
  }, [activeOrg, currentOrgId, orgLoading, forceRefresh, loadLocations]);

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    
    if (!formData.address || !formData.latitude || !formData.longitude) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const locationData = {
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        type: formData.type
      };

      await locationService.createLocation(locationData);
      toast.success('Location created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadLocations();
    } catch (err) {
      console.error('Failed to create location:', err);
      toast.error('Failed to create location');
    }
  };

  const handleEditLocation = async (e) => {
    e.preventDefault();
    
    if (!formData.address || !formData.latitude || !formData.longitude) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const locationData = {
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        type: formData.type
      };

      await locationService.updateLocation(selectedLocation.id, locationData);
      toast.success('Location updated successfully');
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      resetForm();
      loadLocations();
    } catch (err) {
      console.error('Failed to update location:', err);
      toast.error('Failed to update location');
    }
  };

  const handleDeleteLocation = async (location) => {
    try {
      await locationService.deleteLocation(location.id);
      toast.success('Location deleted successfully');
      loadLocations();
    } catch (err) {
      console.error('Failed to delete location:', err);
      if (err.response?.status === 400) {
        toast.error('Cannot delete location with active employees or routes');
      } else {
        toast.error('Failed to delete location');
      }
    }
  };

  const openEditDialog = (location) => {
    setSelectedLocation(location);
    setFormData({
      address: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      type: location.type
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      address: '',
      latitude: '',
      longitude: '',
      type: 'BRANCH'
    });
  };

  const getLocationTypeConfig = (type) => {
    return LOCATION_TYPES.find(t => t.value === type) || LOCATION_TYPES[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {currentOrgId ? 'Loading locations...' : 'Switching organization...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[200px] text-center">
            <div className="space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">
                  {error === 'No active organization selected' ? 'No Organization Selected' : 'Error Loading Locations'}
                </h3>
                <p className="text-muted-foreground">{error}</p>
                {error !== 'No active organization selected' && (
                  <Button 
                    variant="outline" 
                    onClick={loadLocations}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Location Management</h2>
          <p className="text-muted-foreground">
            Manage branch offices and headquarters locations for your organization
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log('Manual refresh triggered');
              locationService.clearCache();
              setForceRefresh(prev => prev + 1);
              loadLocations();
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>
                  Create a new branch office or headquarters location for your organization.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLocation}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter the full address"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude *</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="9.0221"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude *</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="38.7468"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Location Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Location</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Locations List */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Locations Found</h3>
                <p className="text-muted-foreground">
                  Get started by adding your first branch office or headquarters location.
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Location
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => {
            const typeConfig = getLocationTypeConfig(location.type);
            return (
              <Card key={location.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{location.address}</CardTitle>
                    </div>
                    <Badge className={typeConfig.color} variant="secondary">
                      {typeConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Lat: {location.latitude.toFixed(6)}</p>
                    <p>Lng: {location.longitude.toFixed(6)}</p>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{location._count?.employees || 0} employees</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Route className="h-4 w-4 text-green-500" />
                      <span>{location._count?.routes || 0} routes</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(location)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Location</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{location.address}&quot;? 
                            This action cannot be undone and will fail if there are active employees or routes using this location.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteLocation(location)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the location information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditLocation}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter the full address"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-latitude">Latitude *</Label>
                  <Input
                    id="edit-latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-longitude">Longitude *</Label>
                  <Input
                    id="edit-longitude"
                    type="number" 
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-type">Location Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Location</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}