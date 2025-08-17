import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { driverService } from "../../services/driverService";
import { shuttleService } from "@/services/shuttleService";
import { UserRound, Search, Plus, RefreshCw } from "lucide-react";
import { Input } from "@/components/Common/UI/Input";
import Button from "@/components/Common/UI/Button";
import DriversTable from "./DriversTable";
import DriverFormDialog from "./DriverFormDialog";
import DriverDetailsDialog from "./DriverDetailsDialog";
import DriverDeleteDialog from "./DriverDeleteDialog";
import { toast } from "sonner";

/**
 * Driver Management Component
 * Main component for managing drivers
 */
export default function DriverManagement() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State management
  const [drivers, setDrivers] = useState([]);
  const [shuttles, setShuttles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    phoneNumber: "",
    experience: 0,
    shuttleId: null
  });

  // Load drivers and shuttles when component mounts
  useEffect(() => {
    loadDrivers();
    loadShuttles();
  }, []);

  // Load drivers from API
  const loadDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await driverService.listDrivers();
      setDrivers(data);
    } catch (err) {
      console.error("Failed to load drivers:", err);
      setError(err.message || "Could not load drivers. Please try again.");
      toast.error(err.message || "Could not load drivers");
    } finally {
      setLoading(false);
    }
  };

  // Load shuttles from API
  const loadShuttles = async () => {
    try {
      const data = await shuttleService.getShuttles();
      setShuttles(data.filter(shuttle => shuttle.status === 'active'));
    } catch (err) {
      console.error("Failed to load shuttles:", err);
      toast.error("Could not load shuttles");
    }
  };

  // Handle opening the create form dialog
  const handleAdd = () => {
    setFormData({
      name: "",
      licenseNumber: "",
      phoneNumber: "",
      experience: 0,
      shuttleId: null
    });
    setIsEditMode(false);
    setShowAddModal(true);
  };

  // Handle opening the edit form dialog
  const handleEdit = (driver) => {
    setFormData({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      phoneNumber: driver.phoneNumber,
      experience: driver.experience,
      shuttleId: driver.shuttleId
    });
    setSelectedDriver(driver);
    setIsEditMode(true);
    setShowAddModal(true);
  };

  // Handle opening the delete confirmation dialog
  const handleDelete = (driver) => {
    setSelectedDriver(driver);
    setShowDeleteDialog(true);
  };

  // Handle opening the details dialog
  const handleViewDetails = (driver) => {
    setSelectedDriver(driver);
    setShowDetailsDialog(true);
  };

  // Handle driver form submission (create/edit)
  const handleSubmit = async (data) => {
    try {
      if (isEditMode && selectedDriver) {
        // Update existing driver
        await driverService.updateDriver(selectedDriver.id, data);
        toast.success(`${data.name} has been successfully updated.`);
      } else {
        // Create new driver
        await driverService.createDriver(data);
        toast.success(`${data.name} has been successfully created.`);
      }
      
      // Close dialog and reload drivers
      setShowAddModal(false);
      await loadDrivers();
      return true;
    } catch (err) {
      console.error("Error submitting driver:", err);
      toast.error(err.message || "Failed to save driver");
      return false;
    }
  };

  // Handle driver delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedDriver) return false;
    
    try {
      await driverService.deleteDriver(selectedDriver.id);
      toast.success(`${selectedDriver.name} has been successfully removed.`);
      
      // Close dialog and reload drivers
      setShowDeleteDialog(false);
      await loadDrivers();
      return true;
    } catch (err) {
      console.error("Error deleting driver:", err);
      toast.error(err.message || "Failed to delete driver");
      return false;
    }
  };

  // Handle actions from the drivers table
  const handleAction = (action, driver) => {
    switch (action) {
      case 'add':
        handleAdd();
        break;
      case 'edit':
        handleEdit(driver);
        break;
      case 'view':
        handleViewDetails(driver);
        break;
      case 'delete':
        handleDelete(driver);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  // Filter drivers based on search query
  const filteredDrivers = drivers.filter(driver => {
    if (!searchQuery.trim()) return true;
    return (
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserRound className={`h-6 w-6 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
          Driver Management
        </h2>
        <Button 
          onClick={handleAdd}
          className={`gap-2 ${isDark ? "bg-amber-700 hover:bg-amber-600" : "bg-amber-600 hover:bg-amber-500"} text-white`}
        >
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className={`relative flex-1 max-w-md ${isDark ? "text-white" : ""}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${isDark ? "bg-gray-800 border-gray-700" : ""}`}
          />
        </div>
        <div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadDrivers}
            className={`${loading ? "animate-spin" : ""} ${isDark ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700" : ""}`}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Drivers Table */}
      <DriversTable 
        drivers={filteredDrivers}
        loading={loading}
        error={error}
        isDark={isDark}
        onViewDetails={handleViewDetails}
        onAction={handleAction}
      />

      {/* Driver Form Dialog */}
      <DriverFormDialog 
        isOpen={showAddModal}
        isDark={isDark}
        editMode={isEditMode}
        formData={formData}
        setFormData={setFormData}
        shuttles={shuttles}
        onSubmit={handleSubmit}
        onCancel={() => setShowAddModal(false)}
      />

      {/* Driver Details Dialog */}
      <DriverDetailsDialog
        driver={selectedDriver}
        isOpen={showDetailsDialog}
        isDark={isDark}
        onClose={() => setShowDetailsDialog(false)}
      />

      {/* Driver Delete Dialog */}
      <DriverDeleteDialog
        isOpen={showDeleteDialog}
        isDark={isDark}
        driver={selectedDriver}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}