import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import mapboxgl from 'mapbox-gl'
import { MAPBOX_ACCESS_TOKEN } from '@data/routeAssignmentData'

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

function Map({ route }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!route) return

    // Initialize map if it doesn't exist
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: route.coordinates[0],
        zoom: 12,
      })
    } else {
      // If map exists, update the center
      map.current.setCenter(route.coordinates[0])
    }

    // Clean up previous markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Function to add route and markers
    const addRouteAndMarkers = () => {
      // Remove existing route layer and source if they exist
      if (map.current.getLayer('route')) map.current.removeLayer('route')
      if (map.current.getSource('route')) map.current.removeSource('route')

      // Add new route
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates,
          },
        },
      })

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#6366F1',
          'line-width': 4,
        },
      })

      // Add markers for each stop
      route.coordinates.forEach((coord, idx) => {
        const marker = new mapboxgl.Marker({ color: '#6366F1' })
          .setLngLat(coord)
          .setPopup(
            new mapboxgl.Popup().setHTML(`<h3>${route.areas[idx]}</h3>`)
          )
          .addTo(map.current)
        markersRef.current.push(marker)
      })
    }

    // Add route and markers when map is loaded
    if (map.current.loaded()) {
      addRouteAndMarkers()
    } else {
      map.current.on('load', addRouteAndMarkers)
    }

    return () => {
      // Cleanup function
      if (map.current) {
        if (map.current.getLayer('route')) map.current.removeLayer('route')
        if (map.current.getSource('route')) map.current.removeSource('route')
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []
      }
    }
  }, [route])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div ref={mapContainer} className="h-[250px] rounded-xl" />
    </div>
  )
}

Map.propTypes = {
  route: PropTypes.shape({
    coordinates: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.number.isRequired).isRequired
    ).isRequired,
    areas: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  }),
}

export default Map
