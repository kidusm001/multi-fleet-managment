import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/Common/UI/dialog";
import Button from "@/components/Common/UI/Button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import LocationMapPicker from "../LocationMapPicker";

// Enhanced location picker with Mapbox GL JS integration
export default function MapPickerDialog({
  isDark,
  isOpen,
  onOpenChange,
  initialPosition,
  onLocationSelect
}) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Handle location selection from the map picker
  const handleLocationSelect = (lat, lng, address) => {
    setSelectedLocation({ lat, lng, address });
  };

  // Handle confirming the selected location
  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng, selectedLocation.address);
      onOpenChange(false);
      setSelectedLocation(null);
    }
  };

  // Handle canceling the dialog
  const handleCancel = () => {
    onOpenChange(false);
    setSelectedLocation(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className={cn(
        "sm:max-w-[800px] max-h-[90vh] overflow-hidden",
        isDark ? "bg-gray-900 border-gray-700" : ""
      )}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className={cn("text-xl", isDark ? "text-gray-200" : "")}>
            Select Employee Home Location
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <LocationMapPicker
            initialPosition={initialPosition}
            onLocationSelect={handleLocationSelect}
            isDark={isDark}
          />

          {selectedLocation && (
            <div className={cn(
              "mt-4 p-3 rounded-lg border",
              isDark ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"
            )}>
              <h3 className="font-medium mb-2">Selected Location:</h3>
              <div className="text-sm space-y-1">
                <p><strong>Address:</strong> {selectedLocation.address}</p>
                <p><strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 px-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleCancel}
            className={isDark ? "bg-gray-800 border-gray-700" : ""}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLocation}
            disabled={!selectedLocation}
            className={cn(
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isDark ? "bg-blue-700 hover:bg-blue-600 text-white" : ""
            )}
          >
            Select Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}