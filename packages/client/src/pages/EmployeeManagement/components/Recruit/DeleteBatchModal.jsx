import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/Common/UI/dialog";
import { Button } from "@components/Common/UI/Button";
import { AlertCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function DeleteBatchModal({ isOpen, onClose, onConfirm, batchName }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getSeverityStyles = () => {
    return isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-100";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`rounded-xl p-6 shadow-lg border ${getSeverityStyles()} animate-in fade-in-0 zoom-in-95`}>
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <DialogTitle className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              Confirm Batch Deletion
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className={`text-sm ${isDark ? "text-white/80" : "text-gray-600"}`}>
            Are you sure you want to delete {batchName || "this batch"}? This action cannot be undone.
          </p>
        </div>
        <DialogFooter className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className={`border ${isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white" : "bg-white hover:bg-gray-100"}`}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg transition-all duration-200 bg-red-500 hover:bg-red-600 text-white"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

DeleteBatchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  batchName: PropTypes.string,
};