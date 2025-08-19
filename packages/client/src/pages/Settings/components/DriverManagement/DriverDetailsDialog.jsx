import { UserRound, Phone, Award, Bus } from "lucide-react";
import Button from "@/components/Common/UI/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/Common/UI/dialog";

/**
 * Driver Details Dialog Component
 * Shows detailed information about a driver
 */
export default function DriverDetailsDialog({
  driver,
  isOpen,
  isDark,
  onClose
}) {
  if (!driver) return null;

  // Define theme-specific styling
  const sectionClass = isDark 
    ? "bg-gray-800/50 border border-gray-700" 
    : "bg-gray-50 border border-gray-100";
  const labelClass = isDark ? "text-gray-400" : "text-gray-500";
  const valueClass = isDark ? "text-gray-200" : "text-gray-900";
  const dialogBgClass = isDark ? "bg-gray-900 border-gray-700 text-gray-100" : "";

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return "Not provided";
    return phone;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={dialogBgClass}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <UserRound className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
            Driver Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Driver Header */}
          <div className={`flex items-center gap-4 p-4 rounded-lg ${sectionClass}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
              isDark ? "bg-amber-700 text-amber-200" : "bg-amber-100 text-amber-600"
            }`}>
              {driver.name?.charAt(0).toUpperCase() || "D"}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${valueClass}`}>{driver.name}</h3>
              <p className={labelClass}>
                {driver.licenseNumber ? `License: ${driver.licenseNumber}` : "No License Number"}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className={`text-sm font-medium uppercase tracking-wider ${labelClass}`}>
              Contact Information
            </h4>
            <div className={`p-4 rounded-lg ${sectionClass} space-y-3`}>
              <div className="flex items-center gap-3">
                <Phone className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
                <div>
                  <p className={`text-xs ${labelClass}`}>Phone Number</p>
                  <p className={`text-sm font-medium ${valueClass}`}>{formatPhoneNumber(driver.phoneNumber)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="space-y-4">
            <h4 className={`text-sm font-medium uppercase tracking-wider ${labelClass}`}>
              Driver Information
            </h4>
            <div className={`p-4 rounded-lg ${sectionClass} space-y-3`}>
              <div className="flex items-center gap-3">
                <Award className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
                <div>
                  <p className={`text-xs ${labelClass}`}>Experience</p>
                  <p className={`text-sm font-medium ${valueClass}`}>
                    {driver.experience} {driver.experience === 1 ? 'year' : 'years'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Bus className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
                <div>
                  <p className={`text-xs ${labelClass}`}>Assigned Shuttle</p>
                  <p className={`text-sm font-medium ${valueClass}`}>
                    {driver.shuttle 
                      ? `${driver.shuttle.name} (${driver.shuttle.licensePlate})` 
                      : "No shuttle assigned"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={onClose}
              className={isDark 
                ? "bg-amber-700 hover:bg-amber-600 text-white" 
                : "bg-amber-600 hover:bg-amber-500 text-white"
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