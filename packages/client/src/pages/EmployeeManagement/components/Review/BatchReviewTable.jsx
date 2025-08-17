
import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@components/Common/UI/Button";
import { Checkbox } from "@components/Common/UI/Checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";
import { cn } from "@/lib/utils";
import { useTheme } from "@contexts/ThemeContext";
import { useToast } from "@components/Common/UI/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { batchService } from "@/services/batchService";

// Number of candidates to show per page
const ITEMS_PER_PAGE = 5;

export function BatchReviewTable({ 
  candidates, 
  onApprove, 
  onDeny, 
  isLoading, 
  batchId,
  onReviewComplete // Add this new prop
}) {
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toast } = useToast();

  // Calculate pagination values
  const totalCandidates = candidates.length;
  const totalPages = Math.ceil(totalCandidates / ITEMS_PER_PAGE);
  
  // Get current page of candidates
  const currentCandidates = candidates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Initialize selections based on candidates status if they already have one
  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    
    const initialSelections = {};
    candidates.forEach(candidate => {
      // Pre-select candidates that are already approved
      if (candidate.status === "APPROVED" || candidate.status === "Approved") {
        initialSelections[candidate.id] = true;
      }
    });
    
    setSelectedCandidates(initialSelections);
  }, [candidates]);

  // Reset to first page when candidates change
  useEffect(() => {
    setCurrentPage(1);
  }, [candidates]);

  const selectedCount = Object.values(selectedCandidates).filter(Boolean).length;
  const allSelected = selectedCount === candidates.length;
  const someSelected = selectedCount > 0 && !allSelected;
  
  // Current page statuses
  const currentPageSelectedCount = currentCandidates.filter(c => selectedCandidates[c.id]).length;
  const allCurrentSelected = currentPageSelectedCount === currentCandidates.length && currentCandidates.length > 0;
  const someCurrentSelected = currentPageSelectedCount > 0 && !allCurrentSelected;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedCandidates({});
    } else {
      const newSelected = {};
      candidates.forEach((candidate) => {
        newSelected[candidate.id] = true;
      });
      setSelectedCandidates(newSelected);
    }
  }, [allSelected, candidates]);
  
  // For selecting/deselecting just the current page
  const handleSelectCurrentPage = useCallback(() => {
    if (allCurrentSelected) {
      // If all on current page are selected, deselect them
      const newSelected = { ...selectedCandidates };
      currentCandidates.forEach(candidate => {
        newSelected[candidate.id] = false;
      });
      setSelectedCandidates(newSelected);
    } else {
      // Otherwise select all on current page
      const newSelected = { ...selectedCandidates };
      currentCandidates.forEach(candidate => {
        newSelected[candidate.id] = true;
      });
      setSelectedCandidates(newSelected);
    }
  }, [allCurrentSelected, currentCandidates, selectedCandidates]);

  const handleSelectCandidate = useCallback((candidateId) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [candidateId]: !prev[candidateId],
    }));
    
    // Reset confirming state when selection changes
    if (isConfirming) {
      setIsConfirming(false);
    }
  }, [isConfirming]);

  const handleSubmit = useCallback(async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    const approvedIds = Object.entries(selectedCandidates)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);

    const deniedIds = candidates
      .map((c) => c.id)
      .filter((id) => !selectedCandidates[id]);

    if (selectedCount === 0 && deniedIds.length === 0) {
      toast({
        title: "No Action Taken",
        description: "Please select candidates to approve/deny",
        variant: "warning",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Process approvals and denials in parallel if both exist
      const promises = [];
      
      if (approvedIds.length > 0) {
        promises.push(onApprove(approvedIds));
      }
      
      if (deniedIds.length > 0) {
        promises.push(onDeny(deniedIds));
      }
      
      // Wait for all candidate status updates to complete
      await Promise.all(promises);
      
      // Now update the batch status to REVIEWED since we've processed all candidates
      if (batchId) {
        await batchService.updateBatchStatus(batchId, "REVIEWED");
        toast({
          title: "Batch Reviewed",
          description: `Batch has been successfully reviewed and status updated`,
          duration: 3000,
        });
        
        // Signal completion to parent component
        onReviewComplete(batchId);
      }
    } catch (error) {
      console.error("Error processing review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete the review process",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsConfirming(false);
    }
  }, [isConfirming, selectedCandidates, candidates, selectedCount, onApprove, onDeny, batchId, toast, onReviewComplete]);

  const handleClearSelection = useCallback(() => {
    setSelectedCandidates({});
    setIsConfirming(false);
  }, []);
  
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    // Reset confirming state when changing pages
    if (isConfirming) {
      setIsConfirming(false);
    }
  }, [isConfirming]);

  // Get current status of a candidate (from existing status or selection state)
  const getCandidateStatus = useCallback((candidate) => {
    // If candidate already has a status, use that first
    if (candidate.status) {
      if (candidate.status === "APPROVED" || candidate.status === "Approved") {
        return "Approved";
      }
      if (candidate.status === "REJECTED" || candidate.status === "Denied") {
        return "Denied";
      }
    }
    
    // Otherwise use the current selection state
    return selectedCandidates[candidate.id] ? "Approved" : "Denied";
  }, [selectedCandidates]);

  return (
    <div className="space-y-4">
      <div
        className={`flex items-center justify-between p-4 ${
          isDark ? "bg-slate-800/50" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected ? "true" : undefined}
            onCheckedChange={handleSelectAll}
            className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            disabled={isLoading || isProcessing}
          />
          <span className={isDark ? "text-gray-300" : "text-gray-600"}>
            {selectedCount} of {candidates.length} selected for approval
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClearSelection}
            disabled={selectedCount === 0 || isLoading || isProcessing}
            className={cn(
              "border",
              isDark
                ? "bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200"
                : "bg-white border-gray-200 hover:bg-gray-100 text-gray-900"
            )}
          >
            Clear Selection
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isProcessing}
            className={cn(
              "text-white",
              isConfirming
                ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                : "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            )}
          >
            {isLoading || isProcessing ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-r-transparent"></span>
                Processing...
              </span>
            ) : isConfirming ? (
              `Confirm ${selectedCount === 0 ? "All Denied" : "Decisions"}`
            ) : (
              `Submit Review`
            )}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className={isDark ? "bg-slate-800/50" : "bg-gray-50"}>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allCurrentSelected}
                indeterminate={someCurrentSelected ? "true" : undefined}
                onCheckedChange={handleSelectCurrentPage}
                className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                disabled={isLoading || isProcessing}
              />
            </TableHead>
            <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
              Name
            </TableHead>
            <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
              Contact
            </TableHead>
            <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
              Email
            </TableHead>
            <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
              Department
            </TableHead>
            <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
              Location
            </TableHead>
            <TableHead className={isDark ? "text-gray-300" : "text-gray-700"}>
              Decision
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isDark ? "bg-slate-900" : "bg-white"}>
          {currentCandidates.map((candidate) => (
            <TableRow
              key={candidate.id}
              className={cn(
                "cursor-pointer transition-colors",
                selectedCandidates[candidate.id]
                  ? "bg-emerald-50/30 dark:bg-emerald-900/20"
                  : isDark
                  ? "hover:bg-slate-800/50"
                  : "hover:bg-gray-50"
              )}
              onClick={() => handleSelectCandidate(candidate.id)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedCandidates[candidate.id] || false}
                  onCheckedChange={() => handleSelectCandidate(candidate.id)}
                  className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  disabled={isLoading || isProcessing}
                />
              </TableCell>
              <TableCell className={isDark ? "text-white" : "text-gray-900"}>
                {candidate.name}
              </TableCell>
              <TableCell className={isDark ? "text-white" : "text-gray-900"}>
                {candidate.contact || '-'}
              </TableCell>
              <TableCell className={isDark ? "text-white" : "text-gray-900"}>
                {candidate.email || '-'}
              </TableCell>
              <TableCell className={isDark ? "text-white" : "text-gray-900"}>
                {candidate.department || '-'}
              </TableCell>
              <TableCell className={isDark ? "text-white" : "text-gray-900"}>
                {candidate.location || '-'}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(
                    "transition-colors",
                    selectedCandidates[candidate.id]
                      ? "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-emerald-100 border-none font-medium"
                      : "bg-red-500 text-white dark:bg-red-600 dark:text-red-100 border-none font-medium"
                  )}
                >
                  {selectedCandidates[candidate.id] ? "Approved" : "Denied"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination controls - only show if we have multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCandidates)} of {totalCandidates} candidates
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading || isProcessing}
              className={cn(
                "border",
                isDark
                  ? "bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200"
                  : "bg-white border-gray-200 hover:bg-gray-100 text-gray-900"
              )}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            {/* Page number indicators */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                // Logic to show current page and surrounding pages
                let pageToShow;
                if (totalPages <= 5) {
                  // Show all pages if 5 or fewer
                  pageToShow = index + 1;
                } else if (currentPage <= 3) {
                  // Near the start
                  pageToShow = index + 1;
                  if (index === 4) pageToShow = totalPages;
                } else if (currentPage >= totalPages - 2) {
                  // Near the end
                  pageToShow = index === 0 ? 1 : totalPages - 4 + index;
                } else {
                  // In the middle
                  pageToShow = currentPage - 2 + index;
                  if (index === 0) pageToShow = 1;
                  if (index === 4) pageToShow = totalPages;
                }
                
                // Show ellipsis or page number
                if ((index === 1 && pageToShow !== 2 && totalPages > 5) || 
                    (index === 3 && pageToShow !== totalPages - 1 && totalPages > 5)) {
                  return <span key={index} className="px-2">...</span>;
                }
                
                return (
                  <Button
                    key={index}
                    variant={currentPage === pageToShow ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => handlePageChange(pageToShow)}
                    disabled={isLoading || isProcessing}
                  >
                    {pageToShow}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isLoading || isProcessing}
              className={cn(
                "border",
                isDark
                  ? "bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200"
                  : "bg-white border-gray-200 hover:bg-gray-100 text-gray-900"
              )}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="mt-4 text-sm text-gray-500 italic">
        Click on rows to toggle approval status. Unselected candidates will be
        automatically denied.
      </p>

    </div>
  );
}

BatchReviewTable.propTypes = {
  candidates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      contact: PropTypes.string,
      email: PropTypes.string,
      department: PropTypes.string,
      location: PropTypes.string.isRequired,
      status: PropTypes.string,
    })
  ).isRequired,
  onApprove: PropTypes.func.isRequired,
  onDeny: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  batchId: PropTypes.string,
  onReviewComplete: PropTypes.func // Add this
};

BatchReviewTable.defaultProps = {
  isLoading: false,
  batchId: null,
  onReviewComplete: () => {} // Default empty function
};
