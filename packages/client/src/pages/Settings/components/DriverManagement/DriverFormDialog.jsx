import { useState, useEffect, useCallback } from "react";
import { Truck, AlertCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import { authClient } from "@/lib/auth-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/Common/UI/dialog";

// Phone number validation for Ethiopian phone numbers
export const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\s+/g, '');
  return Boolean(cleanPhone.match(/^(?:\+251|251|0)?9\d{8}$/));
};

/**
 * Driver Form Dialog Component
 * Form dialog for creating and editing drivers
 */
export default function DriverFormDialog({
  isOpen,
  isDark,
  editMode,
  formData,
  setFormData,
  shuttles,
  onSubmit,
  onCancel,
}) {
  const { useActiveOrganization } = authClient;
  const { data: activeOrganization } = useActiveOrganization();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [phoneError, setPhoneError] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Load organization members
  const loadMembers = useCallback(async () => {
    if (!activeOrganization?.id) return;
    
    setLoadingMembers(true);
    try {
      // First try to get full organization data which includes members
      const { data: fullOrgData, error: fullOrgError } = await authClient.organization.getFullOrganization({
        organizationId: activeOrganization.id
      });

      let membersList = [];

      if (fullOrgError) {
        console.warn('Failed to get full organization, trying listMembers:', fullOrgError);
        // Fallback to list members API
        const { data: membersData, error: membersError } = await authClient.organization.listMembers({
          organizationId: activeOrganization.id
        });

        if (membersError) {
          console.error('Failed to list members:', membersError);
          throw new Error(membersError.message || 'Failed to load members');
        }

        membersList = membersData || [];
      } else {
        // Use members from full organization data
        membersList = fullOrgData?.members || [];
      }

      // Filter to show only members who have the "driver" role
      const availableMembers = membersList.filter(member => {
        const role = member.role?.toLowerCase() || '';
        // Only show members with driver role
        return role === 'driver';
      });

      console.log('Loaded members:', membersList.length, 'Available:', availableMembers.length);
      console.log('Member roles:', membersList.map(m => ({ name: m.user?.name, role: m.role })));
      setMembers(availableMembers);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load organization members. Please try again.');
    } finally {
      setLoadingMembers(false);
    }
  }, [activeOrganization?.id]);

  // Load organization members when dialog opens
  useEffect(() => {
    if (isOpen && activeOrganization?.id && !editMode) {
      loadMembers();
    }
  }, [isOpen, activeOrganization?.id, editMode, loadMembers]);

  // Handle member selection
  const handleMemberSelect = (memberId) => {
    const member = members.find(m => m.userId === memberId || m.id === memberId);
    if (member) {
      setSelectedMember(member);
      // Auto-fill form data from member info
      const userName = member.user?.name || member.user?.email?.split('@')[0] || '';
      const userPhone = member.user?.phone || member.user?.phoneNumber || '';
      const userEmail = member.user?.email || '';
      
      console.log('Selected member:', member);
      console.log('Auto-filling: name=', userName, 'email=', userEmail, 'phone=', userPhone);
      
      setFormData({
        ...formData,
        name: userName,
        email: userEmail,
        phoneNumber: userPhone,
        userId: member.userId || member.id,
      });
    }
  };

  // Input styles - derived based on theme
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";
  const inputClass = cn(
    isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white",
    "focus:ring-offset-0",
    isDark && "focus:border-amber-500/50 focus:ring-amber-500/20"
  );
  const formBgClass = isDark ? "bg-gray-900 border-gray-700 text-gray-100" : "";

  // Handle submission with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPhoneError(false);
    
    // Basic validation
    if (!formData.name.trim()) {
      setError("Driver name is required");
      return;
    }
    
    if (!editMode && !formData.email) {
      setError("Email is required");
      return;
    }
    
    // Phone number validation
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setPhoneError(true);
      setError("Please enter a valid Ethiopian phone number (e.g., 0911234567 or +251911234567)");
      return;
    }
    
    try {
      setIsSubmitting(true);
      // Transform data to match backend schema
      const submitData = {
        name: formData.name,
        email: formData.email || null,
        licenseNumber: formData.licenseNumber,
        phoneNumber: formData.phoneNumber,
        experienceYears: formData.experience || 0, // Backend expects experienceYears, not experience
        status: formData.status || 'ACTIVE',
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : null,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        overtimeRate: formData.overtimeRate ? parseFloat(formData.overtimeRate) : 1.5,
        bankAccountNumber: formData.bankAccountNumber || null,
        bankName: formData.bankName || null,
        userId: formData.userId,
      };
      
      // Only include shuttleId/vehicleId if it's set
      if (formData.shuttleId) {
        submitData.vehicleId = formData.shuttleId;
      }
      
      console.log('Submitting driver data:', submitData);
      const success = await onSubmit(submitData, editMode);
      if (success) {
        onCancel();
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={formBgClass}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <Truck className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
            {editMode ? "Edit Driver" : "Add New Driver"}
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : ""}>
            {editMode 
              ? "Update driver information" 
              : "Add a new driver to the system"}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
            isDark 
              ? "bg-red-900/30 text-red-400 border border-red-800/40" 
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editMode && (
            <div className="space-y-2">
              <label className={`text-sm font-medium ${labelClass}`}>
                Select Organization Member*
              </label>
              <Select
                value={selectedMember?.userId || selectedMember?.id || ""}
                onValueChange={handleMemberSelect}
                disabled={loadingMembers}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={loadingMembers ? "Loading members..." : "Select a member"}>
                    {selectedMember && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{selectedMember.user?.name || selectedMember.user?.email || 'Selected Member'}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className={isDark ? "bg-gray-800 border-gray-700 text-gray-200" : ""}>
                  {loadingMembers ? (
                    <div className={`px-2 py-1.5 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      Loading members...
                    </div>
                  ) : members.length === 0 ? (
                    <div className={`px-2 py-1.5 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      No available members found
                    </div>
                  ) : (
                    members.map((member) => {
                      const memberId = member.userId || member.id;
                      const memberName = member.user?.name || member.user?.email || memberId;
                      return (
                        <SelectItem 
                          key={memberId} 
                          value={memberId}
                          className={isDark ? "focus:bg-gray-700 focus:text-gray-200" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{memberName}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {!loadingMembers && members.length === 0 && !error && (
                <p className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                  All organization members are already assigned roles. Please invite new members first.
                </p>
              )}
              {error && !loadingMembers && (
                <p className={`text-xs ${isDark ? "text-red-400" : "text-red-500"}`}>
                  {error}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Driver Name*
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={inputClass}
              placeholder="Enter driver name"
              disabled={!editMode && !selectedMember}
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              License Number*
            </label>
            <Input
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              className={inputClass}
              placeholder="Enter license number"
              required
              disabled={!editMode && !selectedMember}
            />
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Required for driver registration
            </p>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Phone Number*
            </label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) => {
                setFormData({ ...formData, phoneNumber: e.target.value });
                if (phoneError) setPhoneError(false);
              }}
              required
              className={cn(
                inputClass,
                phoneError && "border-red-500 focus:border-red-500"
              )}
              placeholder="Enter phone number (e.g., 0911234567)"
              disabled={!editMode && !selectedMember}
            />
            {phoneError && (
              <p className={`text-xs ${isDark ? "text-red-400" : "text-red-500"}`}>
                Please enter a valid Ethiopian phone number
              </p>
            )}
            {!editMode && selectedMember && !formData.phoneNumber && (
              <p className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                Member doesn&apos;t have a phone number on file. Please enter one.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Experience (Years)*
            </label>
            <Input
              type="number"
              min="0"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
              className={inputClass}
              placeholder="Enter years of driving experience"
              required
              disabled={!editMode && !selectedMember}
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Status
            </label>
            <Select
              value={formData.status || "ACTIVE"}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={!editMode && !selectedMember}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select driver status" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-gray-800 border-gray-700 text-gray-200" : ""}>
                <SelectItem value="ACTIVE" className={isDark ? "focus:bg-gray-700 focus:text-gray-200" : ""}>
                  Active
                </SelectItem>
                <SelectItem value="OFF_DUTY" className={isDark ? "focus:bg-gray-700 focus:text-gray-200" : ""}>
                  Off Duty
                </SelectItem>
                <SelectItem value="ON_BREAK" className={isDark ? "focus:bg-gray-700 focus:text-gray-200" : ""}>
                  On Break
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payroll Information */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className={`text-sm font-semibold ${labelClass}`}>
              Payroll Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-sm font-medium ${labelClass}`}>
                  Base Salary (ETB)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.baseSalary || ""}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., 8000.00"
                  disabled={!editMode && !selectedMember}
                />
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Monthly base salary
                </p>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${labelClass}`}>
                  Hourly Rate (ETB)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate || ""}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., 50.00"
                  disabled={!editMode && !selectedMember}
                />
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Used if base salary is not set
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${labelClass}`}>
                Overtime Rate Multiplier
              </label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="3"
                value={formData.overtimeRate || "1.5"}
                onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                className={inputClass}
                placeholder="e.g., 1.5"
                disabled={!editMode && !selectedMember}
              />
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Default: 1.5x (time and a half)
              </p>
            </div>
          </div>

          {/* Bank Information */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className={`text-sm font-semibold ${labelClass}`}>
              Bank Information (Optional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-sm font-medium ${labelClass}`}>
                  Bank Name
                </label>
                <Input
                  value={formData.bankName || ""}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Commercial Bank of Ethiopia"
                  disabled={!editMode && !selectedMember}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${labelClass}`}>
                  Account Number
                </label>
                <Input
                  value={formData.bankAccountNumber || ""}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  className={inputClass}
                  placeholder="Enter account number"
                  disabled={!editMode && !selectedMember}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass}`}>
              Assigned Vehicle (Optional)
            </label>
            <Select
              value={formData.shuttleId?.toString() || "null"}
              onValueChange={(value) => setFormData({ ...formData, shuttleId: value === "null" ? null : value })}
              disabled={!editMode && !selectedMember}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-gray-800 border-gray-700 text-gray-200" : ""}>
                <SelectItem value="null" className={isDark ? "focus:bg-gray-700 focus:text-gray-200" : ""}>
                  No Vehicle Assigned
                </SelectItem>
                {shuttles.map((shuttle) => (
                  <SelectItem 
                    key={shuttle.id} 
                    value={shuttle.id.toString()}
                    className={isDark ? "focus:bg-gray-700 focus:text-gray-200" : ""}
                  >
                    {shuttle.name} ({shuttle.licensePlate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              You can assign a vehicle now or later
            </p>
          </div>
          
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
              disabled={isSubmitting || (!editMode && !selectedMember)}
              className={`${isDark 
                ? "bg-amber-700 hover:bg-amber-600 text-white" 
                : "bg-amber-600 hover:bg-amber-500 text-white"} 
                transition-colors ${(isSubmitting || (!editMode && !selectedMember)) ? "opacity-70" : ""}`}
            >
              {isSubmitting 
                ? "Processing..." 
                : editMode ? "Save Changes" : "Add Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}