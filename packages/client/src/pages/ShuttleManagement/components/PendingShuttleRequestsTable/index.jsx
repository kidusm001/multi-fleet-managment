import React, { useEffect, useState, useCallback } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/Common/UI/Button";
import { Card } from "@/components/Common/UI/Card";
import { cn } from "@/lib/utils";
import { shuttleService } from "@/services/shuttleService";
import { api } from "@/services/api";
import { 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  Edit,
  ChevronLeft,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import EditRequestModal from "./EditRequestModal";

const columnHelper = createColumnHelper();

export default function PendingShuttleRequestsTable({ onRequestStatusChanged }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [currentActionId, setCurrentActionId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditRequest, setCurrentEditRequest] = useState(null);

  const fetchPendingRequests = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const data = await shuttleService.getPendingShuttleRequests();
      setPendingRequests(data);
      setError(null);
    } catch (err) {
      setError("Failed to load pending requests");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleRefresh = () => {
    fetchPendingRequests(true);
  };

  const handleEdit = (request) => {
    setCurrentEditRequest(request);
    setEditModalOpen(true);
  };

  const handleSaveAndApprove = async (formData) => {
    if (!currentEditRequest) return;

    try {
      setActionLoading((prev) => ({ ...prev, [currentEditRequest.id]: true }));
      
      // Update the request first
      await api.put(`/vehicle-requests/${currentEditRequest.id}`, formData);
      
      // Then approve it
      await shuttleService.approveShuttleRequest(currentEditRequest.id);
      
      toast.success('Vehicle request updated and approved');
      await fetchPendingRequests();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vehicle-request:refresh'));
        window.dispatchEvent(new CustomEvent('shuttle:list-refresh'));
      }
      
      if (onRequestStatusChanged) {
        onRequestStatusChanged();
      }
      
      setEditModalOpen(false);
      setCurrentEditRequest(null);
    } catch (err) {
      console.error("Save and approve error:", err);
      toast.error(err.response?.data?.message || 'Failed to save and approve request');
      throw err;
    } finally {
      setActionLoading((prev) => ({ ...prev, [currentEditRequest.id]: false }));
    }
  };

  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await shuttleService.approveShuttleRequest(id);
      toast.success('Vehicle request approved');
      await fetchPendingRequests();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vehicle-request:refresh'));
        window.dispatchEvent(new CustomEvent('shuttle:list-refresh'));
      }
      if (onRequestStatusChanged) {
        onRequestStatusChanged();
      }
    } catch (err) {
      console.error("Approve error:", err);
      toast.error('Failed to approve request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const openRejectModal = (id) => {
    setCurrentActionId(id);
    setRejectComment("");
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectComment.trim()) {
      toast.error("Please enter a rejection comment");
      return;
    }
    setActionLoading((prev) => ({ ...prev, [currentActionId]: true }));
    try {
      await shuttleService.rejectShuttleRequest(currentActionId, rejectComment);
      toast.success('Vehicle request rejected');
      await fetchPendingRequests();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vehicle-request:refresh'));
      }
      if (onRequestStatusChanged) {
        onRequestStatusChanged();
      }
    } catch (err) {
      console.error("Reject error:", err);
      toast.error('Failed to reject request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [currentActionId]: false }));
      setRejectModalOpen(false);
      setCurrentActionId(null);
      setRejectComment("");
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
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("model", {
      header: "Model",
      cell: (info) => (
        <span className="text-gray-900 dark:text-gray-100">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={actionLoading[row.original.id]}
            onClick={() => handleEdit(row.original)}
            className={cn(
              "inline-flex items-center rounded-full border",
              "border-blue-300 dark:border-blue-700",
              "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40",
              "text-blue-600 dark:text-blue-400"
            )}
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={actionLoading[row.original.id]}
            onClick={() => handleApprove(row.original.id)}
            className={cn(
              "inline-flex items-center rounded-full border",
              "border-green-300 dark:border-green-700",
              "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40",
              "text-green-600 dark:text-green-400"
            )}
          >
            {actionLoading[row.original.id] ? (
              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Check className="w-3 h-3 mr-1" />
            )}
            Approve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={actionLoading[row.original.id]}
            onClick={() => openRejectModal(row.original.id)}
            className={cn(
              "inline-flex items-center rounded-full border",
              "border-red-300 dark:border-red-700",
              "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40",
              "text-red-600 dark:text-red-400"
            )}
          >
            <X className="w-3 h-3 mr-1" />
            Reject
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: pendingRequests,
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
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading pending shuttle requests...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <div className="p-6 text-center text-red-500 dark:text-red-400">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          {error}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Pending Vehicle Requests
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
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
        
        {pendingRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pending vehicle requests</p>
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
                                <span className="font-medium text-gray-500 dark:text-gray-400">Capacity:</span>
                                <p className="text-gray-900 dark:text-gray-100">{row.original.capacity} seats</p>
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
                {pendingRequests.length} total requests
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full mr-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Reject Vehicle Request
              </h3>
            </div>
            
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for rejection:
              </label>
              <textarea
                className={cn(
                  "w-full p-3 border rounded-lg resize-none min-h-[100px]",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "border-gray-300 dark:border-gray-700",
                  "bg-white dark:bg-gray-900",
                  "text-gray-900 dark:text-gray-100"
                )}
                placeholder="Enter reason for rejection..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmReject}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && currentEditRequest && (
        <EditRequestModal
          request={currentEditRequest}
          onClose={() => {
            setEditModalOpen(false);
            setCurrentEditRequest(null);
          }}
          onSave={handleSaveAndApprove}
        />
      )}
    </>
  );
}
