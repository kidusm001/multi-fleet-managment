import PropTypes from "prop-types";
import mapboxgl from "mapbox-gl";

import { HQ_LOCATION } from "@/config";

export function HQMarker({ map, location = null }) {
  // Use provided location or fallback to default HQ
  const markerLocation = location || HQ_LOCATION;
  
  // Create HQ marker element
  const el = document.createElement("div");
  el.className = "drop-off-order hq-marker";
  el.style.cssText = `
    background-color: #10B981;
    color: white;
    padding: 6px 10px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: bold;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 2;
    cursor: pointer;
  `;
  el.innerHTML = markerLocation.type === 'BRANCH' ? "Branch" : "HQ";

  const popup = new mapboxgl.Popup({
    closeButton: false,
    className: "drop-off-popup",
    offset: 25,
    anchor: "bottom",
    focusAfterOpen: false,
  }).setHTML(`
    <div style="padding: 8px; min-width: 150px;">
      <div style="color: #10B981; font-weight: bold; margin-bottom: 4px;">${markerLocation.name || markerLocation.address || 'Location'}</div>
      <div style="margin: 0; font-size: 12px;">${markerLocation.address || 'Addis Ababa, Ethiopia'}</div>
    </div>
  `);

  const marker = new mapboxgl.Marker({
    element: el,
    anchor: "center",
  })
    .setLngLat(markerLocation.coords || [markerLocation.longitude, markerLocation.latitude])
    .setPopup(popup)
    .addTo(map);

  // Handle click event
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    marker.togglePopup();
  });

  return marker;
}

export function RouteMarkers({ map, route, shuttle, currentUserId = null }) {
  if (!route?.coordinates?.length) {
    return [];
  }

  const coordinateGroups = new Map();

  route.coordinates.forEach((coords, index) => {
    if (!Array.isArray(coords) || coords.length !== 2) {
      return;
    }

    const [longitude, latitude] = coords;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return;
    }

    const key = `${longitude.toFixed(6)}|${latitude.toFixed(6)}`;
    if (!coordinateGroups.has(key)) {
      coordinateGroups.set(key, { coords: [longitude, latitude], indices: [] });
    }

    coordinateGroups.get(key).indices.push(index);
  });

  const markers = [];

  coordinateGroups.forEach(({ coords, indices }) => {
    const groupedStops = indices.map((stopIndex) => ({
      stopIndex,
      stopNumber: stopIndex + 1,
      area: route.areas?.[stopIndex] || "Unassigned Stop",
      employeeUserId: route.employeeUserIds?.[stopIndex] || null,
    }));

    const hasCurrentUser = Boolean(
      currentUserId && groupedStops.some((stop) => stop.employeeUserId === currentUserId)
    );

    const labels = groupedStops.map((stop) => stop.stopNumber);
    const labelText =
      labels.length === 1
        ? labels[0].toString()
        : labels.length <= 3
        ? labels.join(" & ")
        : `${labels.length} stops`;

    const el = document.createElement("div");
    el.className = "drop-off-order";

    const fontSize = labelText.length > 6 ? "12px" : hasCurrentUser ? "16px" : "14px";
    const padding = labelText.length > 6 ? "6px 8px" : hasCurrentUser ? "8px 12px" : "6px 10px";

    el.style.cssText = `
      background-color: ${hasCurrentUser ? "#10B981" : "#4272FF"};
      color: white;
      padding: ${padding};
      border-radius: 18px;
      font-size: ${fontSize};
      font-weight: bold;
      border: 3px solid white;
      box-shadow: 0 ${hasCurrentUser ? "4px 8px" : "2px 4px"} rgba(0,0,0,0.2);
      z-index: ${hasCurrentUser ? "3" : "1"};
      cursor: pointer;
      transform: ${hasCurrentUser ? "scale(1.08)" : "scale(1)"};
      white-space: nowrap;
    `;
    el.innerHTML = labelText;

    const stopSections = groupedStops
      .map((stop) => {
        const sanitizedArea = stop.area.replace(/\n/g, "<br />");
        const stopColor = stop.employeeUserId === currentUserId ? "#10B981" : "#1f2937";
        return `
          <div style="margin-bottom: 6px;">
            <div style="font-weight: 600; color: ${stopColor};">Stop ${stop.stopNumber}</div>
            <div style="font-size: 12px; color: #4b5563;">${sanitizedArea}</div>
          </div>
        `;
      })
      .join('<hr style="border: 0; height: 1px; background: #e5e7eb; margin: 6px 0;" />');

    const shuttleSection = shuttle
      ? `
        <div style="margin-top: 4px; font-size: 12px; color: #666;">
          <div>Shuttle: ${shuttle.id}</div>
          <div>Driver: ${shuttle.driver || "Not assigned"}</div>
          <div>Capacity: ${shuttle.capacity}</div>
        </div>
      `
      : "";

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      className: "drop-off-popup",
      focusAfterOpen: false,
      anchor: "bottom",
    }).setHTML(`
      <div style="padding: 8px;">
        ${stopSections}
        ${shuttleSection}
      </div>
    `);

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat(coords)
      .setPopup(popup)
      .addTo(map);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".mapboxgl-popup").forEach((p) => p.remove());
    });

    markers.push(marker);
  });

  return markers;
}

HQMarker.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.string,
    type: PropTypes.string,
    coords: PropTypes.arrayOf(PropTypes.number),
    longitude: PropTypes.number,
    latitude: PropTypes.number,
  }),
};

RouteMarkers.propTypes = {
  map: PropTypes.object.isRequired,
  route: PropTypes.shape({
    coordinates: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.number.isRequired)
    ).isRequired,
    areas: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    employeeUserIds: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  shuttle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired,
    driver: PropTypes.string,
  }),
  currentUserId: PropTypes.string,
};
