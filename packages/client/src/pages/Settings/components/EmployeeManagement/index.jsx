import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { employeeService } from "@/services/employeeService";
import { Users, RefreshCw, AlertCircle } from "lucide-react";
import Button from "@/components/Common/UI/Button";
import { toast } from "sonner";
import EmployeeStatsCard from "./EmployeeStatsCard";
import EmployeeUploadSection from "./EmployeeUploadSection";

/**
 * Employee Management Component for Settings Page
 * This component provides access to bulk upload employees and redirects to the 
 * full Employee Management page for detailed editing
 */
export default function EmployeeManagement({ navigateToDepartments, navigateToShifts }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  
  // State management
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    departments: 0,
    recentlyAdded: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load employee statistics when component mounts
  useEffect(() => {
    loadEmployeeStats();
  }, []);

  // Load employee statistics
  const loadEmployeeStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeService.getEmployeeStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load employee statistics:", err);
      setError(err.message || "Could not load employee statistics");
      toast.error("Could not load employee statistics. Using default values.");
    } finally {
      setLoading(false);
    }
  };

  // Navigation helpers handled inline where used

  // Handle download template
  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const templateBlob = await employeeService.getUploadTemplate();
      
      // Create a download link for the template
      const url = window.URL.createObjectURL(templateBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "employee_upload_template.xlsx");
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success("Template downloaded successfully");
    } catch (err) {
      console.error("Failed to download template:", err);
      toast.error("Failed to download template");
    } finally {
      setLoading(false);
    }
  };

  // Refresh stats
  const handleRefresh = async () => {
    await loadEmployeeStats();
    toast.success("Employee statistics refreshed");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className={`h-6 w-6 ${isDark ? "text-green-400" : "text-green-600"}`} />
          Employee Management
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh statistics"
            className={`${loading ? "animate-spin" : ""} ${
              isDark ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : ""
            }`}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          isDark ? "bg-red-900/20 border-red-900/30 text-red-400" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <EmployeeStatsCard 
          title="Total Employees" 
          value={stats.total} 
          icon={<Users className="h-4 w-4" />}
          isDark={isDark}
          color="blue"
          loading={loading}
        />
        <EmployeeStatsCard 
          title="Assigned Employees" 
          value={stats.assigned} 
          isDark={isDark}
          color="green"
          loading={loading}
        />
        <EmployeeStatsCard 
          title="Departments" 
          value={stats.departments}
          isDark={isDark}
          color="amber"
          loading={loading}
        />
        <EmployeeStatsCard 
          title="Recently Added" 
          value={stats.recentlyAdded}
          isDark={isDark}
          color="purple"
          subtitle="Last 30 days"
          loading={loading}
        />
      </div>

      {/* Upload Section */}
      <EmployeeUploadSection 
        onSuccess={loadEmployeeStats}
        isDark={isDark} 
        navigateToEmployeeManagement={() => navigate("/employees")}
        navigateToDepartmentManagement={navigateToDepartments}
        navigateToShiftManagement={navigateToShifts}
        handleDownloadTemplate={handleDownloadTemplate}
      />
    </div>
  );
}
