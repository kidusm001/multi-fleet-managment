import { User, Mail, Phone, Building2, Clock, Briefcase, MapPin, MapIcon, Check, Info, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import { Label } from "@/components/Common/UI/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";

export default function SingleEmployeeForm({
  isDark,
  employee,
  departments,
  shifts,
  phoneValid,
  emailValid,
  isLoading,
  onEmployeeChange,
  onSelectChange,
  onPhoneChange,
  onEmailChange,
  onMapClick,
  onSubmit,
  onCancel,
  onNavigateToDepartments,
  onNavigateToShifts
}) {
  // Custom placeholder style classes for dark mode
  const placeholderClasses = isDark 
    ? "placeholder:text-gray-500 placeholder:opacity-50"
    : "placeholder:text-gray-500";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={employee.name}
              onChange={onEmployeeChange}
              placeholder="Abebe Kebede"
              className={cn(
                isDark ? "bg-gray-900 border-gray-700" : "bg-white",
                placeholderClasses
              )}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                value={employee.email}
                onChange={onEmailChange}
                placeholder="abebe.kebede@example.com"
                className={cn(
                  isDark ? "bg-gray-900 border-gray-700" : "bg-white",
                  !emailValid && employee.email && "border-red-500 dark:border-red-800",
                  placeholderClasses
                )}
              />
              {employee.email && !emailValid && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Info className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>
            {employee.email && !emailValid && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Please enter a valid email address
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              Phone
            </Label>
            <div className="relative">
              <Input
                id="phone"
                name="phone"
                value={employee.phone}
                onChange={onPhoneChange}
                placeholder="+251911234567"
                className={cn(
                  isDark ? "bg-gray-900 border-gray-700" : "bg-white",
                  !phoneValid && employee.phone && "border-red-500 dark:border-red-800",
                  placeholderClasses
                )}
              />
              {employee.phone && !phoneValid && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Info className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>
            {employee.phone && !phoneValid && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Please enter a valid Ethiopian phone number (e.g., +251911234567)
              </p>
            )}
          </div>
        </div>
        
        {/* Work Information */}
        <div className="space-y-4">
          {/* Department field with manage option */}
          <div className="space-y-2">
            <Label htmlFor="departmentId" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              Department <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select 
                value={employee.departmentId?.toString() || ""} 
                onValueChange={(value) => onSelectChange("departmentId", parseInt(value))}
                required
              >
                <SelectTrigger 
                  className={cn(
                    "w-full",
                    isDark ? "bg-gray-900 border-gray-700" : "bg-white",
                    !employee.departmentId && isDark && "text-gray-500 opacity-50"
                  )}
                >
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 && (
                    <div className="px-2 py-4 text-center">
                      <p className="text-sm text-gray-500">No departments found</p>
                    </div>
                  )}
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "flex-shrink-0",
                  isDark ? "border-gray-700 bg-gray-800" : ""
                )}
                onClick={() => onNavigateToDepartments('departments')}
                title="Manage departments"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {departments.length === 0 && (
              <p className={cn(
                "text-xs",
                isDark ? "text-amber-400" : "text-amber-600"
              )}>
                No departments added yet. Click the + button to manage departments.
              </p>
            )}
          </div>
          
          {/* Shift field with manage option */}
          <div className="space-y-2">
            <Label htmlFor="shiftId" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Shift <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Select 
                value={employee.shiftId?.toString() || ""} 
                onValueChange={(value) => onSelectChange("shiftId", parseInt(value))}
                required
              >
                <SelectTrigger 
                  className={cn(
                    "w-full",
                    isDark ? "bg-gray-900 border-gray-700" : "bg-white",
                    !employee.shiftId && isDark && "text-gray-500 opacity-50"
                  )}
                >
                  <SelectValue placeholder="Select a shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.length === 0 && (
                    <div className="px-2 py-4 text-center">
                      <p className="text-sm text-gray-500">No shifts found</p>
                    </div>
                  )}
                  {shifts.map(shift => (
                    <SelectItem key={shift.id} value={shift.id.toString()}>
                      {shift.name} {shift.startTime && shift.endTime ? `(${shift.startTime} - ${shift.endTime})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "flex-shrink-0",
                  isDark ? "border-gray-700 bg-gray-800" : ""
                )}
                onClick={() => onNavigateToShifts('shifts')}
                title="Manage shifts"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {shifts.length === 0 && (
              <p className={cn(
                "text-xs",
                isDark ? "text-amber-400" : "text-amber-600"
              )}>
                No shifts added yet. Click the + button to manage shifts.
              </p>
            )}
          </div>
          
          {/* Position field */}
          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              Position
            </Label>
            <Input
              id="position"
              name="position"
              value={employee.position}
              onChange={onEmployeeChange}
              placeholder="Software Developer"
              className={cn(
                isDark ? "bg-gray-900 border-gray-700" : "bg-white",
                placeholderClasses
              )}
            />
          </div>

          {/* Location field with map picker */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              Location <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="location"
                name="location"
                value={employee.location}
                onChange={onEmployeeChange}
                placeholder="Bole, Addis Ababa"
                className={cn(
                  "w-full",
                  isDark ? "bg-gray-900 border-gray-700" : "bg-white",
                  placeholderClasses
                )}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "flex-shrink-0",
                  isDark ? "border-gray-700 bg-gray-800" : ""
                )}
                onClick={onMapClick}
              >
                <MapIcon className="h-4 w-4" />
              </Button>
            </div>
            
            {employee.latitude && employee.longitude ? (
              <div className={cn(
                "text-xs flex items-center mt-1",
                isDark ? "text-green-400" : "text-green-600"
              )}>
                <Check className="w-3 h-3 mr-1" />
                Location coordinates selected
              </div>
            ) : (
              <div className={cn(
                "text-xs flex items-center mt-1",
                isDark ? "text-amber-400" : "text-amber-600"
              )}>
                <Info className="w-3 h-3 mr-1" />
                Click the map icon to select coordinates
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className={isDark ? "bg-gray-800 border-gray-700" : ""}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !phoneValid || !emailValid}
          className={cn(
            isDark ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-500",
            "text-white"
          )}
        >
          {isLoading ? "Adding..." : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}