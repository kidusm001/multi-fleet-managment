import { Building2, Users } from "lucide-react";
import Button from "@/components/Common/UI/Button";
import { Badge } from "@/components/Common/UI/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/Common/UI/dialog";

/**
 * Department Details Dialog Component
 * Displays detailed information about a department
 */
export default function DepartmentDetailsDialog({ 
  department, 
  isOpen, 
  isDark, 
  onClose 
}) {
  if (!department) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-lg ${
        isDark ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-200"
      }`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <Building2 className={`h-5 w-5 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
            <span>Department Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Department Header */}
          <div className={`p-4 rounded-lg ${
            isDark 
              ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
              : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${
                  isDark
                    ? "bg-amber-900/30 text-amber-400"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{department.name}</h3>
                </div>
              </div>
              <div>
                <Badge variant="outline" className={`${
                  isDark ? "border-amber-500/30 text-amber-400" : "border-amber-200 text-amber-700"
                }`}>
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  {department.employeeCount} Employees
                </Badge>
              </div>
            </div>
          </div>

          {/* Department Employees Summary */}
          <div>
            <h4 className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Department Information
            </h4>
            <div className={`p-4 rounded-md ${
              isDark 
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-50 text-gray-700"
            }`}>
              <p>
                The <strong>{department.name}</strong> department currently has <strong>{department.employeeCount}</strong> employee{department.employeeCount !== 1 ? 's' : ''}.
              </p>
              {department.employeeCount > 0 ? (
                <p className="mt-2">
                  Employees in this department can be viewed and managed from the Employees section.
                </p>
              ) : (
                <p className="mt-2">
                  This department doesn&#39;t have any employees assigned to it yet.
                </p>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex justify-end">
            <Button 
              onClick={onClose}
              className={isDark 
                ? "bg-gray-800 hover:bg-gray-700 text-gray-200" 
                : ""
              }
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}