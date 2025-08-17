import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { departmentService } from "../../services/departmentService";
import { Building2, Search, Plus, RefreshCw } from "lucide-react";
import { Input } from "@/components/Common/UI/Input";
import Button from "@/components/Common/UI/Button";
import DepartmentsTable from "./DepartmentsTable";
import DepartmentFormDialog from "./DepartmentFormDialog";
import DepartmentDetailsDialog from "./DepartmentDetailsDialog";
import DepartmentDeleteDialog from "./DepartmentDeleteDialog";
import { toast } from "sonner";

/**
 * Department Management Component
 * Main component for managing departments with proper authentication handling
 */
export default function DepartmentManagement() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // State variables
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "" });

  // Load departments when component mounts
  useEffect(() => {
    loadDepartments();
  }, []);

  // Load departments from API
  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await departmentService.listDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setError(err.message || "Could not load departments. Please try again.");
      toast.error(err.message || "Could not load departments");
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the create form dialog
  const handleAdd = () => {
    setFormData({ name: "" });
    setIsEditMode(false);
    setShowAddModal(true);
  };

  // Handle opening the edit form dialog
  const handleEdit = (department) => {
    setFormData({ name: department.name });
    setSelectedDepartment(department);
    setIsEditMode(true);
    setShowAddModal(true);
  };

  // Handle opening the delete confirmation dialog
  const handleDelete = (department) => {
    setSelectedDepartment(department);
    setShowDeleteDialog(true);
  };

  // Handle opening the details dialog
  const handleViewDetails = (department) => {
    setSelectedDepartment(department);
    setShowDetailsDialog(true);
  };

  // Handle department form submission (create/edit)
  const handleSubmit = async () => {
    try {
      if (isEditMode && selectedDepartment) {
        // Update existing department
        await departmentService.updateDepartment(selectedDepartment.id, formData);
        toast.success(`${formData.name} has been successfully updated.`);
      } else {
        // Create new department
        await departmentService.createDepartment(formData);
        toast.success(`${formData.name} has been successfully created.`);
      }
      
      // Close dialog and reload departments
      setShowAddModal(false);
      await loadDepartments();
      return true;
    } catch (err) {
      console.error("Error submitting department:", err);
      toast.error(err.message || "Failed to save department");
      return false;
    }
  };

  // Handle department delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedDepartment) return false;
    
    try {
      await departmentService.deleteDepartment(selectedDepartment.id);
      toast.success(`${selectedDepartment.name} has been successfully removed.`);
      
      // Close dialog and reload departments
      setShowDeleteDialog(false);
      await loadDepartments();
      return true;
    } catch (err) {
      console.error("Error deleting department:", err);
      toast.error(err.message || "Failed to delete department");
      return false;
    }
  };

  // Handle actions from the departments table
  const handleAction = (action, department) => {
    switch (action) {
      case 'add':
        handleAdd();
        break;
      case 'edit':
        handleEdit(department);
        break;
      case 'view':
        handleViewDetails(department);
        break;
      case 'delete':
        handleDelete(department);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  // Filter departments based on search query
  const filteredDepartments = departments.filter(dept => {
    if (!searchQuery.trim()) return true;
    return dept.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className={`h-6 w-6 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
          Department Management
        </h2>
        <Button 
          onClick={handleAdd}
          className={`gap-2 ${isDark ? "bg-amber-700 hover:bg-amber-600" : "bg-amber-600 hover:bg-amber-500"} text-white`}
        >
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className={`relative flex-1 max-w-md ${isDark ? "text-white" : ""}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 ${isDark ? "bg-gray-800 border-gray-700" : ""}`}
          />
        </div>
        <div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadDepartments}
            className={`${loading ? "animate-spin" : ""} ${isDark ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700" : ""}`}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Department Table */}
      <DepartmentsTable 
        departments={filteredDepartments}
        loading={loading}
        error={error}
        isDark={isDark}
        onViewDetails={handleViewDetails}
        onAction={handleAction}
      />

      {/* Department Form Dialog */}
      <DepartmentFormDialog 
        isOpen={showAddModal}
        isDark={isDark}
        editMode={isEditMode}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onCancel={() => setShowAddModal(false)}
      />

      {/* Department Details Dialog */}
      <DepartmentDetailsDialog
        department={selectedDepartment}
        isOpen={showDetailsDialog}
        isDark={isDark}
        onClose={() => setShowDetailsDialog(false)}
      />

      {/* Department Delete Dialog */}
      <DepartmentDeleteDialog
        isOpen={showDeleteDialog}
        isDark={isDark}
        department={selectedDepartment}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}