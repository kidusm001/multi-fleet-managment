import { useState, useEffect } from 'react';
import { AlertCircle, UploadCloud, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import { DataTable } from "@/components/Common/UI/DataTable";
// Fix import path case to match the rest of the project
import { Alert, AlertTitle, AlertDescription } from "@/components/Common/UI/alert";

// Define a custom hook that helps detect potential duplicates in the preview data
function useDetectDuplicates(data) {
  const [duplicates, setDuplicates] = useState([]);
  
  useEffect(() => {
    if (!data || !Array.isArray(data)) return;
    
    // Look for duplicate name + location combos within the preview data
    const uniqueCheck = new Map();
    const duplicatesList = [];
    
    data.forEach((item, index) => {
      if (!item.name || !item.location) return;
      
      const key = `${item.name.toLowerCase()}|${item.location.toLowerCase()}`;
      if (uniqueCheck.has(key)) {
        duplicatesList.push({
          index,
          name: item.name,
          location: item.location,
          duplicateOf: uniqueCheck.get(key)
        });
      } else {
        uniqueCheck.set(key, index);
      }
    });
    
    setDuplicates(duplicatesList);
  }, [data]);
  
  return duplicates;
}

const TABLE_HEADERS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "department", label: "Department" },
  { key: "location", label: "Location" },
];

export default function PreviewTable({
  isDark,
  previewData,
  currentPage,
  itemsPerPage,
  isLoading,
  onUpload,
  onPageChange,
  onClear,
  _validationErrors
}) {
  // Check for duplicates in the preview data
  const duplicates = useDetectDuplicates(previewData);
  
  // Calculate pagination values
  const totalPages = Math.ceil(previewData.length / itemsPerPage);
  
  // Get current page of data
  const paginatedData = previewData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get all the data to display in the table
  const processedData = paginatedData.map((item, index) => {
    const actualIndex = (currentPage - 1) * itemsPerPage + index;
    
    // Check if this item is a duplicate
    const isDuplicate = duplicates.some(d => d.index === actualIndex);
    
    return {
      ...item,
      // Highlight duplicate entries with a visual indicator
      name: isDuplicate ? 
        <span className="flex items-center text-amber-600 dark:text-amber-500 font-medium">
          <AlertCircle className="w-3 h-3 mr-1 inline" />
          {item.name}
        </span> : 
        item.name
    };
  });

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden",
      isDark ? "border-gray-700" : "border-gray-200"
    )}>
      {/* Header */}
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
      )}>
        <h3 className="font-medium">
          Preview ({previewData.length} employees)
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className={cn(
              isDark ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100"
            )}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
          <Button
            onClick={onUpload}
            className={cn(
              isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-500",
              "text-white hover:text-white"
            )}
            disabled={isLoading}
          >
            <UploadCloud className="w-4 h-4 mr-1" />
            {isLoading ? "Uploading..." : "Upload Employees"}
          </Button>
        </div>
      </div>

      {/* Duplicate warning - Add this section */}
      {duplicates.length > 0 && (
        <Alert className={cn(
          "m-4 border-amber-200 bg-amber-50 text-amber-800",
          isDark && "border-amber-900/50 bg-amber-900/20 text-amber-200"
        )}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Duplicate Entries Detected</AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              Found {duplicates.length} duplicate employee entries within your data. These will be filtered out during upload to prevent duplicates.
            </p>
            <div className="mt-2 text-sm max-h-24 overflow-y-auto">
              {duplicates.slice(0, 5).map((dup, idx) => (
                <div key={idx} className="py-1">
                  • <span className="font-medium">{dup.name}</span> at {dup.location}
                </div>
              ))}
              {duplicates.length > 5 && (
                <p className="mt-1 italic">...and {duplicates.length - 5} more</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <DataTable
        data={processedData}
        headers={TABLE_HEADERS}
        className="w-full"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={cn(
          "p-4 border-t flex items-center justify-between",
          isDark ? "border-gray-700" : "border-gray-200"
        )}>
          <span className={cn(
            "text-sm",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, previewData.length)} of {previewData.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className={cn(
                "h-8 px-2",
                isDark ? "border-gray-700 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
              )}
            >
              Previous
            </Button>

            {/* Add page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              // Calculate which page number to show
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) {
                  // Near start
                  pageNum = i + 1;
                  if (i === 4) pageNum = totalPages;
                } else if (currentPage >= totalPages - 2) {
                  // Near end
                  pageNum = totalPages - 4 + i;
                  if (i === 0) pageNum = 1;
                } else {
                  // Middle
                  pageNum = currentPage - 2 + i;
                  if (i === 0) pageNum = 1;
                  if (i === 4) pageNum = totalPages;
                }
              }

              return (
                <Button
                  key={i}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  disabled={isLoading}
                  className={cn(
                    "h-8 w-8 px-0",
                    currentPage === pageNum 
                      ? isDark ? "bg-blue-700 text-white" : "bg-blue-600 text-white"
                      : isDark ? "border-gray-700" : "border-gray-300"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className={cn(
                "h-8 px-2",
                isDark ? "border-gray-700 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"
              )}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}