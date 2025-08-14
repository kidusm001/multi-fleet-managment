import api from "./api";

/**
 * Fetch all recruitment batches
 * @returns {Promise<Array>} List of recruitment batches
 */
export async function getAllBatches() {
  try {
    const response = await api.get("/batches");
    return response.data;
  } catch (error) {
    console.error("Error fetching batches:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch batches");
  }
}

/**
 * Get a single batch by ID
 * @param {string} batchId - The batch ID
 * @returns {Promise<Object>} The batch data
 */
export async function getBatchById(batchId) {
  try {
    const response = await api.get(`/batches/${batchId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching batch ${batchId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to fetch batch");
  }
}

/**
 * Create a new recruitment batch
 * @param {Object} batchData - The batch data
 * @returns {Promise<Object>} The created batch
 */
export async function createBatch(batchData) {
  try {
    const response = await api.post("/batches", batchData);
    return response.data;
  } catch (error) {
    console.error("Error creating batch:", error);
    throw new Error(error.response?.data?.message || "Failed to create batch");
  }
}

/**
 * Update an existing batch
 * @param {string} batchId - The batch ID
 * @param {Object} batchData - The updated batch data
 * @returns {Promise<Object>} The updated batch
 */
export async function updateBatch(batchId, batchData) {
  try {
    const response = await api.put(`/batches/${batchId}`, batchData);
    return response.data;
  } catch (error) {
    console.error(`Error updating batch ${batchId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to update batch");
  }
}

/**
 * Delete a batch
 * @param {string} batchId - The batch ID to delete
 * @returns {Promise<void>}
 */
export async function deleteBatch(batchId) {
  try {
    await api.delete(`/batches/${batchId}`);
  } catch (error) {
    console.error(`Error deleting batch ${batchId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to delete batch");
  }
}

/**
 * Change batch status
 * @param {string} batchId - The batch ID
 * @param {string} status - New status (APPROVED, REJECTED, PENDING_REVIEW)
 * @returns {Promise<Object>} Updated batch
 */
export async function changeBatchStatus(batchId, status) {
  try {
    const response = await api.patch(`/batches/${batchId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error changing status for batch ${batchId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to update batch status");
  }
}
/**
 * Submit a batch for review
 * @param {string} batchId 
 * @returns {Promise<Object>} Updated batch
 */
export async function submitBatchForReview(batchId) {
  try {
    const response = await api.post(`/batches/${batchId}/submit`);
    return response.data;
  } catch (error) {
    console.error(`Error submitting batch ${batchId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to submit batch for review");
  }
}

/**
 * Submit a batch for re-review with updated data
 * @param {string} batchId - The batch ID
 * @param {Object} batchData - Updated batch data including candidates
 * @returns {Promise<Object>} Updated batch
 */
export async function submitBatchForRereview(batchId, batchData) {
  try {
    // Fetch the current batch to check its status
    const currentBatch = await getBatchById(batchId);
    const newStatus = currentBatch.status === 'REVIEWED' ? 'NEEDS_REREVIEW' : currentBatch.status;
    
    // Update the batch status if needed
    if (newStatus !== currentBatch.status) {
      await changeBatchStatus(batchId, newStatus);
    }
    
    // Update the batch data
    const response = await api.put(`/batches/${batchId}/rereview`, batchData);
    return response.data;
  } catch (error) {
    console.error(`Error submitting batch ${batchId} for re-review:`, error);
    throw new Error(error.response?.data?.message || "Failed to submit batch for re-review");
  }
}

/**
 * Get all batches submitted by a specific user
 * @param {string} submitterId - ID of the user who submitted the batches
 * @returns {Promise<Array>} List of batches submitted by the user
 */
export async function getBatchesBySubmitter(submitterId) {
  try {
    const response = await api.get(`/batches/submitter/${submitterId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching batches for submitter ${submitterId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to fetch your submitted batches");
  }
}

/**
 * Add a new candidate to an existing batch
 * @param {string} batchId - ID of the batch to add the candidate to
 * @param {Object} candidateData - Candidate information
 * @returns {Promise<Object>} The newly created candidate
 */
export async function addCandidateToBatch(batchId, candidateData) {
  try {
    const response = await api.post(`/batches/${batchId}/candidates`, candidateData);
    return response.data;
  } catch (error) {
    console.error(`Error adding candidate to batch ${batchId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to add candidate to batch");
  }
}

/**
 * Remove a candidate from a batch
 * @param {string} batchId - ID of the batch
 * @param {string} candidateId - ID of the candidate to remove
 * @returns {Promise<void>}
 */
export async function removeCandidateFromBatch(batchId, candidateId) {
  try {
    await api.delete(`/batches/${batchId}/candidates/${candidateId}`);
  } catch (error) {
    console.error(`Error removing candidate ${candidateId} from batch ${batchId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to remove candidate from batch");
  }
}

// Alias for changeBatchStatus to maintain API naming consistency with backend
export const updateBatchStatus = changeBatchStatus;

// Create and export the batchService object that contains all functions
export const batchService = {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  changeBatchStatus,
  updateBatchStatus, // Add the alias to the service object too
  submitBatchForReview,
  submitBatchForRereview,
  getBatchesBySubmitter,
  addCandidateToBatch,
  removeCandidateFromBatch
};
