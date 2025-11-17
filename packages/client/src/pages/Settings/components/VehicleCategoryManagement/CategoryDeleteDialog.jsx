import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/Common/UI/dialog";

/**
 * Category Delete Dialog Component
 * Confirmation dialog for deleting vehicle categories
 */
export default function CategoryDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  category,
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              "bg-red-100 dark:bg-red-900/20"
            )}>
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete the category{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {category.name}
            </span>
            ?
          </p>

          <div className={cn(
            "p-4 rounded-lg",
            "bg-yellow-50 dark:bg-yellow-900/10",
            "border border-yellow-200 dark:border-yellow-800"
          )}>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> This category can only be deleted if it has no
              associated vehicles or pending vehicle requests.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className={cn(
                "bg-red-600 hover:bg-red-700 text-white",
                "dark:bg-red-600 dark:hover:bg-red-700"
              )}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
