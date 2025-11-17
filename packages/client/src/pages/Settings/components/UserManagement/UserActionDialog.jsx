import { 
  Ban, CheckCircle, Key, RefreshCcw, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/Common/UI/alert-dialog";

export default function UserActionDialog({ isOpen, isDark, user, action, onConfirm, onCancel }) {
  if (!user) return null;
  
  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      // Ensure we clean up properly
      onCancel();
    }
  };

  // Handle close with cleanup
  const handleClose = () => {
    onCancel();
  };

  const getActionTitle = () => {
    switch (action) {
      case "ban":
        return "Ban User";
      case "unban":
        return "Unban User";
      case "reset2fa":
        return "Reset 2FA";
      case "resetPassword":
        return "Reset Password";
      case "revoke-sessions":
        return "Revoke Sessions";
      default:
        return "Confirm Action";
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case "ban":
        return <Ban className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-500"}`} />;
      case "unban":
        return <CheckCircle className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-500"}`} />;
      case "reset2fa":
        return <Key className={`w-5 h-5 ${isDark ? "text-yellow-400" : "text-yellow-500"}`} />;
      case "resetPassword":
        return <RefreshCcw className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-500"}`} />;
      default:
        return <AlertCircle className={`w-5 h-5 ${isDark ? "text-orange-400" : "text-orange-500"}`} />;
    }
  };

  const getActionDescription = () => {
    switch (action) {
      case "ban":
        return `Are you sure you want to ban ${user.name}? They will lose all access to the system.`;
      case "unban":
        return `Are you sure you want to unban ${user.name}? They will regain access to the system.`;
      case "reset2fa":
        return `This will disable 2FA for ${user.name}. They will need to set it up again.`;
      case "resetPassword":
        return `This will send a password reset email to ${user.name} (${user.email}).`;
      case "revoke-sessions":
        return `This will log out ${user.name} from all their active sessions.`;
      default:
        return "";
    }
  };

  const getActionButtonStyle = () => {
    switch (action) {
      case "ban":
        return isDark 
          ? "bg-red-900 hover:bg-red-800 text-red-100" 
          : "bg-red-500 hover:bg-red-600";
      case "unban":
        return isDark 
          ? "bg-green-800 hover:bg-green-700 text-green-100" 
          : "bg-green-500 hover:bg-green-600";
      case "reset2fa":
        return isDark 
          ? "bg-yellow-800 hover:bg-yellow-700 text-yellow-100" 
          : "bg-yellow-500 hover:bg-yellow-600";
      case "resetPassword":
        return isDark 
          ? "bg-blue-800 hover:bg-blue-700 text-blue-100" 
          : "bg-blue-500 hover:bg-blue-600";
      default:
        return isDark 
          ? "bg-orange-800 hover:bg-orange-700 text-orange-100" 
          : "bg-orange-500 hover:bg-orange-600";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className={isDark ? "bg-gray-900 border-gray-700 text-gray-100" : ""}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            {getActionIcon()}
            {getActionTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className={isDark ? "text-gray-300" : ""}>
            {getActionDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-3 mt-6">
          <AlertDialogCancel 
            onClick={handleClose}
            className={isDark ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700" : ""}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn("transition-colors", getActionButtonStyle())}
          >
            Confirm
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}