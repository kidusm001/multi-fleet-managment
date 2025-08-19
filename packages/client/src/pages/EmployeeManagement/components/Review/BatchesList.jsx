import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { format, parseISO, startOfDay, endOfDay, subDays, isWithinInterval, isAfter } from "date-fns";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/Common/UI/use-toast";
import { Button } from "@/components/Common/UI/Button";
import { Badge } from "@/components/Common/UI/Badge";
import { Calendar as CalendarComponent } from "@/components/Common/UI/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/Common/UI/popover";
import { Skeleton } from "@/components/Common/UI/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Edit,
  Calendar,
  Trash2,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { batchService } from "@/services/batchService";

// Add formatDateRange helper function
const formatDateRange = (range) => {
  if (!range || !range.from) {
    return "Select date";
  }
  // For specific date selection
  if (!range.to || range.from === range.to) {
    return format(range.from, "MMM dd, yyyy");
  }
  // For last 7 days
  return `Last 7 days (${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd")})`;
};

export function BatchesList({
  batches,
  onEditBatch,
  onDownloadResults,
  currentBatchId,
  role = "manager",
  isLoading = false,
  onBatchDelete,  // This will now receive the batch object directly
}) {
  // State variables

  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [expandedBatchData, setExpandedBatchData] = useState(null);
  const [localBatches, setLocalBatches] = useState(batches); // New state to track batches locally
  const { theme: _theme } = useTheme();
  const { toast } = useToast();
  const ITEMS_PER_PAGE = 5;

  // Update local batches when prop batches change
  useEffect(() => {
    setLocalBatches(batches);
  }, [batches]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, statusFilter]);

  // Simplified date range presets
  const dateRangePresets = useMemo(() => [
    {
      label: 'Today',
      value: {
        from: startOfDay(new Date()),
        to: endOfDay(new Date())
      }
    },
    {
      label: 'Last 7 days',
      value: {
        from: subDays(startOfDay(new Date()), 6),
        to: endOfDay(new Date())
      }
    }
  ], []);

  // Enhanced date range filter logic
  const filteredBatches = useMemo(() => {
    const roleBatchesFiltered = localBatches.filter(batch => {
      if (role === "recruitment") return true;
      if (role === "manager") return batch.assignedTo?.toUpperCase() === "MANAGER";
      if (role === "admin") return batch.assignedTo?.toUpperCase() === "ADMIN";
      return true;
    });

    const sorted = [...roleBatchesFiltered].sort((a, b) => {
      if (a.lastEditedAt && b.lastEditedAt) {
        return new Date(b.lastEditedAt) - new Date(a.lastEditedAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return sorted.filter(batch => {
      if (statusFilter !== "all" && batch.status !== statusFilter) return false;
      
      if (dateRange.from && dateRange.to) {
        const batchDate = parseISO(batch.createdAt);
        const fromDate = startOfDay(dateRange.from);
        const toDate = endOfDay(dateRange.to);
        return isWithinInterval(batchDate, { start: fromDate, end: toDate });
      }
      return true;
    });
  }, [localBatches, role, statusFilter, dateRange]);

  const totalPages = Math.ceil(filteredBatches.length / ITEMS_PER_PAGE);
  const paginatedBatches = useMemo(() => {
    return filteredBatches.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredBatches, currentPage]);

  // Fetch detailed batch data when a row is expanded
  const fetchBatchDetails = useCallback(async (batchId) => {
    try {
      setLocalLoading(true);
      const batchData = await batchService.getBatchById(batchId);
      
      // Update both expanded batch data and refresh the batch in the local list
      setExpandedBatchData(batchData);
      
      // Also update this batch in the local state to ensure it's up-to-date
      setLocalBatches(prev => prev.map(b => 
        b.id === batchId ? {...b, ...batchData} : b
      ));
    } catch (error) {
      console.error(`Error fetching batch ${batchId} details:`, error);
      toast({
        title: "Error",
        description: "Failed to load batch details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLocalLoading(false);
    }
  }, [toast]);

  const handleToggleExpand = useCallback((batchId) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      setExpandedBatchData(null);
    } else {
      setExpandedBatch(batchId);
      fetchBatchDetails(batchId);
    }
  }, [expandedBatch, fetchBatchDetails]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleEditClick = useCallback((e, batch) => {
    e.stopPropagation();
    try {
      onEditBatch(batch);
    } catch (error) {
      console.error("Error editing batch:", error);
      toast({
        title: "Error",
        description: "Failed to open batch for editing",
        variant: "destructive",
      });
    }
  }, [onEditBatch, toast]);

  // Internal download function when no external handler is provided
  const handleInternalDownload = useCallback(async (batchId) => {
    try {
      setLocalLoading(true);
      
      // Fetch latest batch data to ensure we have the most up-to-date information
      const batchData = await batchService.getBatchById(batchId);
      
      if (!batchData.candidates || batchData.candidates.length === 0) {
        toast({
          title: "No Data",
          description: "This batch doesn't contain any candidates to download",
          variant: "warning",
        });
        return;
      }
      
      // Prepare CSV data
      const csvData = [
        // Header row
        ["ID", "Name", "Contact", "Email", "Department", "Location", "Status", "Review Date"].join(","),
        // Data rows
        ...batchData.candidates.map(c => [
          c.id,
          c.name,
          c.contact || '',
          c.email || '',
          c.department || '',
          c.location,
          c.status || 'PENDING',
          c.reviewDate ? new Date(c.reviewDate).toLocaleDateString() : ''
        ].map(field => `"${field}"`).join(","))
      ].join("\n");
      
      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch-${batchData.name || batchData.id}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${batchData.candidates.length} candidate records`,
      });
    } catch (error) {
      console.error("Error downloading batch results:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download batch results",
        variant: "destructive",
      });
    } finally {
      setLocalLoading(false);
    }
  }, [toast]);

  const handleDownloadClick = useCallback((e, batchId) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setLocalLoading(true);
      
      // If a batch ID is passed directly, use it.
      // Otherwise, find the batch in the list by its ID.
      const batchToDownload = localBatches.find(b => b.id === batchId) || { id: batchId };
      
      // Use the provided handler if available
      if (typeof onDownloadResults === 'function') {
        onDownloadResults(batchToDownload);
      } else {
        // Fallback to internal handler
        handleInternalDownload(batchId);
      }
    } catch (error) {
      console.error("Error downloading batch:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download batch results",
        variant: "destructive",
      });
    } finally {
      setLocalLoading(false);
    }
  }, [onDownloadResults, handleInternalDownload, toast, localBatches]);

  const handleDeleteBatch = useCallback(async (e, batch) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // First optimistically update local state
      setLocalBatches(prev => prev.filter(b => b.id !== batch.id));
      
      // Then pass the batch to the parent handler
      if (onBatchDelete) {
        onBatchDelete(batch);
      }
    } catch (error) {
      // If there was an error, we can refresh the list
      console.error("Error handling batch delete:", error);
      // Try to recover the list
      const refreshedBatches = await batchService.getAllBatches();
      setLocalBatches(refreshedBatches);
    }
  }, [onBatchDelete]);

  const formatDate = useCallback((dateString) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  }, []);

  const shouldShowUpdateLabel = useCallback((createdAt, lastEditedAt) => {
    try {
      // If either date is missing, don't show update label
      if (!createdAt || !lastEditedAt) return false;
      
      // Parse the ISO date strings
      const createdDate = parseISO(createdAt);
      const editedDate = parseISO(lastEditedAt);
      
      // Compare timestamps - if they're different, show the update label
      return createdDate.getTime() !== editedDate.getTime();
    } catch (error) {
      return false;
    }
  }, []);

  const getBatchStatusBadge = useCallback((batch) => {
    const status = batch.status?.toUpperCase();
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500 text-white dark:bg-emerald-600 dark:text-emerald-100 border-none">
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-500 text-white dark:bg-red-600 dark:text-red-100 border-none">
            Rejected
          </Badge>
        );
      case "PENDING_REVIEW":
        return (
          <Badge className="bg-yellow-500 text-white dark:bg-yellow-600 dark:text-yellow-100 border-none">
            Pending Review
          </Badge>
        );
      case "REVIEWED":
        return (
          <Badge className="bg-blue-500 text-white dark:bg-blue-600 dark:text-blue-100 border-none">
            Reviewed
          </Badge>
        );
      case "NEEDS_REREVIEW":
        return (
          <Badge className="bg-orange-500 text-white dark:bg-orange-600 dark:text-orange-100 border-none">
            Needs Re-Review
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white dark:bg-gray-600 dark:text-gray-100 border-none">
            Processing
          </Badge>
        );
    }
  }, []);

  // For candidate status we use the old design's styling
  const getCandidateStatusBadge = useCallback((status) => {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case "APPROVED":
        return (
          <Badge className="bg-green-500 text-white dark:bg-green-600 dark:text-green-100 border-none">
            {status}
          </Badge>
        );
      case "REJECTED":
      case "DENIED":
        return (
          <Badge className="bg-red-500 text-white dark:bg-red-600 dark:text-red-100 border-none">
            {status}
          </Badge>
        );
      case "PENDING_REVIEW":
        return (
          <Badge className="bg-yellow-500 text-white dark:bg-yellow-600 dark:text-yellow-100 border-none">
            {status}
          </Badge>
        );
      case "REVIEWED":
        return (
          <Badge className="bg-blue-500 text-white dark:bg-blue-600 dark:text-blue-100 border-none">
            {status}
          </Badge>
        );
      case "NEEDS_REREVIEW":
        return (
          <Badge className="bg-orange-500 text-white dark:bg-orange-600 dark:text-orange-100 border-none">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white dark:bg-gray-600 dark:text-gray-100 border-none">
            {status}
          </Badge>
        );
    }
  }, []);

  const handleClearDateFilter = useCallback(() => {
    setDateRange({ from: null, to: null });
  }, []);

  const renderFilters = useMemo(() => (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={dateRange.from ? "secondary" : "outline"} 
            className={cn(
              "flex items-center gap-1 justify-between min-w-[200px]",
              dateRange.from && "bg-primary/10 text-primary hover:bg-primary/20"
            )} 
            size="sm"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="truncate">
                {formatDateRange(dateRange)}
              </span>
            </div>
            {dateRange.from && (
              <XIcon 
                className="h-4 w-4 opacity-50 hover:opacity-100" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearDateFilter();
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              {dateRangePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setDateRange(preset.value);
                    document.body.click(); // Close popover
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            
            {/* Single Date Calendar */}
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Or select a specific date:</p>
              <CalendarComponent
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => {
                  if (date) {
                    setDateRange({
                      from: startOfDay(date),
                      to: endOfDay(date)
                    });
                  } else {
                    setDateRange({ from: null, to: null });
                  }
                }}
                disabled={(date) => isAfter(date, new Date())}
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearDateFilter}
              >
                Clear
              </Button>
              <Button 
                size="sm" 
                onClick={() => document.body.click()}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
          <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
          <SelectItem value="REVIEWED">Reviewed</SelectItem>
          <SelectItem value="Needs_reReview">Needs Re-Review</SelectItem>
        </SelectContent>
      </Select>
    </>
  ), [dateRange, handleClearDateFilter, statusFilter, dateRangePresets]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-medium">Recruitment Batches</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2 shadow-sm">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredBatches.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-medium">Recruitment Batches</h3>
          <div className="flex gap-2">{renderFilters}</div>
        </div>
        <div className="border rounded-lg p-8 text-center shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">
            {role !== "recruitment"
              ? `No batches assigned to ${role} role matching the filters.`
              : "No batches found matching the filters."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-xl font-medium">
          {role !== "recruitment"
            ? `${role.charAt(0).toUpperCase() + role.slice(1)} Assigned Batches`
            : "All Recruitment Batches"}
        </h3>
        <div className="flex gap-2">{renderFilters}</div>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm">
        {paginatedBatches.map((batch) => (
          <div
            key={batch.id}
            className={`border-b last:border-b-0 ${
              currentBatchId === batch.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            <div
              onClick={() => handleToggleExpand(batch.id)}
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {batch.name ? batch.name : `Batch #${batch.id?.substring(0, 8)}`}
                      {batch.needsReview && (
                        <Badge
                          variant="outline"
                          className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border-orange-300 dark:border-orange-800/50"
                        >
                          Needs Review
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="ml-1 text-xs bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-300 dark:border-blue-800/50"
                      >
                        {batch.assignedTo?.toUpperCase() === "ADMIN" ? "Admin" : "Manager"}
                      </Badge>
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(batch.createdAt)} • {batch.candidates?.length || 0} candidates
                      {batch.lastEditedAt && shouldShowUpdateLabel(batch.createdAt, batch.lastEditedAt) && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">
                          • Updated: {formatDate(batch.lastEditedAt)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getBatchStatusBadge(batch)}
                    {/* Only show Edit button (which triggers review for managers/admins) if:
                        1. Role is recruitment (they can always edit their batches)
                        2. OR batch status is PENDING_REVIEW (needs initial review)
                        3. OR batch status is Needs_reReview (needs another review after changes) */}
                    {(role === "recruitment" || 
                      batch.status === "PENDING_REVIEW" || 
                      batch.status === "Needs_reReview") && (
                      <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(e, batch)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {/* Always show download button, regardless of onDownloadResults prop */}
                    <Button variant="ghost" size="sm" onClick={(e) => handleDownloadClick(e, batch.id)}>
                      <FileDown className="h-4 w-4" />
                    </Button>
                    {role === "recruitment" && ( // Only show delete button for recruiters
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => handleDeleteBatch(e, batch)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {expandedBatch === batch.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {expandedBatch === batch.id && (
              <div className="px-4 pb-4 bg-gray-50 dark:bg-slate-800/30">
                {localLoading ? (
                  <div className="py-8 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : (
                  <div className="rounded-lg border border-[var(--divider)] overflow-hidden bg-white dark:bg-slate-900">
                    <h4 className="text-sm font-medium p-4 border-b border-[var(--divider)] text-[var(--text-primary)]">
                      Candidates in this Batch
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[var(--accent-background)]">
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(expandedBatchData?.candidates || batch.candidates)?.length > 0 ? (
                            (expandedBatchData?.candidates || batch.candidates).map((candidate) => (
                              <TableRow key={candidate.id} className="hover:bg-[var(--accent-background)]">
                                <TableCell className="text-[var(--text-primary)]">{candidate.name}</TableCell>
                                <TableCell className="text-[var(--text-primary)]">{candidate.contact}</TableCell>
                                <TableCell className="text-[var(--text-primary)]">{candidate.email || "-"}</TableCell>
                                <TableCell className="text-[var(--text-primary)]">{candidate.department || "-"}</TableCell>
                                <TableCell className="text-[var(--text-primary)]">{candidate.location}</TableCell>
                                <TableCell>
                                  {getCandidateStatusBadge(candidate.status)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                                No candidates in this batch
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredBatches.length)} of {filteredBatches.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            {Array.from({ length: totalPages }).map((_, index) => (
              <Button
                key={index}
                variant={currentPage === index + 1 ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>

        </div>
      )}
    </div>
  );
}

BatchesList.propTypes = {
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      createdAt: PropTypes.string, // Made optional
      lastEditedAt: PropTypes.string,
      status: PropTypes.string,
      needsReview: PropTypes.bool,
      candidates: PropTypes.array,
      assignedTo: PropTypes.string,
    })
  ).isRequired,
  onEditBatch: PropTypes.func.isRequired,
  onDownloadResults: PropTypes.func, // Optional
  currentBatchId: PropTypes.string,
  role: PropTypes.oneOf(["recruitment", "manager", "admin"]),
  isLoading: PropTypes.bool,
  onBatchDelete: PropTypes.func,

};
