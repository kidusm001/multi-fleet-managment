import PropTypes from "prop-types";
import { Input } from "@/components/Common/UI/Input";
import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@components/Common/UI/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Common/UI/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";

export function RecruitmentEmployeeList({
  assignmentFilter,
  setAssignmentFilter,
  searchTerm,
  setSearchTerm,
  paginatedEmployees,
  shuttleRoutes,
  employeesPage,
  employeesPages,
  setEmployeesPage
}) {
  return (
    <div className="bg-[var(--card-background)] rounded-xl p-6 border border-[var(--divider)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
        Employee List
      </h2>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Select
              value={assignmentFilter}
              onValueChange={setAssignmentFilter}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[240px] h-9 text-sm bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800">
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Shuttle Route</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="text-sm font-medium">
                      {employee.id}
                    </TableCell>
                    <TableCell className="text-sm">{employee.name}</TableCell>
                    <TableCell className="text-sm">
                      {employee.location}
                    </TableCell>
                    <TableCell className="text-sm">
                      {employee.shuttle
                        ? shuttleRoutes.find((r) => r.id === employee.shuttle)
                            ?.name || "-"
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          employee.shuttle
                            ? "text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                            : "text-xs bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                        }
                      >
                        {employee.shuttle ? "Assigned" : "Unassigned"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        {employeesPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setEmployeesPage((p) => Math.max(1, p - 1))}
              disabled={employeesPage === 1}
              className="h-9 px-4 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500 dark:text-slate-400">
              Page {employeesPage} of {employeesPages}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setEmployeesPage((p) => Math.min(employeesPages, p + 1))
              }
              disabled={employeesPage === employeesPages}
              className="h-9 px-4 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

RecruitmentEmployeeList.propTypes = {
  assignmentFilter: PropTypes.string.isRequired,
  setAssignmentFilter: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  paginatedEmployees: PropTypes.array.isRequired,
  shuttleRoutes: PropTypes.array.isRequired,
  employeesPage: PropTypes.number.isRequired,
  employeesPages: PropTypes.number.isRequired,
  setEmployeesPage: PropTypes.func.isRequired
};