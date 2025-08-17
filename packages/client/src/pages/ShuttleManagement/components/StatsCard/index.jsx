import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, change, type }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        <p
          className={cn(
            'ml-2 flex items-baseline text-sm font-semibold',
            type === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          {type === 'increase' ? (
            <ArrowUp className="w-3 h-3 mr-0.5 flex-shrink-0 self-center" />
          ) : (
            <ArrowDown className="w-3 h-3 mr-0.5 flex-shrink-0 self-center" />
          )}
          {change}
        </p>
      </div>
    </div>
  );
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  type: PropTypes.oneOf(['increase', 'decrease']).isRequired,
}; 