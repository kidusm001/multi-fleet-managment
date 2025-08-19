import { useState, useCallback } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { validateFileUpload } from '@/utils/validators';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";

export default function FileUploadTab({ 
  isDark, 
  onSubmit: _onSubmit, 
  isLoading,
  onPreview,
  shifts = [],
  selectedShiftId,
  onSelectShift
}) {
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection and parsing
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    // Check if shift is selected
    if (!selectedShiftId) {
      toast.error("Please select a shift first");
      return;
    }

    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let data;
          if (file.name.endsWith('.csv')) {
            // Improved CSV parsing
            const text = e.target.result;
            const rows = text.split(/\r?\n/).filter(row => row.trim());
            
            // Check if the first row is a header row
            const isHeaderRow = (row) => {
              const lowerRow = row.toLowerCase();
              // Check if this row contains standard header keywords
              return ['name', 'email', 'phone', 'department', 'area'].some(
                keyword => lowerRow.includes(keyword)
              );
            };
            
            // Determine if we have a header row to skip
            const hasHeader = rows.length > 0 && isHeaderRow(rows[0]);
            const dataRows = hasHeader ? rows.slice(1) : rows;
            
            data = dataRows.map(row => {
              // Handle quoted and non-quoted fields properly
              const fields = [];
              let inQuotes = false;
              let currentField = '';
              
              for (let i = 0; i < row.length; i++) {
                const char = row[i];
                
                if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
                  inQuotes = !inQuotes;
                  continue;
                }
                
                if (char === ',' && !inQuotes) {
                  fields.push(currentField.trim());
                  currentField = '';
                  continue;
                }
                
                currentField += char;
              }
              
              // Add the last field
              fields.push(currentField.trim());
              
              // Parse the fields into an object
              return {
                name: fields[0]?.replace(/^"|"$/g, '') || '',
                email: fields[1]?.replace(/^"|"$/g, '') || '',
                phone: fields[2]?.replace(/^"|"$/g, '') || '',
                department: fields[3]?.replace(/^"|"$/g, '') || '',
                areaName: fields[4]?.replace(/^"|"$/g, '') || '',
                // Convert latitude and longitude to numbers properly
                latitude: parseFloat(fields[5]?.replace(/^"|"$/g, '') || 0),
                longitude: parseFloat(fields[6]?.replace(/^"|"$/g, '') || 0),
                location: fields[4]?.replace(/^"|"$/g, '') || ''
              };
            });
          } else {
            // Parse Excel - include all rows but skip header
            const buffer = e.target.result;
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Read sheet with headers option to skip first row
            const jsonData = XLSX.utils.sheet_to_json(sheet, { 
              raw: false, 
              defval: '',
              header: 1 // Use array of arrays format
            });
            
            // Check if first row is a header
            const hasHeader = jsonData.length > 0 && jsonData[0].some(cell => 
              typeof cell === 'string' && 
              ['name', 'email', 'phone', 'department', 'area'].some(
                keyword => cell.toLowerCase().includes(keyword)
              )
            );
            
            // Skip header row if detected
            const dataRows = hasHeader ? jsonData.slice(1) : jsonData;
            
            // Process and normalize field names
            data = dataRows.map(row => ({
              name: row[0] || '',
              email: row[1] || '',
              phone: row[2] || '',
              department: row[3] || '',
              areaName: row[4] || '',
              latitude: parseFloat(row[5] || 0),
              longitude: parseFloat(row[6] || 0),
              location: row[4] || ''
            }));
          }

          if (data.length === 0) {
            toast.error('File must contain at least one row of data');
            return;
          }

          onPreview(data);
          // Add success toast with green checkmark
          toast.success(
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              <span>File processed successfully</span>
            </div>,
            { duration: 3000 }
          );
        } catch (error) {
          console.error('Error parsing file:', error);
          toast.error('Failed to parse file. Please check the format.');
        }
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file');
    }
  }, [onPreview, selectedShiftId]);

  // Handle drag and drop events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full">
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
      
      <div 
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center",
          dragActive 
            ? isDark 
              ? "border-blue-500 bg-blue-500/10" 
              : "border-blue-500 bg-blue-50"
            : isDark
              ? "border-gray-700 hover:border-gray-600"
              : "border-gray-200 hover:border-gray-300",
          "transition-all duration-200"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          disabled={isLoading || !selectedShiftId}
        />
        
        <Upload 
          className={cn(
            "h-8 w-8 mx-auto mb-2",
            isDark ? "text-blue-400" : "text-blue-500"
          )} 
        />
        
        <div className="space-y-1.5">
          <p className={cn(
            "text-sm",
            isDark ? "text-gray-300" : "text-gray-600"
          )}>
            {isLoading ? "Processing..." : "Drag & drop CSV/Excel file or click to upload"}
          </p>
          <p className={cn(
            "text-xs",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            Required format: Name, Email, Phone, Department, Area Name, Latitude, Longitude
          </p>
        </div>
      </div>
    </div>
  );
}