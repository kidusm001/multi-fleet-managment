import { Search, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@components/Common/UI/Card";
import { Badge } from "@/components/Common/UI/Badge";
import { useTheme } from "@contexts/ThemeContext";

import PropTypes from "prop-types";

const RouteList = ({
  filteredRoutes,
  selectedRoute,
  handleRouteSelect,
  searchQuery,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Card className="bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md shadow-lg border-0 rounded-xl overflow-hidden">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center justify-between">
          <span>Routegna Routes</span>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#4272FF]/10 text-[#4272FF] dark:text-[#4272FF]">
            {filteredRoutes.length} routes
          </span>
        </h3>
        <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '500px' }}>{filteredRoutes.length > 0 ? (
            filteredRoutes
              .sort((a, b) => {
                const timeA = a.nextDeparture ? new Date(a.nextDeparture) : new Date('9999-12-31');
                const timeB = b.nextDeparture ? new Date(b.nextDeparture) : new Date('9999-12-31');
                return timeA - timeB;
              })
              .map((route) => (
                <button
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  className={`w-full text-left p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#4272FF]/50 ${
                    selectedRoute?.id === route.id
                      ? isDark ? "bg-[#4272FF]/90" : "bg-[#4272FF]"
                      : isDark 
                        ? "bg-[#1a2538]/50 hover:bg-[#4272FF]/10" 
                        : "bg-white/50 hover:bg-[#4272FF]/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-medium truncate ${
                          selectedRoute?.id === route.id
                            ? "text-white"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {route.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`flex items-center gap-1 text-sm ${
                            selectedRoute?.id === route.id
                              ? "text-white/80"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{route.stops?.length || 0} stops</span>
                        </div>
                        <div
                          className={`flex items-center gap-1 text-sm ${
                            selectedRoute?.id === route.id
                              ? "text-white/80"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{route.stops?.filter(stop => stop.employee)?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        route.status === "active" ? "success" : "secondary"
                      }
                      className={`ml-3 ${
                        selectedRoute?.id === route.id
                          ? "bg-white/20 text-white border-white/10"
                          : ""
                      }`}
                    >
                      {route.status}
                    </Badge>
                  </div>
                </button>
              ))
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <Search className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
              {searchQuery.trim() ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No routes found matching &quot;{searchQuery}&quot;
                </p>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Unassigned route</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    You do not have a route yet. Once dispatch assigns one, it will appear here automatically.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

RouteList.propTypes = {
  filteredRoutes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      stops: PropTypes.arrayOf(
        PropTypes.shape({
          employee: PropTypes.object,
        })
      ),
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedRoute: PropTypes.object,
  handleRouteSelect: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
};

export default RouteList;
