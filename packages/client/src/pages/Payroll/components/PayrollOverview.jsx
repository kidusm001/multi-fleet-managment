import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@components/Common/UI/Card";
import { Progress } from "@components/Common/UI/Progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Common/UI/Select";
import { Calendar, TrendingUp, DollarSign } from "lucide-react";
import PropTypes from "prop-types";
import { CalendarIcon } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/formatters";
import { ExpensesCalculator } from "./ExpensesCalculator";

export function TotalPayrollCard({
  selectedMonth,
  setSelectedMonth,
  monthlyPayrollData,
}) {
  const currentMonthData = monthlyPayrollData.find(
    (data) => data.month === selectedMonth
  ) || { amount: 0 };

  const previousMonthData = monthlyPayrollData.find(
    (data) => data.month === getPreviousMonth(selectedMonth)
  ) || { amount: 0 };

  const monthChange = calculateMonthChange(
    currentMonthData.amount,
    previousMonthData.amount
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-4">
        <CalendarIcon className="h-6 w-6 text-gray-400" />
        <div>
          <p className="text-sm text-gray-500">Total Payroll</p>
          <p className="text-2xl font-bold">
            {formatCurrency(currentMonthData.amount)}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              monthChange >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {monthChange >= 0 ? "+" : ""}{formatPercent(monthChange)}
          </span>
          <span className="text-sm text-gray-500">vs last month</span>
        </div>
      </div>
    </div>
  );
}

export function PayrollPeriodCard({ selectedMonth, shuttleData }) {
  const startDate = new Date().setDate(1);
  const endDate = new Date(new Date().setMonth(new Date().getMonth() + 1, 0));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Current Period</h3>
        <ExpensesCalculator shuttleData={shuttleData} selectedMonth={selectedMonth} />
      </div>
      <div className="grid gap-2">
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">Start Date</p>
          <p className="text-sm">{new Date(startDate).toLocaleDateString()}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">End Date</p>
          <p className="text-sm">{endDate.toLocaleDateString()}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">Period</p>
          <p className="text-sm">{selectedMonth}</p>
        </div>
      </div>
    </div>
  );
}

export function QuickStatsCard({ shuttleData }) {
  const totalShuttles = shuttleData.length;
  const activeShuttles = shuttleData.filter(
    (shuttle) => shuttle.status === "PROCESSED"
  ).length;
  const avgEfficiency = calculateAverageEfficiency(shuttleData);
  const totalPayroll = calculateTotalPayroll(shuttleData);

  return (
    <div className="p-6">
      <h3 className="font-medium">Quick Stats</h3>
      <div className="mt-4 grid gap-4">
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">Total Shuttles</p>
          <p className="text-sm font-medium">{formatNumber(totalShuttles)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">Active Shuttles</p>
          <p className="text-sm font-medium">{formatNumber(activeShuttles)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">Avg. Efficiency</p>
          <p className="text-sm font-medium">{formatPercent(avgEfficiency)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">Total Payroll</p>
          <p className="text-sm font-medium">{formatCurrency(totalPayroll)}</p>
        </div>
      </div>
    </div>
  );
}

// Utility functions
function getPreviousMonth(month) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const currentIndex = months.indexOf(month);
  return currentIndex > 0 ? months[currentIndex - 1] : months[11];
}

function calculateMonthChange(current, previous) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateAverageEfficiency(shuttleData) {
  if (shuttleData.length === 0) return 0;
  return shuttleData.reduce((sum, shuttle) => sum + shuttle.efficiency, 0) / shuttleData.length;
}

function calculateTotalPayroll(shuttleData) {
  return shuttleData.reduce((sum, shuttle) => {
    return sum + (shuttle.usageDays * shuttle.costPerDay);
  }, 0);
}

TotalPayrollCard.propTypes = {
  selectedMonth: PropTypes.string.isRequired,
  setSelectedMonth: PropTypes.func.isRequired,
  monthlyPayrollData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
    })
  ).isRequired,
}

PayrollPeriodCard.propTypes = {
  selectedMonth: PropTypes.string.isRequired,
  shuttleData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      costPerDay: PropTypes.number.isRequired,
      usageDays: PropTypes.number.isRequired,
    })
  ).isRequired,
}

QuickStatsCard.propTypes = {
  shuttleData: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      costPerDay: PropTypes.number.isRequired,
    })
  ).isRequired,
}
