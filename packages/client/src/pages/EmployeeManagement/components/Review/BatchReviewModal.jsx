
import { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@components/Common/UI/Button";
import { BatchReviewTable } from "./BatchReviewTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@components/Common/UI/dialog";
import { useTheme } from "@contexts/ThemeContext";
import { useToast } from "@components/Common/UI/use-toast";
import { batchService } from "@/services/batchService";
import { candidateService } from "@/services/candidateService";

export function BatchReviewModal({ batch, onApprove, onDeny, onClose, onReviewComplete }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(batch);
  const [error, setError] = useState(null);

  // Fetch the latest batch data when modal opens to ensure we have current information
  useEffect(() => {
    const fetchLatestBatchData = async () => {
      if (!batch?.id) return;
      
      try {
        setIsLoading(true);
        const latestBatch = await batchService.getBatchById(batch.id);
        setCurrentBatch(latestBatch);
        setError(null);
      } catch (err) {
        console.error("Error fetching latest batch data:", err);
        setError("Failed to load the latest batch data. Please try again.");
        toast({
          title: "Error",
          description: err.message || "Failed to load the latest batch data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestBatchData();
  }, [batch?.id, toast]);

  // Enhanced approve function with proper error handling and backend integration
  const handleApprove = useCallback(async (candidateIds) => {
    if (!candidateIds || candidateIds.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // Update candidates in batch - handle in parallel for performance
      await Promise.all(
        candidateIds.map(id => 
          candidateService.updateCandidateStatus(id, "APPROVED", localStorage.getItem('userId'))
        )
      );
      
      // If all candidates in the batch have been reviewed
      if (candidateIds.length === currentBatch.candidates.length) {
        // Update batch status to REVIEWED
        await batchService.updateBatchStatus(currentBatch.id, "REVIEWED");
      }
      
      toast({
        title: "Success",
        description: `${candidateIds.length} candidates approved successfully`,
        duration: 3000,
      });
      
      // Call the onApprove callback to update parent component
      onApprove(candidateIds);
    } catch (err) {
      console.error("Error approving candidates:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to approve candidates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentBatch, onApprove, toast]);
  
  // Enhanced deny function with proper error handling and backend integration
  const handleDeny = useCallback(async (candidateIds) => {
    if (!candidateIds || candidateIds.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // Update candidates in batch - handle in parallel for performance
      await Promise.all(
        candidateIds.map(id => 
          candidateService.updateCandidateStatus(id, "REJECTED", localStorage.getItem('userId'))
        )
      );
      
      // If all candidates have been processed
      const totalCandidates = currentBatch.candidates.length;
      const allProcessed = candidateIds.length === totalCandidates;
      
      if (allProcessed) {
        // Update batch status to REVIEWED
        await batchService.updateBatchStatus(currentBatch.id, "REVIEWED");
      }
      
      toast({
        title: "Success",
        description: `${candidateIds.length} candidates denied`,
        duration: 3000,
      });
      
      // Call the onDeny callback to update parent component
      onDeny(candidateIds);
    } catch (err) {
      console.error("Error denying candidates:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to deny candidates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentBatch, onDeny, toast]);
  
  const handleReviewComplete = useCallback((batchId) => {
    // Close the modal
    onClose();
    
    // Signal to parent that review is complete to refresh BatchesList
    if (onReviewComplete) {
      onReviewComplete(batchId);
    }
  }, [onClose, onReviewComplete]);

  // Prevent opening the modal if the batch is invalid or already reviewed
  if (!currentBatch || (currentBatch.status === "REVIEWED" && !currentBatch.status === "Needs_reReview")) {
    return null;
  }

  return (
    <div className={isDark ? "dark" : ""}>
      <Dialog open onOpenChange={onClose}>
        <DialogContent
          className={`
          max-w-4xl 
          ${isDark ? "bg-slate-900" : "bg-white"}
          border 
          ${isDark ? "border-slate-700" : "border-gray-200"}
          shadow-lg
          dark:shadow-slate-900
        `}
        >
          <DialogHeader
            className={`border-b ${
              isDark ? "border-slate-700" : "border-gray-200"
            } pb-4`}
          >
            <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
              Review Batch #{currentBatch.id}
              {currentBatch.status === "Needs_reReview" && (
                <Badge className="ml-2 bg-orange-500 text-white">Needs Re-Review</Badge>
              )}
            </DialogTitle>
            <DialogDescription
              className={isDark ? "text-gray-400" : "text-gray-500"}
            >
              Review and approve/deny candidates in this batch. Unselected
              candidates will be denied.
            </DialogDescription>
          </DialogHeader>

          <div
            className={`space-y-4 py-4 ${isDark ? "bg-slate-900" : "bg-white"}`}
          >
            {error ? (
              <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg">
                {error}
                <Button 
                  size="sm" 
                  className="ml-2 bg-red-500 text-white hover:bg-red-600"
                  onClick={() => window.location.reload()}
                >
                  Reload
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div
                className={`rounded-lg border ${
                  isDark ? "border-slate-700" : "border-gray-200"
                } overflow-hidden`}
              >
                <BatchReviewTable
                  candidates={currentBatch.candidates || []}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  isLoading={isLoading}
                  batchId={currentBatch.id}
                  onReviewComplete={handleReviewComplete} // Pass the handler
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

BatchReviewModal.propTypes = {
  batch: PropTypes.shape({
    id: PropTypes.string.isRequired,
    submittedAt: PropTypes.string.isRequired,
    lastEditedAt: PropTypes.string,
    needsReview: PropTypes.bool,
    status: PropTypes.string,
    candidates: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        contact: PropTypes.string.isRequired,
        email: PropTypes.string,
        department: PropTypes.string,
        location: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  onApprove: PropTypes.func.isRequired,
  onDeny: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onReviewComplete: PropTypes.func
};

BatchReviewModal.defaultProps = {
  onReviewComplete: null
};
