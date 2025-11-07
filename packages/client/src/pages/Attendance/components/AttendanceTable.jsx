import { Edit, Trash2, Eye, Clock, TrendingUp, Fuel, Banknote, Car, RefreshCw } from "lucide-react";
import { Badge } from "@/components/Common/UI/Badge";
import Button from "@/components/Common/UI/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";

/**
 * Attendance Table Component
 * Displays attendance records in a table format
 */
export default function AttendanceTable({
  records,
  isDark,
  onEdit,
  onDelete,
  onView,
  onRecalculate,
}) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
          isDark ? "bg-gray-800" : "bg-gray-100"
        }`}>
          <Clock className={`h-8 w-8 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
        </div>
        <h3 className={`text-lg font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-900"}`}>
          No Attendance Records
        </h3>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          No attendance records found. Click the Add Attendance button to create one.
        </p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border ${
      isDark ? "border-gray-800" : "border-gray-200"
    }`}>
      <Table>
        <TableHeader>
          <TableRow className={`${
            isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"
          }`}>
            <TableHead className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Date
            </TableHead>
            <TableHead className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Vehicle
            </TableHead>
            <TableHead className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Driver
            </TableHead>
            <TableHead className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Hours
              </div>
            </TableHead>
            <TableHead className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Trips
              </div>
            </TableHead>
            <TableHead className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              <div className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                Distance
              </div>
            </TableHead>
            <TableHead className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4" />
                Fuel
              </div>
            </TableHead>
            <TableHead className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              <div className="flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                Toll
              </div>
            </TableHead>
            <TableHead className={`font-semibold text-right ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow
              key={record.id}
              className={`transition-colors ${
                isDark
                  ? "border-gray-700 hover:bg-gray-800/50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <TableCell className={`font-medium ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                <div className="flex flex-col">
                  <span>{formatDate(record.date)}</span>
                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isDark ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"
                  }`}>
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <div className={`font-medium ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                      {record.vehicle?.model || 'Unknown'}
                    </div>
                    <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      {record.vehicle?.plateNumber || record.vehicle?.licensePlate || '-'}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {record.driver ? (
                  <div className="flex items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                      isDark ? "bg-purple-900/20 text-purple-400" : "bg-purple-50 text-purple-600"
                    }`}>
                      {record.driver.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={`font-medium ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                        {record.driver.name}
                      </div>
                      <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                        {record.driver.licenseNumber || '-'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Badge variant="outline" className={`${
                    isDark ? "border-gray-600 text-gray-400" : "border-gray-300 text-gray-600"
                  }`}>
                    Outsourced
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {record.hoursWorked ? (
                  <Badge variant="secondary" className={`font-mono ${
                    isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-900"
                  }`}>
                    {record.hoursWorked}h
                  </Badge>
                ) : (
                  <span className={isDark ? "text-gray-500" : "text-gray-400"}>-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={`font-mono ${
                  record.tripsCompleted > 0
                    ? isDark ? "bg-green-900/20 text-green-400" : "bg-green-50 text-green-600"
                    : isDark ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-500"
                }`}>
                  {record.tripsCompleted || 0} trips
                </Badge>
              </TableCell>
              <TableCell className={`font-medium ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                {record.kmsCovered ? (
                  <span>{record.kmsCovered.toLocaleString()} km</span>
                ) : (
                  <span className={isDark ? "text-gray-500" : "text-gray-400"}>-</span>
                )}
              </TableCell>
              <TableCell className={`font-medium ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                {record.fuelCost ? (
                  <span className={isDark ? "text-orange-400" : "text-orange-600"}>
                    {formatCurrency(record.fuelCost)}
                  </span>
                ) : (
                  <span className={isDark ? "text-gray-500" : "text-gray-400"}>-</span>
                )}
              </TableCell>
              <TableCell className={`font-medium ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                {record.tollCost ? (
                  <span className={isDark ? "text-blue-400" : "text-blue-600"}>
                    {formatCurrency(record.tollCost)}
                  </span>
                ) : (
                  <span className={isDark ? "text-gray-500" : "text-gray-400"}>-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(record)}
                    title="View details"
                    className={`h-8 w-8 p-0 ${
                      isDark
                        ? "hover:bg-gray-700 hover:text-blue-400"
                        : "hover:bg-gray-100 hover:text-blue-600"
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRecalculate(record)}
                    title="Recalculate from routes"
                    className={`h-8 w-8 p-0 ${
                      isDark
                        ? "hover:bg-gray-700 hover:text-purple-400"
                        : "hover:bg-gray-100 hover:text-purple-600"
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(record)}
                    title="Edit record"
                    className={`h-8 w-8 p-0 ${
                      isDark
                        ? "hover:bg-gray-700 hover:text-green-400"
                        : "hover:bg-gray-100 hover:text-green-600"
                    }`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(record)}
                    title="Delete record"
                    className={`h-8 w-8 p-0 ${
                      isDark
                        ? "hover:bg-red-900/20 text-red-400 hover:text-red-300"
                        : "hover:bg-red-50 text-red-600 hover:text-red-700"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
