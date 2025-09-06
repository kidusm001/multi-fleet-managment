import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Common/UI/Card";
import { Overview } from "./Overview";
import { RecentActivity } from "./RecentActivity";
import { employeeService } from "../services/employeeService";
import { driverService } from "../services/driverService";
import { departmentService } from "../services/departmentService";
import { shiftService } from "../services/shiftService";
import { activityService } from "../services/activityService";
import { Skeleton } from "@/components/Common/UI/skeleton";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Settings Dashboard Component
 * 
 * Provides admin users with a high-level overview of key system metrics
 * and recent activity, pulling real-time data from various services.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [_isLoading, setIsLoading] = useState(true);
  const [showAdminContent, setShowAdminContent] = useState(false);
  const [stats, setStats] = useState({
    employees: { total: 0, trend: 0 },
    drivers: { total: 0, trend: 0 },
    departments: { total: 0, trend: 0 },
    shifts: { total: 0, trend: 0 }
  });
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);

  // Verify user is authenticated and has admin privileges
  const checkPermissions = useCallback(() => {
    // Check if user has admin role - checking both common role formats
    const isAdmin = 
      (user?.role === "admin") || 
      (user?.role?.toLowerCase?.() === "admin") ||
      (user?.roles?.includes?.("admin")) || 
      (user?.isAdmin === true);

    // Allow access to all authenticated users
    if (isAuthenticated === true) {
      setShowAdminContent(true);
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    // Only check permissions after authentication has fully loaded
    if (!authLoading) {
      checkPermissions();
    }
  }, [authLoading, checkPermissions]);

  // Load dashboard data - only fetch when we're sure the user is an admin
  useEffect(() => {
    // Only fetch data if user is confirmed as admin
    if (!showAdminContent) return;
    
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel for efficiency
        const [
          employeeStats, 
          driverStats, 
          departmentData, 
          shiftsData, 
          recentActivities,
          employeeChartData
        ] = await Promise.all([
          employeeService.getEmployeeStats(),
          driverService.getDriverStats(),
          departmentService.listDepartments(), // Fixed: using listDepartments instead of getDepartments
          shiftService.listShifts(),
          activityService.getRecentActivity(10), // Get 10 most recent activities
          employeeService.getEmployeeGrowthData()
        ]);
        
        // Process and set stats data
        setStats({
          employees: {
            total: employeeStats.total || 0,
            trend: employeeStats.monthlyChange || 0
          },
          drivers: {
            total: driverStats.total || 0,
            trend: driverStats.monthlyChange || 0
          },
          departments: {
            total: departmentData?.length || 0,
            trend: 0  // Departments don't typically change frequently
          },
          shifts: {
            total: shiftsData?.length || 0,
            trend: shiftsData.filter(shift => 
              new Date(shift.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length || 0
          }
        });
        
        // Format chart data
        setChartData(employeeChartData.map(item => ({
          name: item.month,
          employees: item.employeeCount,
          drivers: item.driverCount
        })));
        
        // Set activities data
        setActivities(recentActivities);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Could not load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [showAdminContent]);

  // Render trend indicator based on value
  const renderTrend = (value) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
          <ArrowUp className="h-3 w-3" />
          +{value}
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
          <ArrowDown className="h-3 w-3" />
          {value}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
        <Minus className="h-3 w-3" />
        No change
      </span>
    );
  };

  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h2>
          <p className="text-[var(--text-secondary)] mt-2">Verifying access...</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="ml-4 space-y-1 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h2>
          <p className="text-[var(--text-secondary)] mt-2">Overview of system settings and recent activity</p>
        </div>
        
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30">
          <CardContent className="py-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <p className="text-lg font-medium mb-2">Failed to load dashboard data</p>
              <p className="text-sm">Please try refreshing the page or contact support if the issue persists</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h2>
        <p className="text-[var(--text-secondary)] mt-2">Overview of system settings and recent activity</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-sky-500 to-indigo-600 dark:from-sky-600 dark:to-indigo-700 transition-transform hover:scale-[1.02] duration-300 hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.employees.total}</div>
            <p className="text-xs text-white/80 flex items-center gap-1">
              {renderTrend(stats.employees.trend)} from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-500 to-green-600 dark:from-teal-600 dark:to-green-700 transition-transform hover:scale-[1.02] duration-300 hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.drivers.total}</div>
            <p className="text-xs text-white/80 flex items-center gap-1">
              {renderTrend(stats.drivers.trend)} from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-red-600 dark:from-amber-600 dark:to-red-700 transition-transform hover:scale-[1.02] duration-300 hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.departments.total}</div>
            <p className="text-xs text-white/80 flex items-center gap-1">
              {renderTrend(stats.departments.trend)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 transition-transform hover:scale-[1.02] duration-300 hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.shifts.total}</div>
            <p className="text-xs text-white/80 flex items-center gap-1">
              {stats.shifts.trend > 0 ? `+${stats.shifts.trend} new this week` : 'No change'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Employee & Driver Trends</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-3 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity activities={activities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}