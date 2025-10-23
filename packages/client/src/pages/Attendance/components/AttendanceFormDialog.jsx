import { useState, useEffect } from "react";
import { Calendar, Clock, TrendingUp, Banknote } from "lucide-react";
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

  // Reset errors when dialog opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setValidationErrors({});
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
