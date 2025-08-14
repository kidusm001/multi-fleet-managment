import { useState } from "react";
import PropTypes from "prop-types";
import {
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/Common/UI/Input";

function Controls({
  selectedShift,
  setSelectedShift,
  routes = [],
  shifts = [],
  loading = false,
  stats = {
    unassignedInShift: 0,
    totalRoutes: 0,
    availableSeats: 0,
  },
}) {
  const [searchShift, setSearchShift] = useState("");
  const currentShift = shifts.find((s) => s.id === selectedShift);

  const filteredShifts = shifts.filter(
    (shift) =>
      shift.name.toLowerCase().includes(searchShift.toLowerCase()) ||
      shift.endTime.toLowerCase().includes(searchShift.toLowerCase())
  );

  // Format time to 12-hour format with AM/PM
  const formatTime = (time) => {
    if (!time) return "";
    if (time.includes("AM") || time.includes("PM")) {
      return time; // Already formatted
    }
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="border-r border-gray-200/50 dark:border-border/50 pr-8">
      <div className="bg-white dark:bg-card p-6 rounded-2xl border border-gray-200/50 dark:border-border/50 shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-3 text-gray-900 dark:text-foreground">
          <ClockIcon className="w-5 h-5 text-blue-600 dark:text-primary" />
          Select Shift
        </h3>

        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search shifts..."
            value={searchShift}
            onChange={(e) => setSearchShift(e.target.value)}
            className="pl-9 border-gray-200/50 dark:border-border/50 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-primary dark:focus:ring-primary"
          />
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 gap-3">
            {filteredShifts.map((shift) => (
              <button
                key={shift.id}
                onClick={() => setSelectedShift(shift.id)}
                className={`flex items-center justify-between w-full p-4 rounded-xl text-left transition-all border
                  ${
                    selectedShift === shift.id
                      ? "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-primary/5 dark:text-primary dark:border-primary/20"
                      : "bg-white dark:bg-card text-gray-600 dark:text-muted-foreground border-gray-200/50 dark:border-border/50 hover:border-blue-100 hover:bg-blue-50/50 dark:hover:border-primary/20 dark:hover:bg-primary/5"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-card border border-gray-200/50 dark:border-border/50 flex items-center justify-center">
                    <span className="text-xl">{shift.icon || "🕒"}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-foreground">
                      {shift.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-muted-foreground">
                      Ends at {formatTime(shift.endTime)}
                    </div>
                  </div>
                </div>
                {selectedShift === shift.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-primary flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedShift && currentShift && (
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-gray-200/50 dark:border-border/50 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-3 text-gray-900 dark:text-foreground">
            <MapPinIcon className="w-5 h-5 text-purple-600 dark:text-primary" />
            Shift Overview
          </h3>

          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="p-4 rounded-xl bg-green-50/50 dark:bg-card border border-green-200/50 dark:border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-muted-foreground">
                    Shift Time
                  </span>
                  <div className="text-right">
                    <div className="font-medium text-green-700 dark:text-foreground">
                      Start: {formatTime(currentShift.startTime)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                      End: {formatTime(currentShift.endTime)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-card border border-blue-200/50 dark:border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-muted-foreground">
                    Unassigned in Shift
                  </span>
                  <span className="text-2xl font-semibold text-blue-700 dark:text-foreground">
                    {stats.unassignedInShift}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-card border border-purple-200/50 dark:border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-muted-foreground">
                    Total Routes
                  </span>
                  <span className="text-2xl font-semibold text-purple-700 dark:text-foreground">
                    {routes.length}
                  </span>
                </div>
                {routes.length === 0 && (
                  <div className="mt-2 p-3 bg-white dark:bg-card rounded-lg border border-purple-200/50 dark:border-primary/20">
                    <p className="text-sm text-purple-600 dark:text-primary flex items-center gap-2">
                      <PlusIcon className="w-4 h-4" />
                      Visit Route Management to create a new route
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-card border border-amber-200/50 dark:border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-muted-foreground">
                    Available Seats
                  </span>
                  <span className="text-2xl font-semibold text-amber-700 dark:text-foreground">
                    {stats.availableSeats}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Controls.propTypes = {
  selectedShift: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedShift: PropTypes.func.isRequired,
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      stops: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          name: PropTypes.string,
          latitude: PropTypes.number,
          longitude: PropTypes.number,
        })
      ),
    })
  ),
  shifts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      icon: PropTypes.string,
      times: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  loading: PropTypes.bool,
  stats: PropTypes.shape({
    unassignedInShift: PropTypes.number,
    totalRoutes: PropTypes.number,
    availableSeats: PropTypes.number,
  }),
};

export default Controls;
