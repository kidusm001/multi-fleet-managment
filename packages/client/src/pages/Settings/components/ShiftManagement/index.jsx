import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { shiftService } from "../../services/shiftService";
import { Clock, Search, Plus, RefreshCw } from "lucide-react";
import { Input } from "@/components/Common/UI/Input";
import Button from "@/components/Common/UI/Button";
import ShiftsTable from "./ShiftsTable";
import ShiftFormDialog from "./ShiftFormDialog";
import ShiftDetailsDialog from "./ShiftDetailsDialog";
import ShiftDeleteDialog from "./ShiftDeleteDialog";
import { toast } from "sonner";

/**
 * Shift Management Component
 * Main component for managing shifts with time zone support
 */
export default function ShiftManagement() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State management
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form data with time zone support
  const [formData, setFormData] = useState({
    name: "",
    startTime: "09:00",
    endTime: "17:00",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Default to browser's time zone
  });

  // Load shifts when component mounts
  useEffect(() => {
    loadShifts();
  }, []);

  // Load shifts from API
  const loadShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shiftService.listShifts();
      setShifts(data);
    } catch (err) {
      console.error("Failed to load shifts:", err);
      setError(err.message || "Could not load shifts. Please try again.");
      toast.error(err.message || "Could not load shifts");
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the create form dialog
  const handleAdd = () => {
    setFormData({
      name: "",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      timeZone: "Africa/Addis_Ababa" // Always default to Addis Ababa
    });
    setIsEditMode(false);
    setShowAddModal(true);
  };

  // Handle opening the edit form dialog
  const handleEdit = (shift) => {
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      timeZone: "Africa/Addis_Ababa" // Always use Addis Ababa timezone
    });
    setSelectedShift(shift);
    setIsEditMode(true);
    setShowAddModal(true);
  };

  // Handle opening the delete confirmation dialog
  const handleDelete = (shift) => {
    setSelectedShift(shift);
    setShowDeleteDialog(true);
  };

  // Handle opening the details dialog
  const handleViewDetails = (shift) => {
    setSelectedShift(shift);
    setShowDetailsDialog(true);
  };

  // Handle shift form submission (create/edit)
  const handleSubmit = async () => {
    try {
      if (isEditMode && selectedShift) {
        // Update existing shift
        await shiftService.updateShift(selectedShift.id, formData);
        toast.success(`${formData.name} shift has been successfully updated.`);
      } else {
        // Create new shift
        await shiftService.createShift(formData);
        toast.success(`${formData.name} shift has been successfully created.`);
      }
      
      // Close dialog and reload shifts
      setShowAddModal(false);
      await loadShifts();
      return true;
    } catch (err) {
      console.error("Error submitting shift:", err);
      toast.error(err.message || "Failed to save shift");
      return false;
    }
  };

  // Handle shift delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedShift) return false;
    
    try {
      await shiftService.deleteShift(selectedShift.id);
      toast.success(`${selectedShift.name} shift has been successfully removed.`);
      
      // Close dialog and reload shifts
      setShowDeleteDialog(false);
      await loadShifts();
      return true;
    } catch (err) {
      console.error("Error deleting shift:", err);
      toast.error(err.message || "Failed to delete shift");
      return false;
    }
  };

  // Handle actions from the shifts table
  const handleAction = (action, shift) => {
    switch (action) {
      case 'add':
        handleAdd();
        break;
      case 'edit':
        handleEdit(shift);
        break;
      case 'view':
        handleViewDetails(shift);
        break;
      case 'delete':
        handleDelete(shift);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  // Filter shifts based on search query
  const filteredShifts = shifts.filter(shift => {
    if (!searchQuery.trim()) return true;
    return shift.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Clock className={`h-6 w-6 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
          Shift Management
        </h2>
        <Button 
          onClick={handleAdd}
          className={`gap-2 ${isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-500"} text-white`}
        >
          <Plus className="h-4 w-4" />
          Add Shift
        </Button>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className={`relative flex-1 max-w-md ${isDark ? "text-white" : ""}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search shifts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${isDark ? "bg-gray-800 border-gray-700" : ""}`}
          />
        </div>
        <div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadShifts}
            className={`${loading ? "animate-spin" : ""} ${isDark ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700" : ""}`}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Shifts Table */}
      <ShiftsTable 
        shifts={filteredShifts}
        loading={loading}
        error={error}
        isDark={isDark}
        onViewDetails={handleViewDetails}
        onAction={handleAction}
      />

      {/* Shift Form Dialog */}
      <ShiftFormDialog 
        isOpen={showAddModal}
        isDark={isDark}
        editMode={isEditMode}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onCancel={() => setShowAddModal(false)}
      />

      {/* Shift Details Dialog */}
      <ShiftDetailsDialog
        shift={selectedShift}
        isOpen={showDetailsDialog}
        isDark={isDark}
        onClose={() => setShowDetailsDialog(false)}
        onEdit={handleEdit}
      />

      {/* Shift Delete Dialog */}
      <ShiftDeleteDialog
        isOpen={showDeleteDialog}
        isDark={isDark}
        shift={selectedShift}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}