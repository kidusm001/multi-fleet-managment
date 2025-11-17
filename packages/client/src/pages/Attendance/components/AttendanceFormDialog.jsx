import { useState, useEffect } from "react";
import { Calendar, Clock, TrendingUp, Banknote, Calculator, RefreshCw, Sparkles } from "lucide-react";
import Button from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import { Label } from "@/components/Common/UI/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/Common/UI/dialog";
import { cn } from "@/lib/utils";
import { attendanceService } from "@/services/attendanceService";

/**
 * Attendance Form Dialog Component
 * Form dialog for creating and editing attendance records
 */
export default function AttendanceFormDialog({
  isOpen,
  isDark,
  editMode,
  formData,
  setFormData,
  vehicles,
  drivers,
  onSubmit,
  onCancel,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [calculatedMetrics, setCalculatedMetrics] = useState(null);
  const [autoCalculated, setAutoCalculated] = useState(false);

  // Reset errors when dialog opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setValidationErrors({});
      setCalculatedMetrics(null);
      setAutoCalculated(false);
    }
  }, [isOpen]);

  // Input styles - derived based on theme
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";
  const inputClass = cn(
    isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white",
    "focus:ring-offset-0"
  );
  const formBgClass = isDark ? "bg-gray-900 text-gray-100" : "bg-white";

  // Handle validation
  const validate = () => {
    const errors = {};
    
    if (!formData.vehicleId) {
      errors.vehicleId = "Vehicle is required";
    }
    
    if (!formData.date) {
      errors.date = "Date is required";
    }
    
    if (formData.hoursWorked && (formData.hoursWorked < 0 || formData.hoursWorked > 24)) {
      errors.hoursWorked = "Hours worked must be between 0 and 24";
    }
    
    if (formData.tripsCompleted && formData.tripsCompleted < 0) {
      errors.tripsCompleted = "Trips completed cannot be negative";
    }
    
    if (formData.kmsCovered && formData.kmsCovered < 0) {
      errors.kmsCovered = "Kilometers covered cannot be negative";
    }
    
    if (formData.fuelCost && formData.fuelCost < 0) {
      errors.fuelCost = "Fuel cost cannot be negative";
    }
    
    if (formData.tollCost && formData.tollCost < 0) {
      errors.tollCost = "Toll cost cannot be negative";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!validate()) {
      setError("Please correct the errors in the form");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const success = await onSubmit(formData);
      if (success) {
        onCancel();
      }
    } catch (err) {
      console.error("Error submitting attendance record:", err);
      setError(err?.message || "An error occurred while saving the attendance record");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle preview/calculate from routes
  const handlePreviewMetrics = async () => {
    if (!formData.vehicleId || !formData.date) {
      setError("Please select a vehicle and date first");
      return;
    }

    try {
      setIsLoadingPreview(true);
      setError(null);
      
      const preview = await attendanceService.previewCalculatedMetrics(
        formData.vehicleId,
        formData.date,
        formData.driverId
      );

      setCalculatedMetrics(preview.calculatedMetrics);
      
      // Show success message
      if (preview.routeCompletions.length === 0) {
        setError("No completed routes found for this date. Metrics will be 0.");
      }
    } catch (err) {
      console.error("Error previewing metrics:", err);
      setError("Failed to calculate metrics from routes");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Apply calculated metrics to form
  const handleApplyCalculated = () => {
    if (calculatedMetrics) {
      setFormData({
        ...formData,
        tripsCompleted: calculatedMetrics.tripsCompleted || 0,
        kmsCovered: calculatedMetrics.kmsCovered || 0,
        hoursWorked: calculatedMetrics.hoursWorked || "",
      });
      setAutoCalculated(true);
      setCalculatedMetrics(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={formBgClass}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <Calendar className="h-5 w-5" />
            {editMode ? "Edit Attendance Record" : "Add Attendance Record"}
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
            {editMode 
              ? "Update the attendance record details below." 
              : "Record daily attendance for a vehicle and driver."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label htmlFor="vehicleId" className={labelClass}>
              Vehicle *
            </Label>
            <Select
              value={formData.vehicleId || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, vehicleId: value })
              }
              disabled={editMode}
            >
              <SelectTrigger
                className={cn(inputClass, validationErrors.vehicleId && "border-red-500")}
              >
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.model} - {vehicle.plateNumber || vehicle.licensePlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.vehicleId && (
              <p className="text-sm text-red-500">{validationErrors.vehicleId}</p>
            )}
          </div>

          {/* Driver Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="driverId" className={labelClass}>
              Driver (Optional)
            </Label>
            <Select
              value={formData.driverId || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, driverId: value === "none" ? null : value })
              }
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select a driver (if applicable)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No driver (Outsourced)</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} - {driver.licenseNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leave empty for outsourced vehicles
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className={labelClass}>
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date || ""}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className={cn(inputClass, validationErrors.date && "border-red-500")}
              max={new Date().toISOString().split('T')[0]}
            />
            {validationErrors.date && (
              <p className="text-sm text-red-500">{validationErrors.date}</p>
            )}
          </div>

          {/* Auto-Calculate Section */}
          {!editMode && (
            <div className="p-4 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Auto-Calculate from Routes
                    </h4>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Automatically calculate trips, kilometers, and hours from completed routes for this date.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviewMetrics}
                    disabled={isLoadingPreview || !formData.vehicleId || !formData.date}
                    className="w-full sm:w-auto"
                  >
                    {isLoadingPreview ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate from Routes
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Show calculated metrics */}
              {calculatedMetrics && (
                <div className="mt-4 p-3 rounded-md bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      Calculated Metrics
                    </h5>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyCalculated}
                    >
                      Apply These Values
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Trips</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {calculatedMetrics.tripsCompleted}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Kilometers</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {calculatedMetrics.kmsCovered?.toFixed(1) || 0} km
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Hours</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {calculatedMetrics.hoursWorked?.toFixed(1) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {autoCalculated && (
                <div className="mt-3 p-2 rounded-md bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                  <p className="text-xs text-green-800 dark:text-green-300 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Values were auto-calculated from completed routes
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Work Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hours Worked */}
            <div className="space-y-2">
              <Label htmlFor="hoursWorked" className={cn(labelClass, "flex items-center gap-2")}>
                <Clock className="h-4 w-4" />
                Hours Worked
              </Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.hoursWorked || ""}
                onChange={(e) =>
                  setFormData({ ...formData, hoursWorked: e.target.value })
                }
                className={cn(inputClass, validationErrors.hoursWorked && "border-red-500")}
                placeholder="e.g., 8.5"
              />
              {validationErrors.hoursWorked && (
                <p className="text-sm text-red-500">{validationErrors.hoursWorked}</p>
              )}
            </div>

            {/* Trips Completed */}
            <div className="space-y-2">
              <Label htmlFor="tripsCompleted" className={cn(labelClass, "flex items-center gap-2")}>
                <TrendingUp className="h-4 w-4" />
                Trips Completed
              </Label>
              <Input
                id="tripsCompleted"
                type="number"
                min="0"
                value={formData.tripsCompleted || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tripsCompleted: e.target.value })
                }
                className={cn(inputClass, validationErrors.tripsCompleted && "border-red-500")}
                placeholder="e.g., 12"
              />
              {validationErrors.tripsCompleted && (
                <p className="text-sm text-red-500">{validationErrors.tripsCompleted}</p>
              )}
            </div>
          </div>

          {/* Kilometers Covered */}
          <div className="space-y-2">
            <Label htmlFor="kmsCovered" className={labelClass}>
              Kilometers Covered
            </Label>
            <Input
              id="kmsCovered"
              type="number"
              step="0.1"
              min="0"
              value={formData.kmsCovered || ""}
              onChange={(e) =>
                setFormData({ ...formData, kmsCovered: e.target.value })
              }
              className={cn(inputClass, validationErrors.kmsCovered && "border-red-500")}
              placeholder="e.g., 150.5"
            />
            {validationErrors.kmsCovered && (
              <p className="text-sm text-red-500">{validationErrors.kmsCovered}</p>
            )}
          </div>

          {/* Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fuel Cost */}
            <div className="space-y-2">
              <Label htmlFor="fuelCost" className={cn(labelClass, "flex items-center gap-2")}>
                <Banknote className="h-4 w-4" />
                Fuel Cost (ETB)
              </Label>
              <Input
                id="fuelCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.fuelCost || ""}
                onChange={(e) =>
                  setFormData({ ...formData, fuelCost: e.target.value })
                }
                className={cn(inputClass, validationErrors.fuelCost && "border-red-500")}
                placeholder="e.g., 500.00"
              />
              {validationErrors.fuelCost && (
                <p className="text-sm text-red-500">{validationErrors.fuelCost}</p>
              )}
            </div>

            {/* Toll Cost */}
            <div className="space-y-2">
              <Label htmlFor="tollCost" className={cn(labelClass, "flex items-center gap-2")}>
                <Banknote className="h-4 w-4" />
                Toll Cost (ETB)
              </Label>
              <Input
                id="tollCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.tollCost || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tollCost: e.target.value })
                }
                className={cn(inputClass, validationErrors.tollCost && "border-red-500")}
                placeholder="e.g., 50.00"
              />
              {validationErrors.tollCost && (
                <p className="text-sm text-red-500">{validationErrors.tollCost}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : editMode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
