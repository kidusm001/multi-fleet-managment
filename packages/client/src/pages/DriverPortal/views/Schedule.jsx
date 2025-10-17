import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { driverService } from '@services/driverService';
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

function ScheduleView() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        // Get schedule for current month and next month (2 months total for efficiency)
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0, 23, 59, 59);
        
        const from = start.toISOString();
        const to = end.toISOString();
        const data = await driverService.getSchedule({ from, to });
        setSchedule(data || []);
      } catch (error) {
        console.error('Failed to load schedule:', error);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [currentMonth]);

  // Get calendar data
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const resolveRouteDate = (route) => {
    if (route.date) {
      return new Date(route.date);
    }
    if (route.startTime) {
      return new Date(route.startTime);
    }
    if (route.shift?.startTime) {
      return new Date(route.shift.startTime);
    }
    return null;
  };

  const resolveRouteStartTime = (route) => {
    if (route.startTime) {
      return new Date(route.startTime);
    }
    if (route.shift?.startTime) {
      return new Date(route.shift.startTime);
    }
    return null;
  };

  const getRoutesForDate = (date) => {
    const target = new Date(date);
    const dateStr = target.toISOString().split('T')[0];
    return schedule
      .filter(route => {
        const routeDate = resolveRouteDate(route);
        if (!routeDate) return false;
        return routeDate.toISOString().split('T')[0] === dateStr;
      })
      .sort((a, b) => {
        const aStart = resolveRouteStartTime(a)?.getTime() ?? 0;
        const bStart = resolveRouteStartTime(b)?.getTime() ?? 0;
        return aStart - bStart;
      });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-blue-500',
      IN_PROGRESS: 'bg-green-500',
      COMPLETED: 'bg-gray-400',
      CANCELLED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#f3684e]" />
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
            Loading your schedule...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen p-4 md:p-6",
      isDark ? "bg-gray-900" : "bg-gray-50"
    )}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-gray-800" : "bg-white"
            )}>
              <Calendar className="w-5 h-5 text-[#f3684e]" />
            </div>
            <div>
              <h1 className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                My Schedule
              </h1>
              <p className={cn(
                "text-sm",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                {schedule.length} {schedule.length === 1 ? 'route' : 'routes'} this month
              </p>
            </div>
          </div>
          <button
            onClick={handleToday}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              isDark
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-100"
            )}
          >
            Today
          </button>
        </div>

        {/* Calendar */}
        <div className={cn(
          "rounded-2xl border overflow-hidden",
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          {/* Calendar Header */}
          <div className={cn(
            "flex items-center justify-between p-4 border-b",
            isDark ? "border-gray-700" : "border-gray-200"
          )}>
            <button
              onClick={handlePrevMonth}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className={cn(
              "text-lg font-semibold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={handleNextMonth}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className={cn(
                  "p-3 text-center text-sm font-medium border-r last:border-r-0",
                  isDark
                    ? "bg-gray-750 text-gray-400 border-gray-700"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const date = day ? new Date(year, month, day) : null;
              const routes = date ? getRoutesForDate(date) : [];
              const hasRoutes = routes.length > 0;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] p-2 border-r border-b last:border-r-0",
                    isDark ? "border-gray-700" : "border-gray-200",
                    !day && (isDark ? "bg-gray-800/50" : "bg-gray-50/50")
                  )}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                            isToday(day)
                              ? "bg-[#f3684e] text-white"
                              : isDark
                              ? "text-gray-300"
                              : "text-gray-700"
                          )}
                        >
                          {day}
                        </span>
                        {hasRoutes && (
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full",
                            isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
                          )}>
                            {routes.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Routes for this day */}
                      <div className="space-y-1">
                        {routes.slice(0, 2).map((route) => {
                          const isVirtual = Boolean(route.isVirtual);
                          const routeStart = resolveRouteStartTime(route);

                          return (
                            <div
                              key={route.id}
                              onClick={() => {
                                if (isVirtual) {
                                  return;
                                }
                                const firstStopId = route.stops?.[0]?.id || '';
                                navigate(`/driver/navigate/${route.id}/${firstStopId}`);
                              }}
                              className={cn(
                                "text-xs p-1.5 rounded transition-colors",
                                isVirtual ? "cursor-default" : "cursor-pointer",
                                isDark
                                  ? isVirtual
                                    ? "bg-gray-700/40"
                                    : "bg-gray-700/50 hover:bg-gray-700"
                                  : isVirtual
                                    ? "bg-white border border-dashed border-gray-200"
                                    : "bg-gray-100 hover:bg-gray-200"
                              )}
                            >
                              {isVirtual && (
                                <div className={cn(
                                  "text-[10px] uppercase tracking-wide mb-0.5",
                                  isDark ? "text-amber-300/80" : "text-amber-600"
                                )}>
                                  Recurring pattern
                                </div>
                              )}
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  getStatusColor(route.status)
                                )} />
                                <span className={cn(
                                  "font-medium truncate",
                                  isDark ? "text-gray-200" : "text-gray-900"
                                )}>
                                  {routeStart
                                    ? routeStart.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })
                                    : 'Time TBD'}
                                </span>
                              </div>
                              <div className={cn(
                                "truncate",
                                isDark ? "text-gray-400" : "text-gray-600"
                              )}>
                                {route.name || `Route ${route.id.slice(0, 8)}`}
                              </div>
                            </div>
                          );
                        })}
                        {routes.length > 2 && (
                          <div className={cn(
                            "text-xs text-center py-1",
                            isDark ? "text-gray-500" : "text-gray-500"
                          )}>
                            +{routes.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className={cn(
          "rounded-xl border p-4",
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <h3 className={cn(
            "text-sm font-semibold mb-3",
            isDark ? "text-gray-200" : "text-gray-900"
          )}>
            Status Legend
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className={cn(
                "text-sm",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                Pending
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className={cn(
                "text-sm",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                In Progress
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className={cn(
                "text-sm",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                Completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className={cn(
                "text-sm",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                Cancelled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleView;
