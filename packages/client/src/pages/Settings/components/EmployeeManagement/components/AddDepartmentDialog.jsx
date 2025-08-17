import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/Common/UI/dialog";
import Button from "@/components/Common/UI/Button";
import { Label } from "@/components/Common/UI/Label";
import { Input } from "@/components/Common/UI/Input";
import { cn } from "@/lib/utils";

export default function AddDepartmentDialog({
  isDark,
  isOpen,
  onOpenChange,
  newDepartment,
  onDepartmentChange,
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
          <DialogTitle>Add New Department</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newDepartment">Department Name</Label>
            <Input
              id="newDepartment"
              value={newDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
              placeholder="Enter department name"
              className={isDark ? "bg-gray-800 border-gray-700" : ""}
              autoFocus
            />
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
            disabled={isLoading || !newDepartment.trim()}
            className={cn(
              isDark ? "bg-amber-700 hover:bg-amber-600" : "bg-amber-600 hover:bg-amber-500",
              "text-white"
            )}
          >
            {isLoading ? "Adding..." : "Add Department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}