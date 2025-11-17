import React from 'react';
import PropTypes from 'prop-types';
import { shifts } from '@data/routeAssignmentData';
import { ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@components/Common/UI/Select';
import './Controls.css';

const Controls = ({
  selectedShift,
  setSelectedShift,
  selectedRoute,
  setSelectedRoute,
  shuttleData,
}) => {
  return (
    <div className="controls">
      <div className="control-group">
        <div className="control-item">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          <Select value={selectedShift} onValueChange={setSelectedShift}>
            <SelectTrigger>
              <SelectValue placeholder="Select Shift" />
            </SelectTrigger>
            <SelectContent>
              {shifts.map((shift) => (
                <SelectItem key={shift.value} value={shift.value}>
                  {shift.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="control-item">
          <MapPinIcon className="h-5 w-5 text-gray-500" />
          <Select value={selectedRoute} onValueChange={setSelectedRoute}>
            <SelectTrigger>
              <SelectValue placeholder="Select Route" />
            </SelectTrigger>
            <SelectContent>
              {shuttleData.map((route) => (
                <SelectItem key={route.id} value={route.name}>
                  {route.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

Controls.propTypes = {
  selectedShift: PropTypes.string.isRequired,
  setSelectedShift: PropTypes.func.isRequired,
  selectedTime: PropTypes.string.isRequired,
  setSelectedTime: PropTypes.func.isRequired,
  selectedRoute: PropTypes.string.isRequired,
  setSelectedRoute: PropTypes.func.isRequired,
  shuttleData: PropTypes.array.isRequired,
};

export default Controls; 