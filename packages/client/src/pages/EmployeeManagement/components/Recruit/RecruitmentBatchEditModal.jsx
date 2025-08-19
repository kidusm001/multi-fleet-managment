// filepath: C:\Users\Netsi\Desktop\Github\hilcoe\Github\shuttle-management\packages\frontend\src\pages\EmployeeManagement\components\Recruit\RecruitmentBatchEditModal.jsx
import { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/Common/UI/dialog";
import { Button } from "@components/Common/UI/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";
import { Badge } from "@/components/Common/UI/Badge";
import { ChevronLeft, ChevronRight, AlertCircle, Plus, Edit2, Trash2 } from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";
import { useToast } from "@components/Common/UI/use-toast";
import { candidateService } from "@/services/candidateService";
import { batchService } from "@/services/batchService";
import { EditCandidateModal } from "./EditCandidateModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/pages/notifications/components/ui/tooltip";

const ITEMS_PER_PAGE = 5;

/**
 * RecruitmentBatchEditModal Component
 * 
 * A modal that allows recruiters to edit a submitted batch of candidates.
 * When a batch is edited, its status is changed to "NEEDS_REREVIEW" and
 * it is sent back to the reviewer (manager/admin) for another review.
 * 
 * @param {Object} props - Component props
 */
export function RecruitmentBatchEditModal({
  isOpen,
  onClose,
  batchId,
  initialBatchData,
  onBatchEdited,
}) {
  const { theme } = useTheme();
  const { toast } = useToast();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!initialBatchData);
  const [batchData, setBatchData] = useState(initialBatchData || { name: "", candidates: [] });
  const [candidates, setCandidates] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [batchName, setBatchName] = useState("");
  
  // Candidate edit modal state
  const [editCandidateModal, setEditCandidateModal] = useState({
    isOpen: false,
    candidate: null,
    mode: null // 'add' or 'edit'
  });
  
  // Fetch batch data if not provided
  useEffect(() => {
    const fetchBatchData = async () => {
      if (batchId && !initialBatchData) {
        try {
          setInitialLoading(true);
          // Get batch details
          const batch = await batchService.getBatchById(batchId);
          
          // Get candidates for this batch
          const batchCandidates = await candidateService.getCandidatesByBatch(batchId);
          
          setBatchData({
            ...batch,
            candidates: batchCandidates
          });
          setCandidates(batchCandidates);
          setBatchName(batch.name || "");
          
        } catch (error) {
          console.error("Error fetching batch data:", error);
          toast({
            title: "Error",
            description: "Failed to load batch data. Please try again.",
            variant: "destructive",
          });
        } finally {
          setInitialLoading(false);
        }
      } else if (initialBatchData) {
        // Use the provided data
        setBatchData(initialBatchData);
        setCandidates(initialBatchData.candidates || []);
        setBatchName(initialBatchData.name || "");
      }
    };
    
    fetchBatchData();
  }, [batchId, initialBatchData, toast]);
  
  // Update local state when batchData changes
  useEffect(() => {
    if (initialBatchData) {
      setBatchData(initialBatchData);
      setCandidates(initialBatchData.candidates || []);
      setBatchName(initialBatchData.name || "");
    }
  }, [initialBatchData]);

  // Pagination logic
  const totalPages = Math.ceil(candidates.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCandidates = candidates.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Handler for opening candidate modal in add mode
  const handleAddCandidate = useCallback(() => {
    setEditCandidateModal({
      isOpen: true,
      candidate: {
        id: `temp_${Date.now()}`, // Add temporary ID for new candidates
        name: "",
        contact: "",
        email: "",
        department: "",
        location: "",
        status: "PENDING_REVIEW",
        batchId: batchId
      },
      mode: 'add'
    });
  }, [batchId]);

  // Handler for opening candidate modal in edit mode
  const handleEditCandidate = useCallback((candidate) => {
    setEditCandidateModal({
      isOpen: true,
      candidate: {
        ...candidate,
        batchId: batchId
      },
      mode: 'edit'
    });
  }, [batchId]);

  // Combined handler for saving candidate (both add and edit)
  const handleSaveCandidate = useCallback((savedCandidate) => {
    if (editCandidateModal.mode === 'add') {
      // Add new candidate to the list
      const tempId = `temp_${Date.now()}`;
      setCandidates(currentCandidates => [
        ...currentCandidates,
        { ...savedCandidate, id: tempId }
      ]);
    } else {
      // Update existing candidate
      setCandidates(currentCandidates => 
        currentCandidates.map(candidate => 
          candidate.id === savedCandidate.id ? savedCandidate : candidate
        )
      );
    }
    
    setHasChanges(true);
    
    // Close the modal
    setEditCandidateModal({
      isOpen: false,
      candidate: null,
      mode: null
    });
    
    toast({
      title: editCandidateModal.mode === 'add' ? "Candidate Added" : "Candidate Updated",
      description: editCandidateModal.mode === 'add' 
        ? "New candidate has been added to the batch" 
        : "The candidate information has been updated",
      duration: 3000,
    });
  }, [editCandidateModal.mode, toast]);

  // Handler for removing a candidate
  const handleRemoveCandidate = useCallback((candidateId) => {
    setCandidates(currentCandidates => 
      currentCandidates.filter(candidate => candidate.id !== candidateId)
    );
    setHasChanges(true);
    
    toast({
      title: "Candidate Removed",
      description: "The candidate has been removed from this batch.",
      duration: 3000,
    });
  }, [toast]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  /**
   * Submit the edited batch for re-review
   */
  const handleSubmitForReReview = async () => {
    try {
      setLoading(true);
      
      // 1. Only update batch status to Needs_reReview if it wasn't already in PENDING_REVIEW
      if (batchData.status !== "PENDING_REVIEW") {
        await batchService.updateBatchStatus(batchId, "Needs_reReview");
      }
      
      // 2. Update batch name if changed
      if (batchName.trim() !== batchData.name) {
        await batchService.updateBatch(batchId, { name: batchName.trim() });
      }
      
      // 3. Get the existing candidates to compare
      const existingCandidates = await candidateService.getCandidatesByBatch(batchId);
      const existingIds = new Set(existingCandidates.map(c => c.id));
      
      // 4. Identify candidates to add, update, or remove
      const toAdd = candidates.filter(c => !c.id || c.id.startsWith('temp_') || !existingIds.has(c.id));
      const toUpdate = candidates.filter(c => c.id && !c.id.startsWith('temp_') && existingIds.has(c.id));
      const currentIds = new Set(candidates.map(c => c.id).filter(id => !id?.startsWith('temp_')));
      const toRemove = existingCandidates.filter(c => !currentIds.has(c.id)).map(c => c.id);
      
      // 5. Execute batch operations in parallel
      await Promise.all([
        // Add new candidates
        ...toAdd.map(candidate => 
          batchService.addCandidateToBatch(batchId, {
            name: candidate.name,
            contact: candidate.contact,
            email: candidate.email || '',
            department: candidate.department || '',
            location: candidate.location,
            status: "PENDING_REVIEW"
          })
        ),
        
        // Update existing candidates
        ...toUpdate.map(candidate => 
          candidateService.updateCandidateWithReviewCheck(candidate.id, candidate)
        ),
        
        // Remove deleted candidates
        ...toRemove.map(candidateId => 
          batchService.removeCandidateFromBatch(batchId, candidateId)
        )
      ]);
      
      // 6. Get the updated batch to pass back to parent
      const refreshedBatch = await batchService.getBatchById(batchId);
      
      // 7. Call the onBatchEdited callback with latest data
      if (onBatchEdited) {
        onBatchEdited(refreshedBatch);
      }
      
      // 8. Close the modal
      onClose();
      
      // 9. Show success toast with appropriate message based on status
      toast({
        title: batchData.status === "PENDING_REVIEW" ? "Batch Updated" : "Batch Submitted for Re-review",
        description: batchData.status === "PENDING_REVIEW" 
          ? `Batch ${batchName.trim() || batchId} has been updated.`
          : `Batch ${batchName.trim() || batchId} has been updated and sent for re-review.`,
        duration: 5000,
      });
      
    } catch (error) {
      console.error("Error updating batch:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update batch",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate status badge based on candidate status
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
      case "Approved":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500 text-white dark:bg-emerald-600 dark:text-emerald-100 border-none font-medium"
          >
            Approved
          </Badge>
        );
      case "REJECTED":
      case "Denied":
        return (
          <Badge
            variant="secondary"
            className="bg-red-500 text-white dark:bg-red-600 dark:text-red-100 border-none font-medium"
          >
            Denied
          </Badge>
        );
      case "DUPLICATE":
      case "Duplicate":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500 text-white dark:bg-purple-600 dark:text-purple-100 border-none font-medium"
          >
            Duplicate
          </Badge>
        );
      case "PENDING_REVIEW":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-500 text-white dark:bg-orange-600 dark:text-orange-100 border-none font-medium"
          >
            Pending
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-orange-500 text-white dark:bg-orange-600 dark:text-orange-100 border-none font-medium"
          >
            Pending
          </Badge>
        );
    }
  };

  /**
   * Render pagination numbers
   */
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
  
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
  
    // First page button
    if (startPage > 1) {
      pageNumbers.push(
        <Button
          key="first"
          variant={1 === currentPage ? "default" : "outline"}
          size="icon"
          className={`h-8 w-8 ${
            1 === currentPage
              ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              : "text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => handlePageChange(1)}
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis1" className="px-1 text-gray-400">...</span>
        );
      }
    }
  
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="icon"
          className={`h-8 w-8 ${
            i === currentPage
              ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              : "text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
  
    // Last page button with ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="ellipsis2" className="px-1 text-gray-400">...</span>
        );
      }
      pageNumbers.push(
        <Button
          key="last"
          variant={totalPages === currentPage ? "default" : "outline"}
          size="icon"
          className={`h-8 w-8 ${
            totalPages === currentPage
              ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              : "text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }
  
    return pageNumbers;
  };

  return (
    <>
      {isOpen && (
        <>
          <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
              className={`
                max-w-4xl
                ${theme === "dark" ? "bg-slate-900" : "bg-white"}
                border 
                ${theme === "dark" ? "border-slate-700" : "border-gray-200"}
                shadow-lg
                dark:shadow-slate-900
                max-h-[85vh]
                flex
                flex-col
              `}
            >
              <DialogHeader
                className={`border-b ${
                  theme === "dark" ? "border-slate-700" : "border-gray-200"
                } pb-4 flex-shrink-0`}
              >
                <DialogTitle
                  className={theme === "dark" ? "text-white" : "text-gray-900"}
                >
                  Edit Batch for Re-review
                  {!initialLoading && (
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      ({candidates.length} candidates)
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription
                  className={theme === "dark" ? "text-gray-400" : "text-gray-500"}
                >
                  Edit this batch to add, remove, or modify candidates. The batch will be sent back for review.
                </DialogDescription>
                
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label 
                      htmlFor="batchName" 
                      className={`block mb-1 text-sm font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Batch Name
                    </label>
                    <input 
                      type="text"
                      id="batchName"
                      value={batchName}
                      onChange={(e) => {
                        setBatchName(e.target.value);
                        if (e.target.value.trim() !== batchData.name) {
                          setHasChanges(true);
                        }
                      }}
                      placeholder={`Batch ${batchId}`}
                      autoFocus={false}
                      tabIndex="-1"
                      className="w-full rounded-lg border transition-colors text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 hover:border-gray-400 py-2 px-4"
                    />
                  </div>
  
                  <div className="flex-none mt-8">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleAddCandidate}
                            className="bg-[#f3684e] hover:bg-[#f3684e]/90 text-white font-medium flex items-center gap-2 rounded-xl px-4 py-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Candidate
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add a new candidate to this batch</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                {hasChanges && (
                  <div className="flex items-center mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md">
                    <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      This batch will be marked for re-review when you save changes.
                    </p>
                  </div>
                )}
              </DialogHeader>
      
              <div
                className={`flex-1 overflow-hidden ${
                  theme === "dark" ? "bg-slate-900" : "bg-white"
                }`}
              >
                {initialLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-opacity-50 border-t-blue-500 rounded-full"></div>
                      <p className={`mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Loading batch data...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`rounded-lg border ${
                      theme === "dark" ? "border-slate-700" : "border-gray-200"
                    } overflow-hidden h-full flex flex-col`}
                  >
                    <div className="overflow-auto flex-1">
                      <Table>
                        <TableHeader>
                          <TableRow
                            className={theme === "dark" ? "bg-slate-800" : "bg-gray-50"}
                          >
                            <TableHead
                              className={
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              Name
                            </TableHead>
                            <TableHead
                              className={
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              Contact
                            </TableHead>
                            <TableHead
                              className={
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              Email
                            </TableHead>
                            <TableHead
                              className={
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              Department
                            </TableHead>
                            <TableHead
                              className={
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              Location
                            </TableHead>
                            <TableHead
                              className={
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              Status
                            </TableHead>
                            <TableHead
                              className={
                                theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody
                          className={theme === "dark" ? "bg-slate-900" : "bg-white"}
                        >
                          {candidates.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="h-32 text-center text-gray-500 dark:text-gray-400"
                              >
                                No candidates in this batch. Click &quot;Add Candidate&quot; to add new candidates.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedCandidates.map((candidate) => (
                              <TableRow
                                key={candidate.id}
                                className={`${
                                  theme === "dark"
                                    ? "hover:bg-slate-800"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <TableCell
                                  className={
                                    theme === "dark" ? "text-white" : "text-gray-900"
                                  }
                                >
                                  {candidate.name}
                                </TableCell>
                                <TableCell
                                  className={
                                    theme === "dark" ? "text-white" : "text-gray-900"
                                  }
                                >
                                  {candidate.contact}
                                </TableCell>
                                <TableCell
                                  className={
                                    theme === "dark" ? "text-white" : "text-gray-900"
                                  }
                                >
                                  {candidate.email || "-"}
                                </TableCell>
                                <TableCell
                                  className={
                                    theme === "dark" ? "text-white" : "text-gray-900"
                                  }
                                >
                                  {candidate.department || "-"}
                                </TableCell>
                                <TableCell
                                  className={
                                    theme === "dark" ? "text-white" : "text-gray-900"
                                  }
                                >
                                  {candidate.location}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(candidate.status)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleEditCandidate(candidate)}
                                            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-700"
                                          >
                                            <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Edit candidate</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleRemoveCandidate(candidate.id)}
                                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                                          >
                                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Remove candidate</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
        
                    {/* Pagination controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, candidates.length)} of {candidates.length} candidates
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`border ${
                              theme === "dark"
                                ? "bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200"
                                : "bg-white border-gray-200 hover:bg-gray-100 text-gray-900"
                            }`}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            {renderPageNumbers()}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={`border ${
                              theme === "dark"
                                ? "bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200"
                                : "bg-white border-gray-200 hover:bg-gray-100 text-gray-900"
                            }`}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
      
              <div
                className={`flex items-center justify-between pt-4 border-t mt-4 flex-shrink-0 ${
                  theme === "dark" ? "border-slate-700" : "border-gray-200"
                }`}
              >
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {!initialLoading && `Total candidates: ${candidates.length}`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-200"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitForReReview}
                    variant="primary"
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                    disabled={loading || !hasChanges || initialLoading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-1">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
                        Saving Changes...
                      </span>
                    ) : (
                      "Sub for Re-review"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Only render EditCandidateModal when it's needed */}
          {editCandidateModal.isOpen && (
            <EditCandidateModal
              candidate={editCandidateModal.candidate}
              onClose={() => setEditCandidateModal({ isOpen: false, candidate: null, mode: null })}
              onSave={handleSaveCandidate}
            />
          )}
        </>
      )}
    </>
  );
}

// PropTypes for type checking
RecruitmentBatchEditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  batchId: PropTypes.string.isRequired, 
  initialBatchData: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    status: PropTypes.string,
    submittedById: PropTypes.string,
    assignedTo: PropTypes.string,
    candidates: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        contact: PropTypes.string, 
        email: PropTypes.string,
        department: PropTypes.string,
        location: PropTypes.string,
        status: PropTypes.string,
      })
    ),
  }),
  onBatchEdited: PropTypes.func,
};

export default RecruitmentBatchEditModal;