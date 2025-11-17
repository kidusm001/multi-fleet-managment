import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Bus, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { cn } from '@/lib/utils';
import { shuttleService } from '@/services/shuttleService';
import { format, formatDistanceToNow } from 'date-fns';
import { SHUTTLE_EVENTS } from '@/constants/events';

export default function MaintenanceSchedule() {
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingShuttles, setUpdatingShuttles] = useState(new Set());

  const fetchMaintenanceSchedule = useCallback(async (shuttleId = null) => {
    try {
      if (shuttleId) {
        setUpdatingShuttles(prev => new Set(prev).add(shuttleId));
      } else {
        setLoading(true);
      }
      
      const data = await shuttleService.getMaintenanceSchedule();
      setMaintenanceSchedule(data);
    } catch (err) {
      console.error('Error fetching maintenance schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      if (shuttleId) {
        setUpdatingShuttles(prev => {
          const next = new Set(prev);
          next.delete(shuttleId);
          return next;
        });
      }
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceSchedule();

    const handleUpdate = (event) => {
      const shuttleId = event.detail?.shuttleId;
      fetchMaintenanceSchedule(shuttleId);
    };

    window.addEventListener(SHUTTLE_EVENTS.MAINTENANCE_CHANGED, handleUpdate);
    window.addEventListener(SHUTTLE_EVENTS.STATUS_UPDATED, handleUpdate);

    return () => {
      window.removeEventListener(SHUTTLE_EVENTS.MAINTENANCE_CHANGED, handleUpdate);
      window.removeEventListener(SHUTTLE_EVENTS.STATUS_UPDATED, handleUpdate);
    };
  }, [fetchMaintenanceSchedule]);

  // Show loading only for initial load
  if (loading && updatingShuttles.size === 0) {
    return (
      <Card title="Maintenance Schedule">
        <div className="p-4 flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Maintenance Schedule">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchMaintenanceSchedule()}
            className="mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Maintenance Schedule (${maintenanceSchedule.length})`}>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {maintenanceSchedule.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
            No shuttles currently under maintenance
          </div>
        ) : (
          maintenanceSchedule.map((shuttle) => (
            <div 
              key={shuttle.id}
              className={cn(
                "p-4 transition-all duration-200",
                "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                updatingShuttles.has(shuttle.id) && "opacity-60 animate-pulse"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Bus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {shuttle.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {shuttle.licensePlate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {updatingShuttles.has(shuttle.id) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500" />
                  )}
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                    Under Maintenance
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Started:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">
                      {format(new Date(shuttle.lastMaintenance), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Expected end:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">
                      {formatDistanceToNow(new Date(shuttle.nextMaintenance), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}