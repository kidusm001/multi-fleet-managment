import { useState } from 'react'
import PropTypes from 'prop-types'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

function ShuttleList({ route, shift, selectedTime }) {
  const [expandedCard, setExpandedCard] = useState(0)

  if (!route || !shift || !selectedTime) return null

  const totalCapacity = route.shuttles.reduce(
    (sum, shuttle) => sum + shuttle.capacity,
    0
  )
  const totalCurrentLoad = route.shuttles.reduce(
    (sum, shuttle) => sum + (shuttle.currentLoad[shift]?.[selectedTime] || 0),
    0
  )
  
  const occupancyPercentage = (totalCurrentLoad / totalCapacity) * 100

  return (
    <div>
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <h3 className="text-gray-800 text-lg font-semibold mb-6 flex items-center gap-3 
                     before:content-[''] before:block before:w-1.5 before:h-7 before:bg-indigo-500 before:rounded-full">
          Route Capacity Overview
        </h3>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">
              Total Occupancy
            </span>
            <span className="text-sm font-medium text-gray-900">
              {totalCurrentLoad}/{totalCapacity} seats
            </span>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`absolute h-full rounded-full transition-all duration-300 ${
                occupancyPercentage >= 90 
                  ? 'bg-red-500' 
                  : occupancyPercentage >= 75 
                    ? 'bg-amber-500' 
                    : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-gray-800 text-lg font-semibold mb-6 flex items-center gap-3 
                     before:content-[''] before:block before:w-1.5 before:h-7 before:bg-indigo-500 before:rounded-full">
          Available Shuttles
        </h3>
        <div className="space-y-4">
          {route.shuttles.map((shuttle, index) => {
            const isExpanded = expandedCard === index
            const currentPassengers = shuttle.passengers[selectedTime] || []
            const occupancy = (shuttle.currentLoad[shift]?.[selectedTime] || 0) / shuttle.capacity * 100
            
            return (
              <div
                key={shuttle.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 
                         hover:border-gray-300 hover:shadow-sm"
              >
                <div
                  onClick={() => setExpandedCard(isExpanded ? -1 : index)}
                  className="flex justify-between items-center p-5 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">{shuttle.id}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        Shuttle {shuttle.id}
                      </h4>
                      <p className="text-sm text-gray-500">{shuttle.routeVariation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-medium 
                              ${occupancy >= 90 
                                ? 'bg-red-50 text-red-700' 
                                : occupancy >= 75 
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-indigo-50 text-indigo-700'}`}
                    >
                      {shuttle.currentLoad[shift]?.[selectedTime] || 0}/{shuttle.capacity}
                    </span>
                    <ChevronDownIcon 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 
                              ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                <div
                  className={`transition-all duration-300 ${
                    isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-5 border-t border-gray-100">
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-4">
                        Current Passengers ({currentPassengers.length})
                      </h5>
                      <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                        {currentPassengers.map((passenger) => (
                          <div
                            key={passenger.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center 
                                          text-indigo-600 font-medium text-sm">
                                {passenger.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-medium text-gray-900">{passenger.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              📍 {passenger.location}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

ShuttleList.propTypes = {
  route: PropTypes.shape({
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
  }),
  shift: PropTypes.string,
  selectedTime: PropTypes.string,
}

export default ShuttleList
