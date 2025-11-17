import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/UI/Table";
import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@/components/Common/UI/Button";
import PropTypes from "prop-types";
import { formatCurrency, formatPercent } from "@/utils/formatters";

export function ShuttleTable({
  filteredShuttleData,
  handleShuttleSelect,
  calculateMonthlyCost,
  selectedShuttle,
}) {
  // Ensure IDs are strings
  const processedData = filteredShuttleData.map(shuttle => ({
    ...shuttle,
    id: String(shuttle.id)
  }));

  const getStatusColor = (status) => {
    switch (status) {
      case 'PROCESSED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateDailyCost = (shuttle) => {
    // For payroll entries, this returns the gross amount (amount before deductions)
    return parseFloat((shuttle.amount || shuttle.costPerDay || 0).toFixed(2));
  };

  const calculateUtilization = (usageDays) => {
    const workingDays = 22;
    return (usageDays / workingDays) * 100;
  };

  // Calculate total costs for footer
  const totalDailyCost = processedData.reduce((sum, shuttle) => 
    sum + calculateDailyCost(shuttle), 0
  );
  
  const totalMonthlyCost = processedData.reduce((sum, shuttle) => 
    sum + calculateMonthlyCost(shuttle), 0
  );

  const averageEfficiency = processedData.length > 0
    ? processedData.reduce((sum, shuttle) => sum + shuttle.efficiency, 0) / processedData.length
    : 0;

  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Usage Days</TableHead>
            <TableHead>Gross Pay</TableHead>
            <TableHead>Net Pay</TableHead>
            <TableHead>Efficiency</TableHead>
            <TableHead>Utilization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <tbody aria-hidden="true" className="table-row h-2"></tbody>
        <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
          {processedData.map((shuttle) => (
            <TableRow
              key={shuttle.id}
              className={`border-none ${
                selectedShuttle?.id === shuttle.id ? "bg-blue-50/50" : ""
              }`}
            >
              <TableCell className="py-2.5 font-medium">{shuttle.vehicleId || shuttle.id}</TableCell>
              <TableCell className="py-2.5">{shuttle.type}</TableCell>
              <TableCell className="py-2.5">{shuttle.model}</TableCell>
              <TableCell className="py-2.5">{shuttle.usageDays}</TableCell>
              <TableCell className="py-2.5">{formatCurrency(calculateDailyCost(shuttle))}</TableCell>
              <TableCell className="py-2.5">{formatCurrency(calculateMonthlyCost(shuttle))}</TableCell>
              <TableCell className="py-2.5">
                <span className={getEfficiencyColor(shuttle.efficiency)}>
                  {formatPercent(shuttle.efficiency)}
                </span>
              </TableCell>
              <TableCell className="py-2.5">
                {formatPercent(calculateUtilization(shuttle.usageDays))}
              </TableCell>
              <TableCell className="py-2.5">
                <Badge className={getStatusColor(shuttle.status)}>
                  {shuttle.status}
                </Badge>
              </TableCell>
              <TableCell className="py-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShuttleSelect(shuttle)}
                >
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <tbody aria-hidden="true" className="table-row h-2"></tbody>
        <TableFooter className="bg-transparent">
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={4} className="font-medium">Totals</TableCell>
            <TableCell>{formatCurrency(totalDailyCost)}</TableCell>
            <TableCell>{formatCurrency(totalMonthlyCost)}</TableCell>
            <TableCell colSpan={2}>{`Avg. Efficiency: ${formatPercent(averageEfficiency)}`}</TableCell>
            <TableCell colSpan={2}></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

ShuttleTable.propTypes = {
  filteredShuttleData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      model: PropTypes.string.isRequired,
      usageDays: PropTypes.number.isRequired,
      costPerDay: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      efficiency: PropTypes.number.isRequired,
    })
  ).isRequired,
  handleShuttleSelect: PropTypes.func.isRequired,
  calculateMonthlyCost: PropTypes.func.isRequired,
  selectedShuttle: PropTypes.object,
};
