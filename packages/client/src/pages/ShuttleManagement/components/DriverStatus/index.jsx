import React, { useState, useEffect } from 'react';
import { Users, Clock, ChevronLeft, ChevronRight, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '@/lib/utils';
import { formatDriverStatus } from '../../utils';
import { driverService } from '@/services/driverService';

const ITEMS_PER_PAGE = 4; // Show 4 drivers per page for better visual balance

export default function DriverStatus() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        setLoading(true);
        const data = await driverService.getDrivers();
        // Normalize status to lowercase to match frontend expectations
        const normalizedDrivers = data.map(driver => ({
          ...driver,
          status: driver.status?.toLowerCase()
        }));
        setDrivers(normalizedDrivers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDrivers();

    // Refresh every 30 seconds for live status
    const intervalId = setInterval(fetchDrivers, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const totalPages = Math.ceil((drivers?.length || 0) / ITEMS_PER_PAGE);
  const paginatedDrivers = drivers.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  // Function to generate the array of page numbers to display with ellipsis
  const getPageNumbers = () => {
    const maxPageButtons = 5;
    let pages = [];

    if (totalPages <= maxPageButtons) {
      // If we have fewer pages than max buttons, show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      if (currentPage <= 2) {
        // Near the start
        pages = [0, 1, 2];
        pages.push("ellipsis");
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        pages.push(0);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Somewhere in the middle
        pages.push(0);
        pages.push("ellipsis");
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push("ellipsis2");
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <Card title="Driver Status">
        <div className="p-4">
          <div className="space-y-4">
            {[...Array(2)].map((_, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center justify-between p-4 rounded-lg',
                  'bg-gray-50 dark:bg-gray-800/50 animate-pulse',
                  'border border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Driver Status">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Driver Status (${drivers.length})`}>
      <div className="space-y-4 p-4">
        {paginatedDrivers.map((driver) => (
          <div
            key={driver.id}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg',
              'bg-gray-50 dark:bg-gray-800/50',
              'border border-gray-200 dark:border-gray-700',
              'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
            )}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {driver.name}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    {
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400': driver.status === 'on-duty' || driver.status === 'active',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400': driver.status === 'break',
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400': driver.status === 'off-duty',
                    }
                  )}>
                    {formatDriverStatus(driver.status)}
                  </span>
                  {driver.route && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Route {driver.route}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{driver.hours || '0h'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Button>
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === "ellipsis" || page === "ellipsis2") {
                return (
                  <div 
                    key={`ellipsis-${index}`} 
                    className="flex items-center justify-center h-8 w-8"
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </div>
                );
              }
              
              return (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "primary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    currentPage === page && "text-white"
                  )}
                >
                  {page + 1}
                </Button>
              );
            })}
          </div>
          <Button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}