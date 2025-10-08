import { useState, useEffect, useCallback } from "react";
import { utils, write } from 'xlsx';
import api from "@/services/api";
import { employeeService } from "@/services/employeeService";
import { departmentService } from "@/services/departmentService";
import { shiftService } from "@/services/shiftService";
import { locationService } from "@/services/locationService";
import { useOrganizations } from "@/contexts/OrganizationContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// Add CheckCircle icon for success indicators
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/Common/UI/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/Common/UI/Tabs";
import { validatePhoneNumber, validateEmail, validateEmployeeUploadData } from "@/utils/validators";

// Import components from index
import {
  FileUploadTab,
  PasteDataTab,
  QuickActionsTab,
  SingleEmployeeForm,
  PreviewTable,
  MapPickerDialog,
  AddDepartmentDialog,
  AddShiftDialog,
  ValidationErrors
} from './components';

const DEFAULT_POSITION = { lat: 9.0221, lng: 38.7468 }; // Addis Ababa coordinates

export default function EmployeeUploadSection({ 
  onSuccess, 
  isDark, 
  navigateToEmployeeManagement, 
  navigateToDepartmentManagement,
  navigateToShiftManagement,
}) {
  const _navigate = useNavigate();
  const { members, loadMembers } = useOrganizations();
  const [availableMembers, setAvailableMembers] = useState([]);
  
  // State for file upload and data preview
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedData, setPastedData] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [showingDuplicates, setShowingDuplicates] = useState([]);

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  // State for form data
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [phoneValid, setPhoneValid] = useState(true);
  const [emailValid, setEmailValid] = useState(true);

  // Dialog states
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showAddDepartmentDialog, setShowAddDepartmentDialog] = useState(false);
  const [showAddShiftDialog, setShowAddShiftDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("actions");

  // Form states
  const [mapPosition, setMapPosition] = useState(DEFAULT_POSITION);
  const [newDepartment, setNewDepartment] = useState("");
  const [newShift, setNewShift] = useState({ name: "", startTime: "", endTime: "" });
  const [singleEmployee, setSingleEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    shiftId: "",
    location: "",
    ...DEFAULT_POSITION
  });

  // Reset component state
  const resetComponent = useCallback(() => {
    setSelectedFile(null);
    setPastedData("");
    setPreviewData([]);
    setErrorMessage("");
    setCurrentPage(1);
    setIsLoading(false);
    setSingleEmployee({
      name: "",
      email: "",
      phone: "",
      departmentId: "",
      shiftId: "",
      position: "",
      location: "",
      ...DEFAULT_POSITION
    });
  }, []);

  // Load initial data
  useEffect(() => {
    const fetchDepartmentsAndShifts = async () => {
      try {
        setIsLoading(true);
        const [deptResponse, shiftResponse, locationsResponse] = await Promise.all([
          departmentService.getAllDepartments(),
          shiftService.getAllShifts(),
          locationService.getLocations()
        ]);
        setDepartments(deptResponse);
        setShifts(shiftResponse);
        setLocations(locationsResponse);
        
        // Load members separately since it doesn't return data directly
        await loadMembers();
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load department and shift data");
        setErrorMessage("Failed to load initial data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDepartmentsAndShifts();
    
    // Cleanup function
    return () => {
      // Only reset on unmount, not on every render
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - loadMembers causes infinite loop if included

  // Compute available members for the "Add Single Employee" selector:
  // - only members whose role is 'employee' (case-insensitive)
  // - exclude members who already exist in the employees table
  useEffect(() => {
    let cancelled = false;

    const computeAvailable = async () => {
      try {
        if (!members || members.length === 0) {
          setAvailableMembers([]);
          return;
        }

        // Fetch existing employees and build a set of userIds to exclude
        const existingEmployees = await employeeService.getAllEmployees();
        const existingUserIds = new Set(existingEmployees.map(e => e.userId));

        const filtered = members.filter(m => {
          const role = (m.role || '').toString().toLowerCase();
          if (role !== 'employee') return false;

          // Try to resolve a stable user id from the member object
          const memberUserId = (m.user && m.user.id) || m.userId || m.id;
          // Exclude if this member maps to an existing employee userId
          if (memberUserId && existingUserIds.has(memberUserId)) return false;

          return true;
        });

        if (!cancelled) setAvailableMembers(filtered);
      } catch (err) {
        console.error('Failed to compute available members for employee selector:', err);
        // Fallback: show members with role employee only
        try {
          const fallback = (members || []).filter(m => ((m.role || '').toString().toLowerCase() === 'employee'));
          if (!cancelled) setAvailableMembers(fallback);
        } catch (e) {
          if (!cancelled) setAvailableMembers([]);
        }
      }
    };

    computeAvailable();

    return () => { cancelled = true; };
  }, [members]);

  // Handlers for single employee form
  const handleEmployeeChange = useCallback((e) => {
    const { name, value } = e.target;
    setSingleEmployee(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((name, value) => {
    setSingleEmployee(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleValidatedChange = useCallback((e, validator, setValid) => {
    const { value } = e.target;
    setSingleEmployee(prev => ({
      ...prev,
      [e.target.name]: value
    }));
    setValid(value ? validator(value) : true);
  }, []);

  const handleEmailChange = useCallback((e) => {
    handleValidatedChange(e, validateEmail, setEmailValid);
  }, [handleValidatedChange]);

  const handlePhoneChange = useCallback((e) => {
    handleValidatedChange(e, validatePhoneNumber, setPhoneValid);
  }, [handleValidatedChange]);

  // Handler for member selection
  const handleMemberSelect = useCallback((memberId) => {
    if (memberId === "none" || !memberId) {
      // Clear the selected member but keep other form data
      setSingleEmployee(prev => ({ ...prev, selectedMemberId: null }));
      return;
    }
    
  const selectedMember = availableMembers.find(m => m.id === memberId) || members.find(m => m.id === memberId);
    if (selectedMember) {
      // Auto-fill name, email, phone from member data
      // Better Auth member object may include user details
      const memberUser = selectedMember.user || {};
      const memberName = memberUser.name || 
                        selectedMember.name || 
                        memberUser.email?.split('@')[0]?.replace(/[._-]/g, ' ') || 
                        selectedMember.userId?.split('@')[0]?.replace(/[._-]/g, ' ') || 
                        '';
      
      const memberEmail = memberUser.email || 
                         selectedMember.email || 
                         (selectedMember.userId?.includes('@') ? selectedMember.userId : '');
      
      setSingleEmployee(prev => ({
        ...prev,
        selectedMemberId: memberId,
        name: memberName,
        email: memberEmail,
        phone: memberUser.phone || '', // Try to get phone if available
        // Keep existing department, shift, location data
      }));
      
      // Validate the auto-filled email
      if (memberEmail) {
        setEmailValid(validateEmail(memberEmail));
      }
      
      toast.success(
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          <span>Member information loaded. Please fill in department, shift, and location.</span>
        </div>,
        { duration: 4000 }
      );
    }
  }, [members, availableMembers]);


  // Handlers for map location
  const handleMapSelect = useCallback((lat, lng, address) => {
    setSingleEmployee(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address || prev.location
    }));
    setMapPosition({ lat, lng });
    setShowMapPicker(false);
  }, []);

  // Handlers for department and shift management
  const handleAddDepartment = useCallback(async () => {
    if (!newDepartment.trim()) {
      toast.error("Department name cannot be empty");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await departmentService.createDepartment({ name: newDepartment });
      setDepartments(prev => [...prev, result]);
      setSingleEmployee(prev => ({ ...prev, departmentId: result.id }));
      toast.success(`Department "${newDepartment}" added successfully`);
      setNewDepartment("");
      setShowAddDepartmentDialog(false);
    } catch (error) {
      console.error("Failed to add department:", error);
      toast.error(error.message || "Failed to add department");
    } finally {
      setIsLoading(false);
    }
  }, [newDepartment]);

  const handleAddShift = useCallback(async () => {
    if (!newShift.name.trim() || !newShift.startTime || !newShift.endTime) {
      toast.error("All shift fields are required");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await shiftService.createShift(newShift);
      setShifts(prev => [...prev, result]);
      setSingleEmployee(prev => ({ ...prev, shiftId: result.id }));
      toast.success(`Shift "${newShift.name}" added successfully`);
      setNewShift({ name: "", startTime: "", endTime: "" });
      setShowAddShiftDialog(false);
    } catch (error) {
      console.error("Failed to add shift:", error);
      toast.error(error.message || "Failed to add shift");
    } finally {
      setIsLoading(false);
    }
  }, [newShift]);

  // Handle department and shift management
  const handleNavigateToDepartments = useCallback(() => {
    navigateToDepartmentManagement();
  }, [navigateToDepartmentManagement]);

  const handleNavigateToShifts = useCallback(() => {
    navigateToShiftManagement();
  }, [navigateToShiftManagement]);

  // Check for saved form data on component mount
  useEffect(() => {
    if (localStorage.getItem('returnToEmployeeForm') === 'true') {
      try {
        const savedData = localStorage.getItem('employeeFormData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setSingleEmployee(parsedData);
          setActiveTab('add-single');
        }
        // Clean up
        localStorage.removeItem('employeeFormData');
        localStorage.removeItem('returnToEmployeeForm');
      } catch (error) {
        console.error("Failed to restore form state:", error);
      }
    }
  }, []);

  // Handlers for form submission
  const handleSingleEmployeeSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      // Get userId from selected member
      const selectedMember = singleEmployee.selectedMemberId
        ? (availableMembers.find(m => m.id === singleEmployee.selectedMemberId) || members.find(m => m.id === singleEmployee.selectedMemberId))
        : null;
      
      const userId = selectedMember?.userId || selectedMember?.user?.id;
      
      if (!userId) {
        throw new Error("Please select a member or the member doesn't have a valid user ID");
      }
      
      // Create a Stop first if coordinates are provided
      let stopId = null;
      if (singleEmployee.latitude && singleEmployee.longitude) {
        const stopData = {
          name: `${singleEmployee.name} - Home`,
          address: singleEmployee.location || `${singleEmployee.name}'s location`,
          latitude: parseFloat(singleEmployee.latitude),
          longitude: parseFloat(singleEmployee.longitude),
        };
        
        const stopResponse = await api.post('/stops', stopData);
        stopId = stopResponse.data.id;
      }
      
      // Validate required fields
      if (!singleEmployee.locationId) {
        throw new Error("Work location is required");
      }
      
      // Prepare employee data for API
      const employeeData = {
        name: singleEmployee.name,
        location: singleEmployee.location || null,
        departmentId: singleEmployee.departmentId,
        shiftId: singleEmployee.shiftId,
        userId: userId,
        stopId: stopId, // Use the created stop ID
        locationId: singleEmployee.locationId, // Work location (required)
      };
      
      await employeeService.createEmployee(employeeData);
      // Enhanced toast with green checkmark
      toast.success(
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          <span>Employee {singleEmployee.name} added successfully</span>
        </div>,
        { duration: 4000 }
      );
      resetComponent();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to add employee:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to add employee";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [singleEmployee, members, availableMembers, onSuccess, resetComponent]);

  // Process CSV data
  const processCsvData = useCallback((content) => {
    try {
      if (!selectedShiftId) {
        toast.error("Please select a shift first");
        return;
      }

      // Split content into rows
      const rows = content.trim().split(/\r?\n/).filter(row => row.trim());
      
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
      
      const processedData = [];
      const errors = [];
      const departmentWarnings = new Set();
      
      // Process each row, skipping header if present
      dataRows.forEach((row, idx) => {
        // Split row by comma or tab
        const delimiter = row.includes('\t') ? '\t' : ',';
        
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
          
          if ((char === delimiter) && !inQuotes) {
            fields.push(currentField.trim());
            currentField = '';
            continue;
          }
          
          currentField += char;
        }
        
        // Add the last field
        fields.push(currentField.trim());
        
        // Parse numeric fields correctly
        const latitudeStr = fields[5]?.replace(/^"|"$/g, '').trim() || '';
        const longitudeStr = fields[6]?.replace(/^"|"$/g, '').trim() || '';
        const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
        const longitude = longitudeStr ? parseFloat(longitudeStr) : null;
        
        const data = {
          name: fields[0]?.replace(/^"|"$/g, '').trim() || '',
          email: fields[1]?.replace(/^"|"$/g, '').trim() || '',
          phone: fields[2]?.replace(/^"|"$/g, '').trim() || '',
          department: fields[3]?.replace(/^"|"$/g, '').trim() || '',
          areaName: fields[4]?.replace(/^"|"$/g, '').trim() || '',
          latitude,
          longitude,
          shiftId: selectedShiftId,
          location: fields[4]?.replace(/^"|"$/g, '').trim() || '' // Use area name as location too
        };
        
        // Check if department exists
        if (data.department) {
          const departmentExists = departments.some(
            dept => dept.name.toLowerCase() === data.department.toLowerCase()
          );
          
          if (!departmentExists) {
            departmentWarnings.add(data.department);
          }
        }
        
        // Validate data
  const validation = validateEmployeeUploadData(data);
        if (!validation.isValid) {
          // Use real row number (accounting for header if present)
          const rowNum = hasHeader ? idx + 2 : idx + 1;
          errors.push(`Row ${rowNum}: ${validation.errors.join(', ')}`);
        }
        
        // Add to processed data regardless of validation (for preview)
        processedData.push(data);
      });
      
      // Update state
      setPreviewData(processedData);
      setValidationErrors(errors);
      
      // Show department warnings
      if (departmentWarnings.size > 0) {
        const warningMessage = `The following departments don't exist in the system: ${[...departmentWarnings].join(', ')}. You can create them from the department management page.`;
        toast.warning(warningMessage, { duration: 6000 });
      }
      
      // Show success/warning toast
      if (errors.length > 0) {
        toast.warning(`Processed with ${errors.length} validation issues`);
      } else {
        toast.success('Data processed successfully');
      }
    } catch (error) {
      console.error("Error processing data:", error);
      setErrorMessage("Failed to process the data. Please check the format.");
      toast.error("Failed to process data");
    }
  }, [selectedShiftId, departments]);

  // Handle file upload preview
  const handleFilePreview = useCallback((rows) => {
    if (!selectedShiftId) {
      toast.error("Please select a shift first");
      return;
    }

    const processedData = [];
    const errors = [];
    const departmentWarnings = new Set();
    
    rows.forEach((row, idx) => {
      const data = {
        name: row.name,
        email: row.email,
        phone: row.phone,
        department: row.department,
        areaName: row.areaname || row['area name'] || row.areaName || row['Area Name'],
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        shiftId: selectedShiftId,
        location: row.location || row.areaname || row['area name'] || row.areaName || row['Area Name'] // Use area name as location if location is not provided
      };
      
      // Check if department exists
      if (data.department) {
        const departmentExists = departments.some(
          dept => dept.name.toLowerCase() === data.department.toLowerCase()
        );
        
        if (!departmentExists) {
          departmentWarnings.add(data.department);
        }
      }
      
      // Validate data
  const validation = validateEmployeeUploadData(data);
      if (!validation.isValid) {
        errors.push(`Row ${idx + 1}: ${validation.errors.join(', ')}`);
      }
      
      processedData.push(data);
    });
    
    // Update state
    setPreviewData(processedData);
    setValidationErrors(errors);
    
    // Show department warnings
    if (departmentWarnings.size > 0) {
      const warningMessage = `The following departments don't exist in the system: ${[...departmentWarnings].join(', ')}. You can create them from the department management page.`;
      toast.warning(warningMessage, { duration: 6000 });
    }
    
    // Show success/warning toast
    if (errors.length > 0) {
      toast.warning(`Processed with ${errors.length} validation issues`);
    } else {
      toast.success('Data processed successfully');
    }
  }, [selectedShiftId, departments]);

  // Clear preview data
  const handleClearPreview = useCallback(() => {
    setPreviewData([]);
    setValidationErrors([]);
    setPastedData("");
    setSelectedFile(null);
    setCurrentPage(1);
  }, []);

  // Handle bulk upload submission
  const handleSubmitUpload = useCallback(async () => {
    if (previewData.length === 0) {
      setErrorMessage("No data to upload");
      return;
    }
  
    if (validationErrors.length > 0) {
      const confirmUpload = window.confirm(
        `There are ${validationErrors.length} validation issues. Do you still want to proceed?`
      );
      if (!confirmUpload) return;
    }
  
    setIsLoading(true);
    setErrorMessage("");
  
    try {
      const processedData = previewData.map(employee => {
        // Find department ID by case-insensitive name match with better trimming and normalization
        let departmentId = employee.departmentId;
        if (!departmentId && employee.department) {
          const normalizedDeptName = employee.department.toLowerCase().trim().replace(/\s+/g, ' ');
          
          // Try to find an exact match first
          const foundDepartment = departments.find(d => 
            d.name.toLowerCase().trim().replace(/\s+/g, ' ') === normalizedDeptName
          );
          
          // If no exact match, try to find a partial match (contains)
          if (!foundDepartment) {
            const partialMatch = departments.find(d => 
              d.name.toLowerCase().trim().replace(/\s+/g, ' ').includes(normalizedDeptName) ||
              normalizedDeptName.includes(d.name.toLowerCase().trim().replace(/\s+/g, ' '))
            );
            departmentId = partialMatch?.id;
          } else {
            departmentId = foundDepartment.id;
          }

          // Debug logging
          console.log('Department matching:', {
            employeeDept: employee.department,
            normalizedInput: normalizedDeptName,
            foundDept: foundDepartment || 'Using partial match or none found',
            foundId: departmentId,
            availableDepts: departments.map(d => ({ 
              id: d.id, 
              name: d.name,
              nameLower: d.name.toLowerCase().trim().replace(/\s+/g, ' ')
            }))
          });

          if (!departmentId) {
            // Better error message with list of valid departments
            const validDepts = departments.map(d => d.name).join(", ");
            const errorMsg = `Department "${employee.department}" not found. Valid departments are: ${validDepts}`;
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }
        }

        return {
          name: employee.name,
          departmentId: parseInt(departmentId),
          shiftId: parseInt(selectedShiftId),
          location: employee.location || employee.areaName,
          areaName: employee.areaName,
          latitude: employee.latitude || null,
          longitude: employee.longitude || null
        };
      });
  
      // Log the final processed data
      console.log('Final processed data:', processedData);
  
      // Validate all employees have departments
      const missingDepts = processedData.filter(emp => !emp.departmentId);
      if (missingDepts.length > 0) {
        const missingNames = missingDepts.map(emp => emp.name).join(", ");
        toast.error(`Missing departments for employees: ${missingNames}`);
        return;
      }
  
      const result = await employeeService.processEmployeeData(processedData);
      
      // First handle duplicates with higher visibility
      if (result.duplicateCount > 0) {
        // Get list of duplicates with formatted names
        const duplicatesList = result.duplicates?.map(d => `${d.name} at ${d.location}`);
        setShowingDuplicates(duplicatesList || []);
        
        // Show prominent toast that stays longer
        toast.warning(
          <div>
            <p className="font-semibold">Duplicate Employees Detected!</p>
            <p>Skipped {result.duplicateCount} duplicate employee(s)</p>
            <div className="mt-2 max-h-24 overflow-y-auto text-xs">
              {duplicatesList?.map((name, i) => (
                <div key={i} className="py-0.5 border-t border-amber-200 dark:border-amber-800 first:border-t-0">
                  {name}
                </div>
              ))}
            </div>
          </div>, 
          { 
            duration: 10000, // Longer duration
            important: true, // Make it more prominent in the toast stack 
            id: 'duplicate-employees' // Unique ID to prevent duplicates
          }
        );
        
        // If ALL employees were duplicates, show an error message in the UI as well
        if (result.processedCount === 0 && result.duplicateCount > 0) {
          setErrorMessage(`All ${result.duplicateCount} employees were duplicates and were skipped. None were added to the database.`);
        }
      } else {
        // Clear duplicates list if there are none
        setShowingDuplicates([]);
      }
      
      // Then handle successful additions if there were any
      if (result.processedCount > 0) {
        // Enhanced success toast with green checkmark
        toast.success(
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
            <span>Successfully added {result.processedCount} employees</span>
          </div>,
          { duration: 4000 }
        );
        
        if (result.failedCount > 0) {
          toast.warning(`Failed to add ${result.failedCount} employees`);
        }
        
        resetComponent();
        onSuccess?.();
        
        // Show a final summary toast if there were both successes and duplicates
        if (result.duplicateCount > 0) {
          toast.info(
            <div className="flex items-center">
              <span>Added {result.processedCount} employees. Skipped {result.duplicateCount} duplicates.</span>
            </div>, 
            { duration: 5000 }
          );
        }
      } else {
        // No employees added at all
        if (result.duplicateCount === 0) {
          toast.error("No employees were added. Please check the data and try again.");
          setErrorMessage("Failed to add employees. Please check that all required fields are present.");
        }
      }
    } catch (error) {
      console.error("Error uploading employees:", error);
      setErrorMessage(error.message || "Failed to upload employees");
      toast.error(error.message || "Failed to upload employees");
    } finally {
      setIsLoading(false);
    }
  }, [previewData, departments, validationErrors, selectedShiftId, onSuccess, resetComponent, setShowingDuplicates]);

  // Update the template download function to use real department names
  const handleDownloadTemplate = useCallback((format) => {
    try {
      // Get actual department names from the loaded departments
      const departmentNames = departments.length > 0 
        ? departments.map(d => d.name).slice(0, 4) // Take first 4 departments 
        : ["Operations", "Creative", "Trade Surveillance", "Cvent-Addis"]; // Fallback departments
      
      // Template data with correct departments and sample entries
      const templateData = [
        ['Name', 'Email', 'Phone', 'Department', 'Area Name', 'Latitude', 'Longitude'],
  ['Alemayehu Tadesse', 'alemayehu.t@example.com', '+251911456789', departmentNames[0] || "Operations", 'Kazanchis', '9.0215', '38.7468'],
        ['Tigist Hailu', 'tigist.h@example.com', '+251922345678', departmentNames[1] || "Creative", 'Bole', '8.9806', '38.7578'],
        ['Yonas Bekele', 'yonas.b@example.com', '+251911234567', departmentNames[2] || "Trade Surveillance", 'CMC', '9.0339', '38.7861'],
        ['Hiwot Girma', 'hiwot.g@example.com', '+251944567890', departmentNames[3] || "Cvent-Addis", 'Sarbet', '8.9946', '38.7468']
      ];
      
      if (format === 'csv') {
        // Generate proper CSV content WITHOUT adding quotes to all fields
        // This way, numerical values remain as-is without quotes
        const csvContent = templateData.map(row => {
          return row.map(cell => {
            // Only add quotes for fields containing commas or that are strings (not decimal numbers)
            const needsQuotes = typeof cell === 'string' && (
              cell.includes(',') || 
              isNaN(parseFloat(cell)) || 
              cell.includes('.')
            );
            return needsQuotes ? `"${cell}"` : cell;
          }).join(',');
        }).join('\n');
        
        // Create download with correct MIME type
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'employee_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        
        toast.success(
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            <span>CSV template downloaded successfully</span>
          </div>,
          { duration: 3000 }
        );
      } else {
        // Generate proper Excel file
        const ws = utils.aoa_to_sheet(templateData);
        
        // Set column widths
        ws['!cols'] = [
          { wch: 20 }, // Name
          { wch: 25 }, // Email
          { wch: 15 }, // Phone
          { wch: 15 }, // Department
          { wch: 15 }, // Area Name
          { wch: 10 }, // Latitude
          { wch: 10 }  // Longitude
        ];
        
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Employees");
        
        // Create a Blob for the Excel file
        const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'employee_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url); // Clean up
        
        toast.success(
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            <span>Excel template downloaded successfully</span>
          </div>,
          { duration: 3000 }
        );
      }
    } catch (error) {
      console.error("Failed to download template:", error);
      toast.error("Failed to download template file");
    }
  }, [departments]);

  return (
    <div className={cn(
      "rounded-xl border",
      isDark ? "bg-gray-800/30 border-gray-700/50" : "bg-white border-gray-200/70"
    )}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className={cn(
          "text-lg font-medium mb-5",
          isDark ? "text-gray-200" : "text-gray-800"
        )}>
          Employee Data Management
        </h3>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn(
            "p-1 rounded-lg w-full sm:w-auto",
            isDark ? "bg-gray-900" : "bg-gray-100"
          )}>
            {['paste', 'upload', 'add-single', 'actions'].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={cn(
                  "px-4 py-2 text-sm rounded-lg transition-all",
                  isDark 
                    ? "data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-300"
                    : "data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                )}
              >
                {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </TabsTrigger>
            ))}
          </TabsList>

          <ValidationErrors 
            isDark={isDark}
            errorMessage={errorMessage}
            validationErrors={validationErrors}
          />
          
          <div className="mt-6">
            <TabsContent value="paste">
              <PasteDataTab
                isDark={isDark}
                pastedData={pastedData}
                onPasteChange={(e) => setPastedData(e.target.value)}
                onClear={() => setPastedData("")}
                onPreview={() => processCsvData(pastedData)}
                isLoading={isLoading}
                previewTableData={previewData}
                setPreviewTableData={setPreviewData} // Add this prop
                shifts={shifts}
                selectedShiftId={selectedShiftId}
                onSelectShift={setSelectedShiftId}
              />
            </TabsContent>

            <TabsContent value="upload">
              <FileUploadTab
                isDark={isDark}
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                isLoading={isLoading}
                onSubmit={handleSubmitUpload}
                onPreview={handleFilePreview}
                shifts={shifts}
                selectedShiftId={selectedShiftId}
                onSelectShift={setSelectedShiftId}
              />
            </TabsContent>

            <TabsContent value="add-single">
              <SingleEmployeeForm
                isDark={isDark}
                employee={singleEmployee}
                departments={departments}
                shifts={shifts}
                locations={locations}
                members={availableMembers}
                phoneValid={phoneValid}
                emailValid={emailValid}
                isLoading={isLoading}
                onEmployeeChange={handleEmployeeChange}
                onSelectChange={handleSelectChange}
                onPhoneChange={handlePhoneChange}
                onEmailChange={handleEmailChange}
                onMapClick={() => setShowMapPicker(true)}
                onSubmit={handleSingleEmployeeSubmit}
                onCancel={resetComponent}
                onMemberSelect={handleMemberSelect}
                onAddDepartmentClick={handleNavigateToDepartments}
                onAddShiftClick={handleNavigateToShifts}
                onNavigateToDepartments={handleNavigateToDepartments}
                onNavigateToShifts={handleNavigateToShifts}
              />
            </TabsContent>

            <TabsContent value="actions">
              <QuickActionsTab
                isDark={isDark}
                onUploadClick={() => setActiveTab("upload")}
                onAddSingleClick={() => setActiveTab("add-single")}
                onDownloadTemplate={handleDownloadTemplate} // Use our internal implementation
                onManageEmployeesClick={navigateToEmployeeManagement}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Preview Table */}
      {previewData.length > 0 && (
        <PreviewTable
          isDark={isDark}
          previewData={previewData}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          isLoading={isLoading}
          onUpload={handleSubmitUpload}
          onPageChange={setCurrentPage}
          onClear={handleClearPreview}
          validationErrors={validationErrors}
        />
      )}

      {/* Show duplicate warnings if any - Fix the structure here */}
      {showingDuplicates.length > 0 && (
        <div className="px-6 py-4">
          <Alert className={cn(
            "mt-4 border-amber-200 bg-amber-50 text-amber-800",
            isDark && "border-amber-900/50 bg-amber-900/20 text-amber-200"
          )}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Duplicate Employees Detected</AlertTitle>
            <AlertDescription className="mt-2">
              <p>{showingDuplicates.length} employees were skipped because they already exist in the system.</p>
              <div className="mt-2 max-h-24 overflow-y-auto">
                {showingDuplicates.map((name, i) => (
                  <div key={i} className="text-sm py-1 border-t border-amber-200 dark:border-amber-800 first:border-t-0">
                    {name}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Dialogs */}
      <MapPickerDialog
        isDark={isDark}
        isOpen={showMapPicker}
        onOpenChange={setShowMapPicker}
        initialPosition={mapPosition}
        onLocationSelect={handleMapSelect}
      />

      <AddDepartmentDialog
        isDark={isDark}
        isOpen={showAddDepartmentDialog}
        onOpenChange={setShowAddDepartmentDialog}
        newDepartment={newDepartment}
        onDepartmentChange={setNewDepartment}
        onAdd={handleAddDepartment}
        isLoading={isLoading}
      />

      <AddShiftDialog
        isDark={isDark}
        isOpen={showAddShiftDialog}
        onOpenChange={setShowAddShiftDialog}
        newShift={newShift}
        onShiftChange={setNewShift}
        onAdd={handleAddShift}
        isLoading={isLoading}
      />
    </div>
  );
}
