import PropTypes from 'prop-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/Common/UI/Select';
import { ROLES, ROLE_LABELS } from '@data/constants';

export function RoleSelector({ role, setRole }) {
  return (
    <div className="mb-4">
      <Select value={role} onValueChange={setRole}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select role">
            {ROLE_LABELS[role]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLES).map(([, value]) => (
            <SelectItem key={value} value={value}>
              {ROLE_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

RoleSelector.propTypes = {
  role: PropTypes.string.isRequired,
  setRole: PropTypes.func.isRequired,
}; 