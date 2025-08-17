// EnhancedShuttlePayrollDashboard.jsx
import { Download, Activity, Award, Target, Zap, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@contexts/ThemeContext";
import { payrollService } from "@/services/payrollService";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { useToast } from "@/components/Common/UI/use-toast";

import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@/components/Common/UI/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Common/UI/Card";

import {
  QuickMetricCard,
  AlertsCard,
  TimelineCard,
} from "./components/DashboardComponents";
import { MonthlyPayrollChart } from "./components/MonthlyPayrollChart";
import { PayrollDistributionChart } from "./components/PayrollDistributionChart";
import { PayrollFilters } from "./components/PayrollFilters";
import {
  TotalPayrollCard,
  PayrollPeriodCard,
  QuickStatsCard,
} from "./components/PayrollOverview";
import { PayrollProjectionsChart } from "./components/PayrollProjectionsChart";
import { ShuttleAnalysis } from "./components/ShuttleAnalysis";
import { ShuttleTable } from "./components/ShuttleTable";

export default function EnhancedShuttlePayrollDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [shuttleData, setShuttleData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [modelFilter, setModelFilter] = useState("All");
  const [costRangeFilter, setCostRangeFilter] = useState([2000, 4000]); // Updated to realistic ETB range
  const [payrollDistributionData, setPayrollDistributionData] = useState([]);
  const [monthlyPayrollData, setMonthlyPayrollData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    efficiency: 0,
    utilization: 0,
    costOptimization: 0,
    compliance: 100
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample shuttle data for fallback
  const sampleShuttleData = [
    {
      id: "SH001",
      type: "Owned",
      model: "Toyota Hiace",
      usageDays: 18,
      costPerDay: 2500,  // Updated to ETB
      status: "PROCESSED",
      efficiency: 92,
    },
    {
      id: "SH002",
      type: "Outsourced",
      model: "Mercedes Sprinter",
      usageDays: 22,
      costPerDay: 3200,  // Updated to ETB
      status: "PROCESSED",
      efficiency: 88,
    },
    {
      id: "SH003",
      type: "Owned",
      model: "Ford Transit",
      usageDays: 15,
      costPerDay: 2800,  // Updated to ETB
      status: "PENDING",
      efficiency: 75,
    },
    {
      id: "SH004",
      type: "Outsourced",
      model: "Hyundai Starex",
      usageDays: 20,
      costPerDay: 3000,  // Updated to ETB
      status: "PROCESSED",
      efficiency: 95,
    },
  ];

  useEffect(() => {
    const loadPayrollData = async () => {
      try {
        setIsLoading(true);
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString("default", { month: "short" });
        const currentYear = currentDate.getFullYear();
        
        setSelectedMonth(currentMonth);
        
        // Get current month's payroll data
        let shuttleDataTemp = [];
        try {
          const payrolls = await payrollService.getAllMonthlyPayrolls(currentMonth, currentYear);
          console.log("API Response:", payrolls); // Debug log
          
          // Transform API response into expected format
          if (payrolls && Array.isArray(payrolls)) {
            shuttleDataTemp = payrolls.map(payroll => {
              // First try to get data from the nested shuttle object
              const shuttleData = payroll.shuttle || {};
              return {
                // Ensure ID is always a string
                id: String(shuttleData.id || payroll.id || `SH${Math.random().toString(36).substr(2, 5)}`),
                type: (shuttleData.type === 'in-house' || payroll.type === 'in-house') ? 'Owned' : 'Outsourced',
                model: shuttleData.model || payroll.model || 'Unknown Model',
                usageDays: parseInt(payroll.workedDays || shuttleData.workedDays || 0),
                costPerDay: parseFloat(payroll.dailyRate || shuttleData.dailyRate || 0),
                status: payroll.status || shuttleData.status || 'PENDING',
                efficiency: parseInt(payroll.efficiency || shuttleData.efficiency || 75)
              };
            });
          }
          console.log("Transformed data:", shuttleDataTemp); // Debug log
        } catch (error) {
          console.error("Error loading payroll data:", error);
        }

        // If no data was loaded, use sample data
        if (!shuttleDataTemp || shuttleDataTemp.length === 0) {
          console.log("Using sample data");
          shuttleDataTemp = sampleShuttleData;
        }

        // Get payroll distribution data or calculate it from sample data
        let distributionData;
        try {
          const distribution = await payrollService.getPayrollDistribution(currentMonth, currentYear);
          distributionData = [
            { name: "Owned Shuttles", value: Number(distribution.ownedShuttles || 0) },
            { name: "Outsourced Shuttles", value: Number(distribution.outsourcedShuttles || 0) },
            { name: "Maintenance", value: Number(distribution.maintenance || 0) },
            { name: "Other Expenses", value: Number(distribution.other || 0) }
          ];
        } catch (error) {
          console.error("Error fetching distribution data:", error);
          // Calculate from sample data
          const ownedCost = shuttleDataTemp
            .filter(s => s.type === 'Owned')
            .reduce((sum, s) => sum + (s.costPerDay * s.usageDays), 0);
          
          const outsourcedCost = shuttleDataTemp
            .filter(s => s.type === 'Outsourced')
            .reduce((sum, s) => sum + (s.costPerDay * s.usageDays), 0);
          
          const maintenanceCost = shuttleDataTemp.reduce((sum, s) => {
            const dailyMaintenance = s.type === 'Owned' ? 15 : 20;
            return sum + (dailyMaintenance * s.usageDays);
          }, 0);
          
          const otherExpenses = shuttleDataTemp.reduce((sum, s) => {
            const insurance = s.type === 'Owned' ? 200 : 250;
            const other = s.usageDays * 10;
            return sum + insurance + other;
          }, 0);
          
          distributionData = [
            { name: "Owned Shuttles", value: ownedCost },
            { name: "Outsourced Shuttles", value: outsourcedCost },
            { name: "Maintenance", value: maintenanceCost },
            { name: "Other Expenses", value: otherExpenses }
          ];
        }

        // Get historical data or generate sample data
        let monthlyData;
        try {
          const historicalData = await payrollService.getHistoricalPayrollData();
          monthlyData = historicalData.map(data => ({
            month: data.month.split(' ')[0],
            amount: data.totalExpenses
          }));
        } catch (error) {
          console.error("Error fetching historical data:", error);
          // Generate sample monthly data
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const currentMonthIndex = months.indexOf(currentMonth);
          
          monthlyData = Array.from({length: 6}, (_, i) => {
            const monthIndex = (currentMonthIndex - 5 + i + 12) % 12;
            const baseAmount = 50000 + (Math.random() * 10000);
            const trendFactor = 1 + (i * 0.05); // Increasing trend
            
            return {
              month: months[monthIndex],
              amount: baseAmount * trendFactor
            };
          });
        }

        // Calculate performance metrics
        const metrics = {
          efficiency: calculateAverageEfficiency(shuttleDataTemp),
          utilization: calculateFleetUtilization(shuttleDataTemp),
          costOptimization: calculateCostOptimization(monthlyData),
          compliance: 100 // Assuming full compliance
        };
        
        console.log("Setting shuttle data:", shuttleDataTemp); // Debug log
        setShuttleData(shuttleDataTemp);
        setPayrollDistributionData(distributionData);
        setMonthlyPayrollData(monthlyData);
        setPerformanceMetrics(metrics);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in payroll dashboard:", error);
        setError("Failed to load payroll data. Please try again later.");
        // Use sample data as fallback
        const formattedSampleData = sampleShuttleData.map(sample => ({
          ...sample,
          // Ensure ID is always a string
          id: String(sample.id),
          type: sample.type || 'Owned',
          costPerDay: parseFloat(sample.costPerDay || 0),
          usageDays: parseInt(sample.usageDays || 0),
          efficiency: parseInt(sample.efficiency || 75)
        }));
        setShuttleData(formattedSampleData);
        setIsLoading(false);
      }
    };

    loadPayrollData();
  }, []);

  const calculateAverageEfficiency = (shuttles) => {
    if (shuttles.length === 0) return 0;
    const total = shuttles.reduce((sum, s) => sum + s.efficiency, 0);
    return Math.round(total / shuttles.length);
  };

  const calculateFleetUtilization = (shuttles) => {
    if (shuttles.length === 0) return 0;
    const totalWorkDays = shuttles.reduce((sum, s) => sum + s.usageDays, 0);
    const avgWorkDays = totalWorkDays / shuttles.length;
    return Math.round((avgWorkDays / 22) * 100); // 22 working days in a month
  };

  const calculateCostOptimization = (monthlyData) => {
    if (monthlyData.length < 2) return 50; // Default value
    
    // Calculate cost trend over last months
    const latest = monthlyData[monthlyData.length - 1].amount;
    const previous = monthlyData[monthlyData.length - 2].amount;
    
    // If costs are decreasing, that's good
    const improvement = ((previous - latest) / previous) * 100;
    return Math.round(Math.max(0, Math.min(100, 50 + improvement))); // Base 50% + improvement
  };

  const calculateMonthlyCost = (shuttle) => {
    return parseFloat((shuttle.usageDays * shuttle.costPerDay).toFixed(2));
  };

  const generateReport = async () => {
    try {
      const currentYear = new Date().getFullYear();
      await payrollService.generateReport(selectedMonth, currentYear);
      toast({
        title: "Success",
        description: "Report generated and downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const safeStringIncludes = (str, searchStr) => {
    if (typeof str !== 'string') {
      str = String(str || '');
    }
    if (typeof searchStr !== 'string') {
      searchStr = String(searchStr || '');
    }
    return str.toLowerCase().includes(searchStr.toLowerCase());
  };

  const filteredShuttleData = shuttleData.filter((shuttle) => {
    const matchesSearch = searchTerm
      ? safeStringIncludes(shuttle.id, searchTerm) ||
        safeStringIncludes(shuttle.model, searchTerm)
      : true;
    const matchesType = typeFilter === "All" || shuttle.type === typeFilter;
    const matchesModel = modelFilter === "All" || shuttle.model === modelFilter;
    const matchesCostRange =
      shuttle.costPerDay >= costRangeFilter[0] &&
      shuttle.costPerDay <= costRangeFilter[1];
    return matchesSearch && matchesType && matchesModel && matchesCostRange;
  }).map(shuttle => ({
    ...shuttle,
    // Ensure ID is always a string for the ShuttleTable component
    id: String(shuttle.id)
  }));

  const uniqueModels = [...new Set(shuttleData.map((shuttle) => shuttle.model))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading payroll data...</p>
      </div>
    );
  }

  if (error && shuttleData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-slate-900/50' : 'bg-gray-50/50'
    } transition-colors duration-300`}>
      <main className="mx-auto max-w-7xl p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-3xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Shuttle Payroll Overview</h1>
              <Badge variant={isDark ? 'default' : 'secondary'} 
                className={isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'}>
                HRD Private Access
              </Badge>
            </div>
            <p className={`mt-2 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Financial period: {selectedMonth} 1 - {selectedMonth} 30, {new Date().getFullYear()}
            </p>
          </div>
          <div>
            <Button
              className={`gap-2 ${
                isDark 
                  ? 'bg-blue-500/80 hover:bg-blue-600/80' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
              onClick={generateReport}
            >
              <Download className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className={`${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white'
          } backdrop-blur-sm`}>
            <TotalPayrollCard
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              monthlyPayrollData={monthlyPayrollData}
            />
          </Card>
          <Card className={`${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white'
          } backdrop-blur-sm`}>
            <PayrollPeriodCard selectedMonth={selectedMonth} shuttleData={shuttleData} />
          </Card>
          <Card className={`${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white'
          } backdrop-blur-sm`}>
            <QuickStatsCard shuttleData={shuttleData} />
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className={`${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white'
          } backdrop-blur-sm col-span-2`}>
            <MonthlyPayrollChart data={monthlyPayrollData} />
          </Card>
          <Card className={`${
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white'
          } backdrop-blur-sm`}>
            <PayrollDistributionChart data={payrollDistributionData} />
          </Card>
        </div>

        <div className="mt-6">
          <PayrollProjectionsChart />
        </div>

        <Card className={`mt-6 ${
          isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white'
        } backdrop-blur-sm`}>
          <CardHeader>
            <CardTitle>Shuttle Payroll Details</CardTitle>
            <PayrollFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              modelFilter={modelFilter}
              setModelFilter={setModelFilter}
              costRangeFilter={costRangeFilter}
              setCostRangeFilter={setCostRangeFilter}
              uniqueModels={uniqueModels}
            />
          </CardHeader>
          <CardContent>
            {filteredShuttleData && filteredShuttleData.length > 0 ? (
              <ShuttleTable
                filteredShuttleData={filteredShuttleData}
                handleShuttleSelect={setSelectedShuttle}
                calculateMonthlyCost={calculateMonthlyCost}
                selectedShuttle={selectedShuttle}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm || typeFilter !== "All" || modelFilter !== "All"
                    ? "No shuttle data matches your filters"
                    : "No shuttle data available"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedShuttle && (
          <ShuttleAnalysis
            selectedShuttle={selectedShuttle}
            calculateMonthlyCost={calculateMonthlyCost}
            onClose={() => setSelectedShuttle(null)}
          />
        )}
      </main>
    </div>
  );
}
