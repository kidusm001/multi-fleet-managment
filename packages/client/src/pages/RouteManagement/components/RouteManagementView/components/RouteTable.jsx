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
import { formatDisplayAddress } from "@/utils/address";

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
                            : `${stop.employee.firstName || ""} ${stop.employee.lastName || ""
                                }`.trim(),
                    };

                    return {
                        routeId: route.id,
                        routeName: route.name || "Unnamed Route",
                        employee: enhancedEmployee,
                        department: department?.name || "N/A",
                        departmentId: department?.id,
                        pickupLocation: "HQ",
                        dropOffLocation:
                            formatDisplayAddress(
                                stop.address || stop.location || stop.employee?.location || ""
                            ) || "N/A",
                        driver: {
                            name: (route.shuttle?.driver?.name || route.vehicle?.driver?.name) || "Not Assigned",
                            phone: (route.shuttle?.driver?.phone || route.vehicle?.driver?.phone) || "N/A",
                        },
                        shuttle: {
                            id: route.shuttle?.id || route.vehicle?.id,
                            name: (route.shuttle?.name || route.vehicle?.name || route.vehicle?.plateNumber) || "Not Assigned",
                            capacity: route.shuttle?.capacity || route.vehicle?.capacity || 0,
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

        // Debug logging
        console.log('Export params:', { exportType, selectedOption, fileFormat });
        console.log('Sample flattenedData:', flattenedData[0]);

        // Filter data based on export type
        switch (exportType) {
            case "all":
                dataToExport = flattenedData;
                break;
            case "department":
                dataToExport = flattenedData.filter(
                    (row) => String(row.departmentId) === String(selectedOption)
                );
                break;
            case "shuttle":
                dataToExport = flattenedData.filter(
                    (row) => row.shuttle?.id && String(row.shuttle.id) === String(selectedOption)
                );
                break;
            case "shift":
                dataToExport = flattenedData.filter(
                    (row) => row.shift?.id && String(row.shift.id) === String(selectedOption)
                );
                break;
            case "route":
                dataToExport = flattenedData.filter(
                    (row) => String(row.routeId) === String(selectedOption)
                );
                break;
            default:
                dataToExport = flattenedData;
        }

        console.log('Filtered data count:', dataToExport.length);

        // Check if there's data to export
        if (!dataToExport || dataToExport.length === 0) {
            alert("No data available to export for the selected filter.");
            setShowExportPopup(false);
            return;
        }

        // Format data for export
        const formattedData = dataToExport.map((row) => ({
            "Route Name": row.routeName || "",
            "Route ID": row.routeId || "",
            "Employee Name": row.employee?.name || "",
            "Employee ID": row.employee?.id || "",
            Department: row.department || "",
            "Pick-up Location": row.pickupLocation || "",
            "Drop-off Location": row.dropOffLocation || "",
            "Driver Name": row.driver?.name || "",
            "Driver Phone": row.driver?.phone || "",
            "Shuttle Name": row.shuttle?.name || "",
            "Shuttle Capacity": row.shuttle?.capacity || "",
            "Shift Name": row.shift?.name || "",
            "Shift Time": `${row.shift?.startTime || ""} - ${row.shift?.endTime || ""}`,
            Status: row.status || "",
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
        if (!data || data.length === 0) {
            return "";
        }
        const header = Object.keys(data[0]);
        const rows = data.map((row) =>
            header.map((key) => `"${row[key] || ""}"`).join(",")
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

            {/* Mobile compact list - only visible on small screens */}
            <div className="block md:hidden">
                <div className="space-y-3 p-3">
                    {pageData.map((row, i) => (
                        <div
                            key={`mobile-row-${row.routeId}-${i}`}
                            onClick={() => {
                                const route = routes.find((r) => r.id === row.routeId);
                                if (route) onRouteClick(route);
                            }}
                            className="bg-background/80 border border-border/30 rounded-lg p-3 flex items-start justify-between gap-3 hover:bg-background/90 cursor-pointer"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-medium text-primary truncate">
                                        {row.routeName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">#{row.routeId}</div>
                                </div>
                                <div className="mt-1 text-sm truncate">{row.employee.name}</div>
                                <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-2">
                                    <span className="truncate">Pickup: {row.pickupLocation}</span>
                                    <span className="truncate">Drop: {row.dropOffLocation}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-xs text-muted-foreground text-right">
                                    {row.shift.startTime} - {row.shift.endTime}
                                </div>
                                <div>
                                    <Badge
                                        variant={row.status === "active" ? "success" : "secondary"}
                                        className="capitalize text-xs px-2 py-1"
                                    >
                                        {row.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop / tablet table - hidden on small screens */}
            <div className="hidden md:block rounded-xl border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader className="sticky top-0 z-50 bg-background">
                        <TableRow>
                            {[
                                { key: "routeName", label: "Route" },
                                { key: "employeeName", label: "Employee" },
                                { key: "department", label: "Department", hideOnMobile: true },
                                { key: "pickupLocation", label: "Pick-up", hideOnMobile: true },
                                { key: "dropOffLocation", label: "Drop-off", hideOnMobile: true },
                                { key: "driver", label: "Driver", hideOnMobile: true },
                                { key: "shuttleName", label: "Shuttle", hideOnMobile: true },
                                {
                                    key: "shift",
                                    label: sortColumn === "shift" ? "Time" : "Shift",
                                    hideOnMobile: true,
                                },
                                { key: "status", label: "Status" },
                            ].map(({ key, label, hideOnMobile }) => (
                                <TableHead
                                    key={key}
                                    className={cn(
                                        "py-4 px-4 h-12",
                                        "group cursor-pointer hover:bg-muted/80",
                                        "transition-colors duration-200",
                                        "first:rounded-tl-lg last:rounded-tr-lg",
                                        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95",
                                        "sticky top-0",
                                        "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border",
                                        hideOnMobile && "hidden md:table-cell"
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
                                        <TableCell className={cn("py-3 px-4", "table-cell")}>
                                            <div className="font-medium text-primary">
                                                {row.routeName}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                #{row.routeId}
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn("py-3 px-4")}>
                                            <div className="font-medium">{row.employee.name}</div>
                                        </TableCell>
                                        <TableCell className={cn("py-3 px-4", "hidden md:table-cell")}>
                                            {row.department}
                                        </TableCell>
                                        <TableCell className={cn("py-3 px-4", "hidden md:table-cell")}>
                                            {row.pickupLocation}
                                        </TableCell>
                                        <TableCell className={cn("py-3 px-4", "hidden md:table-cell")}>
                                            <div className="max-w-[200px] truncate">
                                                {row.dropOffLocation}
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn("py-3 px-4", "hidden md:table-cell")}>
                                            <div className="font-medium">{row.driver.name}</div>
                                            {row.driver.phone !== "N/A" && (
                                                <div className="text-xs text-muted-foreground">
                                                    {row.driver.phone}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className={cn("py-3 px-4", "hidden md:table-cell")}>
                                            <div className="font-medium">{row.shuttle.name}</div>
                                            {row.shuttle.capacity > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    {row.shuttle.capacity} seats
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className={cn("py-3 px-4", "hidden md:table-cell")}>
                                            <div className="font-medium">{row.shift.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {row.shift.startTime} - {row.shift.endTime}
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn("py-3 px-4")}>
                                            <Badge
                                                variant={row.status === "active" ? "success" : "secondary"}
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
