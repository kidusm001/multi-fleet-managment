import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@components/Common/UI/Button';
import { Input } from '@/components/Common/UI/Input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@components/Common/UI/Select';
import Modal from '@components/Common/UI/Modal';
import './AssignmentModal.css';

const AssignmentModal = ({ isOpen, onClose, selectedShuttle: _selectedShuttle, onAssign }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Shuttle">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Shuttle Name
          </label>
          <Input
            type="text"
            placeholder="Enter shuttle name"
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Driver
          </label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="john">John Doe</SelectItem>
              <SelectItem value="jane">Jane Smith</SelectItem>
              <SelectItem value="mike">Mike Johnson</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Capacity
          </label>
          <Input
            type="number"
            placeholder="Enter capacity"
            className="mt-1"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onAssign({ /* assignment data */ })}>
            Assign
          </Button>
        </div>
      </div>
    </Modal>
  );
};

AssignmentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedShuttle: PropTypes.object,
  onAssign: PropTypes.func.isRequired,
};

export default AssignmentModal; 