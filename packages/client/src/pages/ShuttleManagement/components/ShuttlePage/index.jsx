import React, { useState, useEffect, useRef } from 'react';
import MaintenanceSchedule from '../MaintenanceSchedule';
import DriverStatus from '../DriverStatus';
import ShuttleTable from '../ShuttleTable';
import PendingShuttleRequestsTable from '../PendingShuttleRequestsTable';
import { useShuttleManagement } from '@/hooks/useShuttleManagement';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';
import styles from '../../styles/index.module.css';
import { Activity, AlertTriangle, Bus } from 'lucide-react';
import { shuttleService } from '@/services/shuttleService';

export default function ShuttlePage() {
  const { shuttles, refreshShuttles } = useShuttleManagement();
  const { role } = useRole();
  const [maintenanceStats, setMaintenanceStats] = useState({
    count: 0,
    urgent: 0,
    ongoing: 0,
    scheduled: 0,
    avgDuration: 0,
  });
  
  // Create a reference to track if the component is mounted
  const isMounted = useRef(true);

  // Handle when a shuttle request status changes
  const handleRequestStatusChanged = () => {
    // Refresh the main shuttle table to reflect the changes
    if (isMounted.current) {
      refreshShuttles();
    }
  };

  useEffect(() => {
    // Set up the mounted ref
    isMounted.current = true;
    return () => {
      // Clean up by setting mounted ref to false on unmount
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchMaintenanceStats = async () => {
      try {
        const maintenanceData = await shuttleService.getMaintenanceSchedule();
        const now = new Date();

        const stats = maintenanceData.reduce(
          (acc, shuttle) => {
            acc.count++;

            const endDate = new Date(shuttle.nextMaintenance);
            const startDate = new Date(shuttle.lastMaintenance);
            const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

            acc.avgDuration += duration;

            if (daysLeft <= 1) acc.urgent++;
            else if (daysLeft <= 3) acc.ongoing++;
            else acc.scheduled++;

            return acc;
          },
          { count: 0, urgent: 0, ongoing: 0, scheduled: 0, avgDuration: 0 }
        );

        if (isMounted.current) {
          stats.avgDuration = stats.count ? Math.round(stats.avgDuration / stats.count) : 0;
          setMaintenanceStats(stats);
        }
      } catch (error) {
        console.error('Error fetching maintenance stats:', error);
      }
    };

    fetchMaintenanceStats();
    // No need for polling interval - we'll update on relevant actions
  }, []);

  const stats = {
    totalShuttles: {
      title: 'Total Shuttles',
      value: shuttles?.length?.toString() || '0',
      change: '+2',
      type: 'increase',
      icon: Bus,
      bgClass: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
    activeShuttles: {
      title: 'Active Shuttles',
      value: shuttles?.filter(s => s.status === 'active')?.length?.toString() || '0',
      change: '-1',
      type: 'decrease',
      icon: Activity,
      bgClass: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      iconClass: 'text-green-600 dark:text-green-400',
    },
    maintenance: {
      title: 'Under Maintenance',
      value: maintenanceStats.count.toString(),
      change: maintenanceStats.urgent ? `${maintenanceStats.urgent} urgent` : 'All on schedule',
      type: maintenanceStats.urgent ? 'decrease' : 'increase',
      icon: AlertTriangle,
      bgClass: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
      iconClass: 'text-orange-600 dark:text-orange-400',
    },
  };

  return (
    <div className={styles.pageContainer}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={styles.pageHeader}>
            <div className={styles.headerContent}>
              <h1 className={styles.headerTitle}>Shuttle Management</h1>
            </div>
          </div>

          <div className={cn(styles.statsGrid, styles.fadeIn)}>
            {Object.entries(stats).map(([key, stat]) => (
              <div key={key} className={styles.staggered}>
                <div
                  className={cn(
                    'bg-gradient-to-br p-6 rounded-xl',
                    'border border-gray-200/50 dark:border-gray-700/50',
                    'shadow-lg shadow-gray-200/20 dark:shadow-gray-900/30',
                    'hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
                    stat.bgClass
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</h3>
                    <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                      <stat.icon className={cn('w-5 h-5', stat.iconClass)} />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p
                      className={cn(
                        'flex items-baseline text-sm font-semibold px-2 py-0.5 rounded-full',
                        stat.type === 'increase'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      )}
                    >
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.fadeIn}>
            <ShuttleTable />
          </div>

          {/* Pass the callback to the PendingShuttleRequestsTable */}
          {role === 'admin' && (
            <div className="mt-6">
              <PendingShuttleRequestsTable 
                onRequestStatusChanged={handleRequestStatusChanged}
              />
            </div>
          )}

          <div className={cn(styles.mainContent, styles.slideUp, 'mt-6')}>
            <div className={styles.tableSection}>
              <MaintenanceSchedule />
            </div>
            <div className={styles.sidebarSection}>
              <DriverStatus />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}