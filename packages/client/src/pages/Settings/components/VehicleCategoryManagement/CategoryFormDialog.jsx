import { useState, useEffect } from "react";
import { Car, X } from "lucide-react";
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
 * Category Form Dialog Component
 * Form dialog for creating and editing vehicle categories
 */
export default function CategoryFormDialog({
  isOpen,
  onClose,
  onSubmit,
  editingCategory,
}) {
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setFormData({
          name: editingCategory.name,
          capacity: editingCategory.capacity.toString(),
        });
      } else {
        setFormData({
          name: "",
          capacity: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, editingCategory]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Category name must be at least 2 characters";
    }

    const capacity = parseInt(formData.capacity);
    if (!formData.capacity) {
      newErrors.capacity = "Capacity is required";
    } else if (isNaN(capacity) || capacity <= 0) {
      newErrors.capacity = "Capacity must be a positive number";
    } else if (!Number.isInteger(capacity)) {
      newErrors.capacity = "Capacity must be a whole number";
    } else if (capacity > 100) {
      newErrors.capacity = "Capacity cannot exceed 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        capacity: parseInt(formData.capacity),
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              "bg-blue-100 dark:bg-blue-900/20"
            )}>
              <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update vehicle category information"
                  : "Create a new vehicle category for your fleet"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Category Name */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-[var(--text-primary)]"
            >
              Category Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Standard Van, Mini Bus, Large Coach"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <label
              htmlFor="capacity"
              className="text-sm font-medium text-[var(--text-primary)]"
            >
              Capacity (seats) <span className="text-red-500">*</span>
            </label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="100"
              value={formData.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              placeholder="e.g., 14, 22, 45"
              className={errors.capacity ? "border-red-500" : ""}
            />
            {errors.capacity && (
              <p className="text-sm text-red-500">{errors.capacity}</p>
            )}
            <p className="text-sm text-[var(--text-secondary)]">
              Number of passengers this vehicle type can accommodate
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {editingCategory ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{editingCategory ? "Update Category" : "Create Category"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
