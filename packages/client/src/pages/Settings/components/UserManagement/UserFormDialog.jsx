import { useState } from "react";
import { UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { roles } from "./constants";
import Button from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/Common/UI/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import { Switch } from "@/components/Common/UI/switch";

export default function UserFormDialog({ 
  isOpen, 
  isDark, 
  editMode, 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel 
}) {
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editMode && !emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Password validation for new users
    if (!editMode && (!formData.password || formData.password.length < 8)) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await onSubmit();
      if (result !== false) {
        onCancel();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formBgClass = isDark ? "bg-gray-900 border-gray-700" : "bg-white";
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";
  const inputClass = isDark
    ? "bg-gray-800 border-gray-700 text-gray-200 focus:border-blue-500"
    : "bg-white focus:border-blue-500";
  const disabledInputClass = isDark
    ? "bg-gray-800/50 border-gray-700 text-gray-500"
    : "bg-gray-100 text-gray-500";

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={formBgClass}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <UserCog className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-[var(--primary)]"}`} />
            {editMode ? "Edit User" : "Add New User"}
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : ""}>
            {editMode 
              ? "Update user information and permissions" 
              : "Create a new user account"}
          </DialogDescription>
        </DialogHeader>
        
        {/* Show error state */}
        {error && (
          <div className={`p-3 rounded-lg text-sm ${
            isDark 
              ? "bg-red-900/30 text-red-400 border border-red-800/40" 
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Full Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={editMode} // Disable in edit mode
              className={cn(inputClass, editMode && disabledInputClass)}
              placeholder="Enter full name"
            />
          </div>
          
          {/* Email field */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Email Address
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={editMode} // Disable in edit mode
              className={cn(inputClass, editMode && disabledInputClass)}
              placeholder="email@example.com"
            />
          </div>
          
          {/* Password field - only for new users */}
          {!editMode && (
            <div className="space-y-2">
              <label className={`text-sm font-medium ${labelClass}`}>
                Temporary Password
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className={inputClass}
                placeholder="Minimum 8 characters"
                minLength={8}
              />
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                User will be prompted to change this password on first login
              </p>
            </div>
          )}
          
          {/* Role selection */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Role
            </label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                {roles.map((role) => (
                  <SelectItem 
                    key={role} 
                    value={role} 
                    className={isDark ? "text-gray-200 focus:bg-gray-700" : ""}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {formData.role === "admin" 
                ? "Full system access and all permissions"
                : formData.role === "manager"
                  ? "Can manage employees, drivers, and shifts"
                  : "Limited to employee management and viewing drivers"}
            </p>
          </div>
          
          {/* Active status - for edit mode only */}
          {editMode && (
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className={`text-sm font-medium ${labelClass}`}>User Status</h4>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {formData.isActive ? "User can access the system" : "User is banned from the system"}
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                className={`${
                  formData.isActive 
                    ? isDark ? "bg-green-700" : "bg-green-600" 
                    : isDark ? "bg-red-900" : "bg-red-600"
                }`}
              />
            </div>
          )}
          
          {/* Form actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className={isDark ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : ""}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className={`${isDark 
                ? "bg-blue-700 hover:bg-blue-600 text-white" 
                : "bg-[var(--primary)] hover:bg-[var(--button-hover)] text-white"} 
                transition-colors ${isSubmitting ? "opacity-70" : ""}`}
            >
              {isSubmitting 
                ? "Processing..." 
                : editMode ? "Save Changes" : "Add User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}