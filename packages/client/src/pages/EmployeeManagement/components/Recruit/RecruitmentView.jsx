import { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { read, utils } from "xlsx";
import { useToast } from "@components/Common/UI/use-toast";
import { candidateService } from "@services/candidateService";
import { batchService } from "@services/batchService";

// Local components
import { CandidatePreviewModal } from "./CandidatePreviewModal";
import { EditCandidateModal } from "./EditCandidateModal";
import { InvalidCsvModal } from "./InvalidCsvModal";
import { RecruitmentUploadSection } from "./RecruitmentUploadSection";
import { RecruitmentBatchesSection } from "./RecruitmentBatchesSection";
import { RecruitmentEmployeeOverview } from "./RecruitmentEmployeeOverview";
import { RecruitmentEmployeeList } from "./RecruitmentEmployeeList";

// Utils & Constants
import {
  validateCandidateData,
  validateEmail,
  validateFileUpload,
  validatePhoneNumber
} from "@/utils/validators";

const ITEMS_PER_PAGE = 10;

// Internal utility functions
const getNextCandidateId = (existingCandidates, processedCandidates = []) => {
  const allIds = new Set(
    [
      ...existingCandidates.map((c) => c.id || ""),
      ...processedCandidates.map((c) => c.id || ""),
    ].filter((id) => id)
  );

  const timestamp = Date.now();
  let counter = 1;
  let newId;
  do {
    // Include timestamp in ID to ensure uniqueness
    newId = `C${String(counter).padStart(3, "0")}-${timestamp}-${Math.random()
      .toString(36)
      .substring(2, 5)}`;
    counter++;
  } while (allIds.has(newId));

  return newId;
};

// removed unused getNextBatchId

const checkForDuplicates = (candidate, existingCandidates) => {
  return existingCandidates.find(
    (existing) =>
      (existing.name?.toLowerCase() === candidate.name?.toLowerCase() &&
        existing.contact === candidate.contact) ||
      existing.contact === candidate.contact
  );
};

// Internal processFileData function
const processFileData = (rows, existingCandidates) => {
  // Remove empty rows
  const nonEmptyRows = rows.filter(row => Array.isArray(row) && row.some(cell => cell && cell.toString().trim()));
  
  if (nonEmptyRows.length === 0) {
    return {
      processedCandidates: [],
      hasErrors: true,
      validationErrors: [{ message: 'File contains no data' }]
    };
  }

  // Get headers and normalize them
  const headers = nonEmptyRows[0].map(h => h?.toLowerCase()?.trim() || '');
  const requiredFields = ['name', 'location', 'contact'];
  
  // Find indices of required fields
  const fieldIndexes = {
    name: headers.findIndex(h => h === 'name'),
    location: headers.findIndex(h => h === 'location'),
    contact: headers.findIndex(h => h === 'contact'),
    email: headers.findIndex(h => h === 'email'),
    department: headers.findIndex(h => h === 'department')
  };

  // Check for missing required fields
  const missingFields = requiredFields.filter(field => fieldIndexes[field] === -1);
  if (missingFields.length > 0) {
    return {
      processedCandidates: [],
      hasErrors: true,
      validationErrors: [{
        message: `Missing required columns: ${missingFields.join(', ')}`
      }]
    };
  }

  const validationErrors = [];
  const processedCandidates = nonEmptyRows.slice(1)
    .map((row, index) => {
      // Skip completely empty rows
      if (row.every(cell => !cell?.toString().trim())) return null;

      const candidate = {
        id: getNextCandidateId(existingCandidates),
        name: row[fieldIndexes.name]?.toString().trim() || '',
        location: row[fieldIndexes.location]?.toString().trim() || '',
        contact: row[fieldIndexes.contact]?.toString().trim() || '',
        email: fieldIndexes.email >= 0 ? row[fieldIndexes.email]?.toString().trim() || '' : '',
        department: fieldIndexes.department >= 0 ? row[fieldIndexes.department]?.toString().trim() || '' : '',
        submittedAt: new Date().toISOString()
      };

      // Validate the candidate
      const validation = validateCandidateData(candidate);
      if (!validation.isValid) {
        validationErrors.push({
          rowNumber: index + 2, // +2 because we're 0-based and skipped header
          candidate: candidate.name || `Row ${index + 2}`,
          errors: validation.errors
        });
        return null;
      }

      // Check for duplicates
      const duplicate = checkForDuplicates(candidate, existingCandidates);
      if (duplicate) {
        return {
          ...candidate,
          status: "Duplicate",
          duplicateOf: duplicate.id,
          duplicateInfo: `Duplicate of ${duplicate.name} (${duplicate.contact})`
        };
      }

      return candidate;
    })
    .filter(Boolean);

  return {
    processedCandidates,
    hasErrors: validationErrors.length > 0,
    validationErrors
  };
};

export function RecruitmentView({
  getEmployeeStats,
  assignmentFilter,
  setAssignmentFilter,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  getFilteredEmployees,
  getFilteredCandidates,
  exportCandidatesData: _exportCandidatesData,
  shuttleRoutes,
  existingCandidates,
  onAddCandidates,
  onRemoveCandidate,
  role: _role,
  onUpdateBatch,
}) {
  const { toast } = useToast();
  const [candidatesPage, _setCandidatesPage] = useState(1);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [pastedData, setPastedData] = useState("");
  const [previewCandidates, setPreviewCandidates] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [selectedRole, setSelectedRole] = useState(() => {
    // Initialize from localStorage if available, otherwise default to "manager"
    try {
      return localStorage.getItem('preferredAssigneeRole') || "manager";
    } catch (e) {
      return "manager";
    }
  });
  const [invalidCsvModalOpen, setInvalidCsvModalOpen] = useState({
    open: false,
    description: "",
    title: "Validation Error",
    severity: "error"
  });
  const [editingMode, setEditingMode] = useState({
    isEditing: false,
    batchId: null,
  });
  const [previewTableData, setPreviewTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [batchHistory, setBatchHistory] = useState([]);

  // Fetch batch history when component mounts
  useEffect(() => {
    const fetchBatchHistory = async () => {
      try {
        setIsLoading(true);
        const batches = await batchService.getAllBatches();
        
        // Process batches to ensure they have consistent format
        const processedBatches = batches.map(batch => ({
          ...batch,
          submittedAt: batch.submittedAt || new Date().toISOString(),
          status: batch.status || "Pending Review",
          needsReview: !!batch.needsReview,
          assignedTo: batch.assignedTo || "manager"
        }));
        
        setBatchHistory(processedBatches);
      } catch (error) {
        console.error("Error fetching batch history:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load batch history",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBatchHistory();
  }, [toast]);

  // Data processing remains unchanged
  const filteredCandidates = getFilteredCandidates();
  const filteredEmployees = getFilteredEmployees();
  const _candidatesPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE);
  const employeesPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const _paginatedCandidates = filteredCandidates.slice(
    (candidatesPage - 1) * ITEMS_PER_PAGE,
    candidatesPage * ITEMS_PER_PAGE
  );
  const paginatedEmployees = filteredEmployees.slice(
    (employeesPage - 1) * ITEMS_PER_PAGE,
    employeesPage * ITEMS_PER_PAGE
  );

  // Enhanced file selection handler with robust validation and backend integration
  const handleFileSelect = useCallback(async (file) => {
    if (!file) {
      setInvalidCsvModalOpen({
        open: true,
        description: "Please select a file to upload",
        title: "No File Selected",
        severity: "warning"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Step 1: Basic file validation
      const fileValidation = validateFileUpload(file);
      if (!fileValidation.isValid) {
        setInvalidCsvModalOpen({
          open: true,
          description: fileValidation.errors.join('\n'),
          title: "Invalid File",
          severity: "error"
        });
        return;
      }

      // Step 2: Read file contents
      let rawData;
      try {
        const extension = file.name.toLowerCase().split('.').pop();
        if (extension === 'csv') {
          const text = await file.text();
          const firstLine = text.split('\n')[0];
          const delimiter = [',', ';', '\t'].find(d => firstLine.includes(d)) || ',';
          rawData = text.split('\n').map(line => 
            line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
          );
        } else {
          const buffer = await file.arrayBuffer();
          const workbook = read(buffer);
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          rawData = utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        }
      } catch (error) {
        console.error('File reading error:', error);
        setInvalidCsvModalOpen({
          open: true,
          description: "Unable to read file contents. Please check if the file is corrupted.",
          title: "File Reading Error",
          severity: "error"
        });
        return;
      }

      // Step 3: Process and validate data
      const processedResult = processFileData(rawData, existingCandidates);
      
      if (processedResult.hasErrors) {
        const errorMessage = processedResult.validationErrors
          .map(error => {
            if (error.rowNumber) {
              return `Row ${error.rowNumber} (${error.candidate}): ${error.errors.join(', ')}`;
            }
            return error.message;
          })
          .join('\n');

        setInvalidCsvModalOpen({
          open: true,
          description: errorMessage,
          title: processedResult.processedCandidates.length > 0 ? "Partial Validation Issues" : "Validation Failed",
          severity: processedResult.processedCandidates.length > 0 ? "warning" : "error"
        });
      }

      if (processedResult.processedCandidates.length > 0) {
        setPreviewCandidates(processedResult.processedCandidates);
        setIsPreviewModalOpen(true);
      }

    } catch (error) {
      console.error("File processing error:", error);
      setInvalidCsvModalOpen({
        open: true,
        description: "There was an error processing your file. Please check the format and try again.",
        title: "File Processing Error",
        severity: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [existingCandidates]);

  // Enhanced paste data handler with better validation and performance
  const handlePasteData = useCallback((e) => {
    const newPastedData = e.target.value;
    setPastedData(newPastedData);

    try {
      // Split by newlines and filter out empty lines
      const lines = newPastedData
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      // Process all lines including the first one
      const parsedData = lines.map((line) => {
        const [name, contact, email, department, location] = line
          .split("\t")
          .map((field) => field?.trim() || "");
        return { name, contact, email, department, location };
      });

      // Update the preview table data immediately
      setPreviewTableData(parsedData);
    } catch (error) {
      console.error("Parse error:", error);
      // Don't interrupt the user experience for simple parse errors while typing
    }
  }, []);

  // Enhanced preview submission with robust validation and backend error handling
  const handlePreviewSubmit = useCallback(() => {
    if (!pastedData.trim()) {
      toast({
        title: "Empty Data",
        description: "Please paste some data first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Process the previewTableData
      if (!previewTableData || previewTableData.length === 0) {
        throw new Error("Invalid data input detected");
      }

      // Process and validate the candidates
      const timestamp = new Date().toISOString();
      const processedCandidates = [];
      const validationErrors = [];

      previewTableData.forEach((row, index) => {
        // Skip completely empty rows
        if (!row.name?.trim() && !row.contact?.trim() && !row.location?.trim() && 
            !row.email?.trim() && !row.department?.trim()) {
          return;
        }

        const rowErrors = [];
        // Required field validation
        if (!row.name?.trim()) rowErrors.push("name is required");
        if (!row.location?.trim()) rowErrors.push("location is required");

        // Format validation
        if (row.contact?.trim() && !validatePhoneNumber(row.contact?.trim())) {
          rowErrors.push("invalid contact format");
        }
        if (row.email?.trim() && !validateEmail(row.email?.trim())) {
          rowErrors.push("invalid email format");
        }

        if (rowErrors.length > 0) {
          validationErrors.push({
            row: index + 1,
            name: row.name?.trim() || `Row ${index + 1}`,
            errors: rowErrors
          });
          return;
        }

        const candidate = {
          id: getNextCandidateId(existingCandidates),
          name: row.name.trim(),
          contact: row.contact?.trim() || '',
          email: row.email?.trim() || '',
          department: row.department?.trim() || '',
          location: row.location.trim(),
          submittedAt: timestamp,
        };

        // Check for duplicates
        const duplicate = checkForDuplicates(candidate, existingCandidates);
        if (duplicate) {
          candidate.status = "Duplicate";
          candidate.duplicateOf = duplicate.id;
          candidate.duplicateInfo = `Duplicate of ${duplicate.name} (${duplicate.contact})`;
        }

        processedCandidates.push(candidate);
      });

      // Check if we have validation errors
      if (validationErrors.length > 0) {
        // Format error message for display
        const errorMessage = validationErrors.map(err => 
          `Row ${err.row} (${err.name}): ${err.errors.join(', ')}`
        ).join('\n');
        
        // Show in InvalidCsvModal for better visibility
        setInvalidCsvModalOpen({
          open: true,
          description: errorMessage,
          title: "Pasted Data Validation Error",
          severity: "error"
        });
        return;
      }

      if (processedCandidates.length === 0) {
        toast({
          title: "No Valid Data",
          description: "Please ensure data contains at least name and location",
          variant: "destructive"
        });
        return;
      }

      setPreviewCandidates(processedCandidates);
      setIsPreviewModalOpen(true);

    } catch (error) {
      console.error("Parse error:", error);
      toast({
        title: "Error Parsing Data",
        description: "Please ensure data is tab-separated and contains: Name, Contact, Email, Department, Location",
        variant: "destructive",
      });
    }
  }, [pastedData, previewTableData, existingCandidates, toast]);

  // Enhanced candidate editing with proper backend integration
  const handleEditCandidate = useCallback((candidate) => {
    setEditingCandidate({
      ...candidate,
      lastEditedAt: new Date().toISOString(),
    });
  }, []);

  // Save edited candidate with proper backend integration
  const handleSaveCandidateEdit = useCallback(async (editedCandidate) => {
    try {
      setIsLoading(true);
      
      // If we're editing a candidate in the preview modal
      if (isPreviewModalOpen && previewCandidates) {
        setPreviewCandidates((prev) =>
          prev.map((c) => (c.id === editedCandidate.id ? 
            {...editedCandidate, lastEditedAt: new Date().toISOString()} : c))
        );
      } 
      // If we're editing an existing candidate in the database
      else if (editedCandidate.id) {
        const updatedCandidate = await candidateService.updateCandidateWithReviewCheck(
          editedCandidate.id, 
          {...editedCandidate, lastEditedAt: new Date().toISOString()}
        );
        
        // If candidate is part of a reviewed batch, show notification
        if (updatedCandidate.requiresReReview) {
          toast({
            title: "Batch Needs Re-Review",
            description: "The candidate's batch will need to be reviewed again due to your changes.",
            duration: 6000,
          });
        }
        
        // Refresh batch history to reflect changes
        const batches = await batchService.getAllBatches();
        setBatchHistory(batches);
      }
      
      setEditingCandidate(null);

      toast({
        title: "Success",
        description: "Candidate updated successfully",
      });
    } catch (error) {
      console.error("Error saving candidate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update candidate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isPreviewModalOpen, previewCandidates, toast]);

  // Handle candidate removal with proper backend integration
  const handleRemoveCandidate = useCallback(async (candidateId) => {
    try {
      setIsLoading(true);
      
      // If removing from preview
      if (isPreviewModalOpen && previewCandidates) {
        setPreviewCandidates((prev) => {
          if (!prev) return prev;

          // Filter out the specific candidate
          const newCandidates = prev.filter((c) => c.id !== candidateId);

          // If all candidates are removed, close the preview
          if (newCandidates.length === 0) {
            setIsPreviewModalOpen(false);
            setPastedData("");
            setPreviewTableData([]);
            return null;
          }

          return newCandidates;
        });
      } 
      // Otherwise, delete from database
      else if (candidateId) {
        // First check if this candidate is in a batch
        const candidate = await candidateService.getCandidateById(candidateId);
        
        await candidateService.deleteCandidate(candidateId);
        
        // If the candidate was in a batch, we may need to mark the batch for re-review
        if (candidate.batchId && candidate.batch?.status === "REVIEWED") {
          // Update batch to needs re-review
          await batchService.updateBatch(candidate.batchId, {
            status: "Needs_reReview",
            lastEditedAt: new Date().toISOString()
          });
        }
        
        onRemoveCandidate(candidateId);
        
        // Refresh batch history
        const batches = await batchService.getAllBatches();
        setBatchHistory(batches);
        
        toast({
          title: "Success",
          description: "Candidate removed successfully",
        });
      }
    } catch (error) {
      console.error("Error removing candidate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove candidate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isPreviewModalOpen, previewCandidates, onRemoveCandidate, toast]);

  // Enhanced preview confirmation with better batch refresh
  const handlePreviewConfirm = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        throw new Error("User information not found. Please log in again.");
      }
      
      // Filter out duplicate candidates
      const validCandidates = previewCandidates?.filter(c => 
        c.status !== "Duplicate" && c.status !== "DUPLICATE"
      ) || [];
      
      if (validCandidates.length === 0) {
        toast({
          title: "No Valid Candidates",
          description: "All candidates were marked as duplicates.",
          variant: "warning"
        });
        setIsPreviewModalOpen(false);
        setPreviewCandidates(null);
        return;
      }
      
      if (editingMode.isEditing && editingMode.batchId) {
        // EDITING EXISTING BATCH
        const timestamp = new Date().toISOString();
        const batchName = document.getElementById("batchName")?.value?.trim() || null;
        const wasReviewed = editingMode.status === "REVIEWED";
        
        // Optimistically update the batch list immediately
        const updatedBatch = {
          id: editingMode.batchId,
          name: batchName,
          status: wasReviewed ? "Needs_reReview" : "PENDING_REVIEW",
          lastEditedAt: timestamp,
          candidates: validCandidates,
          needsReview: wasReviewed
        };
        
        setBatchHistory(prev => prev.map(b => 
          b.id === editingMode.batchId ? updatedBatch : b
        ));
        
        // Perform all operations in parallel for better performance
        await Promise.all([
          // Update batch first
          batchService.updateBatch(editingMode.batchId, {
            name: batchName,
            status: wasReviewed ? "Needs_reReview" : "PENDING_REVIEW",
            lastEditedAt: timestamp
          }),
          
          // Then update UI state
          onUpdateBatch(updatedBatch),
          
          // In parallel, handle all candidate operations
          ...validCandidates.map(candidate => 
            candidateService.updateCandidate(candidate.id, {
              ...candidate,
              status: candidate.status || "PENDING_REVIEW",
              lastEditedAt: timestamp
            })
          )
        ]);

        toast({
          title: wasReviewed ? "Batch Updated" : "Batch Saved",
          description: wasReviewed 
            ? "The batch has been updated and will need to be reviewed again."
            : `Updated batch with ${validCandidates.length} candidates`,
          duration: wasReviewed ? 5000 : 3000,
        });
        
      } else {
        // CREATING NEW BATCH
        const timestamp = new Date().toISOString();
        const batchName = document.getElementById("batchName")?.value?.trim();
        
        // Create batch first to get the ID
        const newBatch = await batchService.createBatch({
          name: batchName || null,
          status: "PENDING_REVIEW",
          submittedById: userId,
          assignedTo: selectedRole?.toUpperCase() || "MANAGER",
          lastEditedAt: timestamp
        });
        
        // Optimistically add the new batch to the list immediately
        const newBatchWithCandidates = {
          ...newBatch,
          candidates: validCandidates,
          needsReview: false
        };
        
        setBatchHistory(prev => [newBatchWithCandidates, ...prev]);
        
        // Add candidates in parallel
        await Promise.all([
          // Update UI state
          onAddCandidates(validCandidates.map(c => ({
            ...c,
            batchId: newBatch.id,
            status: "PENDING_REVIEW",
            lastEditedAt: timestamp
          }))),

          // Add all candidates to batch in parallel
          ...validCandidates.map(candidate => 
            batchService.addCandidateToBatch(newBatch.id, {
              ...candidate,
              status: "PENDING_REVIEW",
              lastEditedAt: timestamp
            })
          )
        ]);
        
        toast({
          title: "Batch Created",
          description: `Created batch with ${validCandidates.length} candidates`,
          duration: 3000,
        });
      }
      
      // Reset UI state
      setIsPreviewModalOpen(false);
      setPreviewCandidates(null);
      setPastedData("");
      setPreviewTableData([]);
      setEditingMode({ isEditing: false, batchId: null });
      
      // Refresh batch list in background to ensure consistency
      batchService.getAllBatches().then(batches => {
        setBatchHistory(batches);
      }).catch(error => {
        console.error("Error refreshing batch list:", error);
      });
      
    } catch (error) {
      console.error("Error processing batch:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process candidates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    previewCandidates,
    editingMode, 
    selectedRole,
    onUpdateBatch,
    onAddCandidates,
    toast,
    setPastedData
  ]);

  // Enhanced file drop handler with proper error tracking
  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileSelect(file);
    } else {
      setInvalidCsvModalOpen({
        open: true,
        description: "No file was detected. Please try dropping the file again.",
        title: "Drop Failed",
        severity: "warning"
      });
    }
  }, [handleFileSelect]);

  // Helper function to normalize status values
  // removed unused normalizeStatus

  // Enhanced download results function with proper backend integration
  const handleDownloadResults = useCallback(async (batch) => {
    try {
      setIsLoading(true);
      
      // Fetch latest batch data to ensure we have the most up-to-date information
      const latestBatch = await batchService.getBatchById(batch.id);
      
      if (!latestBatch.candidates || latestBatch.candidates.length === 0) {
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
        ...latestBatch.candidates.map(c => [
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
      link.setAttribute('download', `batch-${latestBatch.name || latestBatch.id}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${latestBatch.candidates.length} candidate records`,
      });
    } catch (error) {
      console.error("Error downloading batch results:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download batch results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Add this function near your other handler functions in RecruitmentView.jsx
  const handleEditBatch = useCallback((batch) => {
    try {
      setIsLoading(true);
      // Set editing mode
      setEditingMode({
        isEditing: true,
        batchId: batch.id,
        status: batch.status
      });
      
      // Fetch candidates for this batch
      const fetchBatchCandidates = async () => {
        try {
          const candidates = await candidateService.getCandidatesByBatch(batch.id);
          // Transform candidates to match the expected format for preview
          const formattedCandidates = candidates.map(c => ({
            id: c.id,
            name: c.name,
            contact: c.contact || '',
            email: c.email || '',
            department: c.department || '',
            location: c.location,
            status: c.status
          }));
          
          // Open preview modal with these candidates
          setPreviewCandidates(formattedCandidates);
          setIsPreviewModalOpen(true);
        } catch (error) {
          console.error("Error fetching batch candidates:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to load candidates for editing",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchBatchCandidates();
    } catch (error) {
      console.error("Error setting up batch edit:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to prepare batch for editing",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [toast]);

  const handleBatchListUpdate = useCallback((updatedBatches) => {
    setBatchHistory(updatedBatches);
  }, []);

  return (
    <div className="space-y-8">
      <RecruitmentUploadSection
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        handleFileSelect={handleFileSelect}
        handleFileDrop={handleFileDrop}
        pastedData={pastedData}
        setPastedData={setPastedData}
        handlePasteData={handlePasteData}
        previewTableData={previewTableData}
        setPreviewTableData={setPreviewTableData}
        handlePreviewSubmit={handlePreviewSubmit}
        isLoading={isLoading}
      />
      <RecruitmentBatchesSection
        batchHistory={batchHistory}
        handleEditBatch={handleEditBatch}
        handleDownloadResults={handleDownloadResults}
        isLoading={isLoading}
        onBatchListUpdate={handleBatchListUpdate}
        editingMode={editingMode}
      />
      <RecruitmentEmployeeOverview
        getEmployeeStats={getEmployeeStats}
      />
      <RecruitmentEmployeeList
        assignmentFilter={assignmentFilter}
        setAssignmentFilter={setAssignmentFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        getFilteredEmployees={getFilteredEmployees}
        paginatedEmployees={paginatedEmployees}
        employeesPage={employeesPage}
        setEmployeesPage={setEmployeesPage}
        employeesPages={employeesPages}
        shuttleRoutes={shuttleRoutes}
      />

      {/* Modals */}
      {isPreviewModalOpen && previewCandidates && (
        <CandidatePreviewModal
          candidates={previewCandidates}
          onClose={() => {
            // Just close the modal without clearing state
            setIsPreviewModalOpen(false);
          }}
          onConfirm={async (success) => {
            // Only clear input states if submission was successful
            if (success) {
              await handlePreviewConfirm();
              // Clear all related states after successful submission
              setPreviewCandidates(null);
              setEditingMode({ isEditing: false, batchId: null });
              setPastedData("");
              setPreviewTableData([]);
            }
          }}
          onEditCandidate={handleEditCandidate}
          onRemoveCandidate={handleRemoveCandidate}
          isEditing={editingMode.isEditing}
          batchId={editingMode.batchId}
          isLoading={isLoading}
        />
      )}
      {editingCandidate && (
        <EditCandidateModal
          candidate={editingCandidate}
          onSave={handleSaveCandidateEdit}
          onCancel={() => setEditingCandidate(null)}
          isLoading={isLoading}
        />
      )}
      {invalidCsvModalOpen.open && (
        <InvalidCsvModal
          description={invalidCsvModalOpen.description}
          title={invalidCsvModalOpen.title}
          severity={invalidCsvModalOpen.severity}
          onClose={() => setInvalidCsvModalOpen({ ...invalidCsvModalOpen, open: false })}
        />
      )}
    </div>
  );
}

// PropTypes remain unchanged
RecruitmentView.propTypes = {
  getEmployeeStats: PropTypes.func.isRequired,
  assignmentFilter: PropTypes.string.isRequired,
  setAssignmentFilter: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  getFilteredEmployees: PropTypes.func.isRequired,
  getFilteredCandidates: PropTypes.func.isRequired,
  exportCandidatesData: PropTypes.func.isRequired,
  shuttleRoutes: PropTypes.array.isRequired,
  existingCandidates: PropTypes.array.isRequired,
  onAddCandidates: PropTypes.func.isRequired,
  onRemoveCandidate: PropTypes.func.isRequired,
  role: PropTypes.string.isRequired,
  onUpdateBatch: PropTypes.func.isRequired,
};
