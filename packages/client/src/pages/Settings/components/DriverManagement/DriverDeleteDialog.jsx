import { useState } from "react";
import { AlertCircle } from "lucide-react";
import Button from "@/components/Common/UI/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/Common/UI/alert-dialog";

/**
 * Driver delete confirmation dialog component
 * Confirms permanent deletion of a driver
 */
export default function DriverDeleteDialog({ 
  isOpen, 
  isDark, 
  driver, 
  onConfirm, 
  onCancel 
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!driver) return null;

  // Handles the delete confirmation with loading state
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const success = await onConfirm();
      if (success) {
        setIsDeleting(false);
      }
    } catch (error) {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className={isDark ? "bg-gray-900 border-gray-700 text-gray-100" : ""}>
        <AlertDialogHeader>
          <AlertDialogTitle className={`flex items-center gap-2 ${isDark ? "text-gray-100" : ""}`}>
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span>Delete Driver</span>
          </AlertDialogTitle>
          <AlertDialogDescription className={isDark ? "text-gray-400" : ""}>
            Are you sure you want to delete <span className="font-semibold">{driver.name}</span>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Warning about permanent deletion */}
        <div className={`p-3 mb-4 text-sm rounded-md ${
          isDark 
            ? "bg-red-900/20 text-red-400 border border-red-900/30" 
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          <p className="mb-1 font-medium">Please confirm this permanent action:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>The driver will be completely removed from the system</li>
            <li>Any shuttle assignments will be unlinked</li>
            <li>This action cannot be reversed</li>
          </ul>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel
            className={isDark ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : ""}
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className={`${isDark 
              ? "bg-red-900 text-red-50 hover:bg-red-800 focus:ring-red-900" 
              : "bg-red-600 hover:bg-red-700 focus:ring-red-600"} ${
              isDeleting ? "opacity-70 cursor-progress" : ""
            }`}
          >
            {isDeleting ? "Deleting..." : "Delete Driver"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}