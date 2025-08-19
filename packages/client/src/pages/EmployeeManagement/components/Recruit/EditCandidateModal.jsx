import PropTypes from "prop-types";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@components/Common/UI/dialog";
import { useToast } from "@components/Common/UI/use-toast";
import { useTheme } from "@contexts/ThemeContext";

import {
  validatePhoneNumber,
  validateEmail,
} from "@/utils/validators";

export function EditCandidateModal({ candidate, onSave, onClose }) {
  const [editedCandidate, setEditedCandidate] = useState(candidate);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [originalCandidate] = useState(candidate); // Store original for comparison
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Check if form has been modified
  const hasChanges = useMemo(() => {
    return Object.keys(editedCandidate).some(key => 
      editedCandidate[key] !== originalCandidate[key]
    );
  }, [editedCandidate, originalCandidate]);

  // Reset API error when user makes changes
  useEffect(() => {
    if (apiError) {
      setApiError(null);
    }
  }, [editedCandidate, apiError]);

  const validateField = useCallback((name, value) => {
    switch (name) {
      case "contact":
        return validatePhoneNumber(value)
          ? null
          : "Invalid Ethiopian phone number (+251, 251, 0, or 9 followed by 8 digits)";
      case "email":
        return value ? (validateEmail(value) ? null : "Invalid email format") : null;
      case "name":
        return value.trim() ? null : "Name is required";
      case "location":
        return value.trim() ? null : "Location is required";
      case "department":
        return null; // Department is optional
      default:
        return null;
    }
  }, []);

  const validateAllFields = useCallback(() => {
    const newErrors = {};
    Object.entries(editedCandidate).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [editedCandidate, validateField]);

  const handleChange = useCallback((field, value) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));

    setEditedCandidate(prev => ({
      ...prev,
      [field]: value,
    }));
  }, [validateField]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Validate all fields
    if (!validateAllFields()) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields",
        variant: "destructive",
      });
      return;
    }

    // Don't submit if no changes were made
    if (!hasChanges) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      
      // Just pass the edited data back to parent
      onSave(editedCandidate);
      onClose();
      
      toast({
        title: "Success",
        description: "Candidate updated successfully"
      });
    } catch (error) {
      console.error("Error updating candidate:", error);
      setApiError(error.message || "Failed to update candidate");
      toast({
        title: "Error",
        description: error.message || "Failed to update candidate",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [editedCandidate, validateAllFields, hasChanges, toast, onSave, onClose]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className={`rounded-3xl p-8 ${
          isDark ? "bg-[#324048]" : "bg-white"
        } shadow-2xl border ${isDark ? "border-white/10" : "border-black/10"}`}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            } mb-6`}
          >
            Edit Candidate
          </DialogTitle>
          <DialogDescription
            className={`${isDark ? "text-white/80" : "text-gray-600"}`}
          >
            Update the candidate&apos;s information below.
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className={`block text-sm font-medium ${
                isDark ? "text-white/90" : "text-gray-700"
              }`}
            >
              Name
            </label>
            <Input
              id="name"
              value={editedCandidate.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter name"
              required
              className={`h-11 text-sm ${
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
              } rounded-xl focus:ring-2 focus:ring-[#f3684e] focus:border-transparent ${
                errors.name && "border-red-500 focus:ring-red-500"
              }`}
              error={errors.name}
            />
            {errors.name && (
              <span className="text-xs text-red-500">{errors.name}</span>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="contact"
              className={`block text-sm font-medium ${
                isDark ? "text-white/90" : "text-gray-700"
              }`}
            >
              Contact
            </label>
            <Input
              id="contact"
              value={editedCandidate.contact}
              onChange={(e) => handleChange("contact", e.target.value)}
              placeholder="Enter contact"
              required
              error={errors.contact}
              className={`h-11 text-sm ${
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
              } rounded-xl focus:ring-2 focus:ring-[#f3684e] focus:border-transparent ${
                errors.contact && "border-red-500 focus:ring-red-500"
              }`}
            />
            {errors.contact && (
              <span className="text-xs text-red-500">Invalid phone format</span>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className={`block text-sm font-medium ${
                isDark ? "text-white/90" : "text-gray-700"
              }`}
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={editedCandidate.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Enter email"
              error={errors.email}
              className={`h-11 text-sm ${
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
              } rounded-xl focus:ring-2 focus:ring-[#f3684e] focus:border-transparent ${
                errors.email && "border-red-500 focus:ring-red-500"
              }`}
            />
            {errors.email && (
              <span className="text-xs text-red-500">Invalid email format</span>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="department"
              className={`block text-sm font-medium ${
                isDark ? "text-white/90" : "text-gray-700"
              }`}
            >
              Department
            </label>
            <Input
              id="department"
              value={editedCandidate.department}
              onChange={(e) => handleChange("department", e.target.value)}
              placeholder="Enter department"
              className={`h-11 text-sm ${
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
              } rounded-xl focus:ring-2 focus:ring-[#f3684e] focus:border-transparent`}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="location"
              className={`block text-sm font-medium ${
                isDark ? "text-white/90" : "text-gray-700"
              }`}
            >
              Location
            </label>
            <Input
              id="location"
              value={editedCandidate.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Enter location"
              required
              className={`h-11 text-sm ${
                isDark
                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
              } rounded-xl focus:ring-2 focus:ring-[#f3684e] focus:border-transparent ${
                errors.location && "border-red-500 focus:ring-red-500"
              }`}
              error={errors.location}
            />
            {errors.location && (
              <span className="text-xs text-red-500">{errors.location}</span>
            )}
          </div>

          <DialogFooter className="mt-8 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className={`${
                isDark
                  ? "border-white/10 hover:bg-white/10 text-white"
                  : "border-black/10 hover:bg-black/10 text-black"
              }`}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="relative overflow-hidden group bg-gradient-to-r from-[#f3684e] to-[#f3684e]/80 hover:from-[#f3684e]/90 hover:to-[#f3684e]/70 text-white py-3.5 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98]"
              disabled={loading || (!hasChanges && !loading)}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
                  Saving...
                </span>
              ) : !hasChanges ? "No Changes" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

EditCandidateModal.propTypes = {
  candidate: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    contact: PropTypes.string.isRequired,
    email: PropTypes.string,
    department: PropTypes.string,
    location: PropTypes.string.isRequired,
    batchId: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
