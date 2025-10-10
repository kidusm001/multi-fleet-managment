import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { format, parseISO } from 'date-fns';

function UpcomingShiftsList({ shifts }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  if (!shifts || shifts.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className={cn(
        "text-lg font-semibold mb-3",
        isDark ? "text-gray-100" : "text-gray-900"
      )}>
        🔜 Upcoming Shifts
      </h2>
      <div className="space-y-3">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            onClick={() => navigate(`/driver/route/${shift.id}`)}
            className={cn(
              "rounded-lg p-4 cursor-pointer transition-all",
              isDark
                ? "bg-gray-800/50 hover:bg-gray-800"
                : "bg-white border border-gray-200 hover:shadow-md"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className={cn(
                    "text-sm font-medium",
                    isDark ? "text-gray-300" : "text-gray-700"
                  )}>
                    {shift.date ? format(parseISO(shift.date), 'EEEE, MMM d') : 'Date TBD'}
                  </span>
                </div>

                <h3 className={cn(
                  "text-base font-semibold",
                  isDark ? "text-gray-100" : "text-gray-900"
                )}>
                  {shift.name} - {shift.shift?.name}
                </h3>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                      {shift.startTime || 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                      {shift.stops?.length || 0} stops
                    </span>
                  </div>
                </div>
              </div>

              <button className={cn(
                "text-sm font-medium px-3 py-1.5 rounded-lg",
                isDark
                  ? "text-blue-400 hover:bg-blue-900/30"
                  : "text-blue-600 hover:bg-blue-50"
              )}>
                View →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UpcomingShiftsList;
