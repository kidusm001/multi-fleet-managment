import React from 'react'
import { useEffect } from 'react'
import PropTypes from 'prop-types'
import Map from './Map'
import ShuttleList from './ShuttleList'
import { ClockIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { shifts } from '@data/routeAssignmentData'

function Controls({
  selectedShift,
  setSelectedShift,
  selectedRoute,
  setSelectedRoute,
  selectedTime,
  setSelectedTime,
  shuttleData,
}) {
  const currentShift = shifts.find(s => s.value === selectedShift)

  useEffect(() => {
    setSelectedRoute('')
    setSelectedTime('')
  }, [selectedShift, setSelectedRoute, setSelectedTime])

  const currentRoute = shuttleData.find((route) => route.id === selectedRoute)

  return (
    <div className="border-r border-gray-200 pr-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <h3 className="text-gray-800 text-lg font-semibold mb-6 flex items-center gap-3 
                     before:content-[''] before:block before:w-1.5 before:h-7 before:bg-indigo-500 before:rounded-full">
          Route Filters
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-gray-500" />
                Select Shift
              </div>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {shifts.map((shift) => (
                <button
                  key={shift.value}
                  onClick={() => setSelectedShift(shift.value)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all
                    ${selectedShift === shift.value
                      ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200'
                      : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:border-gray-200'
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">{shift.icon}</span>
                    <span className="text-xs whitespace-nowrap">{shift.label.split(' ')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedShift && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  Select Time
                </div>
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 
                         appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%236B7280%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27%3E%3C/path%3E%3C/svg%3E')] 
                         bg-no-repeat bg-[length:1rem] bg-[center_right_1rem]
                         focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10"
              >
                <option value="">Select Time</option>
                {currentShift?.times.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-gray-500" />
                Select Route
              </div>
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              disabled={!selectedShift || !selectedTime}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 
                       appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%236B7280%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27%3E%3C/path%3E%3C/svg%3E')] 
                       bg-no-repeat bg-[length:1rem] bg-[center_right_1rem]
                       focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10
                       disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <option value="">Select Route</option>
              {shuttleData.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedRoute && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            <Map route={currentRoute} />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-gray-800 text-lg font-semibold mb-6 flex items-center gap-3 
                         before:content-[''] before:block before:w-1.5 before:h-7 before:bg-indigo-500 before:rounded-full">
              Route Overview
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Total Stops:</span>
                <span className="font-medium">{currentRoute.areas.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Available Shuttles:</span>
                <span className="font-medium">
                  {currentRoute.shuttles.length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Route Distance:</span>
                <span className="font-medium">
                  {calculateRouteDistance(currentRoute.coordinates).toFixed(1)}{' '}
                  km
                </span>
              </div>
            </div>
          </div>

          <ShuttleList route={currentRoute} shift={selectedShift} selectedTime={selectedTime} />
        </div>
      )}
    </div>
  )
}

// Helper function to calculate route distance
function calculateRouteDistance(coordinates) {
  let distance = 0
  for (let i = 0; i < coordinates.length - 1; i++) {
    distance += getDistance(
      coordinates[i][1],
      coordinates[i][0],
      coordinates[i + 1][1],
      coordinates[i + 1][0]
    )
  }
  return distance
}

// Haversine formula to calculate distance between coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180
}

Controls.propTypes = {
  selectedShift: PropTypes.string.isRequired,
  setSelectedShift: PropTypes.func.isRequired,
  selectedRoute: PropTypes.string.isRequired,
  setSelectedRoute: PropTypes.func.isRequired,
  selectedTime: PropTypes.string.isRequired,
  setSelectedTime: PropTypes.func.isRequired,
  shuttleData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      areas: PropTypes.arrayOf(PropTypes.string).isRequired,
      coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
      shuttles: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          capacity: PropTypes.number.isRequired,
          currentLoad: PropTypes.object.isRequired,
          routeVariation: PropTypes.string.isRequired,
          passengers: PropTypes.objectOf(
            PropTypes.arrayOf(
              PropTypes.shape({
                id: PropTypes.string.isRequired,
                name: PropTypes.string.isRequired,
                location: PropTypes.string.isRequired,
              })
            )
          ).isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
}

export default Controls
