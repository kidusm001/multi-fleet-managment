import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  XMarkIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

function AssignmentModal({
  employee,
  route,
  shift,
  selectedTime,
  onClose,
  onAssign,
}) {
  const availableShuttles = route.shuttles
    .filter((shuttle) => {
      const currentLoad = shuttle.currentLoad[shift]?.[selectedTime] || 0
      return currentLoad < shuttle.capacity
    })
    .map((shuttle) => ({
      ...shuttle,
      currentOccupancy: shuttle.currentLoad[shift]?.[selectedTime] || 0,
      optimalityScore: calculateOptimalityScore(shuttle, shift, selectedTime),
    }))
    .sort((a, b) => b.optimalityScore - a.optimalityScore)

  const [selectedPickupPoints, setSelectedPickupPoints] = useState(
    Object.fromEntries(availableShuttles.map((s) => [s.id, employee.location]))
  )

  function calculateOptimalityScore(shuttle, shift, selectedTime) {
    const currentLoad = shuttle.currentLoad[shift]?.[selectedTime] || 0
    const loadFactor = 1 - currentLoad / shuttle.capacity
    return loadFactor * 100
  }

  function handleAssign(shuttleId) {
    onAssign(employee.id, shuttleId, selectedPickupPoints[shuttleId])
  }

  if (availableShuttles.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl max-w-[800px] w-[90%] max-h-[90vh] relative p-10 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              No Available Shuttles
            </h3>
            <p className="text-gray-600">
              All shuttles on this route are currently at full capacity. Please
              try a different route or time slot.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl max-w-[800px] w-[90%] max-h-[90vh] overflow-y-auto relative p-10 shadow-2xl">
        <div className="mb-8 pr-10">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Assign {employee.name}
          </h3>
          <p className="text-gray-600 text-[0.9375rem]">
            Location: {employee.location} | Department: {employee.department}
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>

        <div className="space-y-6">
          {availableShuttles.map((shuttle, index) => (
            <div
              key={shuttle.id}
              className={`bg-gray-50 rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
                index === 0
                  ? 'bg-white border-indigo-500 border-2'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  Shuttle {shuttle.id}
                  {index === 0 && (
                    <span className="ml-3 px-3 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      Recommended
                    </span>
                  )}
                </h4>
                <div className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 font-medium flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-gray-500" />
                  {shuttle.currentOccupancy}/{shuttle.capacity} seats occupied
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 bg-white rounded-xl border border-gray-200">
                  <p className="text-[0.9375rem] text-gray-700 mb-4">
                    <strong>Route Variation:</strong> {shuttle.routeVariation}
                  </p>
                  <p className="text-[0.9375rem] text-gray-700 mb-4">
                    <strong>Optimality Score:</strong>{' '}
                    {shuttle.optimalityScore.toFixed(1)}%
                  </p>
                  <div className="flex gap-4 mt-6">
                    <select
                      value={selectedPickupPoints[shuttle.id]}
                      onChange={(e) =>
                        setSelectedPickupPoints({
                          ...selectedPickupPoints,
                          [shuttle.id]: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-sm text-gray-800"
                    >
                      <option value="">Select Pickup Point</option>
                      {route.areas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(shuttle.id)}
                      disabled={!selectedPickupPoints[shuttle.id]}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg 
                               hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-gray-200">
                  <h5 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-gray-500" />
                    Current Passengers
                  </h5>
                  <div className="max-h-[300px] overflow-y-auto">
                    {(shuttle.passengers[selectedTime] || []).map(
                      (passenger) => (
                        <div
                          key={passenger.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2"
                        >
                          <span className="font-medium text-gray-800">
                            {passenger.name}
                          </span>
                          <span className="text-gray-600 text-sm">
                            📍 {passenger.location}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

AssignmentModal.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    department: PropTypes.string.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    id: PropTypes.string.isRequired,
    areas: PropTypes.arrayOf(PropTypes.string).isRequired,
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
  }).isRequired,
  shift: PropTypes.string.isRequired,
  selectedTime: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
}

export default AssignmentModal
