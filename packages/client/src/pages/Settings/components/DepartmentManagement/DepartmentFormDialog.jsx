import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/Common/UI/dialog";

/**
 * Department Form Dialog Component
 * Form dialog for creating and editing departments
 */
export default function DepartmentFormDialog({
  isOpen,
  isDark,
  editMode,
  formData,
  setFormData,
  onSubmit,
  onCancel,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Input styles - derived based on theme
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";
  const inputClass = cn(
    "bg-[var(--input-background)] border-[var(--input-border)]",
    isDark && "focus:border-amber-500/50 focus:ring-amber-500/20"
  );
  const formBgClass = isDark ? "bg-gray-900 border-gray-700 text-gray-100" : "";

  // Handle submission with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!formData.name.trim()) {
      setError("Department name is required");
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
            <Building2 className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
            {editMode ? "Edit Department" : "Add New Department"}
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : ""}>
            {editMode 
              ? "Update department information" 
              : "Create a new department to organize employees"}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className={`p-3 rounded-lg text-sm ${
            isDark 
              ? "bg-red-900/30 text-red-400 border border-red-800/40" 
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Department Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={inputClass}
              placeholder="Enter department name"
            />
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Department name must be unique
            </p>
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
                : editMode ? "Save Changes" : "Add Department"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}