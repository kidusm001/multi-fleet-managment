import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/Common/UI/Table";
import { Badge } from "@/components/Common/UI/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Common/UI/Select";
import { ChevronUp, ChevronDown, Users } from "lucide-react";
import { cn } from "@lib/utils";
import { format } from "date-fns";
import PropTypes from "prop-types";
import { shuttleService } from "@services/shuttleService";
import { shiftService } from "@services/shiftService";
import { departmentService } from "@services/departmentService";
import Pagination from "./Pagination";
import ExportPopup from "@components/ExportPopup";
import { downloadExcel } from "@utils/exportUtils";

const RouteTable = ({ routes, onRouteClick }) => {
  const [sortColumn, setSortColumn] = useState("routeName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportPopup, setShowExportPopup] = useState(false);

  const [enhancedData, setEnhancedData] = useState({
    shuttles: new Map(),
    shifts: new Map(),
    departments: new Map(),
  });

  useEffect(() => {
    const fetchEnhancedData = async () => {
      try {
        const [shuttlesData, shiftsData, departmentsData] = await Promise.all([
          shuttleService.getShuttles(),
          shiftService.getAllShifts(),
          departmentService.getAllDepartments(),
        ]);

        setEnhancedData({
          shuttles: new Map(shuttlesData.map((s) => [s.id, s])),
          shifts: new Map(shiftsData.map((s) => [s.id, s])),
          departments: new Map(departmentsData.map((dept) => [dept.id, dept])),
        });
      } catch (error) {
        console.error("Error fetching enhanced data:", error);
      }
    };

    fetchEnhancedData();
  }, []);

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return (
        <div className="w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-40">
          <ChevronUp className="h-3 w-3" />
        </div>
      );
    }
    return (
      <div className="w-4 h-4 flex items-center justify-center">
        {sortOrder === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </div>
    );
  };

  SortIcon.propTypes = {
    column: PropTypes.string.isRequired,
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const flattenedData = useMemo(() => {
    return routes.flatMap((route) =>
      (route.stops || [])
        .filter((stop) => stop?.employee)
        .map((stop) => {
          const department = enhancedData.departments.get(
            stop.employee?.departmentId
          );

          const enhancedEmployee = {
            ...stop.employee,
            department,
            name: stop.employee.name
              ? stop.employee.name
              : `${stop.employee.firstName || ""} ${
                  stop.employee.lastName || ""
                }`.trim(),
          };

          return {
            routeId: route.id,
            routeName: route.name || "Unnamed Route",
            employee: enhancedEmployee,
            department: department?.name || "N/A",
            departmentId: department?.id,
            pickupLocation: "HQ",
            dropOffLocation: stop.employee?.location || "N/A",
            driver: {
              name: route.shuttle?.driver?.name || "Not Assigned",
              phone: route.shuttle?.driver?.phone || "N/A",
            },
            shuttle: {
              id: route.shuttle?.id,
              name: route.shuttle?.name || "Not Assigned",
              capacity: route.shuttle?.capacity || 0,
            },
            shift: {
              id: route.shift?.id,
              name: route.shift?.name || "No Shift",
              startTime: route.shift?.startTime
                ? format(new Date(route.shift.startTime), "hh:mm a")
                : "N/A",
              endTime: route.shift?.endTime
                ? format(new Date(route.shift.endTime), "hh:mm a")
                : "N/A",
            },
            status: route.status || "inactive",
          };
        })
    );
  }, [routes, enhancedData]);

  const totalPages = Math.ceil(flattenedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const pageData = flattenedData.slice(startIndex, startIndex + pageSize);

  const paginatedGroupedData = useMemo(() => {
    const sorted = [...pageData].sort((a, b) => {
      let aValue =
        sortColumn === "employeeName"
          ? a.employee?.name?.toLowerCase() || ""
          : (a[sortColumn] || "").toString().toLowerCase();
      let bValue =
        sortColumn === "employeeName"
          ? b.employee?.name?.toLowerCase() || ""
          : (b[sortColumn] || "").toString().toLowerCase();
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    const groups = new Map();
    sorted.forEach((row) => {
      let key;
      switch (sortColumn) {
        case "routeName":
          key = row.routeId;
          break;
        case "department":
          key = row.departmentId || "no-department";
          break;
        case "shuttleName":
          key = row.shuttle.id || "no-shuttle";
          break;
        case "shift":
          key = row.shift.id || "no-shift";
          break;
        default:
          key = row.routeId;
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.values());
  }, [pageData, sortColumn, sortOrder]);

  const handleExport = async ({
    exportType,
    selectedOption,
    fileFormat,
    groupByShift,
  }) => {
    let dataToExport = [];

    // Filter data based on export type
    switch (exportType) {
      case "all":
        dataToExport = flattenedData;
        break;
      case "department":
        dataToExport = flattenedData.filter(
          (row) => row.departmentId === parseInt(selectedOption)
        );
        break;
      case "shuttle":
        dataToExport = flattenedData.filter(
          (row) => row.shuttle.id === parseInt(selectedOption)
        );
        break;
      case "shift":
        dataToExport = flattenedData.filter(
          (row) => row.shift.id === parseInt(selectedOption)
        );
        break;
      case "route":
        dataToExport = flattenedData.filter(
          (row) => row.routeId === parseInt(selectedOption)
        );
        break;
      default:
        dataToExport = flattenedData;
    }

    // Format data for export
    const formattedData = dataToExport.map((row) => ({
      "Route Name": row.routeName,
      "Route ID": row.routeId,
      "Employee Name": row.employee.name,
      "Employee ID": row.employee.id,
      Department: row.department,
      "Pick-up Location": row.pickupLocation,
      "Drop-off Location": row.dropOffLocation,
      "Driver Name": row.driver.name,
      "Driver Phone": row.driver.phone,
      "Shuttle Name": row.shuttle.name,
      "Shuttle Capacity": row.shuttle.capacity,
      "Shift Name": row.shift.name,
      "Shift Time": `${row.shift.startTime} - ${row.shift.endTime}`,
      Status: row.status,
    }));

    if (fileFormat === "excel") {
      downloadExcel(formattedData, `route-data-${Date.now()}.xlsx`, {
        groupByShift,
      });
    } else {
      // CSV export logic here
      const csv = convertToCSV(formattedData);
      downloadCSV(csv, `route-data-${Date.now()}.csv`);
    }

    setShowExportPopup(false);
  };

  const convertToCSV = (data) => {
    const header = Object.keys(data[0]);
    const rows = data.map((row) =>
      header.map((key) => `"${row[key]}"`).join(",")
    );
    return [header.join(","), ...rows].join("\n");
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Total: {flattenedData.length} employees
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowExportPopup(true)}
            className="px-3 py-2 rounded bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              {[
                { key: "routeName", label: "Route" },
                { key: "employeeName", label: "Employee" },
                { key: "department", label: "Department" },
                { key: "pickupLocation", label: "Pick-up" },
                { key: "dropOffLocation", label: "Drop-off" },
                { key: "driver", label: "Driver" },
                { key: "shuttleName", label: "Shuttle" },
                {
                  key: "shift",
                  label: sortColumn === "shift" ? "Time" : "Shift",
                },
                { key: "status", label: "Status" },
              ].map(({ key, label }) => (
                <TableHead
                  key={key}
                  className={cn(
                    "py-4 px-4 h-12",
                    "group cursor-pointer hover:bg-muted/80",
                    "transition-colors duration-200",
                    "first:rounded-tl-lg last:rounded-tr-lg",
                    "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95",
                    "sticky top-0",
                    "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border"
                  )}
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {label}
                    <SortIcon column={key} />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGroupedData.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {groupIndex > 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-2 bg-muted/50 dark:bg-muted/10"
                    />
                  </TableRow>
                )}
                {group.map((row, index) => (
                  <TableRow
                    key={`${row.routeId}-${index}`}
                    className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors duration-200"
                    onClick={() => {
                      const route = routes.find((r) => r.id === row.routeId);
                      if (route) onRouteClick(route);
                    }}
                  >
                    <TableCell className="py-3 px-4">
                      <div className="font-medium text-primary">
                        {row.routeName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{row.routeId}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="font-medium">{row.employee.name}</div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {row.department}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {row.pickupLocation}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="max-w-[200px] truncate">
                        {row.dropOffLocation}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="font-medium">{row.driver.name}</div>
                      {row.driver.phone !== "N/A" && (
                        <div className="text-xs text-muted-foreground">
                          {row.driver.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="font-medium">{row.shuttle.name}</div>
                      {row.shuttle.capacity > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {row.shuttle.capacity} seats
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="font-medium">{row.shift.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.shift.startTime} - {row.shift.endTime}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge
                        variant={
                          row.status === "active" ? "success" : "secondary"
                        }
                        className="capitalize"
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={flattenedData.length}
        onPageChange={(page) => setCurrentPage(page)}
      />

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {pageData.length} of {flattenedData.length} employees
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{flattenedData.length} total employees</span>
        </div>
      </div>

      {showExportPopup && (
        <ExportPopup
          onClose={() => setShowExportPopup(false)}
          onDownload={handleExport}
          shuttles={Object.values(Array.from(enhancedData.shuttles.values()))}
          departments={Object.values(
            Array.from(enhancedData.departments.values())
          )}
          shifts={Object.values(Array.from(enhancedData.shifts.values()))}
          routes={routes}
        />
      )}
    </div>
  );
};

RouteTable.propTypes = {
  routes: PropTypes.array.isRequired,
  onRouteClick: PropTypes.func.isRequired,
};

export default RouteTable;
