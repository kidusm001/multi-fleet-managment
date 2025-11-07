import { useTheme } from '@/contexts/ThemeContext';
import RouteCompletionButton from '@/components/Routes/RouteCompletionButton';

/**
 * Example integration of RouteCompletionButton in Active Route Card
 * Add this to your DriverPortal/components/ActiveRouteCard.jsx
 */

// ... existing imports and component code ...

const ActiveRouteCard = ({ route, onRouteUpdate }) => {
  const { theme } = useTheme();

  const handleRouteCompleted = (completion) => {
    console.log('Route completed:', completion);
    
    // Update the parent component
    if (onRouteUpdate) {
      onRouteUpdate();
    }

    // Optional: Show completion summary
    // showCompletionModal(completion);
  };

  return (
    <div className="active-route-card">
      {/* ... existing route card content ... */}
      
      {/* Route header with name and status */}
      <div className="route-header">
        <h3>{route.name}</h3>
        <span className="status-badge">{route.status}</span>
      </div>

      {/* Route details: stops, distance, etc. */}
      <div className="route-details">
        <div className="detail-item">
          <span>Total Stops:</span>
          <span>{route.stops?.length || 0}</span>
        </div>
        <div className="detail-item">
          <span>Distance:</span>
          <span>{route.totalDistance} km</span>
        </div>
        <div className="detail-item">
          <span>Est. Time:</span>
          <span>{route.totalTime} min</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="route-actions">
        <RouteCompletionButton
          routeId={route.id}
          onComplete={handleRouteCompleted}
          variant="success"
          size="lg"
          label="Complete Route"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default ActiveRouteCard;
