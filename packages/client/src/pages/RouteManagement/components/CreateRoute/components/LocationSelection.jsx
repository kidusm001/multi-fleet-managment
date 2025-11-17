import { useMemo } from "react";
import PropTypes from "prop-types";
import { MapPin, Building2, HelpCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Common/UI/Select";
import { Badge } from "@/components/Common/UI/Badge";
import styles from "../styles/LocationSelection.module.css";
import { formatDisplayAddress } from "@/utils/address";

export default function LocationSelection({
  selectedLocation,
  onLocationChange,
  locations = [],
  disabled = false,
}) {

  // Find selected location data
  const selectedLocationData = useMemo(() => {
    if (!selectedLocation || !locations.length) return null;
    return locations.find(
      (loc) => loc.id === selectedLocation || String(loc.id) === String(selectedLocation)
    );
  }, [selectedLocation, locations]);

  const handleLocationChange = (value) => {
    if (value && value.trim() !== '' && value !== "undefined") {
      const location = locations.find(loc => String(loc.id) === value);
      onLocationChange(location);
    } else {
      onLocationChange(null);
    }
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'HQ':
        return <Building2 className="w-4 h-4" />;
      case 'BRANCH':
        return <MapPin className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getLocationTypeLabel = (type) => {
    switch (type) {
      case 'HQ':
        return 'Headquarters';
      case 'BRANCH':
        return 'Branch';
      default:
        return 'Other';
    }
  };

  if (!locations.length) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h3 className={styles.selectTitle}>
            <MapPin className="w-5 h-5" />
            No Locations Available
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h3 className={styles.selectTitle}>
          <MapPin className="w-5 h-5" />
          Select Location
        </h3>
        
        <div className={styles.selectWrapper}>
          <Select
            onValueChange={handleLocationChange}
            value={selectedLocation ? String(selectedLocation) : ""}
            disabled={disabled}
          >
            <SelectTrigger className={`${styles.trigger} ${!selectedLocation ? styles.unselectedGlow : ''}`}>
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Select a location">
                {selectedLocationData ? (
                  <div className="flex items-center gap-2">
                    {getLocationIcon(selectedLocationData.type)}
                    <span>
                      {formatDisplayAddress(selectedLocationData.address) || 'Unnamed Location'}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {getLocationTypeLabel(selectedLocationData.type)}
                    </Badge>
                  </div>
                ) : (
                  "Select a location"
                )}
              </SelectValue>
            </SelectTrigger>
            
            <SelectContent>
              <SelectGroup>
                <div className="px-3 py-2 text-xs font-semibold text-primary">
                  Available Locations ({locations.length})
                </div>
                {locations.map((location) => (
                  <SelectItem
                    key={location.id}
                    value={String(location.id)}
                    className="font-medium"
                  >
                     <div className="flex items-center gap-2">
                       {getLocationIcon(location.type)}
                       <div className="flex flex-col">
                         <span>
                           {formatDisplayAddress(location.address) || 'Unnamed Location'}
                         </span>
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           <Badge variant="outline" className="text-xs">
                             {getLocationTypeLabel(location.type)}
                           </Badge>
                           {location._count && (
                             <span>
                               {location._count.employees} employees • {location._count.routes} routes
                             </span>
                           )}
                         </div>
                       </div>
                     </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {selectedLocationData && (
            <div className={styles.selectedLocationInfo}>
              <div className="flex items-center gap-2 text-sm">
                {getLocationIcon(selectedLocationData.type)}
                <span className="font-medium">
                  {formatDisplayAddress(selectedLocationData.address) || 'Unnamed Location'}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {getLocationTypeLabel(selectedLocationData.type)}
                </Badge>
              </div>
              {selectedLocationData.address && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDisplayAddress(selectedLocationData.address) || selectedLocationData.address}
                </div>
              )}
              {selectedLocationData._count && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span>{selectedLocationData._count.employees} employees</span>
                  <span>{selectedLocationData._count.routes} routes</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.locationStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              <Building2 className="w-4 h-4 inline mr-1" />
              Total Locations
            </span>
            <span className={styles.statValue}>{locations.length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              <MapPin className="w-4 h-4 inline mr-1" />
              Available
            </span>
            <span className={styles.statValue}>
              {locations.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

LocationSelection.propTypes = {
  selectedLocation: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onLocationChange: PropTypes.func.isRequired,
  locations: PropTypes.array,
  disabled: PropTypes.bool,
};