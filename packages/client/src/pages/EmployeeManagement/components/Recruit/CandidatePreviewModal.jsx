import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";
import { useToast } from "@components/Common/UI/use-toast";
import { candidateService } from "@/services/candidateService";
import { batchService } from "@/services/batchService"; 
import PropTypes from "prop-types";

const ITEMS_PER_PAGE = 5;

export function CandidatePreviewModal({
  candidates,
  onClose,
  onConfirm,
  onEditCandidate,
  onRemoveCandidate,
  isEditing,
  batchId,
  selectedRole,
}) {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [batchName, setBatchName] = useState(batchId || "");
  const { toast } = useToast();
  const [previewCandidates, setPreviewCandidates] = useState(candidates);

  // Update local state when candidates prop changes
  useEffect(() => {
    setPreviewCandidates(candidates);
  }, [candidates]);

  // Handle edit candidate save
  const handleEditSave = useCallback((editedCandidate) => {
    setPreviewCandidates(currentCandidates => 
      currentCandidates.map(candidate => 
        candidate.id === editedCandidate.id ? editedCandidate : candidate
      )
    );
  }, []);

  // Handle remove candidate
  const handleRemoveCandidate = useCallback((candidateId) => {
    setPreviewCandidates(currentCandidates => 
      currentCandidates.filter(candidate => candidate.id !== candidateId)
    );
  }, []);

  const handleEditClick = useCallback((candidate) => {
    onEditCandidate(candidate, handleEditSave);
  }, [onEditCandidate, handleEditSave]);

  const handleRemoveClick = useCallback((candidateId) => {
    handleRemoveCandidate(candidateId);
    onRemoveCandidate(candidateId);
  }, [handleRemoveCandidate, onRemoveCandidate]);

  const totalPages = Math.ceil(previewCandidates.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCandidates = previewCandidates.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Check if any candidate has duplicate status to adjust modal width
  const hasDuplicates = candidates.some(c => c.status === "Duplicate");

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

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

  const getStatusBadge = (status) => {
    if (!isEditing && !status) {
      return (
        <Badge
          variant="secondary"
          className="bg-orange-500 text-white dark:bg-orange-600 dark:text-orange-100 border-none font-medium"
        >
          New
        </Badge>
      );
    }

    switch (status) {
      case "Approved":
      case "APPROVED":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500 text-white dark:bg-emerald-600 dark:text-emerald-100 border-none font-medium"
          >
            Approved
          </Badge>
        );
      case "Denied":
      case "REJECTED":
        return (
          <Badge
            variant="secondary"
            className="bg-red-500 text-white dark:bg-red-600 dark:text-red-100 border-none font-medium"
          >
            Denied
          </Badge>
        );
      case "Duplicate":
      case "DUPLICATE":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500 text-white dark:bg-purple-600 dark:text-purple-100 border-none font-medium"
          >
            Duplicate
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

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (isEditing) {
        const validCandidates = previewCandidates.filter(c => c.status !== "Duplicate" && c.status !== "DUPLICATE");
        
        // 1. Get existing candidates in this batch
        const existingCandidates = await candidateService.getCandidatesByBatch(batchId);
        const existingIds = new Set(existingCandidates.map(c => c.id));
        
        // 2. Separate candidates that need to be added, updated, or removed
        const toAdd = validCandidates.filter(c => !c.id || !existingIds.has(c.id));
        const toUpdate = validCandidates.filter(c => c.id && existingIds.has(c.id));
        const currentIds = new Set(validCandidates.map(c => c.id).filter(Boolean));
        const toRemove = existingCandidates.filter(c => !currentIds.has(c.id)).map(c => c.id);
        
        // 3. Update batch name first (if provided)
        if (batchName.trim()) {
          await batchService.updateBatch(batchId, { name: batchName.trim() });
        }
        
        // 4. Execute batch operations in parallel
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
        
        toast({
          title: "Batch Updated",
          description: `Updated batch ${batchName.trim() || batchId} with ${validCandidates.length} candidates`,
          duration: 5000,
        });
      } else {
        const validCandidates = previewCandidates.filter(c => c.status !== "Duplicate" && c.status !== "DUPLICATE");
        
        // 1. Create a new batch
        const newBatch = await batchService.createBatch({
          name: batchName.trim() || null,
          status: "PENDING_REVIEW",
          submittedById: userId,
          assignedTo: selectedRole?.toUpperCase() || "MANAGER"
        });
        
        // 2. Add candidates to the batch
        await Promise.all(
          validCandidates.map(candidate => 
            batchService.addCandidateToBatch(newBatch.id, {
              name: candidate.name,
              contact: candidate.contact,
              email: candidate.email || '',
              department: candidate.department || '',
              location: candidate.location,
              status: "PENDING_REVIEW"
            })
          )
        );
        
        toast({
          title: "Batch Created",
          description: `Created batch ${batchName.trim() || newBatch.id} with ${validCandidates.length} candidates`,
          duration: 5000,
        });
      }
      
      // Call onConfirm with the updated candidates
      await onConfirm(true, previewCandidates); 
      onClose();
      
    } catch (error) {
      console.error("Error processing batch:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process candidates",
        variant: "destructive"
      });
      await onConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component remains unchanged
  return (
    <Dialog open onOpenChange={() => {
      // Just close the modal without clearing state
      onClose();
    }} initialFocus={false}>
      <DialogContent
        className={`
          ${hasDuplicates ? 'max-w-5xl' : 'max-w-4xl'}
          ${theme === "dark" ? "bg-slate-900" : "bg-white"}
          border 
          ${theme === "dark" ? "border-slate-700" : "border-gray-200"}
          shadow-lg
          dark:shadow-slate-900
          max-h-[85vh]
          flex
          flex-col
        `}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader
          className={`border-b ${
            theme === "dark" ? "border-slate-700" : "border-gray-200"
          } pb-4 flex-shrink-0`}
        >
          <DialogTitle
            className={theme === "dark" ? "text-white" : "text-gray-900"}
          >
            {isEditing ? `Edit Batch #${batchId}` : "Preview Candidates"}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({candidates.length} entries)
            </span>
          </DialogTitle>
          <DialogDescription
            className={theme === "dark" ? "text-gray-400" : "text-gray-500"}
          >
            {isEditing
              ? "Edit candidates in this batch. Changes will need to be reviewed again."
              : "Review the candidates before submitting."}
          </DialogDescription>
          
          <div className="mt-4 relative">
            <label 
              htmlFor="batchName" 
              className={`block mb-1 text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
            >
              Batch Name (Optional)
            </label>
            <input 
              type="text"
              id="batchName"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder={`Batch ${batchId || 'Name'}`}
              autoFocus={false}
              tabIndex="-1"
              className="w-full rounded-lg border transition-colors text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 hover:border-gray-400 py-2 px-4"
            />
          </div>
        </DialogHeader>

        <div
          className={`flex-1 overflow-hidden ${
            theme === "dark" ? "bg-slate-900" : "bg-white"
          }`}
        >
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
                  {paginatedCandidates.map((candidate) => (
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
                        {candidate.status === "Duplicate" ? (
                          <div className="space-y-1">
                            <Badge variant="destructive">Duplicate</Badge>
                            <p
                              className={`text-xs ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {candidate.duplicateInfo}
                            </p>
                          </div>
                        ) : (
                          getStatusBadge(candidate.status)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(candidate)}
                            className="h-8 px-2 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-200"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveClick(candidate.id)}
                            className="h-8 px-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
            Total candidates: {candidates.length}
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
              onClick={handleConfirm}
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
                  {isEditing ? "Saving..." : "Submitting..."}
                </span>
              ) : (
                isEditing ? "Save Changes" : "Submit Batch"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

CandidatePreviewModal.propTypes = {
  candidates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string.isRequired,
      contact: PropTypes.string,
      email: PropTypes.string,
      department: PropTypes.string,
      location: PropTypes.string.isRequired,
      status: PropTypes.string,
      assignedTo: PropTypes.string,
      batchId: PropTypes.string,
      submittedAt: PropTypes.string,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onEditCandidate: PropTypes.func.isRequired,
  onRemoveCandidate: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  batchId: PropTypes.string,
  selectedRole: PropTypes.string,
};

CandidatePreviewModal.defaultProps = {
  isEditing: false,
  selectedRole: "manager"
};
