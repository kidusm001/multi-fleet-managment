import { useState, useEffect } from "react";
import { Truck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
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

// Phone number validation for Ethiopian phone numbers
export const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\s+/g, '');
  return Boolean(cleanPhone.match(/^(?:\+251|251|0)?9\d{8}$/));
};

/**
 * Driver Form Dialog Component
 * Form dialog for creating and editing drivers
 */
export default function DriverFormDialog({
  isOpen,
  isDark,
  editMode,
  formData,
  setFormData,
  shuttles,
  onSubmit,
  onCancel,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [phoneError, setPhoneError] = useState(false);

  // Input styles - derived based on theme
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";
  const inputClass = cn(
    isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white",
    "focus:ring-offset-0",
    isDark && "focus:border-amber-500/50 focus:ring-amber-500/20"
  );
  const formBgClass = isDark ? "bg-gray-900 border-gray-700 text-gray-100" : "";

  // Handle submission with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPhoneError(false);
    
    // Basic validation
    if (!formData.name.trim()) {
      setError("Driver name is required");
      return;
    }
    
    // Phone number validation
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setPhoneError(true);
      setError("Please enter a valid Ethiopian phone number (e.g., 0911234567 or +251911234567)");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const success = await onSubmit(formData, editMode);
      if (success) {
        onCancel();
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={formBgClass}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <Truck className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
            {editMode ? "Edit Driver" : "Add New Driver"}
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : ""}>
            {editMode 
              ? "Update driver information" 
              : "Add a new driver to the system"}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
            isDark 
              ? "bg-red-900/30 text-red-400 border border-red-800/40" 
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Driver Name*
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={inputClass}
              placeholder="Enter driver name"
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              License Number
            </label>
            <Input
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              className={inputClass}
              placeholder="Enter license number (optional)"
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Phone Number*
            </label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) => {
                setFormData({ ...formData, phoneNumber: e.target.value });
                if (phoneError) setPhoneError(false);
              }}
              required
              className={cn(
                inputClass,
                phoneError && "border-red-500 focus:border-red-500"
              )}
              placeholder="Enter phone number (e.g., 0911234567)"
            />
            {phoneError && (
              <p className={`text-xs ${isDark ? "text-red-400" : "text-red-500"}`}>
                Please enter a valid Ethiopian phone number
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Experience (Years)
            </label>
            <Input
              type="number"
              min="0"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
              className={inputClass}
              placeholder="Enter years of experience"
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Assigned Shuttle
            </label>
            <Select
              value={formData.shuttleId?.toString() || "null"}
              onValueChange={(value) => setFormData({ ...formData, shuttleId: value === "null" ? null : parseInt(value) })}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select a shuttle" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-gray-800 border-gray-700 text-gray-200" : ""}>
                <SelectItem value="null" className={isDark ? "focus:bg-gray-700 focus:text-gray-200" : ""}>
                  No Shuttle Assigned
                </SelectItem>
                {shuttles.map((shuttle) => (
                  <SelectItem 
                    key={shuttle.id} 
                    value={shuttle.id.toString()}
                    className={isDark ? "focus:bg-gray-700 focus:text-gray-200" : ""}
                  >
                    {shuttle.name} ({shuttle.licensePlate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className={isDark ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : ""}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className={`${isDark 
                ? "bg-amber-700 hover:bg-amber-600 text-white" 
                : "bg-amber-600 hover:bg-amber-500 text-white"} 
                transition-colors ${isSubmitting ? "opacity-70" : ""}`}
            >
              {isSubmitting 
                ? "Processing..." 
                : editMode ? "Save Changes" : "Add Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}