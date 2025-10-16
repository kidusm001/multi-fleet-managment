import PropTypes from "prop-types";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/Common/UI/Card";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isEstimated = payload[0].payload.estimated;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{label} 2025</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Total Payroll: <span className="font-medium text-gray-900 dark:text-gray-100">
            ETB {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
        {isEstimated && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            📊 Estimated
          </p>
        )}
        {!isEstimated && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            ✓ Actual Data
          </p>
        )}
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

export function MonthlyPayrollChart({ data }) {
  console.log("MonthlyPayrollChart data:", data);
  
  // Filter out zero values for cleaner display
  const validData = data && Array.isArray(data) ? data.filter(item => item.amount > 0) : [];
  
  // Calculate trend
  const calculateTrend = () => {
    if (validData.length < 2) return null;
    const current = validData[validData.length - 1].amount;
    const previous = validData[validData.length - 2].amount;
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      amount: Math.abs(current - previous)
    };
  };
  
  const trend = calculateTrend();
  const totalPayroll = validData.reduce((sum, item) => sum + item.amount, 0);
  const averageMonthly = validData.length > 0 ? totalPayroll / validData.length : 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Monthly Payroll Trend</CardTitle>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Historical payroll expenses over the last 6 months
            </p>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              trend.direction === 'up' 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                : trend.direction === 'down'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {trend.direction === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend.direction === 'down' && <TrendingDown className="h-4 w-4" />}
              {trend.direction === 'neutral' && <Minus className="h-4 w-4" />}
              {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{trend.percentage}%
            </div>
          )}
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">6-Month Total</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              ETB {totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Monthly Average</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              ETB {averageMonthly.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {validData.length > 0 ? (
          <div className="w-full">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={validData} margin={{ top: 20, right: 40, left: 60, bottom: 40 }}>
                <defs>
                  <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  className="text-sm"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  height={60}
                />
                <YAxis 
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  width={80}
                  tickFormatter={(value) => {
                    if (value === 0) return '0';
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return value.toLocaleString();
                  }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  formatter={(value, entry) => {
                    const { payload } = entry;
                    if (payload && payload.estimated) {
                      return <span className="text-sm">{value} (Estimated)</span>;
                    }
                    return <span className="text-sm font-medium">{value}</span>;
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="url(#colorPayroll)"
                  name="Monthly Payroll"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                >
                  {validData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.estimated ? '#94a3b8' : '#3b82f6'}
                      opacity={entry.estimated ? 0.6 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
            
            {/* Legend explanation */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 px-4 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 flex-shrink-0"></div>
                <span className="whitespace-nowrap">Actual Data</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-gray-400 opacity-60 flex-shrink-0"></div>
                <span className="whitespace-nowrap">Estimated</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[320px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No payroll history available
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Generate payroll to see monthly trends
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

MonthlyPayrollChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
    })
  ).isRequired,
};
