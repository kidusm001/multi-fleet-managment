import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";
import { Badge } from "@/components/Common/UI/Badge";
import PropTypes from "prop-types";

import styles from "../styles/Table.module.css";

export default function EmployeeTable({ data }) {
  return (
    <div className={styles.tableContainer}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((employee) => (
            <TableRow key={employee.id} className={styles.staticRow}>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.location || 'N/A'}</TableCell>
              <TableCell>{employee.department.name}</TableCell>
              <TableCell>
                <Badge 
                  variant={employee.assigned ? "secondary" : "default"}
                  className={styles.statusBadge}
                  data-status={employee.assigned ? "assigned" : "unassigned"}
                >
                  {employee.assigned ? "Assigned" : "Unassigned"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {(!data || data.length === 0) && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No employees found for this shift
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

EmployeeTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      location: PropTypes.string,
      department: PropTypes.shape({
        name: PropTypes.string.isRequired,
      }).isRequired,
      assigned: PropTypes.bool,
    })
  ),
};
