import { Decimal } from '@prisma/client/runtime/library';

// KPI Dimension Types
export interface DepartmentKPIs {
  departmentId: string;
  departmentName: string;
  costPerEmployee: number;
  budgetVariance: number;
  utilizationRate: number;
  peakDemand: number;
  totalCost: number;
  employeeCount: number;
}

export interface ShiftKPIs {
  shiftId: string;
  shiftName: string;
  costPerHour: number;
  overtimePercentage: number;
  employeeCount: number;
  routeComplexity: number;
  avgHoursWorked: number;
  totalCost: number;
}

export interface DateTimeKPIs {
  date: Date;
  dailyCostTrend: number;
  seasonalPattern: string;
  weekendPremium: number;
  holidayCosts: number;
  avgDailyCost: number;
  isWeekend: boolean;
  isHoliday: boolean;
}

export interface RouteKPIs {
  routeId: string;
  routeName: string;
  costPerKm: number;
  costPerStop: number;
  distanceEfficiency: number;
  timeUtilization: number;
  totalDistance: number;
  totalStops: number;
  totalCost: number;
}

export interface VehicleCategoryKPIs {
  categoryId: string;
  categoryName: string;
  costPerCapacityUnit: number;
  maintenanceCosts: number;
  fuelEfficiency: number;
  vehicleCount: number;
  avgCapacity: number;
  totalCost: number;
}

export interface LocationKPIs {
  locationId: string;
  locationName: string;
  costPerPickupArea: number;
  geographicDistribution: number;
  demandDensity: number;
  pickupCount: number;
  totalCost: number;
}

// Aggregated KPI Dashboard
export interface PayrollKPIDashboard {
  period: string;
  startDate: Date;
  endDate: Date;
  organizationId: string;
  
  // Summary metrics
  totalCost: number;
  totalEmployees: number;
  totalVehicles: number;
  avgCostPerEmployee: number;
  
  // Dimension breakdowns
  departmentKPIs: DepartmentKPIs[];
  shiftKPIs: ShiftKPIs[];
  dateTimeKPIs: DateTimeKPIs[];
  routeKPIs: RouteKPIs[];
  vehicleCategoryKPIs: VehicleCategoryKPIs[];
  locationKPIs: LocationKPIs[];
  
  // Top insights
  topCostDepartment: DepartmentKPIs | null;
  highestOvertimeShift: ShiftKPIs | null;
  mostEfficientRoute: RouteKPIs | null;
  leastEfficientVehicleCategory: VehicleCategoryKPIs | null;
}

// Filter options for KPI queries
export interface KPIFilters {
  organizationId: string;
  startDate: Date;
  endDate: Date;
  departmentIds?: string[];
  vehicleIds?: string[];
  driverIds?: string[];
  routeIds?: string[];
  categoryIds?: string[];
}

// Trend data for time series
export interface KPITrend {
  date: Date;
  value: number;
  change: number;
  changePercentage: number;
}

// Comparison data
export interface KPIComparison {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}
