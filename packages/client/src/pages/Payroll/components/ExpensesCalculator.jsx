import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Calculator, AlertTriangle, Plus, Trash2, Info } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Common/UI/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/Common/UI/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/Common/UI/Tabs";
import { Label } from "@/components/Common/UI/Label";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { useTheme } from "@/contexts/ThemeContext";
import { payrollService } from "@/services/payrollService";

export function ExpensesCalculator({ shuttleData, selectedMonth }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // State for calculator inputs
  const [selectedTab, _setSelectedTab] = useState("projection");
  const [numShuttles, setNumShuttles] = useState(1);
  const [shuttleType, setShuttleType] = useState("Owned");
  const [daysPerMonth, setDaysPerMonth] = useState(22);
  const [fuelPrice, setFuelPrice] = useState(35); // ETB per liter
  const [maintenanceLevel, setMaintenanceLevel] = useState(1); // 1=Low, 2=Medium, 3=High
  const [routeDistance, setRouteDistance] = useState(50); // km
  const [calculationResults, setCalculationResults] = useState({
    monthlyBaseCost: 0,
    maintenanceCost: 0,
    fuelCost: 0,
    insuranceCost: 0,
    otherCosts: 0,
    totalMonthlyCost: 0,
    costPerDay: 0,
    costPerShuttlePerDay: 0,
    quarterlyProjection: 0,
    annualProjection: 0,
    costPerKm: 0,
    utilizationRate: 0
  });
  
  const [optimizationResults, setOptimizationResults] = useState({
    currentSetup: {
      shuttleType: "",
      shuttleCount: 0,
      dailyRate: 0,
      daysPerMonth: 0,
      totalCost: 0
    },
    alternateTypeOptimization: {
      shuttleType: "",
      shuttleCount: 0,
      dailyRate: 0,
      daysPerMonth: 0,
      totalCost: 0,
      savings: 0,
      savingsPercent: 0
    },
    daysOptimization: {
      shuttleType: "",
      shuttleCount: 0,
      dailyRate: 0,
      daysPerMonth: 0,
      totalCost: 0,
      savings: 0,
      savingsPercent: 0
    },
    shuttleCountOptimization: {
      shuttleType: "",
      shuttleCount: 0,
      dailyRate: 0,
      daysPerMonth: 0,
      totalCost: 0,
      savings: 0,
      savingsPercent: 0
    },
    fuelOptimization: {
      totalFuelCost: 0,
      potentialSavings: 0,
      savingsPercent: 0
    }
  });
  
  const [customExpenses, setCustomExpenses] = useState([]);
  const [selectedShuttleId, setSelectedShuttleId] = useState("");
  const [shuttleSpecificExpenses, setShuttleSpecificExpenses] = useState({});
  const [showTips, setShowTips] = useState(false);
  const [selectedExpenseType, setSelectedExpenseType] = useState("general");
  const [isLoading, setIsLoading] = useState(false);

  // Average cost values from shuttleData
  const avgOwnedRate = getAverageCostPerDay("Owned", shuttleData);
  const avgOutsourcedRate = getAverageCostPerDay("Outsourced", shuttleData);
  
  // Get average cost per day for a shuttle type
  function getAverageCostPerDay(type, data) {
    const filtered = data.filter(shuttle => shuttle.type === type);
    if (filtered.length === 0) return type === "Owned" ? 2800 : 3200;
    
    return Math.round(filtered.reduce((sum, s) => sum + s.costPerDay, 0) / filtered.length);
  }

  const calculateOptimization = useCallback(() => {
    // Current setup costs
    const currentDailyRate = shuttleType === "Owned" ? avgOwnedRate : avgOutsourcedRate;
    const currentMonthlyTotal = currentDailyRate * numShuttles * daysPerMonth;
    
    // Optimization calculations
    const alternateType = shuttleType === "Owned" ? "Outsourced" : "Owned";
    const alternateDailyRate = alternateType === "Owned" ? avgOwnedRate : avgOutsourcedRate;
    const alternateMonthlyTotal = alternateDailyRate * numShuttles * daysPerMonth;
    
    // Calculate optimal days per month (scaled between 15-22)
    const optimalDays = Math.max(15, Math.round(daysPerMonth * 0.85));
    const daysOptimizedTotal = currentDailyRate * numShuttles * optimalDays;
    
    // Calculate fuel optimization (5-15% based on route planning)
    const fuelCostPerShuttle = estimateFuelCost(routeDistance, daysPerMonth, fuelPrice);
    const fuelOptimization = fuelCostPerShuttle * numShuttles * 0.1; // 10% optimization
    
    // Calculate the optimal shuttle count
    const optimalShuttleCount = Math.max(1, Math.ceil(numShuttles * 0.9));
    const shuttleCountOptimizedTotal = currentDailyRate * optimalShuttleCount * daysPerMonth;
    
    setOptimizationResults({
      currentSetup: {
        shuttleType,
        shuttleCount: numShuttles,
        dailyRate: currentDailyRate,
        daysPerMonth,
        totalCost: currentMonthlyTotal,
      },
      alternateTypeOptimization: {
        shuttleType: alternateType,
        shuttleCount: numShuttles,
        dailyRate: alternateDailyRate,
        daysPerMonth,
        totalCost: alternateMonthlyTotal,
        savings: currentMonthlyTotal - alternateMonthlyTotal,
        savingsPercent: ((currentMonthlyTotal - alternateMonthlyTotal) / currentMonthlyTotal) * 100,
      },
      daysOptimization: {
        shuttleType,
        shuttleCount: numShuttles,
        dailyRate: currentDailyRate,
        daysPerMonth: optimalDays,
        totalCost: daysOptimizedTotal,
        savings: currentMonthlyTotal - daysOptimizedTotal,
        savingsPercent: ((currentMonthlyTotal - daysOptimizedTotal) / currentMonthlyTotal) * 100,
      },
      shuttleCountOptimization: {
        shuttleType,
        shuttleCount: optimalShuttleCount,
        dailyRate: currentDailyRate,
        daysPerMonth,
        totalCost: shuttleCountOptimizedTotal,
        savings: currentMonthlyTotal - shuttleCountOptimizedTotal,
        savingsPercent: ((currentMonthlyTotal - shuttleCountOptimizedTotal) / currentMonthlyTotal) * 100,
      },
      fuelOptimization: {
        totalFuelCost: fuelCostPerShuttle * numShuttles,
        potentialSavings: fuelOptimization,
        savingsPercent: 10,
      }
    });
  }, [avgOwnedRate, avgOutsourcedRate, daysPerMonth, fuelPrice, numShuttles, routeDistance, shuttleType]);
  
  const calculateExpenseProjection = useCallback(() => {
    const baseDailyRate = shuttleType === "Owned" ? avgOwnedRate : avgOutsourcedRate;
    const monthlyBaseCost = baseDailyRate * numShuttles * daysPerMonth;
    
    // Calculate maintenance costs based on level
    const maintenanceFactors = [0.08, 0.12, 0.2]; // 8%, 12%, or 20% of base costs
    const maintenanceCost = monthlyBaseCost * maintenanceFactors[maintenanceLevel - 1];
    
    // Calculate fuel costs
    const fuelCost = estimateFuelCost(routeDistance, daysPerMonth, fuelPrice) * numShuttles;
    
    // Calculate insurance cost
    const insuranceCostPerShuttle = shuttleType === "Owned" ? 5000 : 6000;
    const insuranceCost = (insuranceCostPerShuttle / 30) * daysPerMonth * numShuttles;
    
    // Calculate other costs
    const otherCosts = monthlyBaseCost * 0.05; // 5% for misc expenses
    
    // Total cost
    const totalCost = monthlyBaseCost + maintenanceCost + fuelCost + insuranceCost + otherCosts;
    
    // Calculate per day and per shuttle metrics
    const costPerDay = totalCost / daysPerMonth;
    const costPerShuttlePerDay = costPerDay / numShuttles;
    
    // Set quarterly and annual projections with slight increases
    const quarterlyProjection = totalCost * 3 * 1.03; // 3 months with 3% increase
    const annualProjection = totalCost * 12 * 1.05; // 12 months with 5% increase
    
    setCalculationResults({
      baseRate: baseDailyRate,
      totalShuttles: numShuttles,
      daysPerMonth,
      monthlyBaseCost,
      maintenanceCost,
      fuelCost,
      insuranceCost,
      otherCosts,
      totalMonthlyCost: totalCost,
      costPerDay,
      costPerShuttlePerDay,
      quarterlyProjection,
      annualProjection,
      costPerKm: totalCost / (routeDistance * daysPerMonth * numShuttles)
    });
  }, [avgOwnedRate, avgOutsourcedRate, daysPerMonth, fuelPrice, maintenanceLevel, numShuttles, routeDistance, shuttleType]);
  
  function estimateFuelCost(distance, days, pricePerLiter) {
    // Assume average 8 km/liter for a shuttle
    const averageFuelEfficiency = 8;
    const litersPerDay = distance / averageFuelEfficiency;
    return Math.round(litersPerDay * pricePerLiter * days);
  }
  
  // Calculate stats when inputs change
  useEffect(() => {
    if (selectedTab === "projection") {
      calculateExpenseProjection();
    } else if (selectedTab === "optimization") {
      calculateOptimization();
    }
  }, [selectedTab, calculateExpenseProjection, calculateOptimization]);
  
  

  const handleAddCustomExpense = () => {
    const newExpense = {
      id: Date.now(),
      name: "",
      amount: 0,
      frequency: "monthly", // monthly, one-time
      category: "other", // maintenance, fuel, insurance, other
      shuttleId: selectedExpenseType === "shuttle-specific" ? selectedShuttleId : "all"
    };
    setCustomExpenses([...customExpenses, newExpense]);
  };

  const handleUpdateCustomExpense = (id, field, value) => {
    setCustomExpenses(customExpenses.map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    ));
  };

  const handleDeleteCustomExpense = (id) => {
    setCustomExpenses(customExpenses.filter(expense => expense.id !== id));
  };

  // Calculate total custom expenses
  const calculateTotalCustomExpenses = useCallback(() => {
    return customExpenses.reduce((total, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return total + amount;
    }, 0);
  }, [customExpenses]);

  // Add custom expenses to the total calculation
  useEffect(() => {
    setCalculationResults(prev => {
      const totalCustom = calculateTotalCustomExpenses();
      const newTotalMonthlyCost = prev.monthlyBaseCost + 
        prev.maintenanceCost + 
        prev.fuelCost + 
        prev.insuranceCost + 
        prev.otherCosts +
        totalCustom;

      return {
        ...prev,
        customExpenses: totalCustom,
        totalMonthlyCost: newTotalMonthlyCost
      };
    });
  }, [calculateTotalCustomExpenses]);

  const costOptimizationTips = [
    {
      category: "Fuel",
      tips: [
        "Implement route optimization to reduce total distance traveled",
        "Provide eco-driving training to drivers",
        "Regular maintenance for better fuel efficiency",
        "Monitor and penalize excessive idling"
      ]
    },
    {
      category: "Maintenance",
      tips: [
        "Schedule preventive maintenance",
        "Build relationships with reliable service providers",
        "Keep detailed maintenance records",
        "Consider bulk parts purchasing"
      ]
    },
    {
      category: "Insurance",
      tips: [
        "Bundle multiple vehicles for better rates",
        "Maintain good safety records",
        "Install security devices",
        "Review and compare providers annually"
      ]
    }
  ];

  const calculateWithBackend = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentYear = new Date().getFullYear();
      
      // Get actual expense calculations from backend
      const projections = await payrollService.getFutureProjections(
        selectedMonth,
        currentYear,
        3 // Get 3 months projection
      );

      // Update calculations with real data if available
      if (projections && projections.length > 0) {
        const latestProjection = projections[0];
        setCalculationResults(prev => ({
          ...prev,
          monthlyBaseCost: latestProjection.projectedPayment || prev.monthlyBaseCost,
          maintenanceCost: latestProjection.projectedMaintenance || prev.maintenanceCost,
          utilizationRate: latestProjection.projectedUtilization || prev.utilizationRate
        }));
      }

      // Get optimization suggestions from backend
      const distribution = await payrollService.getPayrollDistribution(selectedMonth, currentYear);
      if (distribution) {
        const totalCost = (distribution.ownedShuttles || 0) + (distribution.outsourcedShuttles || 0);
        setOptimizationResults(prev => ({
          ...prev,
          currentSetup: {
            ...prev.currentSetup,
            totalCost: totalCost || prev.currentSetup.totalCost
          }
        }));
      }
    } catch (error) {
      console.error('Error calculating with backend:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  // Call backend calculation when component mounts
  useEffect(() => {
    calculateWithBackend();
  }, [calculateWithBackend]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <Calculator className="h-4 w-4" />
          Expenses Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-w-4xl h-[90vh] overflow-y-auto ${
        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white'
      } backdrop-blur-sm`}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Shuttle Expenses Calculator
          </DialogTitle>
          <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Calculate and optimize your shuttle expenses. Use this tool to project costs and find optimization opportunities.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-gray-500">Loading calculations...</div>
          </div>
        ) : (
          <Tabs defaultValue="projection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="projection">Cost Projection</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
              <TabsTrigger value="custom">Custom Expenses</TabsTrigger>
            </TabsList>

            <TabsContent value="projection">
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numShuttles">Number of Shuttles</Label>
                    <Input
                      id="numShuttles"
                      type="number"
                      min="1"
                      value={numShuttles}
                      onChange={(e) => setNumShuttles(Math.max(1, parseInt(e.target.value) || 1))}
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shuttleType">Shuttle Type</Label>
                    <Select value={shuttleType} onValueChange={setShuttleType}>
                      <SelectTrigger id="shuttleType" className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owned">Owned</SelectItem>
                        <SelectItem value="Outsourced">Outsourced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daysPerMonth">Working Days/Month</Label>
                    <Input
                      id="daysPerMonth"
                      type="number"
                      min="1"
                      max="31"
                      value={daysPerMonth}
                      onChange={(e) => setDaysPerMonth(Math.min(31, Math.max(1, parseInt(e.target.value) || 22)))}
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuelPrice">Fuel Price (ETB/L)</Label>
                    <Input
                      id="fuelPrice"
                      type="number"
                      min="1"
                      value={fuelPrice}
                      onChange={(e) => setFuelPrice(Math.max(1, parseFloat(e.target.value) || 35))}
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceLevel">Maintenance Level</Label>
                    <Select value={maintenanceLevel} onValueChange={setMaintenanceLevel}>
                      <SelectTrigger id="maintenanceLevel" className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={1}>Low</SelectItem>
                        <SelectItem value={2}>Medium</SelectItem>
                        <SelectItem value={3}>High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routeDistance">Avg Route Distance (km/day)</Label>
                    <Input
                      id="routeDistance"
                      type="number"
                      min="1"
                      value={routeDistance}
                      onChange={(e) => setRouteDistance(Math.max(1, parseInt(e.target.value) || 50))}
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                </div>
                
                {calculationResults && (
                  <div className="mt-6 space-y-4">
                    <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Expense Projection for {selectedMonth}
                    </h4>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Base Costs:</div>
                      <div className={`font-medium text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(calculationResults.monthlyBaseCost)}
                      </div>
                      
                      <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Maintenance:</div>
                      <div className={`font-medium text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(calculationResults.maintenanceCost)}
                      </div>
                      
                      <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Fuel:</div>
                      <div className={`font-medium text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(calculationResults.fuelCost)}
                      </div>
                      
                      <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Insurance:</div>
                      <div className={`font-medium text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(calculationResults.insuranceCost)}
                      </div>
                      
                      <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>Other:</div>
                      <div className={`font-medium text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(calculationResults.otherCosts)}
                      </div>
                      
                      <div className={`font-medium pt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Monthly Total:</div>
                      <div className={`font-bold text-right pt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(calculationResults.totalMonthlyCost)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <Card className={isDark ? 'bg-gray-700 border-gray-600' : ''}>
                        <CardContent className="p-3">
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cost per Day</div>
                          <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(calculationResults.costPerDay)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className={isDark ? 'bg-gray-700 border-gray-600' : ''}>
                        <CardContent className="p-3">
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cost per Shuttle/Day</div>
                          <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(calculationResults.costPerShuttlePerDay)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Quarterly Projection</div>
                        <div className="text-lg font-bold">{formatCurrency(calculationResults.quarterlyProjection)}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Annual Projection</div>
                        <div className="text-lg font-bold">{formatCurrency(calculationResults.annualProjection)}</div>
                      </div>
                    </div>
                    
                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500">Cost per Kilometer</div>
                      <div className="text-lg font-bold">{formatCurrency(calculationResults.costPerKm)}</div>
                    </div>
                  </div>
                )}

                {/* Add Specific Shuttle Expenses Section */}
                <div className="col-span-2 space-y-2">
                  <Label>Specific Shuttle</Label>
                  <Select value={selectedShuttleId} onValueChange={setSelectedShuttleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shuttle" />
                    </SelectTrigger>
                    <SelectContent>
                      {shuttleData.map(shuttle => (
                        <SelectItem key={shuttle.id} value={shuttle.id}>
                          {shuttle.id} - {shuttle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedShuttleId && (
                    <Card className="mt-2">
                      <CardHeader>
                        <CardTitle className="text-sm">Shuttle-Specific Expenses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Input
                            type="number"
                            placeholder="Additional maintenance cost"
                            value={shuttleSpecificExpenses[selectedShuttleId]?.maintenance || ""}
                            onChange={(e) => setShuttleSpecificExpenses(prev => ({
                              ...prev,
                              [selectedShuttleId]: {
                                ...prev[selectedShuttleId],
                                maintenance: parseFloat(e.target.value) || 0
                              }
                            }))}
                          />
                          {/* Add more shuttle-specific expense fields as needed */}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="optimization">
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numShuttles">Current Shuttles</Label>
                    <Input
                      id="numShuttles"
                      type="number"
                      min="1"
                      value={numShuttles}
                      onChange={(e) => setNumShuttles(Math.max(1, parseInt(e.target.value) || 1))}
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shuttleType">Current Type</Label>
                    <Select value={shuttleType} onValueChange={setShuttleType}>
                      <SelectTrigger id="shuttleType" className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Owned">Owned</SelectItem>
                        <SelectItem value="Outsourced">Outsourced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daysPerMonth">Current Working Days</Label>
                    <Input
                      id="daysPerMonth"
                      type="number"
                      min="1"
                      max="31"
                      value={daysPerMonth}
                      onChange={(e) => setDaysPerMonth(Math.min(31, Math.max(1, parseInt(e.target.value) || 22)))}
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routeDistance">Avg Route Distance (km)</Label>
                    <Input
                      id="routeDistance"
                      type="number"
                      min="1"
                      value={routeDistance}
                      onChange={(e) => setRouteDistance(Math.max(1, parseInt(e.target.value) || 50))}
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                </div>
                
                {optimizationResults && (
                  <div className="mt-6 space-y-4">
                    <Card className={isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'}>
                      <CardContent className="p-3">
                        <div className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          Current Monthly Cost ({optimizationResults.currentSetup.shuttleType}, {optimizationResults.currentSetup.shuttleCount} shuttles)
                        </div>
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(optimizationResults.currentSetup.totalCost)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="space-y-3">
                      <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Potential Optimizations
                      </h4>
                      
                      <div className="border rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Shuttle Type Optimization</div>
                            <div className="text-sm text-gray-500">Switch to {optimizationResults.alternateTypeOptimization.shuttleType} shuttles</div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-bold">{formatCurrency(optimizationResults.alternateTypeOptimization.savings)}</div>
                            <div className="text-xs text-green-600">{formatPercent(optimizationResults.alternateTypeOptimization.savingsPercent)} savings</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Working Days Optimization</div>
                            <div className="text-sm text-gray-500">Reduce to {optimizationResults.daysOptimization.daysPerMonth} days/month</div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-bold">{formatCurrency(optimizationResults.daysOptimization.savings)}</div>
                            <div className="text-xs text-green-600">{formatPercent(optimizationResults.daysOptimization.savingsPercent)} savings</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Fleet Size Optimization</div>
                            <div className="text-sm text-gray-500">Reduce to {optimizationResults.shuttleCountOptimization.shuttleCount} shuttles</div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-bold">{formatCurrency(optimizationResults.shuttleCountOptimization.savings)}</div>
                            <div className="text-xs text-green-600">{formatPercent(optimizationResults.shuttleCountOptimization.savingsPercent)} savings</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Fuel Optimization</div>
                            <div className="text-sm text-gray-500">Optimize routes & driver training</div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-bold">{formatCurrency(optimizationResults.fuelOptimization.potentialSavings)}</div>
                            <div className="text-xs text-green-600">{formatPercent(optimizationResults.fuelOptimization.savingsPercent)} savings</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Cost Optimization Tips */}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowTips(!showTips)}
                >
                  <Info className="h-4 w-4 mr-2" />
                  {showTips ? "Hide Optimization Tips" : "Show Optimization Tips"}
                </Button>
                
                {showTips && (
                  <div className="space-y-4 mt-4">
                    {costOptimizationTips.map((section) => (
                      <Card key={section.category}>
                        <CardHeader>
                          <CardTitle className="text-sm">{section.category} Optimization Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-4 space-y-2">
                            {section.tips.map((tip, index) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-400">{tip}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="custom">
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Custom Expenses</Label>
                  <Select value={selectedExpenseType} onValueChange={setSelectedExpenseType}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select expense type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Expenses</SelectItem>
                      <SelectItem value="shuttle-specific">Shuttle-Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedExpenseType === "shuttle-specific" && (
                  <Select value={selectedShuttleId} onValueChange={setSelectedShuttleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shuttle" />
                    </SelectTrigger>
                    <SelectContent>
                      {shuttleData.map(shuttle => (
                        <SelectItem key={shuttle.id} value={shuttle.id}>
                          {shuttle.id} - {shuttle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button onClick={handleAddCustomExpense} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Expense
                </Button>

                <div className="space-y-4">
                  {customExpenses.map((expense) => (
                    <Card key={expense.id}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Expense Name</Label>
                            <Input
                              value={expense.name}
                              onChange={(e) => handleUpdateCustomExpense(expense.id, "name", e.target.value)}
                              placeholder="Enter expense name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Amount (ETB)</Label>
                            <Input
                              type="number"
                              value={expense.amount}
                              onChange={(e) => handleUpdateCustomExpense(expense.id, "amount", e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                              value={expense.category}
                              onValueChange={(value) => handleUpdateCustomExpense(expense.id, "category", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="fuel">Fuel</SelectItem>
                                <SelectItem value="insurance">Insurance</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select
                              value={expense.frequency}
                              onValueChange={(value) => handleUpdateCustomExpense(expense.id, "frequency", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="one-time">One-time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-4"
                          onClick={() => handleDeleteCustomExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {customExpenses.length > 0 && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Total Custom Expenses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(calculateTotalCustomExpenses())}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'}>
                      <CardHeader>
                        <CardTitle>Final Monthly Total</CardTitle>
                        <CardDescription>Including all expenses</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="text-sm text-gray-500">Base Monthly Total:</div>
                          <div className="text-right font-medium">
                            {formatCurrency(calculationResults.totalMonthlyCost - (calculationResults.customExpenses || 0))}
                          </div>
                          <div className="text-sm text-gray-500">Custom Expenses:</div>
                          <div className="text-right font-medium">
                            {formatCurrency(calculationResults.customExpenses || 0)}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-right border-t pt-2">
                          {formatCurrency(calculationResults.totalMonthlyCost)}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-between pt-4 border-t">
          <div className="flex items-center text-xs text-gray-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Estimates based on data from {selectedMonth}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

ExpensesCalculator.propTypes = {
  shuttleData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      costPerDay: PropTypes.number.isRequired,
      usageDays: PropTypes.number.isRequired,
    })
  ).isRequired,
  selectedMonth: PropTypes.string.isRequired,
};