import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Bell } from 'lucide-react';
import { Button } from '@components/Common/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/Common/UI/Card';
import { Badge } from '@/components/Common/UI/Badge';
import { employees } from '@data/routeAssignmentData';
import AssignmentModal from './AssignmentModal';
import './DataSection.css';

const DataSection = ({
  selectedShift,
  selectedTime,
  selectedRoute,
  shuttleData,
  setShuttleData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShuttle, setSelectedShuttle] = useState(null);

  const selectedRouteData = shuttleData.find(route => route.name === selectedRoute);

  return (
    <div className="data-section">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Route Details</CardTitle>
            <Button onClick={() => setIsModalOpen(true)}>
              <Bell className="h-4 w-4 mr-2" />
              Assign Shuttle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedRouteData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {selectedRouteData.shuttles.map(shuttle => (
                  <Card key={shuttle.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{shuttle.name}</h3>
                      <Badge>{shuttle.capacity} seats</Badge>
                    </div>
                    <p className="text-sm text-gray-500">Driver: {shuttle.driver}</p>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Select a route to view details
            </div>
          )}
        </CardContent>
      </Card>

      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedShuttle={selectedShuttle}
        onAssign={(data) => {
          // Handle assignment logic
          console.log('Assignment data:', data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

DataSection.propTypes = {
  selectedShift: PropTypes.string.isRequired,
  selectedTime: PropTypes.string.isRequired,
  selectedRoute: PropTypes.string.isRequired,
  shuttleData: PropTypes.array.isRequired,
  setShuttleData: PropTypes.func.isRequired,
};

export default DataSection; 