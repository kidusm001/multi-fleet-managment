import { useState, useEffect, useCallback, memo } from "react";
import PropTypes from "prop-types";
import { BatchesList } from "@/pages/EmployeeManagement/components/Review/BatchesList";
import { batchService } from "@/services/batchService";
import { useToast } from "@components/Common/UI/use-toast";
import { Button } from "@components/Common/UI/Button";
import { RefreshCw } from "lucide-react";
import { DeleteBatchModal } from "./DeleteBatchModal";
import { RecruitmentBatchEditModal } from "./RecruitmentBatchEditModal";

export function RecruitmentBatchesSection({
  batchHistory,
  handleEditBatch,
  handleDownloadResults,
  editingMode,
  isLoading: parentIsLoading,
  onBatchesUpdated,
  onBatchListUpdate
}) {
  const [localBatchHistory, setLocalBatchHistory] = useState(batchHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    batchId: null,
    batchName: null
  });
  // State for the Re-Review Edit Modal
  const [editModalState, setEditModalState] = useState({
    isOpen: false,
    batchId: null,
    batchData: null
  });

  // Initialize with props data
  useEffect(() => {
    if (batchHistory && batchHistory.length > 0) {
      setLocalBatchHistory(batchHistory);
    }
  }, [batchHistory]);

  // Refresh batches function
  const refreshBatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get user ID from local storage
      const userId = localStorage.getItem('userId');
      
      if (userId) {
        // Get batches submitted by this user
        const batches = await batchService.getBatchesBySubmitter(userId);
        setLocalBatchHistory(batches);
        
        // Notify parent component of the update if callback exists
        if (onBatchesUpdated) {
          onBatchesUpdated(batches);
        }
      } else {
        // Fallback to all batches if no user ID (shouldn't normally happen)
        const batches = await batchService.getAllBatches();
        setLocalBatchHistory(batches);
        
        if (onBatchesUpdated) {
          onBatchesUpdated(batches);
        }
      }
      
      toast({
        title: "Refreshed",
        description: "Batch list has been updated",
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to refresh batches:", err);
      setError("Failed to refresh batches");
      toast({
        title: "Error",
        description: err.message || "Failed to refresh batches",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, onBatchesUpdated]);

  // Handle download with proper error handling
  const handleDownload = useCallback(async (batchId) => {
    try {
      setIsLoading(true);
      
      // First get the latest batch data to ensure we have current information
      const batch = await batchService.getBatchById(batchId);
      
      handleDownloadResults(batch);
    } catch (err) {
      console.error(`Error downloading batch ${batchId}:`, err);
      toast({
        title: "Download Failed",
        description: err.message || "Failed to download batch results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [handleDownloadResults, toast]);

  // Effect to refresh batches periodically and on changes
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const updatedBatches = await batchService.getAllBatches();
        setLocalBatchHistory(updatedBatches);
        if (onBatchListUpdate) {
          onBatchListUpdate(updatedBatches);
        }
      } catch (error) {
        console.error('Error refreshing batches:', error);
      }
    };

    // Initial fetch
    fetchBatches();

    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(fetchBatches, 30000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [onBatchListUpdate]);

  // Update local state when batchHistory changes
  useEffect(() => {
    setLocalBatchHistory(batchHistory);
  }, [batchHistory]);

  // Handle batch deletion
  const handleBatchDelete = async (batchId) => {
    try {
      await batchService.deleteBatch(batchId);
      
      // After deletion, fetch the updated list
      const updatedBatches = await batchService.getAllBatches();
      setLocalBatchHistory(updatedBatches);
      if (onBatchListUpdate) {
        onBatchListUpdate(updatedBatches);
      }

      toast({
        title: 'Success',
        description: 'Batch deleted successfully',
      });

      setDeleteModalState({ isOpen: false, batchId: null, batchName: null });
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete batch',
        variant: 'destructive',
      });
    }
  };

  // Open delete modal
  const openDeleteModal = (batch) => {
    setDeleteModalState({
      isOpen: true,
      batchId: batch.id,
      batchName: batch.name || `Batch #${batch.id}`
    });
  };

  // New function to handle opening the edit modal for re-review
  const handleEditForReReview = useCallback(async (batch) => {
    try {
      setIsLoading(true);
      
      // Get the full batch data with candidates
      const fullBatchData = await batchService.getBatchById(batch.id);
      
      // Open the edit modal with the batch data
      setEditModalState({
        isOpen: true,
        batchId: batch.id,
        batchData: fullBatchData
      });
      
    } catch (error) {
      console.error('Error preparing batch for edit:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare batch for editing',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle successful batch edit and re-review submission
  const handleBatchEdited = useCallback(async (updatedBatch) => {
    try {
      // Close the edit modal
      setEditModalState({
        isOpen: false,
        batchId: null,
        batchData: null
      });
      
      // Refresh the batch list to show the updated status
      const updatedBatches = await batchService.getAllBatches();
      setLocalBatchHistory(updatedBatches);
      if (onBatchListUpdate) {
        onBatchListUpdate(updatedBatches);
      }
      
      toast({
        title: 'Success',
        description: `Batch ${updatedBatch.name || updatedBatch.id} submitted for re-review`,
      });
      
    } catch (error) {
      console.error('Error updating batches after edit:', error);
    }
  }, [onBatchListUpdate, toast]);

  // Handle closing the edit modal
  const handleCloseEditModal = useCallback(() => {
    setEditModalState({
      isOpen: false,
      batchId: null,
      batchData: null
    });
  }, []);

  return (
    <div className="bg-[var(--card-background)] rounded-xl p-6 border border-[var(--divider)]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Recent Batches
        </h2>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <BatchesList
        batches={localBatchHistory}
        onEditBatch={handleEditForReReview}
        onDownloadResults={handleDownload}
        currentBatchId={editingMode?.batchId}
        role="recruitment"
        isLoading={isLoading || parentIsLoading}
        onBatchDelete={openDeleteModal}
      />

      {/* Delete Modal */}
      <DeleteBatchModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, batchId: null, batchName: null })}
        onConfirm={() => deleteModalState.batchId && handleBatchDelete(deleteModalState.batchId)}
        batchName={deleteModalState.batchName}
      />
      
      {/* Only render the Re-Review Edit Modal when it should be open */}
      {editModalState.isOpen && (
        <RecruitmentBatchEditModal
          isOpen={editModalState.isOpen}
          onClose={handleCloseEditModal}
          batchId={editModalState.batchId}
          initialBatchData={editModalState.batchData}
          onBatchEdited={handleBatchEdited}
        />
      )}
    </div>
  );
}

RecruitmentBatchesSection.propTypes = {
  batchHistory: PropTypes.array.isRequired,
  handleEditBatch: PropTypes.func.isRequired,
  handleDownloadResults: PropTypes.func.isRequired,
  editingMode: PropTypes.shape({
    isEditing: PropTypes.bool,
    batchId: PropTypes.string
  }),
  isLoading: PropTypes.bool,
  onBatchesUpdated: PropTypes.func,
  onBatchListUpdate: PropTypes.func
};

RecruitmentBatchesSection.defaultProps = {
  isLoading: false,
  onBatchesUpdated: null
};

// Use memo to prevent unnecessary re-renders when other parts of the parent component change
export default memo(RecruitmentBatchesSection);