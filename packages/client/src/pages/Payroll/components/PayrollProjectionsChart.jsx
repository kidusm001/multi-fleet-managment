import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Common/UI/Card";
import { payrollService } from "@/services/payrollService";
import { formatCurrency } from "@/utils/formatters";

export function PayrollProjectionsChart() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get the current month and year for projections
        const now = new Date();
        const currentMonth = now.toLocaleString('default', { month: 'short' });
        const currentYear = now.getFullYear();

        // Get 12 months of historical data
        const historical = await payrollService.getHistoricalPayrollData(12);
        
        // Get 6 months of projections starting from current month
        const projections = await payrollService.getFutureProjections(currentMonth, currentYear, 6);
        
        // Combine historical and projected data
        const combinedData = [
          ...historical.map(h => ({
            month: h.month,
            actual: h.totalExpenses,
            maintenance: h.maintenance,
            utilization: h.fleetUtilization,
            projected: null,
            confidence: null
          })),
          ...projections.map(p => ({
            month: p.month,
            actual: null,
            projected: p.projectedPayment,
            projectedMaintenance: p.projectedMaintenance,
            projectedUtilization: p.projectedUtilization,
            confidence: p.confidence
          }))
        ];
        
        setData(combinedData);
      } catch (error) {
        console.error("Error loading projection data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isProjected = payload[0].payload.projected !== null;
      
      return (
        <div className="bg-white p-4 rounded shadow-lg border">
          <p className="font-bold mb-2">{label}</p>
          {isProjected ? (
            <>
              <p>Projected Amount: {formatCurrency(payload[0].payload.projected)}</p>
              <p>Projected Maintenance: {formatCurrency(payload[0].payload.projectedMaintenance)}</p>
              <p>Projected Utilization: {payload[0].payload.projectedUtilization.toFixed(1)}%</p>
              <p className="text-gray-500">Confidence: {payload[0].payload.confidence}%</p>
            </>
          ) : (
            <>
              <p>Actual Amount: {formatCurrency(payload[0].payload.actual)}</p>
              <p>Maintenance: {formatCurrency(payload[0].payload.maintenance)}</p>
              <p>Fleet Utilization: {payload[0].payload.utilization.toFixed(1)}%</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div>Loading projections...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Trends & Projections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="actual"
                stroke="#8884d8"
                name="Historical Data"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="projected"
                stroke="#82ca9d"
                name="Projected"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="utilization"
                stroke="#ffc658"
                name="Fleet Utilization %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
