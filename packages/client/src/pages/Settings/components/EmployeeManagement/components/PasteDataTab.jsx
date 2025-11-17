import { useState, useCallback } from 'react';
import { Clipboard, ArrowRight, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import Button from "@/components/Common/UI/Button";
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import { DataTable } from "@/components/Common/UI/DataTable";

// Update the template data to match the correct format
const TEMPLATE_DATA = `Name\tEmail\tPhone\tDepartment\tArea Name\tLatitude\tLongitude
Alemayehu Tadesse\talemayehu.t@example.com\t+251911456789\tFinance\tKazanchis\t9.0215\t38.7468
Tigist Hailu\ttigist.h@example.com\t+251922345678\tMarketing\tBole\t8.9806\t38.7578
Yonas Bekele\tyonas.b@example.com\t+251911234567\tIT\tCMC\t9.0339\t38.7861
Hiwot Girma\thiwot.g@example.com\t+251944567890\tHR\tSarbet\t8.9946\t38.7468`;

const TABLE_HEADERS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "department", label: "Department" },
  { key: "areaName", label: "Area Name" },
  { key: "location", label: "Location" },
];

export default function PasteDataTab({ 
  isDark, 
  pastedData, 
  onPasteChange, 
  onClear,
  onPreview,
  isLoading,
  previewTableData = [],
  setPreviewTableData, // Add this prop
  shifts = [],
  selectedShiftId = "",
  onSelectShift
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Calculate pagination values
  const totalPages = Math.ceil(previewTableData.length / itemsPerPage);
  
  // Get current page of data
  const paginatedData = previewTableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle tab key in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      e.target.value = value.substring(0, start) + '\t' + value.substring(end);
      e.target.selectionStart = e.target.selectionEnd = start + 1;
      // Trigger onChange manually since we modified the value
      onPasteChange({ target: { value: e.target.value } });
    }
  };

  // Handle paste data
  const handlePasteData = useCallback((e) => {
    const newPastedData = e.target.value;
    onPasteChange(e);
  
    try {
      // Split by newlines and filter out empty lines
      const lines = newPastedData
        .trim()
        .split("\n")
        .filter((line) => line.trim());
        
      if (lines.length === 0) return;
  
      // Check if the first row is a header row
      const isHeaderRow = (row) => {
        const lowerRow = row.toLowerCase();
        // Check if this row contains standard header keywords
        return ['name', 'email', 'phone', 'department', 'area'].some(
          keyword => lowerRow.includes(keyword)
        );
      };
      
      // Determine if we have a header row to skip
      const hasHeader = lines.length > 0 && isHeaderRow(lines[0]);
      const dataLines = hasHeader ? lines.slice(1) : lines;
  
      // Process all actual data lines (skipping header)
      const parsedData = dataLines.map((line) => {
        // Handle tab or comma delimited data
        const delimiter = line.includes('\t') ? '\t' : ',';
        
        // Split the line and handle quoted fields properly
        const fields = [];
        let inQuotes = false;
        let currentField = '';
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
            inQuotes = !inQuotes;
            continue;
          }
          
          if ((char === delimiter) && !inQuotes) {
            fields.push(currentField.trim());
            currentField = '';
            continue;
          }
          
          currentField += char;
        }
        
        // Add the last field
        fields.push(currentField.trim());
        
        // Extract the fields
        const [name, email, phone, department, areaName, latitudeStr, longitudeStr] = fields.map(
          field => field?.replace(/^"|"$/g, '').trim() || ""
        );
        
        // Parse latitude and longitude as floating point numbers
        const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
        const longitude = longitudeStr ? parseFloat(longitudeStr) : null;
        
        // Create a location string from area name
        const location = areaName || '';
        
        return { 
          name, 
          email, 
          phone, 
          department, 
          areaName, 
          latitude, 
          longitude,
          location
        };
      });
  
      // Update the preview table data immediately
      if (setPreviewTableData) { // Add a safety check
        setPreviewTableData(parsedData);
      }
    } catch (error) {
      console.error("Parse error:", error);
      // Don't interrupt the user experience for simple parse errors while typing
    }
  }, [onPasteChange, setPreviewTableData]);

  // Add a success toast function
  const showSuccessToast = useCallback(() => {
    toast.success(
      <div className="flex items-center">
        <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
        <span>Data processed successfully</span>
      </div>,
      { duration: 3000 }
    );
  }, []);

  // Custom placeholder style classes for dark mode
  const placeholderClasses = isDark 
    ? "placeholder:text-gray-500 placeholder:opacity-50"
    : "placeholder:text-gray-500";

  return (
    <div className="space-y-4">
      {/* Shift Selection */}
      <div className="mb-4">
        <label className={cn(
          "block text-sm font-medium mb-2",
          isDark ? "text-gray-300" : "text-gray-700"
        )}>
          Select Shift*
        </label>
        <Select 
          value={selectedShiftId} 
          onValueChange={onSelectShift}
          disabled={isLoading}
        >
          <SelectTrigger className={cn(
            "w-full max-w-xs",
            isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          )}>
            <SelectValue placeholder="Select a shift" />
          </SelectTrigger>
          <SelectContent>
            {shifts.length === 0 && (
              <div className="px-2 py-4 text-center">
                <p className="text-sm text-gray-500">No shifts found</p>
              </div>
            )}
            {shifts.map(shift => (
              <SelectItem key={shift.id} value={shift.id.toString()}>
                {shift.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {shifts.length === 0 && (
          <p className={cn(
            "text-xs mt-1",
            isDark ? "text-amber-400" : "text-amber-600"
          )}>
            No shifts added yet. Please add shifts from the settings page.
          </p>
        )}
      </div>
      
      <div className="space-y-4 max-w-5xl mx-auto w-full">
        <div className="relative">
          <textarea
            value={pastedData}
            onChange={handlePasteData}
            onKeyDown={handleKeyDown}
            rows={10}
            placeholder={TEMPLATE_DATA}
            className={cn(
              "w-full h-48 p-4 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2",
              isDark
                ? "bg-gray-900 border-gray-700 text-gray-300 focus:ring-blue-900"
                : "bg-white border-gray-200 text-gray-700 focus:ring-blue-100",
              placeholderClasses
            )}
            disabled={isLoading || !selectedShiftId}
          />
          <div className="absolute top-2 right-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={isLoading || !pastedData.trim()}
              className="h-7 px-2 text-xs rounded-lg hover:bg-[var(--accent-background)] border-[var(--divider)]"
            >
              Clear
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Clipboard className="h-4 w-4" />
            <span className={cn(
              "text-xs",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              Format: Name [Tab] Email [Tab] Phone [Tab] Department [Tab] Area Name [Tab] Latitude [Tab] Longitude
            </span>
          </div>
          <Button
            onClick={() => {
              onPreview();
              // Show success toast when preview is processed
              if (pastedData.trim()) {
                showSuccessToast();
              }
            }}
            disabled={isLoading || !pastedData.trim() || !selectedShiftId}
            className={cn(
              "text-sm",
              isDark 
                ? "bg-blue-700 hover:bg-blue-600 text-white" 
                : "bg-blue-600 hover:bg-blue-500 text-white"
            )}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            {isLoading ? "Processing..." : "Preview Data"}
          </Button>
        </div>

        {/* Preview Table */}
        {previewTableData.length > 0 && (
          <div className="mt-6">
            <h4 className={cn(
              "text-sm font-medium mb-2",
              isDark ? "text-gray-300" : "text-gray-700"
            )}>
              Preview ({previewTableData.length} employees):
            </h4>
            <div className={cn(
              "border rounded-xl overflow-hidden",
              isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"
            )}>
              <DataTable
                data={paginatedData}
                headers={TABLE_HEADERS}
              />
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                <div className={cn(
                  "flex items-center text-sm", 
                  isDark ? "text-gray-400" : "text-gray-500"
                )}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, previewTableData.length)} of {previewTableData.length} employees
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || isLoading}
                    className={cn(
                      "h-8",
                      isDark ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className={cn(
                    "text-sm",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || isLoading}
                    className={cn(
                      "h-8",
                      isDark ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-100"
                    )}
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
    </div>
  );
}