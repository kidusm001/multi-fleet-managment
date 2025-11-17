import { useState } from "react";
import { AlertTriangle, Users, Route } from "lucide-react";
import Button from "@/components/Common/UI/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/Common/UI/dialog";

/**
 * Shift Delete Dialog Component
 * Confirmation dialog for shift deletion with employee and route protection
 */
export default function ShiftDeleteDialog({
  shift,
  isOpen,
  isDark,
  onConfirm,
  onCancel
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm();
    } catch (err) {
      setError(err?.response?.data?.details || err?.message);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Apply theme classes
  const dialogBgClass = isDark ? "bg-gray-900 border-gray-700 text-gray-100" : "";
  const titleClass = isDark ? "text-red-400" : "text-red-600";
  const iconClass = isDark ? "text-red-400" : "text-red-500";
  const cancelBtnClass = isDark 
    ? "bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-gray-200 text-gray-300" 
    : "";
  const deleteBtnClass = isDark
    ? "bg-red-700 hover:bg-red-600"
    : "bg-red-600 hover:bg-red-700";
  
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={dialogBgClass}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${titleClass}`}>
            <AlertTriangle className={iconClass} />
            Delete Shift
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className={`p-4 rounded-lg mb-4 ${
            isDark 
              ? "bg-gray-800/50 border border-gray-700" 
              : "bg-gray-50 border border-gray-200"
          }`}>
            <p>Are you sure you want to delete the following shift?</p>
            {shift && (
              <div className={`mt-3 p-3 rounded ${isDark ? "bg-gray-700/50" : "bg-white"}`}>
                <p className="font-medium">{shift.name}</p>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {new Date(shift.startTime).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute:'2-digit',
                    hour12: true,
                    timeZone: shift.timeZone
                  })} - 
                  {new Date(shift.endTime).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute:'2-digit',
                    hour12: true,
                    timeZone: shift.timeZone
                  })}
                  <span className="ml-2 opacity-75">({shift.timeZone.split('/').pop().replace(/_/g, ' ')})</span>
                </p>
              </div>
            )}
          </div>
          
          {error && (
            <div className={`p-4 rounded-lg border mb-4 ${
              isDark 
                ? "bg-red-900/30 border-red-800/40 text-red-400" 
                : "bg-red-50 border-red-200 text-red-600"
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Unable to Delete Shift</p>
                  {error.hasEmployees && (
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="w-4 h-4" />
                      <p className="text-sm">This shift has assigned employees</p>
                    </div>
                  )}
                  {error.hasRoutes && (
                    <div className="flex items-center gap-2 mt-2">
                      <Route className="w-4 h-4" />
                      <p className="text-sm">This shift has associated routes</p>
                    </div>
                  )}
                  <p className="text-sm mt-2">{error.message}</p>
                  <p className="text-sm mt-2 font-medium">
                    Please remove all assignments before deleting this shift.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!error && (
            <p className={isDark ? "text-gray-400" : "text-gray-500"}>
              This action cannot be undone. Make sure no employees or routes are assigned to this shift.
            </p>
          )}
        </div>
        
        <DialogFooter>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
              className={cancelBtnClass}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className={`${deleteBtnClass} text-white`}
            >
              {isDeleting ? "Deleting..." : "Delete Shift"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}