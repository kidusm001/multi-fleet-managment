import api from "./api";

/**
 * Fetch all candidates
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of candidates
 */
export async function getAllCandidates(filters = {}) {
  try {
    const response = await api.get("/candidates", { params: filters });
    return response.data;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch candidates");
  }
}

/**
 * Get a candidate by ID
 * @param {string} candidateId - The candidate's ID
 * @returns {Promise<Object>} The candidate data
 */
export async function getCandidateById(candidateId) {
  try {
    const response = await api.get(`/candidates/${candidateId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching candidate ${candidateId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to fetch candidate");
  }
}

/**
 * Create a new candidate
 * @param {Object} candidateData - The candidate data
 * @returns {Promise<Object>} The created candidate
 */
export async function createCandidate(candidateData) {
  try {
    const response = await api.post("/candidates", candidateData);
    return response.data;
  } catch (error) {
    console.error("Error creating candidate:", error);
    throw new Error(error.response?.data?.message || "Failed to create candidate");
  }
}

/**
 * Update a candidate
 * @param {string} candidateId - The candidate's ID
 * @param {Object} candidateData - The updated candidate data
 * @returns {Promise<Object>} The updated candidate
 */
export async function updateCandidate(candidateId, candidateData) {
  try {
    const response = await api.put(`/candidates/${candidateId}`, candidateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating candidate ${candidateId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to update candidate");
  }
}

/**
 * Update a candidate in a potentially reviewed batch
 * This function is aware of the batch review status and will properly handle edits to reviewed candidates
 * @param {string} candidateId - The candidate's ID
 * @param {Object} candidateData - The updated candidate data
 * @returns {Promise<Object>} The updated candidate and batch status information
 */
export async function updateCandidateWithReviewCheck(candidateId, candidateData) {
  try {
    const response = await api.put(`/candidates/${candidateId}`, candidateData);
    
    // Check if the response includes information about the batch needing re-review
    const requiresReReview = response.data.batch?.status === 'Needs_reReview';
    
    return {
      ...response.data,
      requiresReReview
    };
  } catch (error) {
    console.error(`Error updating candidate ${candidateId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to update candidate");
  }
}

/**
 * Delete a candidate
 * @param {string} candidateId - The candidate's ID
 * @returns {Promise<void>}
 */
export async function deleteCandidate(candidateId) {
  try {
    await api.delete(`/candidates/${candidateId}`);
  } catch (error) {
    console.error(`Error deleting candidate ${candidateId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to delete candidate");
  }
}

/**
 * Change candidate status
 * @param {string} candidateId - The candidate ID
 * @param {string} status - New status (APPROVED, REJECTED, PENDING)
 * @returns {Promise<Object>} Updated candidate
 */
export async function changeCandidateStatus(candidateId, status) {
  try {
    const response = await api.patch(`/candidates/${candidateId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error changing status for candidate ${candidateId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to update candidate status");
  }
}

/**
 * Bulk import candidates from CSV/Excel file
 * @param {File} file - The file to upload
 * @returns {Promise<Array>} Array of processed candidates
 */
export async function importCandidates(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await api.post("/candidates/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("Error importing candidates:", error);
    throw new Error(
      error.response?.data?.message || 
      "Failed to import candidates. Please check your file format."
    );
  }
}

/**
 * Process candidates and assign them to a batch
 * @param {Array} candidates - Array of candidate objects
 * @param {string} batchId - Optional batch ID for updating an existing batch
 * @returns {Promise<Object>} Batch with candidates
 */
export async function processCandidates(candidates, batchId = null) {
  try {
    const endpoint = batchId 
      ? `/candidates/batch/${batchId}` 
      : "/candidates/batch";
    
    const response = await api.post(endpoint, { candidates });
    return response.data;
  } catch (error) {
    console.error("Error processing candidates:", error);
    throw new Error(error.response?.data?.message || "Failed to process candidates");
  }
}

/**
 * Get candidates by batch ID
 * @param {string} batchId - The batch ID
 * @returns {Promise<Array>} List of candidates in the batch
 */
export async function getCandidatesByBatch(batchId) {
  try {
    const response = await api.get(`/candidates/batch/${batchId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching candidates for batch ${batchId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to fetch candidates for this batch");
  }
}

/**
 * Create multiple candidates in a single batch operation
 * @param {Array} candidates - Array of candidate objects to be created
 * @returns {Promise<Array>} The created candidates
 */
export async function createCandidatesInBatch(candidates) {
  try {
    const response = await api.post("/candidates/batch", { candidates });
    return response.data;
  } catch (error) {
    console.error("Error creating candidates in batch:", error);
    throw new Error(error.response?.data?.message || "Failed to create candidates in batch");
  }
}

// Export a named object that contains all the functions
export const candidateService = {
  getAllCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  changeCandidateStatus,
  updateCandidateStatus: changeCandidateStatus, // Added alias for consistent naming with backend
  importCandidates,
  processCandidates,
  getCandidatesByBatch,
  createCandidatesInBatch,
  updateCandidateWithReviewCheck
};

// Add individual named export for direct importing
export const updateCandidateStatus = changeCandidateStatus;
