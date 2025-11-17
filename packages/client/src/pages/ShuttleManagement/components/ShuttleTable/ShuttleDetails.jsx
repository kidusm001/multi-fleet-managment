import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Bus, Wrench, Calendar, Edit2 } from "lucide-react";
import PropTypes from "prop-types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { cn } from "@/lib/utils";
import { formatDate, getStatusColor, formatDriverStatus } from "../../utils";
import { useTheme } from "@/contexts/ThemeContext";
import { driverService } from "@/services/driverService";
import { shuttleCategoryService } from "@/services/shuttleCategoryService";
import { shuttleService } from "@/services/shuttleService";
import styles from "../../styles/ShuttleDetails.module.css";
import { useRole } from "@/contexts/RoleContext";

const formatValidationError = (error) => {
  if (typeof error === 'string') return error;
  if (error.response?.data?.details) {
    return Object.entries(error.response.data.details)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('\n');
  }
  return error.message || 'An error occurred';
};

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, shuttleName }) => {
  const { theme } = useTheme();
  
  if (!isOpen) return null;

  return createPortal(
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/5 dark:from-gray-900/10 dark:to-gray-900/5 rounded-xl" />
          <Card className="relative">
            <div className="p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Delete Shuttle
                </h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {shuttleName}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={onConfirm}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>,
    document.body
  );
};

DeleteConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  shuttleName: PropTypes.string.isRequired,
};

export default function ShuttleDetails({
  shuttle,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [driver, setDriver] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editedData, setEditedData] = useState({ ...shuttle });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { theme } = useTheme();
  const [error, setError] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { role } = useRole(); // Get user role to determine permissions

  const primaryDriverRef = React.useMemo(() => {
    if (!shuttle?.driver) {
      return null;
    }
    if (Array.isArray(shuttle.driver)) {
      return shuttle.driver[0] ?? null;
    }
    return shuttle.driver;
  }, [shuttle?.driver]);
  
  // Check if user is a manager (or similar role with limited permissions)
  const isManager = role === "fleetManager" || role === "manager";
  
  // Normalize status for consistent comparison (handle both UPPERCASE and lowercase)
  const normalizedStatus = shuttle?.status?.toLowerCase() || 'inactive';

  const fetchData = useCallback(async () => {
    try {
      // Fetch categories only if not already loaded
      if (categories.length === 0) {
        const fetchedCategories = await shuttleCategoryService.getCategories();
        setCategories(fetchedCategories);
      }

      // Fetch driver only if assigned and changed
      if (primaryDriverRef?.id && (!driver || driver.id !== primaryDriverRef.id)) {
        const driverData = await driverService.getDriver(primaryDriverRef.id);
        // Normalize status to lowercase
        const normalizedDriver = {
          ...driverData,
          status: driverData.status?.toLowerCase()
        };
        setDriver(normalizedDriver);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [primaryDriverRef, driver, categories.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update edited data when shuttle changes or when entering edit mode
  useEffect(() => {
    if (shuttle) {
      const shuttleData = {
        ...shuttle,
        categoryId: shuttle.category?.id || '',  // Use empty string instead of null
        model: shuttle.model || '',  // Ensure model is never null
        // Normalize backend type enums (IN_HOUSE / OUTSOURCED) to UI values ('in-house' / 'outsourced')
        type: (function normalizeType(t) {
          if (!t) return t;
          const lowered = String(t).toLowerCase();
          if (lowered === 'in_house' || lowered === 'in-house' || lowered === 'in_house' || lowered === 'inhouse' || lowered === 'in house' || lowered === 'in_house') return 'in-house';
          if (lowered === 'outsourced' || lowered === 'out_sourced' || lowered === 'out-sourced' || lowered === 'outsourced') return 'outsourced';
          return t;
        })(shuttle.type)
      };
      setEditedData(shuttleData);
      // Clear any previous errors when shuttle data changes
      setError(null);
    }
  }, [shuttle]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleStatusUpdate = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const currentStatus = shuttle?.status?.toLowerCase();
      const status = currentStatus === "maintenance" ? "active" : "maintenance";
      await shuttleService.updateShuttle(shuttle.id, { status });
      await onUpdate();
    } catch (error) {
      console.error("Error updating status:", error);
      setError(formatValidationError(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const updateData = {
        name: editedData.name?.trim(),
        licensePlate: editedData.licensePlate?.trim().toUpperCase(),
        dailyRate: parseFloat(editedData.dailyRate || 0),
        categoryId: editedData.categoryId
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );

      console.log('Submitting update:', updateData);
      await shuttleService.updateShuttle(shuttle.id, updateData);
      await onUpdate();
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating shuttle:", error);
      setError(formatValidationError(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete(shuttle?.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting shuttle:", error);
      setError(formatValidationError(error));
    }
  };

  // Dedicated handler for deactivation using status endpoint
  const handleDeactivate = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      await shuttleService.updateShuttle(shuttle.id, { status: 'inactive' });
      await onUpdate();
    } catch (error) {
      console.error("Error deactivating shuttle:", error);
      setError(formatValidationError(error));
    } finally {
      setIsUpdating(false);
    }
  };

  // Add handler for activating shuttle
  const handleActivate = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      await shuttleService.updateShuttle(shuttle.id, { status: 'active' });
      await onUpdate();
    } catch (error) {
      console.error("Error activating shuttle:", error);
      setError(formatValidationError(error));
    } finally {
      setIsUpdating(false);
    }
  };

  // Model change handler for edit mode
  const _handleModelChange = (selectedModel) => {
    const category = categories.find((cat) => cat.name === selectedModel);
    if (category) {
      setEditedData((prev) => ({
        ...prev,
        model: selectedModel,
        capacity: category.capacity,
        categoryId: category.id
      }));
    }
  };

  // Update the capacity change handler
  const _handleCapacityChange = (value) => {
    const newCapacity = parseInt(value) || 0;
    if (newCapacity > 0) {
      setEditedData(prev => ({
        ...prev,
        capacity: newCapacity
      }));
    }
  };

  const content = (
    <div className={cn(
      styles.detailsPanel,
      isEditMode ? styles.editModePanel : styles.viewModePanel,
      "max-h-[90vh]" // Add maximum height constraint for large screens
    )}>
      <Card className="h-full animate-fadeIn relative flex flex-col">
        <div className={styles.stickyHeader}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isEditMode ? "Edit Shuttle" : "Shuttle Details"}
            </h3>
            <div className="flex items-center gap-2">
              {!isEditMode && !isManager && ( // Only show edit button if user is not a manager
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}
          {isEditMode ? (
            <div className={styles.formGrid}>
              <Input
                label="Shuttle Name"
                value={editedData.name}
                onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
              />
              <Input
                label="Model"
                value={editedData.model || ''}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
              <Input
                label="License Plate"
                value={editedData.licensePlate}
                onChange={(e) => setEditedData({ ...editedData, licensePlate: e.target.value })}
              />
              {editedData.type === "outsourced" && (
                <Input
                  label="Vendor"
                  value={editedData.vendor || ""}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              )}
              <Input
                label="Daily Rate (ETB)"
                type="number"
                min="0"
                step="0.01"
                value={editedData.dailyRate || ""}
                onChange={(e) => setEditedData({ ...editedData, dailyRate: e.target.value })}
                placeholder="Enter daily rate in ETB"
              />
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg transition-all duration-300",
                  "bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50/70 dark:hover:bg-blue-900/30"
                )}
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Bus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {shuttle.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {shuttle.model}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium inline-flex",
                      getStatusColor(shuttle?.status || 'inactive').bg,
                      getStatusColor(shuttle?.status || 'inactive').text
                    )}
                  >
                    {(shuttle?.status || 'Inactive').charAt(0).toUpperCase() +
                      (shuttle?.status || 'inactive').slice(1)}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Capacity
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {shuttle.capacity} seats
                  </p>
                </div>
              </div>

              {/* Added Daily Rate Information */}
              <div className="mt-4 p-4 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="mr-2">💰</span> Financial Information
                </h4>
                <div className="mt-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Daily Rate:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {shuttle.dailyRate ? `ETB ${Number(shuttle.dailyRate).toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Estimate:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {shuttle.dailyRate ? `ETB ${(Number(shuttle.dailyRate) * 22).toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                  Maintenance Info
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last Service
                      </p>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {formatDate(shuttle.lastMaintenance)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Next Service
                      </p>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {formatDate(shuttle.nextMaintenance)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {shuttle.mileage && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mileage
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {shuttle.mileage.toLocaleString()} km
                  </p>
                </div>
              )}

              {driver && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">
                    Assigned Driver
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {driver.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          License: {driver.licenseNumber}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "px-2 py-1 rounded-full text-sm",
                          driver.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : driver.status === "off-duty"
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        )}
                      >
                        {formatDriverStatus(driver.status)}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Experience
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {driver.experience} years
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Rating
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {driver.rating}/5.0
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-3 px-6 pb-6 pt-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {isEditMode ? (
              <>
                <Button
                  variant="primary"
                  onClick={handleSaveEdit}
                  loading={isUpdating}
                  className="w-full"
                >
                  Save Changes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedData({ ...shuttle });
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={normalizedStatus === "maintenance" ? "primary" : "secondary"}
                  onClick={handleStatusUpdate}
                  loading={isUpdating}
                  className={cn(
                    "w-full", 
                    isManager && "opacity-60 cursor-not-allowed" // Gray out for managers
                  )}
                  disabled={isManager} // Disable for managers
                >
                  {normalizedStatus === "maintenance" ? "End Maintenance" : "Start Maintenance"}
                </Button>
                <Button
                  variant={normalizedStatus === 'inactive' ? "primary" : "secondary"}
                  onClick={normalizedStatus === 'inactive' ? handleActivate : handleDeactivate}
                  loading={isUpdating}
                  className={cn(
                    "w-full",
                    isManager && "opacity-60 cursor-not-allowed" // Gray out for managers
                  )}
                  disabled={isManager} // Disable for managers
                >
                  {normalizedStatus === 'inactive' ? "Activate Shuttle" : "Deactivate Shuttle"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={isManager} // Disable for managers
                  className={cn(
                    "w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
                    isManager && "opacity-60 cursor-not-allowed" // Gray out for managers
                  )}
                >
                  Delete Shuttle
                </Button>
                {isManager && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 italic mt-1">
                    Contact an administrator to modify shuttle details
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      {isMobile ? createPortal(
        <div className={theme === "dark" ? "dark" : ""}>{content}</div>,
        document.body
      ) : content}
      
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        shuttleName={shuttle.name}
      />
    </>
  );
}

ShuttleDetails.propTypes = {
  shuttle: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    model: PropTypes.string,
    // Accept both UI values and backend enum values to avoid warnings
    type: PropTypes.oneOf(["in-house", "outsourced", "IN_HOUSE", "OUTSOURCED"]),
    status: PropTypes.string,
    capacity: PropTypes.number,
    lastMaintenance: PropTypes.string,
    nextMaintenance: PropTypes.string,
    vendor: PropTypes.string,
    mileage: PropTypes.number,
    driver: PropTypes.oneOfType([
      PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          name: PropTypes.string,
          status: PropTypes.string,
        })
      ),
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        status: PropTypes.string,
      }),
      PropTypes.oneOf([null])
    ]),
    category: PropTypes.shape({
      name: PropTypes.string,
      capacity: PropTypes.number,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
