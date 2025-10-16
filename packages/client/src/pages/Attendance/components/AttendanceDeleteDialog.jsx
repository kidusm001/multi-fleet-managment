import { AlertTriangle } from "lucide-react";
import Button from "@/components/Common/UI/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/Common/UI/dialog";

/**
 * Delete Confirmation Dialog Component
 * Confirms deletion of an attendance record
 */
export default function AttendanceDeleteDialog({
  isOpen,
  isDark,
  record,
  onConfirm,
  onCancel,
  isDeleting,
}) {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formBgClass = isDark ? "bg-gray-900 text-gray-100" : "bg-white";

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={formBgClass}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Delete Attendance Record
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className={isDark ? "text-gray-300" : "text-gray-700"}>
            Are you sure you want to delete this attendance record?
          </p>

          {record && (
            <div className="p-4 rounded-md bg-gray-100 dark:bg-gray-800 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  {formatDate(record.date)}
                </span>

                <span className="font-medium text-gray-700 dark:text-gray-300">Vehicle:</span>
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  {record.vehicle?.model || 'Unknown'} - {record.vehicle?.plateNumber || record.vehicle?.licensePlate || '-'}
                </span>

                <span className="font-medium text-gray-700 dark:text-gray-300">Driver:</span>
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  {record.driver?.name || 'Outsourced'}
                </span>

                <span className="font-medium text-gray-700 dark:text-gray-300">Hours:</span>
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  {record.hoursWorked ? `${record.hoursWorked}h` : '-'}
                </span>

                <span className="font-medium text-gray-700 dark:text-gray-300">Trips:</span>
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  {record.tripsCompleted || 0}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
