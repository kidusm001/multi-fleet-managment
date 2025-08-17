import { useState, useEffect } from "react";
import { Clock, AlertCircle, Sunrise, Sunset, Sun, Moon, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import TimeInput from "./TimeInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/Common/UI/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/Common/UI/tooltip";

/**
 * Time zones array with common options - putting Addis Ababa first as default
 */
const TIME_ZONES = [
  { value: "Africa/Addis_Ababa", label: "East Africa Time (Addis Ababa)" },
  { value: "Africa/Nairobi", label: "East Africa Time (Nairobi)" },
  { value: "Africa/Cairo", label: "Eastern European Time (Cairo)" },
  { value: "Africa/Johannesburg", label: "South Africa Standard Time" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Sao_Paulo", label: "Brasilia Time" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (Dubai)" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Shanghai", label: "China Standard Time" },
  { value: "Asia/Tokyo", label: "Japan Standard Time" },
  { value: "Australia/Sydney", label: "Australian Eastern Standard Time" },
  { value: "Europe/London", label: "GMT (London)" },
  { value: "Europe/Paris", label: "Central European Time (Paris, Berlin)" },
  { value: "Pacific/Auckland", label: "New Zealand Standard Time" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

// Add suggestion helper for shifts
const getSuggestedName = (startTime, endTime, timeZone) => {
  if (!startTime || !endTime || !timeZone) return "";
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const zoneName = timeZone.split('/').pop().replace(/_/g, ' ');
  
  let period = '';
  if (start.getHours() >= 3 && start.getHours() < 12) {
    period = 'Morning';
  } else if (start.getHours() >= 12 && start.getHours() < 17) {
    period = 'Afternoon';
  } else if (start.getHours() >= 17 && start.getHours() < 22) {
    period = 'Evening';
  } else {
    period = 'Night';
  }

  const startFormatted = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const endFormatted = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${zoneName} ${period} (${startFormatted} - ${endFormatted})`;
};

// Improve the name suggestion button
const handleNameSuggestion = () => {
  const suggestedName = getSuggestedName(startTime, endTime, timeZone);
  if (suggestedName) {
    setFormData(prev => ({ ...prev, name: suggestedName }));
    toast({
      title: "Name Generated",
      description: `Shift name set to "${suggestedName}"`,
    });
  }
};

/**
 * Shift Form Dialog Component
 * Form dialog for creating and editing shifts with time zone support
 */
export default function ShiftFormDialog({
  isOpen,
  isDark,
  editMode,
  formData,
  setFormData,
  onSubmit,
  onCancel,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isOvernightShift, setIsOvernightShift] = useState(false);

  // Set Addis Ababa as the default timezone
  const DEFAULT_TIMEZONE = "Africa/Addis_Ababa";
  // Always use Addis Ababa as reference timezone
  const referenceTimeZone = "Africa/Addis_Ababa";

  // Initialize form with Addis Ababa timezone
  useEffect(() => {
    if (isOpen && !editMode) {
      const now = new Date();
      setFormData(prev => ({
        ...prev,
        timeZone: DEFAULT_TIMEZONE,
        startTime: now.toISOString(),
        endTime: (() => {
          const end = new Date(now);
          end.setHours(end.getHours() + 8); // Default 8-hour shift
          return end.toISOString();
        })()
      }));
    }
  }, [isOpen, editMode]);

  // Check if overnight shift based on start and end times when component loads
  useEffect(() => {
    if (formData.startTime && formData.endTime && isOpen) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      if (start.getHours() > end.getHours() || 
          (start.getHours() === end.getHours() && start.getMinutes() >= end.getMinutes())) {
        setIsOvernightShift(true);
      } else {
        setIsOvernightShift(false);
      }
    }
  }, [formData.startTime, formData.endTime, isOpen]);

  // Add suggested name handling
  useEffect(() => {
    if (!editMode && formData.startTime && formData.endTime && !formData.name) {
      const suggestion = getSuggestedName(formData.startTime, formData.endTime);
      setFormData(prev => ({ ...prev, name: suggestion }));
    }
  }, [formData.startTime, formData.endTime, editMode]);

  // Input styles - derived based on theme
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";
  const inputClass = cn(
    isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white",
    "focus:ring-offset-0",
    isDark && "focus:border-blue-500/50 focus:ring-blue-500/20"
  );
  const selectClass = cn(
    inputClass,
    isDark && "text-gray-200"
  );
  const formBgClass = isDark ? "bg-gray-900 border-gray-700" : "";
  const titleClass = isDark ? "text-blue-300" : "text-blue-700"; // Improved title color for dark mode
  const headerIconClass = isDark ? "text-blue-300" : "text-blue-600"; // Matching icon color

  // Convert time string to time format for input fields
  const formatTimeForInput = (timeStr) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      // Ensures format is HH:MM with leading zeros
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  // Parse time input and create full date string
  const parseTimeInput = (timeStr) => {
    if (!timeStr) return null;
    
    try {
      // If it's already an ISO string, just return it
      if (timeStr.includes('Z')) {
        return timeStr;
      }

      // For time strings, create a new date
      const now = new Date();
      return now.toISOString();
    } catch (error) {
      console.error("Error parsing time:", error);
      return null;
    }
  };

  // Handle validation
  const validate = () => {
    const errors = {};
    
    if (!formData.name?.trim()) {
      errors.name = "Shift name is required";
    }
    
    if (!formData.startTime) {
      errors.startTime = "Start time is required";
    }
    
    if (!formData.endTime) {
      errors.endTime = "End time is required";
    }
    
    if (!formData.timeZone) {
      errors.timeZone = "Time zone is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!validate()) {
      setError("Please correct the errors in the form");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const success = await onSubmit(formData);
      if (success) {
        onCancel();
      }
    } catch (err) {
      console.error("Error submitting shift:", err);
      setError(err?.message || "An error occurred while saving the shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle time input changes
  const handleTimeChange = (field, value) => {
    if (!value) return;

    setFormData({ ...formData, [field]: value });
    
    // Clear validation error if field has a value now
    if (value && validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = {...prev};
        delete updated[field];
        return updated;
      });
    }
  };

  // Update time conversion display
  const getTimeInUserZone = (time) => {
    if (!time) return "";
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimeZone
      });
    } catch (error) {
      return "";
    }
  };

  // Show conversion only when selected timezone is not Addis Ababa
  const shouldShowConversion = () => {
    return formData.timeZone && formData.timeZone !== "Africa/Addis_Ababa";
  };

  // Get time in Addis Ababa timezone
  const getTimeInAddisAbaba = (time) => {
    if (!time) return "";
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: "Africa/Addis_Ababa"
      });
    } catch (error) {
      return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={`${formBgClass} sm:max-w-[700px]`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${titleClass}`}>
            <Clock className={`w-5 h-5 ${headerIconClass}`} />
            {editMode ? "Edit Shift" : "Add New Shift"}
          </DialogTitle>
          <DialogDescription className={isDark ? "text-gray-400" : "text-gray-600"}>
            {editMode 
              ? "Update shift information and time zone" 
              : "Create a new shift with appropriate time zone"}
          </DialogDescription>
        </DialogHeader>
        
        {/* Error display */}
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shift Name */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass} flex items-center justify-between`}>
              <span>Shift Name*</span>
              {validationErrors.name && (
                <span className={`text-xs ${isDark ? "text-red-400" : "text-red-500"}`}>
                  {validationErrors.name}
                </span>
              )}
            </label>
            <div className="relative">
              <Input
                value={formData.name || ""}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (e.target.value && validationErrors.name) {
                    setValidationErrors(prev => {
                      const updated = {...prev};
                      delete updated.name;
                      return updated;
                    });
                  }
                }}
                className={cn(
                  inputClass,
                  "pr-[42px]",
                  validationErrors.name && "border-red-500 focus:border-red-500"
                )}
                placeholder="Enter shift name (suggestions based on time)"
              />
              <Button
                type="button"
                size="icon"
                onClick={handleNameSuggestion}
                className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 ${
                  isDark 
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-blue-400" 
                    : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                } transition-all duration-200`}
                title="Generate name from time zone and period"
              >
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Time Zone Selection */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelClass} flex items-center justify-between`}>
              <div className="flex items-center gap-1">
                <span>Time Zone*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="w-3.5 h-3.5 text-blue-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className={`p-3 max-w-sm ${isDark ? "bg-gray-800 text-gray-200" : ""}`}>
                      Select the time zone where this shift is physically located. Times will be stored and displayed
                      according to this time zone, with automatic conversion to the user's local time when needed.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {validationErrors.timeZone && (
                <span className={`text-xs ${isDark ? "text-red-400" : "text-red-500"}`}>
                  {validationErrors.timeZone}
                </span>
              )}
            </label>
            <Select
              value={formData.timeZone || ""}
              onValueChange={(value) => {
                setFormData({ ...formData, timeZone: value });
                if (validationErrors.timeZone) {
                  setValidationErrors(prev => {
                    const updated = {...prev};
                    delete updated.timeZone;
                    return updated;
                  });
                }
              }}
            >
              <SelectTrigger 
                className={cn(
                  selectClass,
                  validationErrors.timeZone && "border-red-500 focus:border-red-500"
                )}
              >
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : ""}>
                {TIME_ZONES.map((tz) => (
                  <SelectItem 
                    key={tz.value} 
                    value={tz.value}
                    className={cn(
                      isDark && "text-gray-200 data-[highlighted]:bg-gray-700 data-[highlighted]:text-gray-200",
                      "cursor-pointer transition-colors"
                    )} 
                  >
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {formData.timeZone 
                ? `Selected time zone will be used to store and display shift times.` 
                : `Your device's time zone is ${userTimeZone}`}
            </p>
          </div>
          
          {/* Time Range with new TimeInput */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-medium ${labelClass}`}>Shift Hours*</h4>
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className={`text-sm font-medium ${labelClass} cursor-pointer flex items-center gap-1.5`} htmlFor="overnight-shift">
                        Overnight Shift
                        <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                      </label>
                    </TooltipTrigger>
                    <TooltipContent className={`p-3 max-w-sm ${isDark ? "bg-gray-800 text-gray-200" : ""}`}>
                      Enable this option for shifts that start on one day and end on the next day (e.g., 10:00 PM to 6:00 AM).
                      This allows end time to be earlier than start time.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="relative flex items-center">
                  <input 
                    id="overnight-shift"
                    type="checkbox" 
                    checked={isOvernightShift}
                    onChange={(e) => setIsOvernightShift(e.target.checked)}
                    className={`h-5 w-5 rounded-md ${
                      isDark 
                        ? "bg-gray-700 border-gray-600 checked:bg-blue-600" 
                        : "bg-gray-100 checked:bg-blue-500"
                    } transition-colors cursor-pointer`}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Start Time */}
              <div className="space-y-2">
                <label className={`text-xs font-medium ${labelClass} flex items-center gap-2`}>
                  <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                  Start Time
                </label>
                <TimeInput
                  value={formData.startTime}
                  onChange={(time) => handleTimeChange('startTime', time)}
                  isDark={isDark}
                  showTimezone
                  timezone={formData.timeZone}
                  error={validationErrors.startTime}
                />
              </div>
              
              {/* End Time */}
              <div className="space-y-2">
                <label className={`text-xs font-medium ${labelClass} flex items-center gap-2`}>
                  <Sunset className="w-3.5 h-3.5 text-amber-500" />
                  End Time
                </label>
                <TimeInput
                  value={formData.endTime}
                  onChange={(time) => handleTimeChange('endTime', time)}
                  isDark={isDark}
                  showTimezone
                  timezone={formData.timeZone}
                  error={validationErrors.endTime}
                />
              </div>
            </div>

            {isOvernightShift && (
              <div className={`p-3 rounded-lg ${
                isDark 
                  ? "bg-amber-900/20 border border-amber-800/30" 
                  : "bg-amber-50/80 border border-amber-200/80"
              }`}>
                <div className="flex items-start gap-2">
                  <Moon className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-500"} mt-0.5`} />
                  <div>
                    <p className={`font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                      Overnight Shift
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-amber-300/80" : "text-amber-600/90"}`}>
                      This shift spans across two days. The end time will be considered to be on the following day.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Time Conversion Display - show when timezone is not Addis Ababa */}
            {shouldShowConversion() && (
              <div className={`p-3 rounded-lg ${
                isDark 
                  ? "bg-blue-900/20 border border-blue-800/30" 
                  : "bg-blue-50/80 border border-blue-200/80"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-500"}`} />
                  <span className={`font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                    Time Conversion
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                      In {formData.timeZone.split('/').pop().replace(/_/g, ' ')}:
                    </p>
                    <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                      {new Date(formData.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: formData.timeZone
                      })} - {new Date(formData.endTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: formData.timeZone
                      })}
                    </p>
                  </div>
                  <div>
                    <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                      In Addis Ababa:
                    </p>
                    <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                      {getTimeInAddisAbaba(formData.startTime)} - {getTimeInAddisAbaba(formData.endTime)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className={isDark 
                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-gray-200" 
                  : ""
                }
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className={`${isDark 
                  ? "bg-blue-700 hover:bg-blue-600 text-white" 
                  : "bg-blue-600 hover:bg-blue-500 text-white"} 
                  transition-colors ${isSubmitting ? "opacity-70" : ""}`}
              >
                {isSubmitting 
                  ? "Processing..." 
                  : editMode ? "Save Changes" : "Add Shift"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}