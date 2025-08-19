import PropTypes from "prop-types";
import mapboxgl from "mapbox-gl";

import { HQ_LOCATION } from "@/config";

export function HQMarker({ map }) {
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
  el.innerHTML = "HQ";

  const popup = new mapboxgl.Popup({
    closeButton: false,
    className: "drop-off-popup",
    offset: 25,
    anchor: "bottom",
    focusAfterOpen: false,
  }).setHTML(`
    <div style="padding: 8px; min-width: 150px;">
      <div style="color: #10B981; font-weight: bold; margin-bottom: 4px;">Routegna HQ</div>
      <div style="margin: 0; font-size: 12px;">Addis Ababa, Ethiopia</div>
    </div>
  `);

  const marker = new mapboxgl.Marker({
    element: el,
    anchor: "center",
  })
    .setLngLat(HQ_LOCATION.coords)
    .setPopup(popup)
    .addTo(map);

  // Handle click event
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    marker.togglePopup();
  });

  return marker;
}

export function RouteMarkers({ map, route, shuttle }) {
  return route.areas.map((area, index) => {
    const el = document.createElement("div");
    el.className = "drop-off-order";
    el.style.cssText = `
      background-color: #4272FF;
      color: white;
      padding: 6px 10px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: bold;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      z-index: 1;
      cursor: pointer;
    `;
    el.innerHTML = (index + 1).toString();

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      className: "drop-off-popup",
      focusAfterOpen: false,
      anchor: "bottom",
    }).setHTML(`
      <div style="padding: 8px;">
        <div style="font-weight: bold;">Drop-off Point ${index + 1}</div>
        <div>${area}</div>
        ${
          shuttle
            ? `
          <div style="margin-top: 4px; font-size: 12px; color: #666;">
            <div>Shuttle: ${shuttle.id}</div>
            <div>Driver: ${shuttle.driver || "Not assigned"}</div>
            <div>Capacity: ${shuttle.capacity}</div>
          </div>
        `
            : ""
        }
      </div>
    `);

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat(route.coordinates[index])
      .setPopup(popup)
      .addTo(map);

    // Handle click event to close other popups
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close other popups
      document.querySelectorAll(".mapboxgl-popup").forEach((p) => p.remove());
    });

    return marker;
  });
}

HQMarker.propTypes = {
  map: PropTypes.object.isRequired,
};

RouteMarkers.propTypes = {
  map: PropTypes.object.isRequired,
  route: PropTypes.shape({
    coordinates: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.number.isRequired)
    ).isRequired,
    areas: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  }).isRequired,
  shuttle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired,
    driver: PropTypes.string,
  }),
};
