import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/Common/UI/dialog';
import { Button } from '@/components/Common/UI/Button';
import { Input } from '@/components/Common/UI/Input';
import { Label } from '@/components/Common/UI/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/Common/UI/Select';
import { Calendar, Filter, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { payrollService } from '@/services/payrollService';
import { MultiSelect } from '@/components/Common/UI/MultiSelect';

/**
 * GenerateFilteredPayrollDialog
 * 
 * A dialog component for generating payroll with advanced filters:
 * - Date range (required)
 * - Vehicle type (IN_HOUSE / OUTSOURCED)
 * - Shifts
 * - Departments
 * - Locations (branches)
 * - Specific vehicles
 */
export function GenerateFilteredPayrollDialog({ open, onOpenChange, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    vehicleType: '',
    shiftIds: [],
    departmentIds: [],
    locationIds: [],
    vehicleIds: [],
    name: '',
  });

  // Options for dropdowns
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load filter options when dialog opens
  useEffect(() => {
    if (open) {
      loadFilterOptions();
      // Set default date range (current month)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setFilters(prev => ({
        ...prev,
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
        name: `Payroll ${firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      }));
    }
  }, [open]);

  const loadFilterOptions = async () => {
    setLoadingOptions(true);
    try {
      // Load shifts, departments, locations, and vehicles from API
      // You'll need to implement these endpoints or use existing ones
      const [shiftsRes, deptsRes, locsRes, vehiclesRes] = await Promise.all([
        fetch('/api/shifts').then(r => r.json()).catch(() => ({ shifts: [] })),
        fetch('/api/departments').then(r => r.json()).catch(() => ({ departments: [] })),
        fetch('/api/locations').then(r => r.json()).catch(() => ({ locations: [] })),
        fetch('/api/vehicles').then(r => r.json()).catch(() => ({ vehicles: [] })),
      ]);

      setShifts(shiftsRes.shifts || shiftsRes || []);
      setDepartments(deptsRes.departments || deptsRes || []);
      setLocations(locsRes.locations || locsRes || []);
      setVehicles(vehiclesRes.vehicles || vehiclesRes || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
      toast.error('Failed to load filter options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!filters.startDate || !filters.endDate) {
      toast.error('Start date and end date are required');
      return;
    }

    setLoading(true);

    try {
      // Build request payload (only include non-empty filters)
      const payload = {
        startDate: filters.startDate,
        endDate: filters.endDate,
      };

      if (filters.vehicleType) payload.vehicleType = filters.vehicleType;
      if (filters.shiftIds.length > 0) payload.shiftIds = filters.shiftIds;
      if (filters.departmentIds.length > 0) payload.departmentIds = filters.departmentIds;
      if (filters.locationIds.length > 0) payload.locationIds = filters.locationIds;
      if (filters.vehicleIds.length > 0) payload.vehicleIds = filters.vehicleIds;
      if (filters.name) payload.name = filters.name;

      const result = await payrollService.generateFilteredPayroll(payload);

      toast.success(
        `Successfully generated payroll with ${result.entriesCount} entries`,
        {
          description: `Total amount: ${result.totalAmount} ETB`,
          duration: 5000,
        }
      );

      // Reset form
      setFilters({
        startDate: '',
        endDate: '',
        vehicleType: '',
        shiftIds: [],
        departmentIds: [],
        locationIds: [],
        vehicleIds: [],
        name: '',
      });

      onOpenChange(false);
      if (onSuccess) onSuccess(result);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate payroll';
      toast.error('Payroll Generation Failed', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Generate Filtered Payroll
          </DialogTitle>
          <DialogDescription>
            Generate payroll with advanced filters. Select date range and optional filters to narrow down the scope.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Range - Required */}
          <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Date Range (Required)
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payroll Name - Optional */}
          <div className="space-y-2">
            <Label htmlFor="name">Payroll Period Name (Optional)</Label>
            <Input
              id="name"
              placeholder="e.g., November 2025 Payroll"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              If not provided, will be auto-generated based on date range
            </p>
          </div>

          {/* Optional Filters */}
          <div className="space-y-4 border p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Optional Filters
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select
                value={filters.vehicleType}
                onValueChange={(value) => setFilters({ ...filters, vehicleType: value === 'all' ? '' : value })}
              >
                <SelectTrigger id="vehicleType">
                  <SelectValue placeholder="All vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="IN_HOUSE">In-House Only</SelectItem>
                  <SelectItem value="OUTSOURCED">Outsourced Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shifts Multi-Select */}
            <div className="space-y-2">
              <Label>Shifts</Label>
              {loadingOptions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading shifts...
                </div>
              ) : (
                <MultiSelect
                  options={shifts.map(s => ({ value: s.id, label: s.name }))}
                  selected={filters.shiftIds}
                  onChange={(values) => setFilters({ ...filters, shiftIds: values })}
                  placeholder="Select shifts..."
                />
              )}
            </div>

            {/* Departments Multi-Select */}
            <div className="space-y-2">
              <Label>Departments</Label>
              {loadingOptions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading departments...
                </div>
              ) : (
                <MultiSelect
                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                  selected={filters.departmentIds}
                  onChange={(values) => setFilters({ ...filters, departmentIds: values })}
                  placeholder="Select departments..."
                />
              )}
            </div>

            {/* Locations/Branches Multi-Select */}
            <div className="space-y-2">
              <Label>Locations / Branches</Label>
              {loadingOptions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading locations...
                </div>
              ) : (
                <MultiSelect
                  options={locations.map(l => ({ value: l.id, label: l.address || l.type }))}
                  selected={filters.locationIds}
                  onChange={(values) => setFilters({ ...filters, locationIds: values })}
                  placeholder="Select locations..."
                />
              )}
            </div>

            {/* Specific Vehicles Multi-Select */}
            <div className="space-y-2">
              <Label>Specific Vehicles</Label>
              {loadingOptions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading vehicles...
                </div>
              ) : (
                <MultiSelect
                  options={vehicles.map(v => ({ value: v.id, label: `${v.plateNumber} (${v.model})` }))}
                  selected={filters.vehicleIds}
                  onChange={(values) => setFilters({ ...filters, vehicleIds: values })}
                  placeholder="Select vehicles..."
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Generating...' : 'Generate Payroll'}
              {!loading && <DollarSign className="ml-2 h-4 w-4" />}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
