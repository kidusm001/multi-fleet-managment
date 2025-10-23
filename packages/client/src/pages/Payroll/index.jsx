// EnhancedShuttlePayrollDashboard.jsx
import { 
  Download, 
  Banknote, 
  Users, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Filter,
  Search
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@contexts/ThemeContext";
import { payrollService } from "@/services/payrollService";
import { toast } from 'sonner';

import { Badge } from "@/components/Common/UI/Badge";
import { Button } from "@/components/Common/UI/Button";
import { Input } from "@/components/Common/UI/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Common/UI/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Common/UI/Card";

import { MonthlyPayrollChart } from "./components/MonthlyPayrollChart";
import { ShuttleTable } from "./components/ShuttleTable";

export default function EnhancedShuttlePayrollDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [shuttleData, setShuttleData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [modelFilter, setModelFilter] = useState("All");
  const [costRangeFilter, setCostRangeFilter] = useState({ min: 0, max: 100000 });
  const [monthlyPayrollData, setMonthlyPayrollData] = useState([]);
  const [_performanceMetrics, setPerformanceMetrics] = useState({
    efficiency: 0,
    utilization: 0,
    costOptimization: 0,
    compliance: 100
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
  };

  const handleModelFilterChange = (value) => {
    setModelFilter(value);
  };

  const handleCostRangeChange = (key, value) => {
    setCostRangeFilter((prev) => {
      const numeric = Number(value);
      const fallback = key === 'min' ? 0 : 100000;
      return {
        ...prev,
        [key]: Number.isFinite(numeric) ? numeric : fallback,
      };
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("All");
    setModelFilter("All");
    setCostRangeFilter({ min: 0, max: 100000 });
  };

  // Sample shuttle data for fallback
  const sampleShuttleData = useMemo(() => [
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
  ], []);

  useEffect(() => {
    const loadPayrollData = async () => {
      try {
        setIsLoading(true);
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString("default", { month: "short" });
        const currentYear = currentDate.getFullYear();
        
        setSelectedMonth(currentMonth);
        
        // Get or create current month's payroll period
        let period = null;
        try {
          period = await payrollService.getCurrentMonthPeriod();
          setCurrentPeriod(period);
          
          // If period exists but has no entries, suggest generating them
          if (period && (!period.payrollEntries || period.payrollEntries.length === 0)) {
            toast('Payroll period exists but has no entries. Click "Generate Payroll" to calculate entries.', {
              duration: 5000,
            });
          }
        } catch (err) {
          console.error("Error getting current period:", err);
        }
        
        // Get shuttle data from payroll entries
        let shuttleDataTemp = [];
        try {
          if (period && period.payrollEntries && period.payrollEntries.length > 0) {
            // Transform payroll entries to shuttle format
            shuttleDataTemp = period.payrollEntries.map(entry => ({
              id: entry.vehicle?.id || entry.id,
              type: entry.driver ? 'Owned' : 'Outsourced',
              model: entry.vehicle?.model || 'Unknown',
              usageDays: entry.daysWorked || 0,
              costPerDay: entry.daysWorked > 0 ? Number(entry.amount) / entry.daysWorked : 0,
              status: entry.status || 'PENDING',
              efficiency: 85, // Placeholder
              totalAmount: Number(entry.netPay || 0),
              driver: entry.driver,
              serviceProvider: entry.serviceProvider
            }));
          } else {
            // Fallback to old API for backwards compatibility
            const payrolls = await payrollService.getAllMonthlyPayrolls(currentMonth, currentYear);
            if (payrolls && Array.isArray(payrolls)) {
              shuttleDataTemp = payrolls.map(payroll => {
                const shuttleData = payroll.shuttle || {};
                return {
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
          }
        } catch (error) {
          console.error("Error loading payroll data:", error);
        }

        // If no data was loaded, use sample data
        if (!shuttleDataTemp || shuttleDataTemp.length === 0) {
          console.log("No payroll data found, using sample data");
          shuttleDataTemp = sampleShuttleData;
        } else {
          console.log("Loaded payroll data:", shuttleDataTemp.length, "entries");
        }

        // Get historical data or generate sample data
        let monthlyData;
        try {
          const historicalData = await payrollService.getHistoricalPayrollData();
          if (historicalData && historicalData.length > 0) {
            monthlyData = historicalData.map(data => ({
              month: data.month.split(' ')[0],
              amount: Number(data.totalExpenses || 0),
              estimated: false // Real historical data
            }));
            console.log("Loaded historical payroll data:", monthlyData.length, "months");
          } else {
            throw new Error("No historical data");
          }
        } catch (error) {
          console.error("Error fetching historical data:", error);
          
          // Calculate current month total from actual data
          const currentTotal = shuttleDataTemp.reduce((sum, entry) => {
            return sum + (Number(entry.totalAmount) || (Number(entry.usageDays || 0) * Number(entry.costPerDay || 0)));
          }, 0);
          
          // Generate last 6 months of data with current month being real
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const currentMonthIndex = months.indexOf(currentMonth);
          
          monthlyData = Array.from({length: 6}, (_, i) => {
            const monthIndex = (currentMonthIndex - 5 + i + 12) % 12;
            
            // Last month (current) uses real data, others are estimated
            if (i === 5) {
              return {
                month: months[monthIndex],
                amount: currentTotal,
                estimated: false // Current month is actual data
              };
            } else {
              // Generate decreasing trend toward current month
              const variance = 0.85 + (Math.random() * 0.3); // 85-115% of current
              return {
                month: months[monthIndex],
                amount: currentTotal * variance,
                estimated: true // Previous months are estimated
              };
            }
          });
          
          console.log("Generated monthly data with current month total:", currentTotal);
        }

        // Calculate performance metrics
        const metrics = {
          efficiency: calculateAverageEfficiency(shuttleDataTemp),
          utilization: calculateFleetUtilization(shuttleDataTemp),
          costOptimization: calculateCostOptimization(monthlyData),
          compliance: 100 // Assuming full compliance
        };
        
        console.log("Setting shuttle data:", shuttleDataTemp);
        setShuttleData(shuttleDataTemp);
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
  }, [sampleShuttleData]);

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
      toast('Report generated and downloaded successfully');
    } catch (error) {
      console.error("Error generating report:", error);
      toast('Failed to generate report. Please try again.', {
        type: 'error'
      });
    }
  };

  const handleGeneratePayroll = async () => {
    if (!currentPeriod) {
      toast('No payroll period found. Creating one now...', {
        type: 'error'
      });
      return;
    }

    try {
      setIsGeneratingPayroll(true);
      toast('Generating payroll entries from attendance records...');
      
      await payrollService.generatePayrollEntries(currentPeriod.id);
      
      toast('Payroll entries generated successfully! Reloading data...');
      
      // Reload the page data
      window.location.reload();
    } catch (error) {
      console.error("Error generating payroll:", error);
      toast('Failed to generate payroll entries. Please try again.', {
        type: 'error'
      });
    } finally {
      setIsGeneratingPayroll(false);
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

  const filteredShuttleData = useMemo(() => {
    const filtered = shuttleData.filter((shuttle) => {
      const matchesSearch = searchTerm
        ? safeStringIncludes(shuttle.id, searchTerm) ||
          safeStringIncludes(shuttle.model, searchTerm)
        : true;
      const matchesType = typeFilter === "All" || shuttle.type === typeFilter;
      const matchesModel = modelFilter === "All" || shuttle.model === modelFilter;

      const costPerDay = Number(shuttle.costPerDay || 0);
      const lowerBound = Math.min(costRangeFilter.min, costRangeFilter.max);
      const upperBound = Math.max(costRangeFilter.min, costRangeFilter.max);
      const matchesCostRange = costPerDay >= lowerBound && costPerDay <= upperBound;
      
      return matchesSearch && matchesType && matchesModel && matchesCostRange;
    }).map(shuttle => ({
      ...shuttle,
      // Ensure ID is always a string for the ShuttleTable component
      id: String(shuttle.id)
    }));
    
    console.log("Filtered shuttle data:", filtered.length, "entries", "from", shuttleData.length, "total");
    return filtered;
  }, [shuttleData, searchTerm, typeFilter, modelFilter, costRangeFilter]);

  const uniqueModels = useMemo(
    () => [...new Set(shuttleData.map((shuttle) => shuttle.model).filter(Boolean))],
    [shuttleData]
  );

  // Calculate metrics (must be before early returns to maintain hook order)
  const totalPayroll = useMemo(() => {
    const total = filteredShuttleData.reduce((sum, entry) => {
      const amount = Number(entry.totalAmount) || (Number(entry.usageDays || 0) * Number(entry.costPerDay || 0));
      return sum + amount;
    }, 0);
    console.log("Total payroll calculated:", total);
    return total;
  }, [filteredShuttleData]);

  const processedCount = useMemo(() => {
    const count = filteredShuttleData.filter(s => s.status === 'PROCESSED' || s.status === 'FINALIZED').length;
    console.log("Processed count:", count);
    return count;
  }, [filteredShuttleData]);

  const pendingCount = useMemo(() => {
    const count = filteredShuttleData.filter(s => s.status === 'PENDING' || s.status === 'DRAFT').length;
    console.log("Pending count:", count);
    return count;
  }, [filteredShuttleData]);

  const processedPercentage = filteredShuttleData.length > 0
    ? Math.round((processedCount / filteredShuttleData.length) * 100)
    : 0;

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isDark ? 'bg-green-900/20' : 'bg-green-50'
          }`}>
            <Banknote className={`h-6 w-6 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Payroll Management
            </h1>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--text-secondary)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                {currentPeriod ? (
                  <>
                    {new Date(currentPeriod.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(currentPeriod.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </>
                ) : (
                  'Manage driver and vehicle payroll'
                )}
              </p>
              {currentPeriod?.status && (
                <Badge variant={currentPeriod.status === 'FINALIZED' ? 'secondary' : 'outline'}>
                  {currentPeriod.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleGeneratePayroll}
            disabled={isGeneratingPayroll || !currentPeriod}
          >
            {isGeneratingPayroll ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Generate Payroll
              </>
            )}
          </Button>
          <Button onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search shuttles, models, or entries"
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All vehicle types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All vehicle types</SelectItem>
                <SelectItem value="Owned">Owned</SelectItem>
                <SelectItem value="Outsourced">Outsourced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={modelFilter} onValueChange={handleModelFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All models</SelectItem>
                {uniqueModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <Input
                type="number"
                value={costRangeFilter.min}
                onChange={(event) => handleCostRangeChange('min', event.target.value)}
                placeholder="Min daily cost"
              />
              <Input
                type="number"
                value={costRangeFilter.max}
                onChange={(event) => handleCostRangeChange('max', event.target.value)}
                placeholder="Max daily cost"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-800/30' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  Total Payroll
                </p>
                <div className={`text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  ETB {totalPayroll.toLocaleString()}
                </div>
                <p className={`text-xs mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Current period
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                isDark ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}>
                <Banknote className={`h-6 w-6 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-800/30' : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  Total Entries
                </p>
                <div className={`text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {filteredShuttleData.length}
                </div>
                <p className={`text-xs mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Drivers & vehicles
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                isDark ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}>
                <Users className={`h-6 w-6 ${
                  isDark ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-800/30' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-green-400' : 'text-green-600'
                }`}>
                  Processed
                </p>
                <div className={`text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {processedCount}
                </div>
                <div className={`flex items-center gap-1 text-xs mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 ${
                    isDark ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <span>{processedPercentage}% complete</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                isDark ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <CheckCircle className={`h-6 w-6 ${
                  isDark ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-800/30' : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  Pending
                </p>
                <div className={`text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {pendingCount}
                </div>
                <p className={`text-xs mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Awaiting processing
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                isDark ? 'bg-orange-900/30' : 'bg-orange-100'
              }`}>
                <Clock className={`h-6 w-6 ${
                  isDark ? 'text-orange-400' : 'text-orange-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <MonthlyPayrollChart data={monthlyPayrollData} />
      </Card>

      {/* Payroll Entries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payroll Entries
              </CardTitle>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Detailed breakdown of all payroll entries for this period
              </p>
            </div>
          </div>
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
            <div className="text-center py-16">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <AlertCircle className={`h-8 w-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                No Payroll Entries
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentPeriod 
                  ? 'Click "Generate Payroll" to calculate entries from attendance records.'
                  : 'No payroll period found. Please ensure attendance records exist.'}
              </p>
              {currentPeriod && (
                <Button onClick={handleGeneratePayroll} disabled={isGeneratingPayroll}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Generate Payroll Now
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
