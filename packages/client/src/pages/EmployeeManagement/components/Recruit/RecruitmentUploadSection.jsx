import { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Upload, Clipboard, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@components/Common/UI/Button";
import { DataTable } from "@components/Common/UI/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Common/UI/Select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/Common/UI/Tabs";

const TABLE_HEADERS = [
  { key: "name", label: "Name" },
  { key: "contact", label: "Contact" },
  { key: "email", label: "Email" },
  { key: "department", label: "Department" },
  { key: "location", label: "Location" },
];

export function RecruitmentUploadSection({
  selectedRole,
  setSelectedRole,
  handleFileSelect,
  handleFileDrop,
  pastedData,
  setPastedData,
  handlePasteData,
  previewTableData,
  setPreviewTableData,
  handlePreviewSubmit,
  isLoading
}) {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate pagination values
  const totalPages = Math.ceil(previewTableData.length / itemsPerPage);
  
  // Get current page of data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return previewTableData.slice(startIndex, startIndex + itemsPerPage);
  }, [previewTableData, currentPage, itemsPerPage]);

  // Handler for page changes
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);
  
  // Cache the role options to optimize rendering
  const roleOptions = useMemo(() => [
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Admin" }
  ], []);

  // Optimized handler for role selection to avoid recreating function on each render
  const handleRoleChange = useCallback((role) => {
    // Validate role before setting
    if (role === "manager" || role === "admin") {
      setSelectedRole(role);
      
      // Optional: Save preference to localStorage for better UX on revisit
      try {
        localStorage.setItem('preferredAssigneeRole', role);
      } catch (e) {
        // Silently fail if localStorage isn't available
      }
    }
  }, [setSelectedRole]);

  // Enhanced file input handler with better error handling
  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    handleFileSelect(file);
    
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  }, [handleFileSelect]);

  const handlePreviewClick = useCallback(async () => {
    if (!pastedData.trim() || isLoading) return;

    try {
      // Process preview submission
      await handlePreviewSubmit();
      // Don't clear data here - it will be cleared by parent on successful submission
    } catch (error) {
      console.error('Error in preview submission:', error);
    }
  }, [pastedData, isLoading, handlePreviewSubmit]);

  return (
    <div className="rounded-2xl border border-[var(--divider)] bg-[var(--card-background)] shadow-lg p-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
        Upload Candidates
      </h2>

      <Tabs defaultValue="paste" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabsList className="bg-gray-50 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger
              value="upload"
              className="px-3.5 py-1.5 text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4f46e5] data-[state=active]:to-[#818cf8] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Upload CSV
            </TabsTrigger>
            <TabsTrigger
              value="paste"
              className="px-3.5 py-1.5 text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4f46e5] data-[state=active]:to-[#818cf8] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Paste Data
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Assign to:
            </span>
            <Select 
              value={selectedRole} 
              onValueChange={handleRoleChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[130px] h-8 text-sm bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="upload">
          <div className="flex flex-col items-center gap-4 max-w-4xl mx-auto w-full">
            <input
              type="file"
              id="fileUpload"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInputChange}
              disabled={isLoading}
            />
            <button
              type="button"
              className="w-full border-2 border-dashed border-indigo-100 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-200 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById("fileUpload").click()}
              aria-label="Upload CSV file"
              disabled={isLoading}
            >
              <Upload className="h-8 w-8 text-indigo-500 dark:text-indigo-400 mx-auto mb-2" />
              <div className="space-y-1.5">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {isLoading ? "Processing..." : "Drag & drop CSV file or click to upload"}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Required format: Name, Contact, Email, Department, Location
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Example: John Doe, +251911111111, john@example.com, Engineering, Bole
                </p>
              </div>
            </button>
          </div>
        </TabsContent>

        <TabsContent value="paste">
          <div className="space-y-4 max-w-5xl mx-auto w-full">
            <div className="relative">
              <textarea
                value={pastedData}
                onChange={handlePasteData}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const { selectionStart, selectionEnd } = e.target;
                    setPastedData(
                      pastedData.substring(0, selectionStart) +
                        "\t" +
                        pastedData.substring(selectionEnd)
                    );
                    e.target.selectionStart = e.target.selectionEnd =
                      selectionStart + 1;
                  }
                }}
                placeholder="Paste candidate data (Name TAB Contact TAB Email TAB Department TAB Location)"
                className="w-full h-48 p-4 rounded-xl border border-[var(--divider)] bg-[var(--card-background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
              <div className="absolute top-2 right-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const textArea = document.querySelector('textarea');
                    textArea.focus();
                    textArea.select();
                    document.execCommand('delete');
                    setPastedData("");
                  }}
                  disabled={!pastedData.trim() || isLoading}
                  className="h-7 px-2 text-xs rounded-lg hover:bg-[var(--accent-background)] border-[var(--divider)]"
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Clipboard className="h-4 w-4" />
                <span className="text-xs">
                  Format: Name [Tab] Contact [Tab] Email [Tab] Department
                  [Tab] Location
                </span>
              </div>
              <Button
                onClick={handlePreviewClick}
                disabled={!pastedData.trim() || isLoading}
                className="h-8 px-3.5 text-sm rounded-lg bg-gradient-to-r from-[#4f46e5] to-[#818cf8] text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Preview Candidates"}
              </Button>
            </div>
            {previewTableData.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2 text-[var(--text-primary)]">
                  Preview ({previewTableData.length} candidates):
                </h4>
                <div className="border border-[var(--divider)] rounded-xl overflow-hidden bg-[var(--card-background)]">
                  <DataTable
                    data={paginatedData}
                    headers={TABLE_HEADERS}
                  />
                </div>
                
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, previewTableData.length)} of {previewTableData.length} candidates
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="h-8 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      
                      <div className="hidden sm:flex items-center gap-1">
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
                              className={`w-8 h-8 p-0 ${currentPage === pageToShow ? 
                                "bg-indigo-600 text-white" : 
                                "border-gray-200 dark:border-slate-700"}`}
                              onClick={() => handlePageChange(pageToShow)}
                              disabled={isLoading}
                            >
                              {pageToShow}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <span className="sm:hidden text-sm text-gray-500 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages || isLoading}
                        className="h-8 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

RecruitmentUploadSection.propTypes = {
  selectedRole: PropTypes.string.isRequired,
  setSelectedRole: PropTypes.func.isRequired,
  handleFileSelect: PropTypes.func.isRequired,
  handleFileDrop: PropTypes.func.isRequired,
  pastedData: PropTypes.string.isRequired,
  setPastedData: PropTypes.func.isRequired,
  handlePasteData: PropTypes.func.isRequired,
  previewTableData: PropTypes.array.isRequired,
  setPreviewTableData: PropTypes.func.isRequired,
  handlePreviewSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

RecruitmentUploadSection.defaultProps = {
  isLoading: false
};