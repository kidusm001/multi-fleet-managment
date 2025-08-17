import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/Common/UI/alert-dialog";

export default function UserDeleteDialog({ isOpen, isDark, user, onConfirm, onCancel }) {
  if (!user) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}>
      <AlertDialogContent className={isDark ? "bg-gray-900 border-gray-700 text-gray-100" : ""}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <AlertCircle className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-500"}`} />
            Confirm User Deletion
          </AlertDialogTitle>
          <AlertDialogDescription className={isDark ? "text-gray-300" : ""}>
            Are you sure you want to delete <span className="font-semibold">{user.name}</span>? This action cannot be undone and will permanently revoke their access to the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-3 mt-6">
          <AlertDialogCancel className={isDark ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700" : ""}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`transition-colors ${
              isDark 
                ? "bg-red-900 hover:bg-red-800 text-red-100" 
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}