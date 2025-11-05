import React, { useState, useEffect } from 'react';
import { LogOut, User, Mail, MapPin, TrendingUp, Calendar, Phone } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { cn } from '@lib/utils';
import { authClient } from '@lib/auth-client';
import { driverService } from '@services/driverService';

function ProfileView() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const routes = await driverService.getMyRoutes({
          from: startOfMonth.toISOString(),
          to: now.toISOString(),
          limit: 500
        });

        const completedRoutes = routes?.filter(r => 
          r.status === 'COMPLETED' || r.driverStatus === 'COMPLETED'
        ) || [];
        
        const totalStops = completedRoutes.reduce((sum, r) => sum + (r.stops?.length || 0), 0);
        const completedStops = completedRoutes.reduce((sum, r) => 
          sum + (r.stops?.filter(s => s.completed).length || 0), 0
        );

        setStats({
          routesCompleted: completedRoutes.length,
          totalRoutes: routes?.length || 0,
          stopsCompleted: completedStops,
          totalStops: totalStops,
          completionRate: totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Clear any local state
            window.location.href = '/auth/login';
          },
          onError: (ctx) => {
            console.error('Logout error:', ctx.error);
            // Still redirect even if error
            window.location.href = '/auth/login';
          }
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: force redirect anyway
      window.location.href = '/auth/login';
    }
  };

  return (
    <div className={cn(
      "min-h-screen p-3 md:p-4",
      isDark ? "bg-gray-900" : "bg-gray-50"
    )}>
      <div className="max-w-7xl mx-auto space-y-3 md:space-y-4">
        {/* Profile Card */}
        <div className={cn(
          "rounded-lg border p-4 md:p-5",
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="flex flex-col items-center space-y-2 md:space-y-3">
            <div className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center",
              isDark ? "bg-gray-700" : "bg-gray-200"
            )}>
              <User className={cn(
                "w-8 h-8 md:w-10 md:h-10",
                isDark ? "text-gray-400" : "text-gray-600"
              )} />
            </div>
            
            <div className="text-center">
              <h2 className={cn(
                "text-lg md:text-xl font-bold mb-1 md:mb-2",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {user?.name || 'Driver'}
              </h2>
              <div className="space-y-0.5">
                {user?.email && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail className={cn(
                      "w-3 h-3 md:w-4 md:h-4",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )} />
                    <p className={cn(
                      "text-xs md:text-sm",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}>
                      {user.email}
                    </p>
                  </div>
                )}
                {user?.phoneNumber && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Phone className={cn(
                      "w-3 h-3 md:w-4 md:h-4",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )} />
                    <p className={cn(
                      "text-xs md:text-sm",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}>
                      {user.phoneNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className={cn(
          "rounded-lg border p-3 md:p-4",
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
            <TrendingUp className={cn(
              "w-4 h-4 md:w-5 md:h-5",
              isDark ? "text-gray-400" : "text-gray-600"
            )} />
            <h3 className={cn(
              "text-base md:text-lg font-semibold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Performance Stats
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f3684e]" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className={cn(
                "rounded-lg p-4 border",
                isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className={cn(
                      "text-2xl font-bold",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {stats.routesCompleted}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Routes Completed</p>
                  </div>
                </div>
              </div>

              <div className={cn(
                "rounded-lg p-4 border",
                isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className={cn(
                      "text-2xl font-bold",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {stats.stopsCompleted}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stops Completed</p>
                  </div>
                </div>
              </div>

              <div className={cn(
                "rounded-lg p-4 border",
                isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className={cn(
                      "text-2xl font-bold",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {stats.completionRate}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</p>
                  </div>
                </div>
              </div>

              <div className={cn(
                "rounded-lg p-4 border",
                isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className={cn(
                      "text-2xl font-bold",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {stats.totalRoutes}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Routes</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className={cn(
              "text-sm text-center py-8",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              Performance stats coming soon...
            </p>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-semibold",
            "flex items-center justify-center gap-2",
            "transition-colors",
            "bg-red-500 hover:bg-red-600 text-white"
          )}
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default ProfileView;
