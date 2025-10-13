import React, { useState, useEffect, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card } from '@/components/Common/UI/Card';
import { Button } from '@/components/Common/UI/Button';
import { Badge } from '@/components/Common/UI/Badge';
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

const columnHelper = createColumnHelper();

export default function ManagerVehicleRequestsTable() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const fetchMyRequests = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await api.get('/vehicle-requests/my-requests');
      setRequests(response.data || []);
    } catch (err) {
      console.error('Error fetching my vehicle requests:', err);
      setError(err.response?.data?.message || 'Failed to load requests');
      toast.error('Failed to load your vehicle requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleRefresh = () => {
      fetchMyRequests(true);
    };

    window.addEventListener('vehicle-request:refresh', handleRefresh);
    return () => {
      window.removeEventListener('vehicle-request:refresh', handleRefresh);
    };
  }, [fetchMyRequests]);

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        label: 'Pending'
      },
      APPROVED: {
        icon: CheckCircle,
        color: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        label: 'Approved'
      },
      REJECTED: {
        icon: XCircle,
        color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        label: 'Rejected'
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn('inline-flex items-center gap-1', config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this vehicle request?')) {
      return;
    }

    try {
      await api.delete(`/vehicle-requests/${requestId}`);
      toast.success('Vehicle request deleted successfully');
      fetchMyRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error(err.response?.data?.message || 'Failed to delete request');
    }
  };

  const columns = [
    columnHelper.display({
      id: 'expander',
      cell: ({ row }) => (
        <button
          onClick={() => toggleRow(row.original.id)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          {expandedRows.has(row.original.id) ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ),
      size: 40,
    }),
    columnHelper.accessor("name", {
      header: "Vehicle Name",
      cell: (info) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("licensePlate", {
      header: "License Plate",
      cell: (info) => (
        <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
          {info.getValue() || 'N/A'}
        </span>
      ),
    }),
    columnHelper.accessor("requestedAt", {
      header: "Requested",
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => getStatusBadge(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.status === 'PENDING' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteRequest(row.original.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: requests,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();

  const getPageNumbers = () => {
    const currentPage = pageIndex + 1;
    const maxPageButtons = 5;
    let pages = [];

    pages.push(1);

    if (totalPages <= maxPageButtons) {
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(2, 3);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push("ellipsis");
        for (let i = totalPages - 2; i <= totalPages; i++) {
          if (i > 1) pages.push(i);
        }
      } else {
        pages.push("ellipsis");
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push("ellipsis2");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            My Vehicle Requests
          </h3>
        </div>
        <div className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            My Vehicle Requests
          </h3>
        </div>
        <div className="p-6 text-center text-red-600 dark:text-red-400">
          <XCircle className="w-12 h-12 mx-auto mb-3" />
          <p className="font-medium">Error loading requests</p>
          <p className="text-sm mt-1">{error}</p>
          <Button
            onClick={() => fetchMyRequests()}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          My Vehicle Requests
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchMyRequests(true)}
          disabled={refreshing}
          className={cn(
            "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            "border border-gray-200 dark:border-gray-700"
          )}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No vehicle requests yet</p>
          <p className="text-sm mt-1">Submit your first vehicle acquisition request</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                    {expandedRows.has(row.original.id) && (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Type:</span>
                              <p className="text-gray-900 dark:text-gray-100">{row.original.type}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Model:</span>
                              <p className="text-gray-900 dark:text-gray-100">{row.original.model || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Capacity:</span>
                              <p className="text-gray-900 dark:text-gray-100">{row.original.capacity || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Daily Rate:</span>
                              <p className="text-gray-900 dark:text-gray-100">
                                {row.original.dailyRate ? `$${row.original.dailyRate}` : 'N/A'}
                              </p>
                            </div>
                            {row.original.vendor && (
                              <div>
                                <span className="font-medium text-gray-500 dark:text-gray-400">Vendor:</span>
                                <p className="text-gray-900 dark:text-gray-100">{row.original.vendor}</p>
                              </div>
                            )}
                            {row.original.comment && (
                              <div className="col-span-2 md:col-span-4">
                                <span className="font-medium text-gray-500 dark:text-gray-400">Comment:</span>
                                <p className="text-gray-900 dark:text-gray-100">{row.original.comment}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                variant="secondary"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {getPageNumbers().map((page, index) => {
                  if (page === "ellipsis" || page === "ellipsis2") {
                    return (
                      <div key={`ellipsis-${index}`} className="flex items-center justify-center h-8 w-8">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </div>
                    );
                  }
                  return (
                    <Button
                      key={`page-${page}`}
                      onClick={() => table.setPageIndex(page - 1)}
                      variant={(pageIndex + 1) === page ? "primary" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 w-8",
                        (pageIndex + 1) === page && "bg-blue-600 dark:bg-blue-500 text-white"
                      )}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                variant="secondary"
                size="sm"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {requests.length} total requests
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
