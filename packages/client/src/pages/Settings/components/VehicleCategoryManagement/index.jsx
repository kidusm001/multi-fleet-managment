import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import LoadingAnimation from "@/components/Common/LoadingAnimation";
import CategoriesTable from "./CategoriesTable";
import CategoryFormDialog from "./CategoryFormDialog";
import CategoryDeleteDialog from "./CategoryDeleteDialog";
import { vehicleCategoryService } from "@/services/vehicleCategoryService";

/**
 * Vehicle Category Management Component
 * Manages vehicle categories (types) for the organization
 */
export default function VehicleCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await vehicleCategoryService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to fetch vehicle categories");
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle create category
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  // Handle delete category
  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = async (formData) => {
    try {
      if (editingCategory) {
        await vehicleCategoryService.updateCategory(editingCategory.id, formData);
        toast.success("Vehicle category updated successfully");
      } else {
        await vehicleCategoryService.createCategory(formData);
        toast.success("Vehicle category created successfully");
      }
      setIsFormOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to save vehicle category";
      toast.error(errorMessage);
      throw error;
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    try {
      await vehicleCategoryService.deleteCategory(categoryToDelete.id);
      toast.success("Vehicle category deleted successfully");
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete vehicle category";
      toast.error(errorMessage);
      throw error;
    }
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Vehicle Categories
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage vehicle types and their capacities
          </p>
        </div>
        <Button
          onClick={handleCreateCategory}
          className={cn(
            "flex items-center gap-2",
            "bg-[var(--primary)] hover:bg-[var(--primary-hover)]",
            "text-white"
          )}
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--divider)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Categories</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                {categories.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--divider)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Average Capacity</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                {categories.length > 0
                  ? Math.round(
                      categories.reduce((sum, cat) => sum + cat.capacity, 0) /
                        categories.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card-background)] rounded-lg p-6 border border-[var(--divider)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Capacity</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                {categories.reduce((sum, cat) => sum + cat.capacity, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <Input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Table */}
      <CategoriesTable
        categories={filteredCategories}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />

      {/* Form Dialog */}
      <CategoryFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleFormSubmit}
        editingCategory={editingCategory}
      />

      {/* Delete Dialog */}
      <CategoryDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        category={categoryToDelete}
      />
    </div>
  );
}
