import { useState, useCallback, useEffect } from "react";
import { useRole } from "@contexts/RoleContext";
import { useToast } from "@components/Common/UI/use-toast";
import * as XLSX from "xlsx";
import { ROLES } from "@data/constants";
import {
  getAllEmployees,
  deactivateEmployee,
} from "@services/employeeService";
import { employeeService } from "@pages/Settings/services/employeeService";
import { 
  getAllCandidates, 
  createCandidate,
  updateCandidate,
  deleteCandidate,
  updateCandidateStatus,
  createCandidatesInBatch,
  candidateService
} from "@services/candidateService";
import {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  updateBatchStatus,
  batchService
} from "@services/batchService";
import { exportToCSV } from "@utils/parseClipboard";
import ExcelUpload from "@components/Common/UI/ExcelUpload";
import LoadingWrapper from "@components/Common/LoadingAnimation/LoadingWrapper";
import api from '@/services/api';

import { RoleSelector } from "./components/RoleSelector";
import { StatsSection } from "./components/StatsSection";
import { EmployeeTable } from "./components/EmployeeTable";
import { RecruitmentView } from "./components/Recruit/RecruitmentView";
import { BatchesList } from "@/pages/EmployeeManagement/components/Review/BatchesList";
import { BatchReviewModal } from "./components/Review/BatchReviewModal";

export default function EmployeeManagement() {
  const { role, setRole } = useRole();
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("candidates");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const { toast } = useToast();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch departments and shifts
  useEffect(() => {
    const fetchDepartmentsAndShifts = async () => {
      try {
        const [deptResponse, shiftsResponse] = await Promise.all([
          employeeService.getDepartments(),
          employeeService.getShifts()
        ]);
        setDepartments(deptResponse);
        setShifts(shiftsResponse);
      } catch (error) {
        console.error('Error fetching departments and shifts:', error);
        toast({
          title: "Error",
          description: "Failed to load departments and shifts",
          variant: "destructive",
        });
      }
    };

    fetchDepartmentsAndShifts();
  }, [toast]);

  // Fetch employees including deleted ones (marked as inactive)
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the management endpoint to get all employees including deleted ones
        const response = await employeeService.listEmployeesForManagement();
        
        if (isMounted) {
          setEmployees(response);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching employees:', error);
          setError('Failed to load employees. Please try again later.');
          toast({
            title: "Error",
            description: "Failed to load employees",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [toast]);

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters(employees);
  }, [departmentFilter, shiftFilter, statusFilter, assignmentFilter, searchTerm, employees, currentPage, itemsPerPage]);

  // Apply filters to employees
  const applyFilters = useCallback((employeesList) => {
    let filtered = [...employeesList];
    
    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((e) => 
        (e.department?.id?.toString() === departmentFilter) || 
        (e.departmentId?.toString() === departmentFilter)
      );
    }

    // Shift filter
    if (shiftFilter !== "all") {
      filtered = filtered.filter((e) => 
        (e.shift?.id?.toString() === shiftFilter) || 
        (e.shiftId?.toString() === shiftFilter)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Assignment filter
    if (assignmentFilter === "assigned") {
      filtered = filtered.filter((e) => e.assigned === true);
    } else if (assignmentFilter === "unassigned") {
      filtered = filtered.filter((e) => e.assigned === false);
    }

    // Search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Update pagination data
    setTotalEmployees(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage) || 1); // Ensure at least 1 page even when empty
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);
    
    setFilteredEmployees(paginatedData);
  }, [departmentFilter, shiftFilter, statusFilter, assignmentFilter, searchTerm, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, shiftFilter, statusFilter, assignmentFilter, searchTerm]);

  // Fetch candidates with proper error handling
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchCandidates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllCandidates();

        if (isMounted) {
          setCandidates(data || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching candidates:", error);
          setError(error.message);
          toast({
            title: "Error",
            description: error.message || "Failed to fetch candidates",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCandidates();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [toast]);

  // Fetch batches directly from API with better error handling
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchBatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await batchService.getAllBatches();

        if (isMounted) {
          setBatches(data || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching batches:", error);
          setError(error.message);
          toast({
            title: "Error",
            description: error.message || "Failed to fetch batches",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBatches();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [toast]);

  const getFilteredCandidates = useCallback(() => {
    let filtered = candidates;
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [candidates, statusFilter, searchTerm]);

  // No longer need to filter in this function - we're using the filteredEmployees state
  const getFilteredEmployees = useCallback(() => {
    return filteredEmployees;
  }, [filteredEmployees]);

  const getEmployeeStats = useCallback(() => {
    const total = employees.length;
    const assigned = employees.filter((e) => e.assigned === true).length;
    const unassigned = total - assigned;
    const locationGroups = employees.reduce((acc, emp) => {
      acc[emp.location] = (acc[emp.location] || 0) + 1;
      return acc;
    }, {});
    const topLocationEntries = Object.entries(locationGroups).sort(
      (a, b) => b[1] - a[1]
    );
    const topLocation = topLocationEntries.length > 0 ? topLocationEntries[0] : ["None", 0];
    const activeEmployees = employees.filter(e => e.status !== 'inactive' && e.status !== 'removed').length;

    return {
      total,
      assigned,
      unassigned,
      assignedPercentage: total > 0 ? Math.round((assigned / total) * 100) : 0,
      topLocation: topLocation[0],
      topLocationCount: topLocation[1],
      activeEmployees
    };
  }, [employees]);

  const handleCandidateAction = useCallback(
    async (candidateId, action) => {
      if (role === ROLES.MANAGER || role === ROLES.ADMIN) {
        try {
          setIsLoading(true);
          const status = action === "approve" ? "APPROVED" : "REJECTED";
          const userId = localStorage.getItem('userId');

          if (!userId) {
            throw new Error("User session not found. Please log in again.");
          }

          const result = await candidateService.updateCandidateStatus(
            candidateId, 
            status, 
            userId
          );
          
          // Update local state
          setCandidates(prev =>
            prev.map(c =>
              c.id === candidateId
                ? { ...c, status, reviewedById: userId, reviewDate: new Date().toISOString() }
                : c
            )
          );
          
          toast({
            title: "Success",
            description: `Candidate ${action === "approve" ? "approved" : "denied"} successfully`,
            variant: "default",
          });
          
          // Refresh batches to reflect status changes
          const updatedBatches = await batchService.getAllBatches();
          setBatches(updatedBatches);
          
        } catch (error) {
          console.error(`Error ${action}ing candidate:`, error);
          toast({
            title: "Error",
            description: error.message || `Failed to ${action} candidate`,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [role, toast]
  );

  const handleDeactivateEmployee = useCallback(
    async (employeeId) => {
      if (role === ROLES.ADMIN) {
        try {
          setIsLoading(true);
          await employeeService.deactivateEmployee(employeeId);

          // Update employees list with the deactivated employee
          setEmployees(prevEmployees => 
            prevEmployees.map(emp => 
              emp.id === employeeId 
                ? { ...emp, deleted: true, status: 'inactive' } 
                : emp
            )
          );

          toast({
            title: "Success",
            description: "Employee deactivated successfully",
          });
        } catch (error) {
          console.error('Error deactivating employee:', error);
          toast({
            title: "Error",
            description: "Failed to deactivate employee",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [role, toast]
  );

  const handleActivateEmployee = useCallback(
    async (employeeId) => {
      if (role === ROLES.ADMIN) {
        try {
          setIsLoading(true);
          await employeeService.activateEmployee(employeeId);

          // Update employees list with the reactivated employee
          setEmployees(prevEmployees => 
            prevEmployees.map(emp => 
              emp.id === employeeId 
                ? { ...emp, deleted: false, status: 'active' } 
                : emp
            )
          );

          toast({
            title: "Success",
            description: "Employee activated successfully",
          });
        } catch (error) {
          console.error('Error activating employee:', error);
          toast({
            title: "Error",
            description: "Failed to activate employee",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [role, toast]
  );

  const handleExport = useCallback(() => {
    try {
      const dataToExport = activeTab === "candidates" ? candidates : employees;
      exportToCSV(dataToExport, `${activeTab}-data.csv`);
      
      toast({
        title: "Export Complete",
        description: `Successfully exported ${dataToExport.length} records to CSV`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    }
  }, [activeTab, candidates, employees, toast]);

  const handleAddCandidates = useCallback(
    async (newCandidates) => {
      try {
        setIsLoading(true);
        
        // Update local state immediately for better UX
        const updatedCandidates = [...candidates, ...newCandidates];
        setCandidates(updatedCandidates);
        
        // Refresh data from server to ensure consistency
        const latestCandidates = await getAllCandidates();
        setCandidates(latestCandidates);
        
        const latestBatches = await batchService.getAllBatches();
        setBatches(latestBatches);
        
        toast({
          title: "Success",
          description: `Added ${newCandidates.length} new candidates`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error adding candidates:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to add candidates",
          variant: "destructive",
        });
        
        // Refresh to ensure UI state matches server state
        const latestCandidates = await getAllCandidates();
        setCandidates(latestCandidates);
      } finally {
        setIsLoading(false);
      }
    },
    [candidates, toast]
  );

  const handleEditCandidate = useCallback(
    async (candidateId, updatedData) => {
      try {
        setIsLoading(true);
        const result = await candidateService.updateCandidateWithReviewCheck(
          candidateId, 
          updatedData
        );
        
        // Update local state
        setCandidates(prev =>
          prev.map(c => c.id === candidateId ? { ...c, ...updatedData } : c)
        );
        
        // If candidate was in a reviewed batch that now needs re-review
        if (result.requiresReReview) {
          toast({
            title: "Batch Needs Re-Review",
            description: "The batch containing this candidate will need to be reviewed again",
            duration: 5000,
          });
          
          // Update batches to reflect new status
          const updatedBatches = await batchService.getAllBatches();
          setBatches(updatedBatches);
        } else {
          toast({
            title: "Success",
            description: "Candidate updated successfully",
          });
        }
      } catch (error) {
        console.error("Error updating candidate:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update candidate",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const handleRemoveCandidate = useCallback(
    async (candidateId) => {
      try {
        setIsLoading(true);
        
        // First check if candidate is part of a batch
        const candidate = await candidateService.getCandidateById(candidateId);
        const batchId = candidate.batchId;
        const wasReviewed = candidate.batch?.status === "REVIEWED";
        
        await candidateService.deleteCandidate(candidateId);
        
        // Update local state
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
        
        // If candidate was in a reviewed batch, update batch status
        if (batchId && wasReviewed) {
          await batchService.updateBatch(batchId, {
            status: "Needs_reReview",
            lastEditedAt: new Date().toISOString()
          });
          
          // Update batches list
          const updatedBatches = await batchService.getAllBatches();
          setBatches(updatedBatches);
          
          toast({
            title: "Candidate Removed",
            description: "The batch will need to be reviewed again",
          });
        } else {
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
    },
    [toast]
  );

  const handleBatchAction = useCallback(
    async (batch) => {
      if (role === ROLES.MANAGER || role === ROLES.ADMIN) {
        try {
          setIsLoading(true);
          // Fetch the latest version of the batch
          const latestBatch = await batchService.getBatchById(batch.id);
          setSelectedBatch(latestBatch);
          setCurrentBatchId(batch.id);
        } catch (error) {
          console.error("Error fetching batch details:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to fetch batch details",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [role, toast]
  );

  const handleEditBatch = useCallback(async (batch) => {
    try {
      setIsLoading(true);
      // Fetch the latest version of the batch
      const latestBatch = await batchService.getBatchById(batch.id);
      setSelectedBatch(latestBatch);
    } catch (error) {
      console.error("Error fetching batch details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch batch details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleBatchApprove = useCallback(
    async (approvedIds) => {
      if (!selectedBatch) return;

      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          throw new Error("User session not found. Please log in again.");
        }
        
        // Update all approved candidates
        await Promise.all(
          approvedIds.map(candidateId => 
            candidateService.updateCandidateStatus(candidateId, "APPROVED", userId)
          )
        );
        
        // If all candidates in the batch have been processed
        if (approvedIds.length === selectedBatch.candidates.length) {
          // Update batch status to REVIEWED
          await batchService.updateBatchStatus(selectedBatch.id, "REVIEWED");
        }
        
        // Refresh data
        const updatedCandidates = await getAllCandidates();
        setCandidates(updatedCandidates);
        
        const updatedBatches = await batchService.getAllBatches();
        setBatches(updatedBatches);

        toast({
          title: "Batch Review Complete",
          description: `Approved ${approvedIds.length} candidates`,
          variant: "success",
        });

        setSelectedBatch(null);
        setCurrentBatchId(null);
      } catch (error) {
        console.error("Error approving batch:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to approve batch",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBatch, toast]
  );

  const handleBatchDeny = useCallback(
    async (deniedIds) => {
      if (!selectedBatch) return;

      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          throw new Error("User session not found. Please log in again.");
        }
        
        // Update all denied candidates
        await Promise.all(
          deniedIds.map(candidateId => 
            candidateService.updateCandidateStatus(candidateId, "REJECTED", userId)
          )
        );
        
        // If all candidates have now been processed
        const totalProcessed = selectedBatch.candidates.length;
        const allCandidatesProcessed = deniedIds.length === totalProcessed;
        
        if (allCandidatesProcessed) {
          // Update batch status to REVIEWED
          await batchService.updateBatchStatus(selectedBatch.id, "REVIEWED");
        }
        
        // Refresh data
        const updatedCandidates = await getAllCandidates();
        setCandidates(updatedCandidates);
        
        const updatedBatches = await batchService.getAllBatches();
        setBatches(updatedBatches);
        
        toast({
          title: "Candidates Denied",
          description: `${deniedIds.length} candidates have been denied`,
          variant: "default",
        });
        
        if (allCandidatesProcessed) {
          setSelectedBatch(null);
          setCurrentBatchId(null);
        }
      } catch (error) {
        console.error("Error denying candidates:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to deny candidates",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBatch, toast]
  );

  const handleDownloadResults = useCallback(async (batch) => {
    try {
      setIsLoading(true);
      
      // Get fresh batch data to ensure up-to-date information
      const latestBatch = await batchService.getBatchById(batch.id);
      
      if (!latestBatch.candidates || latestBatch.candidates.length === 0) {
        toast({
          title: "No Data",
          description: "This batch doesn't contain any candidates to download.",
          variant: "warning",
        });
        return;
      }
      
      // Format data for CSV export
      const results = latestBatch.candidates.map(candidate => ({
        ID: candidate.id,
        Name: candidate.name,
        Email: candidate.email || "-",
        Contact: candidate.contact || "-",
        Location: candidate.location,
        Department: candidate.department || "-",
        Status: candidate.status || "PENDING_REVIEW",
        "Batch Name": latestBatch.name || `Batch #${latestBatch.id}`,
        "Submitted Date": new Date(latestBatch.createdAt).toLocaleDateString(),
        "Review Date": candidate.reviewDate
          ? new Date(candidate.reviewDate).toLocaleDateString()
          : "-",
        "Last Edited": candidate.lastEditedAt
          ? new Date(candidate.lastEditedAt).toLocaleDateString()
          : "-"
      }));
      
      // Use the exportToCSV utility
      exportToCSV(results, `batch-${latestBatch.name || latestBatch.id}-results.csv`);
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${results.length} candidate records`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading results:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download batch results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleUpdateBatch = useCallback(
    async (updatedBatch) => {
      try {
        setIsLoading(true);
        
        // Update batch in backend
        await batchService.updateBatch(updatedBatch.id, {
          ...updatedBatch,
          lastEditedAt: new Date().toISOString(),
          needsReview: true,
        });
        
        // Refresh data
        const updatedCandidates = await getAllCandidates();
        setCandidates(updatedCandidates);
        
        const updatedBatches = await batchService.getAllBatches();
        setBatches(updatedBatches);

        toast({
          title: "Batch Updated",
          description:
            "The batch has been updated and will need to be reviewed again.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating batch:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update batch",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const refreshBatches = useCallback(async () => {
    try {
      setIsLoading(true);
      const updatedBatches = await batchService.getAllBatches();
      setBatches(updatedBatches);
    } catch (error) {
      console.error("Error refreshing batches:", error);
      toast({
        title: "Error",
        description: "Failed to refresh batch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleReviewComplete = useCallback(async () => {
    // Refresh the batches list
    await refreshBatches();
  }, [refreshBatches]);

  const handleBatchDelete = useCallback(async (batchId) => {
    try {
      // Update local state by removing the deleted batch
      setBatches(prev => prev.filter(batch => batch.id !== batchId));
    } catch (error) {
      console.error("Error updating batches after deletion:", error);
    }
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(Number(newLimit));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <LoadingWrapper isLoading={isLoading}>
      <main className="content-area text-[var(--text-primary)]">
        <div className="container mx-auto min-w-[90%] py-6">
          <div className="rounded-[30px] border border-[var(--divider)] shadow-[0_12px_48px_-8px_rgba(66,114,255,0.15),0_8px_24px_-4px_rgba(66,114,255,0.1)] bg-[var(--card-background)]">
            <div className="flex justify-between items-center p-6 border-b border-[var(--divider)]">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Employee Management
              </h1>
              <RoleSelector role={role} setRole={setRole} />
            </div>

            <div className="p-6">
              {error ? (
                <div className="text-red-500 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 mb-6">
                  {error}
                </div>
              ) : (
                <div className="space-y-6">
                  <StatsSection
                    candidates={candidates}
                    employees={employees}
                    getEmployeeStats={getEmployeeStats}
                  />

                  {role === ROLES.RECRUITMENT ? (
                    <RecruitmentView
                      getEmployeeStats={getEmployeeStats}
                      assignmentFilter={assignmentFilter}
                      setAssignmentFilter={setAssignmentFilter}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      getFilteredEmployees={getFilteredEmployees}
                      getFilteredCandidates={getFilteredCandidates}
                      exportCandidatesData={handleExport}
                      shuttleRoutes={[]}
                      existingCandidates={candidates}
                      onAddCandidates={handleAddCandidates}
                      onEditCandidate={handleEditCandidate}
                      onRemoveCandidate={handleRemoveCandidate}
                      onUpdateBatch={handleUpdateBatch}
                      role={role}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Recent Batches Section */}
                      <div className="rounded-2xl border border-[var(--divider)] bg-[var(--card-background)] shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)]">
                          Recent Batches
                        </h2>
                        <BatchesList
                          batches={batches}
                          onEditBatch={handleBatchAction}
                          onDownloadResults={handleDownloadResults}
                          currentBatchId={currentBatchId}
                          role={role.toLowerCase()}
                          onBatchDelete={handleBatchDelete}
                        />
                      </div>

                      {/* Employees Section */}
                      <div className="rounded-2xl border border-[var(--divider)] bg-[var(--card-background)] shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-6 text-[var(--text-primary)]">
                          Employee List
                        </h2>
                        <EmployeeTable
                          activeTab="employees"
                          role={role}
                          filteredEmployees={getFilteredEmployees()}
                          filteredCandidates={getFilteredCandidates()}
                          handleApproveLocation={(id) =>
                            handleCandidateAction(id, "approve")
                          }
                          handleDenyLocation={(id) =>
                            handleCandidateAction(id, "deny")
                          }
                          handleDeactivateEmployee={handleDeactivateEmployee}
                          handleActivateEmployee={handleActivateEmployee} // Add the activate handler
                          departmentFilter={departmentFilter}
                          setDepartmentFilter={setDepartmentFilter}
                          shiftFilter={shiftFilter}
                          setShiftFilter={setShiftFilter}
                          statusFilter={statusFilter}
                          setStatusFilter={setStatusFilter}
                          assignmentFilter={assignmentFilter}
                          setAssignmentFilter={setAssignmentFilter}
                          departments={departments}
                          shifts={shifts}
                          // Add pagination props
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={totalEmployees}
                          itemsPerPage={itemsPerPage}
                          onPageChange={handlePageChange}
                          onItemsPerPageChange={handleItemsPerPageChange}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedBatch && (
        <BatchReviewModal
          batch={selectedBatch}
          onApprove={handleBatchApprove}
          onDeny={handleBatchDeny}
          onClose={() => {
            setSelectedBatch(null);
            setCurrentBatchId(null);
          }}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </LoadingWrapper>
  );
}
