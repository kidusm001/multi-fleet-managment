import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/Common/UI/dialog";
import Button from "@/components/Common/UI/Button";
import { cn } from "@/lib/utils";
import { useState } from "react";

// This is a simplified coordinate-based location picker without map
export default function MapPickerDialog({
  isDark,
  isOpen,
  onOpenChange,
  initialPosition,
  onLocationSelect
}) {
  const [latitude, setLatitude] = useState(initialPosition.lat.toFixed(6));
  const [longitude, setLongitude] = useState(initialPosition.lng.toFixed(6));
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  // Handle selecting coordinates
  const handleSelectLocation = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Invalid coordinates. Please check latitude and longitude values.");
      return;
    }
    
    if (!address.trim()) {
      setError("Address/area name is required");
      return;
    }
    
    onLocationSelect(lat, lng, address);
    onOpenChange(false);
  };

  // Common input styles
  const inputClasses = cn(
    "w-full p-2 rounded-md",
    isDark ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-300"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[450px]",
        isDark ? "bg-gray-900 border-gray-700" : ""
      )}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className={cn("text-xl", isDark ? "text-gray-200" : "")}>Enter Employee Location</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="latitude" className={isDark ? "text-gray-300" : ""}>
                Latitude <span className="text-red-500">*</span>
              </label>
              <input
                id="latitude"
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => {
                  setLatitude(e.target.value);
                  setError("");
                }}
                placeholder="9.0221"
                className={inputClasses}
                min="-90"
                max="90"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="longitude" className={isDark ? "text-gray-300" : ""}>
                Longitude <span className="text-red-500">*</span>
              </label>
              <input
                id="longitude"
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => {
                  setLongitude(e.target.value);
                  setError("");
                }}
                placeholder="38.7468"
                className={inputClasses}
                min="-180"
                max="180"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="address" className={isDark ? "text-gray-300" : ""}>
              Address/Area Name <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError("");
              }}
              placeholder="Bole, Addis Ababa"
              className={cn(
                inputClasses,
                !address.trim() && error ? "border-red-500" : ""
              )}
              required
            />
            <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
              Area name is required (e.g., Bole, Kazanchis)
            </p>
          </div>
          
          {error && (
            <div className={cn(
              "p-2 rounded text-sm",
              isDark ? "bg-red-900/20 text-red-400 border border-red-800/40" : 
                      "bg-red-50 text-red-600 border border-red-200"
            )}>
              {error}
            </div>
          )}
          
          <div className={cn(
            "p-3 rounded-lg text-sm",
            isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
          )}>
            <h3 className="font-medium mb-1">Suggested Addis Ababa Coordinates:</h3>
            <ul className="space-y-1 text-xs">
              <li><strong>Bole</strong>: 9.0105, 38.7651</li>
              <li><strong>Kasanchis</strong>: 9.0132, 38.7514</li>
              <li><strong>Megenagna</strong>: 9.0226, 38.7986</li>
              <li><strong>Sarbet</strong>: 8.9905, 38.7772</li>
              <li><strong>CMC</strong>: 9.0506, 38.7922</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="p-4 px-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={isDark ? "bg-gray-800 border-gray-700" : ""}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSelectLocation}
            className={isDark ? "bg-blue-700 hover:bg-blue-600 text-white" : ""}
          >
            Select Coordinates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}