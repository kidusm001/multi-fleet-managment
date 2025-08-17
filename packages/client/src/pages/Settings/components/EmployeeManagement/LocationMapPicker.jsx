import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/Common/UI/Input";
import Button from "@/components/Common/UI/Button";
import { toast } from "sonner";

export default function LocationMapPicker({ 
  initialPosition = { lat: 9.0221, lng: 38.7468 }, 
  onLocationSelect,
  isDark = false
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState(`${initialPosition.lat}, ${initialPosition.lng}`);
  const [copied, setCopied] = useState(false);
  const [manualCoords, setManualCoords] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Initialize the map
  useEffect(() => {
    // Create a script element to load Mapbox GL JS dynamically
    initMapWithoutExternalScripts();
    
    // Clean up map on component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Handle map initialization without external scripts
  const initMapWithoutExternalScripts = async () => {
    try {
      // Use the Mapbox access token from environment variables
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      
      // Create a new div element for the map
      const mapContainer = mapRef.current;
      if (!mapContainer) return;
      
      // Set up the map container with inline styles
      mapContainer.style.width = '100%';
      mapContainer.style.height = '100%';
      mapContainer.style.backgroundColor = isDark ? '#1a1b26' : '#e9edf0';
      
      // Initialize a basic map fallback with controls for manual coordinate entry
      setLoading(false);
      
      // Display message about CSP blocking Mapbox
      setError("Map loading is blocked by Content-Security-Policy. Please use manual coordinate input instead.");
      
      // Set initial marker position
      updateCoordinateDisplay(initialPosition.lat, initialPosition.lng);
      
      // Show manual coordinate input
      setShowManualInput(true);
      
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Failed to load map. Please enter coordinates manually.");
      setLoading(false);
      setShowManualInput(true);
    }
  };

  // Update coordinate display
  const updateCoordinateDisplay = (lat, lng) => {
    const formattedCoords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setCoordinates(formattedCoords);
    setManualCoords(formattedCoords);
  };

  // Handle manual coordinate input
  const handleManualCoordinateSubmit = () => {
    try {
      // Parse coordinates from input
      const [lat, lng] = manualCoords.split(',').map(coord => parseFloat(coord.trim()));
      
      if (isNaN(lat) || isNaN(lng)) {
        toast.error("Invalid coordinates format. Please use: latitude, longitude");
        return;
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        toast.error("Coordinates out of valid range");
        return;
      }
      
      // Update coordinates
      updateCoordinateDisplay(lat, lng);
      
      // Perform reverse geocoding if possible
      reverseGeocode(lat, lng).catch(() => {
        // If reverse geocoding fails, use coordinates as address
        setAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
      });
      
      toast.success("Coordinates updated");
      
    } catch (error) {
      toast.error("Invalid coordinates format");
      console.error("Error parsing coordinates:", error);
    }
  };

  // Copy coordinates to clipboard
  const copyCoordinates = () => {
    navigator.clipboard.writeText(coordinates).then(() => {
      setCopied(true);
      toast.success("Coordinates copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy coordinates:", err);
      toast.error("Failed to copy coordinates");
    });
  };

  // Reverse geocode a position to get address
  const reverseGeocode = async (lat, lng) => {
    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
      );
      
      if (!response.ok) {
        throw new Error("Geocoding failed");
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
        return data.features[0].place_name;
      }
      
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
      return null;
    }
  };

  // Forward geocode to search for an address
  const searchLocation = async () => {
    if (!searchValue.trim()) return;
    
    try {
      setLoading(true);
      
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      
      // Add Ethiopia as a search parameter to prioritize Ethiopian results
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchValue)}.json?country=ET&access_token=${token}`
      );
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const result = data.features[0];
        const [lng, lat] = result.center;
        
        // Update coordinates
        updateCoordinateDisplay(lat, lng);
        setAddress(result.place_name);
        toast.success("Location found");
      } else {
        toast.error("No results found for this search");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again or enter coordinates manually.");
    } finally {
      setLoading(false);
    }
  };

  // Handle confirmation of location
  const handleConfirm = () => {
    // Parse coordinates from the current state
    const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Invalid coordinates");
      return;
    }
    
    onLocationSelect(lat, lng, address || `${lat}, ${lng}`);
  };

  // Parse coordinates from string
  const parseCoordinates = (coordString) => {
    try {
      const [lat, lng] = coordString.split(',').map(coord => parseFloat(coord.trim()));
      if (isNaN(lat) || isNaN(lng)) return null;
      return { lat, lng };
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Search Bar */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for a location..."
            className={cn(
              "pl-9 pr-4",
              isDark ? "bg-gray-800 border-gray-700" : ""
            )}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchLocation();
              }
            }}
          />
        </div>
        <Button 
          onClick={searchLocation}
          disabled={!searchValue.trim() || loading}
          className={cn(
            isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-500",
            "text-white"
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Manual Coordinate Input */}
      <div className={cn(
        "px-6 py-3 border-b border-gray-200 dark:border-gray-700",
        !showManualInput && "hidden"
      )}>
        <div className="flex flex-col space-y-2">
          <label className={cn(
            "text-sm font-medium",
            isDark ? "text-gray-300" : "text-gray-700"
          )}>
            Enter Coordinates (latitude, longitude)
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="9.0221, 38.7468"
              className={cn(
                isDark ? "bg-gray-800 border-gray-700" : ""
              )}
              value={manualCoords}
              onChange={(e) => setManualCoords(e.target.value)}
            />
            <Button 
              onClick={handleManualCoordinateSubmit}
              className={cn(
                isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-500",
                "text-white"
              )}
            >
              Apply
            </Button>
          </div>
          <p className={cn(
            "text-xs",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            Example for Addis Ababa: 9.0221, 38.7468
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-grow">
        {/* Map div */}
        <div 
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: "250px" }}
        />
        
        {/* Error message with map fallback UI */}
        {error && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            isDark ? "bg-gray-900/95" : "bg-white/95"
          )}>
            <div className="max-w-lg p-6 text-center">
              <div className={cn(
                "mb-4 p-4 rounded-lg border",
                isDark ? "bg-amber-900/20 border-amber-900/30 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"
              )}>
                <p className="mb-2 font-medium">{error}</p>
                <p className="text-sm">
                  You can still set coordinates manually below or search for a location by name.
                </p>
              </div>
              
              {/* Fallback Map UI */}
              <div className={cn(
                "h-40 mb-4 rounded-lg border flex items-center justify-center",
                isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
              )}>
                <div className="text-center p-4">
                  <MapPin className={cn(
                    "h-8 w-8 mx-auto mb-2",
                    isDark ? "text-blue-400" : "text-blue-600"
                  )} />
                  <p className={cn(
                    "text-sm",
                    isDark ? "text-gray-300" : "text-gray-700"
                  )}>
                    Current coordinates:
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <p className={cn(
                      "font-mono text-sm font-medium",
                      isDark ? "text-gray-200" : "text-gray-900"
                    )}>
                      {coordinates}
                    </p>
                    <button
                      onClick={copyCoordinates}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
                      )}
                      title="Copy coordinates"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {!showManualInput && (
                <Button
                  onClick={() => setShowManualInput(true)}
                  className={cn(
                    "mt-2",
                    isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  )}
                >
                  Enter Coordinates Manually
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Loading overlay */}
        {loading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            isDark ? "bg-gray-900/70" : "bg-white/70"
          )}>
            <div className="flex flex-col items-center gap-2">
              <Loader2 className={cn(
                "h-8 w-8 animate-spin",
                isDark ? "text-blue-400" : "text-blue-600"
              )} />
              <p className={isDark ? "text-gray-200" : "text-gray-800"}>
                Loading...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected location info */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2 mb-3">
          <MapPin className={cn(
            "h-4 w-4 mt-1 flex-shrink-0",
            isDark ? "text-blue-400" : "text-blue-600" 
          )} />
          <div className="flex-grow">
            <p className={cn(
              "text-sm font-medium",
              isDark ? "text-gray-200" : "text-gray-700"
            )}>
              Selected Location
            </p>
            <p className={cn(
              "text-sm",
              isDark ? "text-gray-400" : "text-gray-500"  
            )}>
              {address || coordinates}
            </p>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={copyCoordinates}
            title="Copy coordinates"
            className={cn(
              "h-8 px-2",
              isDark ? "bg-gray-800 border-gray-700" : ""
            )}
          >
            {copied ? (
              <Check className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            Copy
          </Button>
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              isDark ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-500",
              "text-white"
            )}
          >
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
}
