import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Bus, Plus, Building2, Users, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { cn } from "@/lib/utils";
import { useShuttleManagement } from "@/hooks/useShuttleManagement";
import { getStatusColor } from "../../utils";
import ShuttleDetails from "./ShuttleDetails";
import AddShuttleDialog from "./AddShuttleDialog";
import { shuttleService } from '@/services/shuttleService';
import { useRole } from "@/contexts/RoleContext";

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor("name", {
    header: "Shuttle",
    cell: (info) => (
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Bus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {info.getValue() || "N/A"}
          </p>
          {info.row.original.model && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {info.row.original.model}
            </p>
          )}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("type", {
    header: "Type",
    cell: (info) => (
      <div className="flex items-center space-x-2">
        <Building2 className="w-4 h-4 text-gray-400" />
        <span className="capitalize text-gray-900 dark:text-gray-100">
          {info.getValue() || "N/A"}
        </span>
        {info.row.original.vendor && (
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            ({info.row.original.vendor})
          </span>
        )}
      </div>
    ),
  }),
  columnHelper.accessor("capacity", {
    header: "Capacity",
    cell: (info) => (
      <div className="flex items-center space-x-1">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900 dark:text-gray-100">
          {info.getValue() ? `${info.getValue()} seats` : "N/A"}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue() || "inactive";
      const colors = getStatusColor(status);
      return (
        <span
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium inline-flex items-center",
            colors.bg,
            colors.text
          )}
        >
          <span className={cn(
            "w-2 h-2 rounded-full mr-2",
            status === 'active' ? 'bg-green-500 dark:bg-green-400' :
            status === 'maintenance' ? 'bg-yellow-500 dark:bg-yellow-400' :
            'bg-red-500 dark:bg-red-400'
          )} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    },
  }),
];

export default function ShuttleTable() {
  const {
    shuttles,
    selectedShuttle,
    selectShuttle,
    addShuttle: addShuttleAction,
    refreshShuttles,
    deleteShuttle,
    loading,
    error,
  } = useShuttleManagement();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [pageSize] = useState(8); // Increased page size for better usability
  const [pageIndex, setPageIndex] = useState(0);
  const { role } = useRole();
  
  // Create a ref to store the refresh function for external access
  const refreshTableRef = useRef(null);

  const table = useReactTable({
    data: shuttles || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageSize,
        pageIndex,
      },
    },
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize });
        setPageIndex(newState.pageIndex);
      } else {
        setPageIndex(updater.pageIndex);
      }
    },
    manualPagination: false,
  });

  const handleUpdate = async () => {
    await refreshShuttles();
  };

  // Make the refresh function available to parent components
  refreshTableRef.current = handleUpdate;

  // Function to generate the array of page numbers to display with ellipsis
  const getPageNumbers = () => {
    const totalPages = table.getPageCount();
    const currentPage = pageIndex + 1;
    
    // Max page buttons to show at once
    const maxPageButtons = 5;
    let pages = [];

    // Always show first page
    pages.push(1);

    if (totalPages <= maxPageButtons) {
      // If we have fewer pages than max buttons, show all pages
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("ellipsis");
        for (let i = totalPages - 2; i <= totalPages; i++) {
          if (i > 1) pages.push(i);
        }
      } else {
        // Somewhere in the middle
        pages.push("ellipsis");
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push("ellipsis2");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleAddShuttle = async (submission) => {
    console.log("Submission received:", submission);
    const { mode, data } = submission;
    try {
      if (mode === "add") {
        await addShuttleAction(data);
        refreshShuttles();
      } else if (mode === "request") {
        // Log the requestData
        const requestData = {
          ...data,
          capacity: parseInt(data.capacity, 10),
          dailyRate: parseFloat(data.dailyRate),
        };
        console.log("RequestData for shuttle request:", requestData);
        await shuttleService.requestShuttle(requestData);
        refreshShuttles();
      }
    } catch (error) {
      console.error("Error adding/requesting shuttle:", error);
    } finally {
      setIsAddDialogOpen(false);
    }

  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 mx-auto bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-1/2 mx-auto bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6 text-center text-red-500 dark:text-red-400">
          Error: {error}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Fleet Management"
      action={
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          variant="primary"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          {role === "fleetManager" ? "Request Shuttle" : "Add Shuttle"}
        </Button>
      }
      className="overflow-hidden mt-6"
    >
      <div className="relative">
        <div
          className={cn(
            "grid transition-all duration-500 ease-in-out transform",
            selectedShuttle ? "lg:grid-cols-[2fr,1fr] gap-6" : "grid-cols-1"
          )}
        >
          <div>
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
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        No shuttles found. Add your first shuttle to get started.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => selectShuttle(row.original)}
                        className={cn(
                          "transition-all duration-300 ease-in-out transform",
                          "hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer",
                          selectedShuttle?.id === row.original.id && [
                            "bg-blue-50/50 dark:bg-blue-900/20",
                            "hover:bg-blue-50/70 dark:hover:bg-blue-800/30",
                            "scale-[0.99] lg:translate-x-1",
                          ]
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination Controls */}
            <div className="sticky bottom-0 left-0 right-0 mt-auto flex items-center justify-between px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-2">
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
                        key={`page-${page}`}
                        onClick={() => table.setPageIndex(page - 1)}
                        variant={(pageIndex + 1) === page ? "primary" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 w-8 rounded-lg",
                          (pageIndex + 1) === page
                            ? "bg-blue-600 dark:bg-blue-500 text-white"
                            : "border-gray-200/50 dark:border-gray-700/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
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
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {shuttles?.length || 0} shuttles total
              </div>
            </div>
          </div>

          {selectedShuttle && (
            <ShuttleDetails
              shuttle={selectedShuttle}
              onClose={() => selectShuttle(null)}
              onUpdate={handleUpdate}
              onDelete={deleteShuttle}
            />
          )}
        </div>
      </div>

      {isAddDialogOpen && (
        <AddShuttleDialog
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={handleAddShuttle} // Use the local handleAddShuttle function
        />
      )}
    </Card>
  );
}
