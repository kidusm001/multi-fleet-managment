import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/Common/UI/dialog";
import Button from "@/components/Common/UI/Button";
import { Label } from "@/components/Common/UI/Label";
import { Input } from "@/components/Common/UI/Input";
import { cn } from "@/lib/utils";

export default function AddShiftDialog({
  isDark,
  isOpen,
  onOpenChange,
  newShift,
  onShiftChange,
  onAdd,
  isLoading
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[450px]",
        isDark ? "bg-gray-900 border-gray-700" : ""
      )}>
        <DialogHeader>
          <DialogTitle>Add New Shift</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newShiftName">Shift Name</Label>
            <Input
              id="newShiftName"
              value={newShift.name}
              onChange={(e) => onShiftChange({...newShift, name: e.target.value})}
              placeholder="Morning Shift"
              className={isDark ? "bg-gray-800 border-gray-700" : ""}
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={newShift.startTime}
                onChange={(e) => onShiftChange({...newShift, startTime: e.target.value})}
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={newShift.endTime}
                onChange={(e) => onShiftChange({...newShift, endTime: e.target.value})}
                className={isDark ? "bg-gray-800 border-gray-700" : ""}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className={isDark ? "bg-gray-800 border-gray-700" : ""}
          >
            Cancel
          </Button>
          <Button 
            onClick={onAdd}
            disabled={isLoading || !newShift.name.trim() || !newShift.startTime || !newShift.endTime}
            className={cn(
              isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-500",
              "text-white"
            )}
          >
            {isLoading ? "Adding..." : "Add Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}