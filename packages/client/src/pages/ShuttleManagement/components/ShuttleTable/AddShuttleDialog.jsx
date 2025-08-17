import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Building2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Card } from "../../components/ui/Card";
import { cn } from "@/lib/utils";
import { calculateNextMaintenanceDate } from "../../utils";
import { useTheme } from "@/contexts/ThemeContext";
import { shuttleCategoryService } from "@/services/shuttleCategoryService";
import { useRole } from "@/contexts/RoleContext";

// Common vehicle models with their capacities
const COMMON_MODELS = [
  { name: "Toyota Hiace", capacity: 14 },
  { name: "Toyota Coaster", capacity: 22 },
  { name: "Toyota Land Cruiser", capacity: 7 },
  { name: "Toyota Probox", capacity: 4 },
  { name: "Hyundai H1", capacity: 8 },
  { name: "Hyundai County", capacity: 25 },
  { name: "Suzuki Dzire", capacity: 4 },
  { name: "Toyota Vitz", capacity: 4 },
];

const initialFormState = {
  name: "",
  type: "in-house",
  model: "",
  customModel: false,
  capacity: 4,
  status: "active",
  vendor: "",
  lastMaintenance: new Date().toISOString().split("T")[0],
  licensePlate: "",
  dailyRate: 0,
};

export default function AddShuttleDialog({ onClose, onAdd }) {
  const { theme } = useTheme();
  const { role } = useRole();
  const isFleetManager = role === "fleetManager";

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await shuttleCategoryService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Professional: Ensure capacity stays in sync with selected model
  useEffect(() => {
    if (!formData.customModel && formData.categoryId) {
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      if (selectedCategory) {
        setFormData(prev => ({
          ...prev,
          capacity: selectedCategory.capacity,
          model: selectedCategory.name // Always keep model in sync
        }));
      }
    }
  }, [formData.categoryId, formData.customModel, categories]);

  const handleModelChange = async (e) => {
    const selectedModel = e.target.value;
    if (selectedModel === "custom") {
      setFormData((prev) => ({
        ...prev,
        model: "",
        customModel: true,
        categoryId: categories[0]?.id, // Always use first category for custom models
        capacity: categories[0]?.capacity || 4 // Use default capacity
      }));
    } else {
      const category = categories.find((cat) => cat.name === selectedModel);
      if (category) {
        setFormData((prev) => ({
          ...prev,
          model: selectedModel,
          customModel: false,
          capacity: category.capacity,
          categoryId: category.id,
        }));
      }
    }
  };

  // Modify capacity change handler to preserve model
  const handleCapacityChange = (newCapacity) => {
    setFormData((prev) => ({
      ...prev,
      capacity: newCapacity,
      // If using a predefined model, don't allow capacity changes
      ...(prev.categoryId && !prev.customModel ? {
        capacity: prev.capacity // Keep original capacity if using predefined model
      } : {})
    }));
  };

  // Modified handleSubmit to handle custom models
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name || !formData.licensePlate) {
      alert("Name and license plate are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        type: formData.type || "in-house",
        model: formData.customModel ? formData.model.trim() : formData.model,
        capacity: formData.capacity,
        status: formData.status,
        vendor: formData.type === "outsourced" ? formData.vendor?.trim() : null,
        categoryId: formData.categoryId,
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        dailyRate: parseFloat(formData.dailyRate) || 0,
      };

      console.log("Sending shuttle data:", submitData);
      // Call the appropriate API method based on the user role:
      if (isFleetManager) {
        // For fleet managers, the dialog will request a shuttle
        await onAdd({ mode: "request", data: submitData });
      } else {
        // For admins, the dialog will add a new shuttle directly
        await onAdd({ mode: "add", data: submitData });
      }
      onClose();
    } catch (error) {
      console.error("Error processing shuttle:", error);
      alert(
        error.response?.data?.error ||
          error.message ||
          "Failed to process shuttle request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm">
        <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto relative animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/5 dark:from-gray-900/10 dark:to-gray-900/5 rounded-xl" />
          <Card className="relative">
            <form
              onSubmit={handleSubmit}
              className="divide-y divide-gray-200 dark:divide-gray-700"
            >
              <div className="flex items-center justify-between p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {isFleetManager ? "Request Shuttle" : "Add New Shuttle"}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-1">
                  <Input
                    label="Shuttle Name"
                    placeholder="e.g., MMCY Express 3"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Shuttle Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, type: "in-house" })
                        }
                        className={cn(
                          "p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors",
                          formData.type === "in-house"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        <Building2
                          className={cn(
                            "w-6 h-6",
                            formData.type === "in-house"
                              ? "text-blue-500 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            formData.type === "in-house"
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          In-House
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, type: "outsourced" })
                        }
                        className={cn(
                          "p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors",
                          formData.type === "outsourced"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        <Building2
                          className={cn(
                            "w-6 h-6",
                            formData.type === "outsourced"
                              ? "text-blue-500 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            formData.type === "outsourced"
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          Outsourced
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Select
                      label="Vehicle Model"
                      value={formData.customModel ? "custom" : formData.model}
                      onChange={handleModelChange}
                      required
                      className="w-full text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select a model</option>
                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.name}
                          className="dark:bg-gray-800 dark:text-gray-100"
                        >
                          {category.name} ({category.capacity} seats)
                        </option>
                      ))}
                      <option value="custom">Custom Model</option>
                    </Select>

                    {formData.customModel && (
                      <div className="mt-4">
                        <Input
                          label="Custom Model Name"
                          placeholder="Enter custom model name"
                          value={formData.model}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              model: e.target.value,
                              // Keep the capacity and categoryId from the default category
                              categoryId: categories[0]?.id
                            }))
                          }
                          required
                        />
                      </div>
                    )}
                  </div>

                  {formData.type === "outsourced" && (
                    <Input
                      label="Vendor Company"
                      placeholder="Enter vendor company name"
                      value={formData.vendor}
                      onChange={(e) =>
                        setFormData({ ...formData, vendor: e.target.value })
                      }
                      required
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Capacity
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCapacityChange(Math.max(1, formData.capacity - 1))}
                          disabled={!formData.customModel}
                          className={cn(
                            "p-2 border rounded-lg transition-colors",
                            "border-gray-300 bg-white text-gray-700",
                            "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200",
                            "hover:bg-gray-100 dark:hover:bg-gray-600",
                            !formData.customModel && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="text-lg font-medium">-</span>
                        </button>
                        <input
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => handleCapacityChange(parseInt(e.target.value) || 4)}
                          disabled={!formData.customModel}
                          className={cn(
                            "block w-full rounded-lg text-center",
                            "border-gray-300 bg-white text-gray-900",
                            "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100",
                            !formData.customModel && "opacity-50 cursor-not-allowed"
                          )}
                          min="1"
                          max="50"
                        />
                        <button
                          type="button"
                          onClick={() => handleCapacityChange(Math.min(50, formData.capacity + 1))}
                          disabled={!formData.customModel}
                          className={cn(
                            "p-2 border rounded-lg transition-colors",
                            "border-gray-300 bg-white text-gray-700",
                            "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200",
                            "hover:bg-gray-100 dark:hover:bg-gray-600",
                            !formData.customModel && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="text-lg font-medium">+</span>
                        </button>
                      </div>
                    </div>

                    <Select
                      label="Initial Status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      required
                      className="w-full"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="License Plate"
                      placeholder="e.g., ABC-123"
                      value={formData.licensePlate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          licensePlate: e.target.value,
                        })
                      }
                      required
                    />
                    <Input
                      label="Daily Rate"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.dailyRate}
                      onChange={(e) =>
                        setFormData({ ...formData, dailyRate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isFleetManager ? "Request Shuttle" : "Add Shuttle"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>,
    document.body
  );
}
