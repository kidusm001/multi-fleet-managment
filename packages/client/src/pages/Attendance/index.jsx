import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { attendanceService } from "@/services/attendanceService";
import { driverService } from "@/services/driverService";
import api from "@/services/api";
import { Calendar, Search, Plus, RefreshCw, Filter } from "lucide-react";
import { Input } from "@/components/Common/UI/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import Button from "@/components/Common/UI/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Common/UI/Card";
import { toast } from "sonner";
import AttendanceTable from "./components/AttendanceTable";
import AttendanceFormDialog from "./components/AttendanceFormDialog";
import AttendanceDeleteDialog from "./components/AttendanceDeleteDialog";

/**
 * Attendance Management Component
 * Main component for managing attendance records
 */
export default function AttendanceManagement() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Form data
  const [formData, setFormData] = useState({
    vehicleId: "",
    driverId: null,
    date: new Date().toISOString().split('T')[0],
    hoursWorked: "",
    tripsCompleted: "",
    kmsCovered: "",
    fuelCost: "",
    tollCost: "",
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load attendance records
      const params = {
        page: currentPage,
        limit: 50,
      };

      const [attendanceData, vehiclesData, driversData] = await Promise.all([
        attendanceService.getAttendanceRecords(params),
        api.get('/shuttles').then(res => res.data),
        driverService.getDrivers(),
      ]);

      setAttendanceRecords(attendanceData.records || []);
      setFilteredRecords(attendanceData.records || []);
      setVehicles(vehiclesData || []);
      setDrivers(driversData || []);
      
      if (attendanceData.pagination) {
        setTotalPages(attendanceData.pagination.totalPages);
        setTotalRecords(attendanceData.pagination.total);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load attendance data. Please try again.");
      toast.error("Failed to load attendance data");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFilters = useCallback(() => {
    let filtered = [...attendanceRecords];

    // Search filter (vehicle or driver name)
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.vehicle?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(
        (record) =>
          new Date(record.date).toISOString().split('T')[0] === dateFilter
      );
    }

    // Vehicle filter
    if (vehicleFilter) {
      filtered = filtered.filter((record) => record.vehicleId === vehicleFilter);
    }

    // Driver filter
    if (driverFilter) {
      if (driverFilter === "outsourced") {
        filtered = filtered.filter((record) => !record.driverId);
      } else {
        filtered = filtered.filter((record) => record.driverId === driverFilter);
      }
    }

    setFilteredRecords(filtered);
  }, [attendanceRecords, searchTerm, dateFilter, vehicleFilter, driverFilter]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const resetForm = () => {
    setFormData({
      vehicleId: "",
      driverId: null,
      date: new Date().toISOString().split('T')[0],
      hoursWorked: "",
      tripsCompleted: "",
      kmsCovered: "",
      fuelCost: "",
      tollCost: "",
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsEditMode(false);
    setSelectedRecord(null);
    setShowAddDialog(true);
  };

  const handleEdit = (record) => {
    setFormData({
      vehicleId: record.vehicleId,
      driverId: record.driverId || null,
      date: new Date(record.date).toISOString().split('T')[0],
      hoursWorked: record.hoursWorked || "",
      tripsCompleted: record.tripsCompleted || "",
      kmsCovered: record.kmsCovered || "",
      fuelCost: record.fuelCost || "",
      tollCost: record.tollCost || "",
    });
    setIsEditMode(true);
    setSelectedRecord(record);
    setShowAddDialog(true);
  };

  const handleDelete = (record) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  const handleView = (record) => {
    // For now, just edit. Could create a separate view dialog later
    handleEdit(record);
  };

  const handleSubmit = async (data) => {
    try {
      const payload = {
        vehicleId: data.vehicleId,
        driverId: data.driverId || null,
        date: data.date,
        hoursWorked: data.hoursWorked ? parseFloat(data.hoursWorked) : null,
        tripsCompleted: data.tripsCompleted ? parseInt(data.tripsCompleted, 10) : 0,
        kmsCovered: data.kmsCovered ? parseFloat(data.kmsCovered) : null,
        fuelCost: data.fuelCost ? parseFloat(data.fuelCost) : null,
        tollCost: data.tollCost ? parseFloat(data.tollCost) : null,
      };

      if (isEditMode && selectedRecord) {
        await attendanceService.updateAttendanceRecord(selectedRecord.id, payload);
        toast.success("Attendance record updated successfully");
      } else {
        await attendanceService.createAttendanceRecord(payload);
        toast.success("Attendance record created successfully");
      }

      await loadData();
      setShowAddDialog(false);
      return true;
    } catch (err) {
      console.error("Error submitting attendance record:", err);
      const errorMessage = err.response?.data?.message || "Failed to save attendance record";
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRecord) return;

    try {
      setIsDeleting(true);
      await attendanceService.deleteAttendanceRecord(selectedRecord.id);
      toast.success("Attendance record deleted successfully");
      await loadData();
      setShowDeleteDialog(false);
    } catch (err) {
      console.error("Error deleting attendance record:", err);
      toast.error("Failed to delete attendance record");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadData();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setVehicleFilter("");
    setDriverFilter("");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Attendance Management
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Record and manage daily attendance for vehicles and drivers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Attendance
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by vehicle or driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Filter */}
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />

            {/* Vehicle Filter */}
            <Select
              value={vehicleFilter || "all"}
              onValueChange={(value) => setVehicleFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.model} - {vehicle.plateNumber || vehicle.licensePlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Driver Filter */}
            <Select
              value={driverFilter || "all"}
              onValueChange={(value) => setDriverFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="outsourced">Outsourced</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || dateFilter || vehicleFilter || driverFilter) && (
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`overflow-hidden ${
          isDark ? "bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-800/30" : "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200"
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium mb-2 ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}>
                  Total Records
                </p>
                <div className={`text-3xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>
                  {totalRecords.toLocaleString()}
                </div>
                <p className={`text-xs mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>
                  All attendance entries
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                isDark ? "bg-blue-900/30" : "bg-blue-100"
              }`}>
                <Calendar className={`h-6 w-6 ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`overflow-hidden ${
          isDark ? "bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-800/30" : "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200"
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium mb-2 ${
                  isDark ? "text-green-400" : "text-green-600"
                }`}>
                  Filtered Results
                </p>
                <div className={`text-3xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>
                  {filteredRecords.length.toLocaleString()}
                </div>
                <p className={`text-xs mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>
                  {filteredRecords.length === totalRecords ? "No filters applied" : "Matching filters"}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                isDark ? "bg-green-900/30" : "bg-green-100"
              }`}>
                <Filter className={`h-6 w-6 ${
                  isDark ? "text-green-400" : "text-green-600"
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`overflow-hidden ${
          isDark ? "bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-800/30" : "bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200"
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium mb-2 ${
                  isDark ? "text-purple-400" : "text-purple-600"
                }`}>
                  Current Page
                </p>
                <div className={`text-3xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>
                  {currentPage} <span className={`text-xl ${isDark ? "text-gray-500" : "text-gray-400"}`}>/ {totalPages}</span>
                </div>
                <p className={`text-xs mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>
                  Showing 50 per page
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                isDark ? "bg-purple-900/30" : "bg-purple-100"
              }`}>
                <Search className={`h-6 w-6 ${
                  isDark ? "text-purple-400" : "text-purple-600"
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-[var(--text-secondary)]">Loading attendance records...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button onClick={handleRefresh} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <AttendanceTable
              records={filteredRecords}
              isDark={isDark}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--text-secondary)]">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <AttendanceFormDialog
        isOpen={showAddDialog}
        isDark={isDark}
        editMode={isEditMode}
        formData={formData}
        setFormData={setFormData}
        vehicles={vehicles}
        drivers={drivers}
        onSubmit={handleSubmit}
        onCancel={() => setShowAddDialog(false)}
      />

      <AttendanceDeleteDialog
        isOpen={showDeleteDialog}
        isDark={isDark}
        record={selectedRecord}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
