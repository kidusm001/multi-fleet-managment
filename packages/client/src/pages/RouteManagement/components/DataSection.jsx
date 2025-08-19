import React from 'react'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { employees } from '@data/routeAssignmentData'
import AssignmentModal from './AssignmentModal'

function DataSection({
  selectedShift,
  selectedTime,
  selectedRoute,
  shuttleData,
  setShuttleData,
}) {
  const [availableEmployees, setAvailableEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  const isAssigned = (employee, shuttleData, shift, time) => {
    return shuttleData.some((route) =>
      route.shuttles.some((shuttle) =>
        (shuttle.passengers[time] || []).some((p) => p.id === employee.id)
      )
    )
  }

  useEffect(() => {
    const filtered = employees.filter((emp) => {
      const assigned = isAssigned(emp, shuttleData, selectedShift, selectedTime)

      if (assigned) return false
      if (!selectedShift) return false
      if (!selectedRoute) return emp.preferredShift.toString() === selectedShift

      const route = shuttleData.find((r) => r.id === selectedRoute)
      return (
        emp.preferredShift.toString() === selectedShift &&
        route.areas.includes(emp.location)
      )
    })
    setAvailableEmployees(filtered)
  }, [selectedShift, selectedRoute, shuttleData, selectedTime])

  const handleAssign = (employee) => {
    setSelectedEmployee(employee)
    setShowModal(true)
  }

  const handleConfirmAssignment = (employeeId, shuttleId, pickupPoint) => {
    const employee = availableEmployees.find((emp) => emp.id === employeeId)
    const updatedShuttleData = shuttleData.map((route) => {
      const updatedShuttles = route.shuttles.map((shuttle) => {
        if (shuttle.id === shuttleId) {
          const currentPassengers = shuttle.passengers[selectedTime] || []
          const updatedPassengers = {
            ...shuttle.passengers,
            [selectedTime]: [
              ...currentPassengers,
              {
                id: employee.id,
                name: employee.name,
                location: pickupPoint,
              },
            ],
          }

          const currentLoadForShift = shuttle.currentLoad[selectedShift] || {}
          const updatedCurrentLoad = {
            ...shuttle.currentLoad,
            [selectedShift]: {
              ...currentLoadForShift,
              [selectedTime]: (currentLoadForShift[selectedTime] || 0) + 1,
            },
          }

          return {
            ...shuttle,
            passengers: updatedPassengers,
            currentLoad: updatedCurrentLoad,
          }
        }
        return shuttle
      })

      return { ...route, shuttles: updatedShuttles }
    })

    setShuttleData(updatedShuttleData)
    setShowModal(false)
  }

  return (
    <div className="bg-white rounded-3xl p-8">
      <h3
        className="text-xl font-semibold text-gray-800 mb-8 flex items-center gap-3 
                     before:content-[''] before:block before:w-1.5 before:h-7 before:bg-indigo-500 before:rounded-full"
      >
        Available Employees
      </h3>

      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/75">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {availableEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {employee.id}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
                        {employee.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">
                        {employee.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {employee.location}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {employee.department}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleAssign(employee)}
                      disabled={!selectedRoute || !selectedShift}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg 
                               hover:bg-indigo-600 transition-colors disabled:opacity-50 
                               disabled:cursor-not-allowed shadow-sm hover:shadow-md
                               active:transform active:scale-95"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedEmployee && (
        <AssignmentModal
          employee={selectedEmployee}
          route={shuttleData.find((r) => r.id === selectedRoute)}
          shift={selectedShift}
          selectedTime={selectedTime}
          onClose={() => setShowModal(false)}
          onAssign={handleConfirmAssignment}
        />
      )}
    </div>
  )
}

DataSection.propTypes = {
  selectedShift: PropTypes.string,
  selectedTime: PropTypes.string,
  selectedRoute: PropTypes.string,
  shuttleData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      shuttles: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
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
  setShuttleData: PropTypes.func.isRequired,
}

export default DataSection
