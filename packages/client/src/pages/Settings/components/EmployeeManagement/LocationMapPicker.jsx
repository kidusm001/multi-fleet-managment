import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/Common/UI/Input";
import Button from "@/components/Common/UI/Button";
import { toast } from "sonner";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const [manualAddress, setManualAddress] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [neighborhood, setNeighborhood] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Keep coordinate display fields in sync
  const updateCoordinateDisplay = useCallback((lat, lng) => {
    const formattedCoords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setCoordinates(formattedCoords);
    setManualCoords(formattedCoords);
    setManualAddress((prev) => (prev ? prev : address));
  }, [address]);

  // Reverse geocode coordinates to user-friendly address details
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,poi,neighborhood,locality,place,region,country`
      );

      if (!response.ok) {
        throw new Error("Geocoding failed");
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const features = data.features;

        // Find neighborhood/locality information
        let neighborhoodInfo = '';
        const neighborhoodFeature = features.find(f =>
          f.place_type.includes('neighborhood') ||
          f.place_type.includes('locality')
        );

        if (neighborhoodFeature) {
          neighborhoodInfo = neighborhoodFeature.text;
        }

        // Get the most relevant address
        const addressFeature = features.find(f =>
          f.place_type.includes('address') ||
          f.place_type.includes('poi')
        ) || features[0];

        const fullAddress = addressFeature.place_name;
        const shortAddress = addressFeature.text || fullAddress.split(',')[0];

        setAddress(shortAddress);
        setNeighborhood(neighborhoodInfo);
  setManualAddress(shortAddress);

        return { address: shortAddress, neighborhood: neighborhoodInfo, fullAddress };
      }

      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      const fallbackAddress = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      setAddress(fallbackAddress);
      setNeighborhood('');
  setManualAddress(fallbackAddress);
      return { address: fallbackAddress, neighborhood: '', fullAddress: fallbackAddress };
    }
  }, []);

  // Apply reverse geocoding results to state
  const updateLocationInfo = useCallback(async (lat, lng) => {
    updateCoordinateDisplay(lat, lng);

    try {
      await reverseGeocode(lat, lng);
    } catch (error) {
      console.error('Error updating location info:', error);
      setAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
      setNeighborhood('');
    }
  }, [reverseGeocode, updateCoordinateDisplay]);

  // Initialize Mapbox and register interactive handlers
  const initMapboxMap = useCallback(async () => {
    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

      if (!token) {
        throw new Error("Mapbox access token not found");
      }

      mapboxgl.accessToken = token;

      const mapContainer = mapRef.current;
      if (!mapContainer) return;

      const map = new mapboxgl.Map({
        container: mapContainer,
        style: isDark
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: [initialPosition.lng, initialPosition.lat],
        zoom: 12,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right');

      const marker = new mapboxgl.Marker({
        color: '#3B82F6',
        draggable: true
      })
        .setLngLat([initialPosition.lng, initialPosition.lat])
        .addTo(map);

      markerRef.current = marker;

      map.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        updateMarkerPosition(lat, lng);
        await updateLocationInfo(lat, lng);
      });

      marker.on('dragend', async () => {
        const lngLat = marker.getLngLat();
        await updateLocationInfo(lngLat.lat, lngLat.lng);
      });

      map.on('load', () => {
        setLoading(false);
        updateCoordinateDisplay(initialPosition.lat, initialPosition.lng);
        updateLocationInfo(initialPosition.lat, initialPosition.lng);
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        setError('Failed to load map tiles');
        setLoading(false);
      });

    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Failed to initialize map. Please enter coordinates manually.");
      setLoading(false);
      setShowManualInput(true);
    }
  }, [initialPosition.lat, initialPosition.lng, isDark, updateCoordinateDisplay, updateLocationInfo]);

  // Initialize the map once the component mounts
  useEffect(() => {
    initMapboxMap();
    const localInstance = mapInstanceRef.current;
    return () => {
      if (localInstance) {
        localInstance.remove?.();
      }
    };
  }, [initMapboxMap]);

  // Update marker position
  const updateMarkerPosition = (lat, lng) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [lng, lat],
        zoom: 15
      });
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchResults]);

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

      if (manualAddress.trim()) {
        setAddress(manualAddress.trim());
        setNeighborhood('');
      } else {
        // Perform reverse geocoding if possible
        reverseGeocode(lat, lng).catch(() => {
          const fallback = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
          setAddress(fallback);
          setManualAddress(fallback);
        });
      }
      
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


  // Forward geocode to search for an address or neighborhood
  const searchLocation = async () => {
    if (!searchValue.trim()) return;

    try {
      setLoading(true);
      setShowSearchResults(false);

      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

      // Search with broader types to include neighborhoods and landmarks
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchValue)}.json?country=ET&types=address,poi,neighborhood,locality,place,region&limit=5&access_token=${token}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
        setShowSearchResults(true);

        // If only one result, auto-select it
        if (data.features.length === 1) {
          const result = data.features[0];
          const [lng, lat] = result.center;
          updateMarkerPosition(lat, lng);
          await updateLocationInfo(lat, lng);
          setShowSearchResults(false);
          toast.success("Location found");
        }
      } else {
        toast.error("No results found for this search");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again or enter coordinates manually.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search result selection
  const selectSearchResult = async (result) => {
    const [lng, lat] = result.center;
    updateMarkerPosition(lat, lng);
    await updateLocationInfo(lat, lng);
    setShowSearchResults(false);
    setSearchValue(result.place_name.split(',')[0]); // Set search input to selected place
    toast.success("Location selected");
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

  // (Removed unused parseCoordinates)

  return (
    <div className="flex flex-col h-[500px]">
      {/* Search Bar */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-2 search-container relative">
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
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowManualInput((prev) => {
              const next = !prev;
              if (!prev) {
                setManualCoords(coordinates);
                setManualAddress(address);
              }
              return next;
            });
          }}
          className={cn(
            "whitespace-nowrap",
            isDark ? "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700" : ""
          )}
        >
          {showManualInput ? "Hide Manual Entry" : "Manual Entry"}
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {showSearchResults && searchResults.length > 0 && (
        <div className={cn(
          "absolute top-full left-6 right-6 z-50 mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto",
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => selectSearchResult(result)}
              className={cn(
                "w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors",
                "focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
              )}
            >
              <div className="flex items-start gap-3">
                <MapPin className={cn(
                  "h-4 w-4 mt-0.5 flex-shrink-0",
                  isDark ? "text-blue-400" : "text-blue-600"
                )} />
                <div className="flex-grow min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isDark ? "text-gray-200" : "text-gray-900"
                  )}>
                    {result.text}
                  </p>
                  <p className={cn(
                    "text-xs truncate",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    {result.place_name}
                  </p>
                  {result.context && result.context.length > 0 && (
                    <p className={cn(
                      "text-xs mt-1",
                      isDark ? "text-gray-500" : "text-gray-400"
                    )}>
                      {result.context.map(ctx => ctx.text).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

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
          <div className="flex flex-col gap-1">
            <label className={cn(
              "text-sm font-medium",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              Address or Landmark (optional)
            </label>
            <Input
              type="text"
              placeholder="Bole, Addis Ababa"
              className={cn(
                isDark ? "bg-gray-800 border-gray-700" : ""
              )}
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
            />
            <p className={cn(
              "text-xs",
              isDark ? "text-gray-500" : "text-gray-500"
            )}>
              Provide a recognizable name for the location; leave blank to auto fetch from Mapbox.
            </p>
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
            {neighborhood && (
              <p className={cn(
                "text-xs mt-1 px-2 py-1 rounded-md inline-block",
                isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"
              )}>
                📍 {neighborhood}
              </p>
            )}
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
