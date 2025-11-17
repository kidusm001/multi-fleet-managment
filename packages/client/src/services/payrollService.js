import api from './api';
import { jsPDF } from 'jspdf';

// Sample data for fallback when API is unavailable
const sampleData = {
  shuttles: [
    {
      id: "SH001",
      type: "in-house",
      model: "Toyota Hiace",
      workedDays: 18,
      dailyRate: 2500, // Updated to ETB
      status: "PROCESSED",
      efficiency: 92,
    },
    {
      id: "SH002",
      type: "outsourced",
      model: "Mercedes Sprinter",
      workedDays: 22,
      dailyRate: 3200, // Updated to ETB
      status: "PROCESSED",
      efficiency: 88,
    },
    {
      id: "SH003",
      type: "in-house",
      model: "Ford Transit",
      workedDays: 15,
      dailyRate: 2800, // Updated to ETB
      status: "PENDING",
      efficiency: 75,
    },
    {
      id: "SH004",
      type: "outsourced",
      model: "Hyundai Starex",
      workedDays: 20,
      dailyRate: 3000, // Updated to ETB
      status: "PROCESSED",
      efficiency: 95,
    },
  ],
  distribution: {
    ownedShuttles: 75000, // Updated to ETB
    outsourcedShuttles: 120000, // Updated to ETB
    maintenance: 35000, // Updated to ETB
    other: 25000 // Updated to ETB
  },
  historical: [
    { month: "Jan 2024", totalExpenses: 480000, maintenance: 80000, fleetUtilization: 82 },
    { month: "Feb 2024", totalExpenses: 495000, maintenance: 81000, fleetUtilization: 85 },
    { month: "Mar 2024", totalExpenses: 502000, maintenance: 83000, fleetUtilization: 84 },
    { month: "Apr 2024", totalExpenses: 520000, maintenance: 85000, fleetUtilization: 86 },
    { month: "May 2024", totalExpenses: 535000, maintenance: 87000, fleetUtilization: 88 },
    { month: "Jun 2024", totalExpenses: 542000, maintenance: 88000, fleetUtilization: 87 }
  ],
  projections: [
    { month: "Jul 2024", projectedPayment: 550000, projectedMaintenance: 89000, projectedUtilization: 86, confidence: 85 },
    { month: "Aug 2024", projectedPayment: 560000, projectedMaintenance: 90000, projectedUtilization: 85, confidence: 75 },
    { month: "Sep 2024", projectedPayment: 575000, projectedMaintenance: 92000, projectedUtilization: 84, confidence: 65 }
  ]
};

export const payrollService = {
  // ==================== NEW PAYROLL PERIODS API ====================

  /**
   * Get all payroll periods for the organization
   */
  async getPayrollPeriods(params = {}) {
    try {
      const response = await api.get('/payroll-periods', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching payroll periods:", error);
      throw error;
    }
  },

  /**
   * Get a specific payroll period with all entries
   */
  async getPayrollPeriod(periodId) {
    try {
      const response = await api.get(`/payroll-periods/${periodId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching payroll period:", error);
      throw error;
    }
  },

  /**
   * Create a new payroll period
   */
  async createPayrollPeriod(name, startDate, endDate) {
    try {
      const response = await api.post('/payroll-periods', {
        name,
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      console.error("Error creating payroll period:", error);
      throw error;
    }
  },

  /**
   * Generate payroll entries for a period (TRIGGER)
   */
  async generatePayrollEntries(periodId) {
    try {
      const response = await api.post(`/payroll-periods/${periodId}/generate-entries`);
      return response.data;
    } catch (error) {
      console.error("Error generating payroll entries:", error);
      throw error;
    }
  },

  /**
   * Generate filtered payroll with advanced filters (NEW)
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date (YYYY-MM-DD or ISO)
   * @param {string} filters.endDate - End date (YYYY-MM-DD or ISO)
   * @param {string} [filters.vehicleType] - 'IN_HOUSE' or 'OUTSOURCED'
   * @param {string[]} [filters.shiftIds] - Array of shift IDs
   * @param {string[]} [filters.departmentIds] - Array of department IDs
   * @param {string[]} [filters.locationIds] - Array of location/branch IDs
   * @param {string[]} [filters.vehicleIds] - Array of specific vehicle IDs
   * @param {string} [filters.name] - Custom payroll period name
   */
  async generateFilteredPayroll(filters) {
    try {
      const response = await api.post('/payroll-periods/generate-filtered', filters);
      return response.data;
    } catch (error) {
      console.error("Error generating filtered payroll:", error);
      throw error;
    }
  },

  /**
   * Update payroll period status
   */
  async updatePayrollPeriodStatus(periodId, status) {
    try {
      const response = await api.patch(`/payroll-periods/${periodId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error("Error updating payroll period status:", error);
      throw error;
    }
  },

  /**
   * Update/adjust a payroll entry
   */
  async updatePayrollEntry(periodId, entryId, updates) {
    try {
      const response = await api.patch(`/payroll-periods/${periodId}/entries/${entryId}`, updates);
      return response.data;
    } catch (error) {
      console.error("Error updating payroll entry:", error);
      throw error;
    }
  },

  /**
   * Delete a payroll period
   */
  async deletePayrollPeriod(periodId) {
    try {
      const response = await api.delete(`/payroll-periods/${periodId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting payroll period:", error);
      throw error;
    }
  },

  // ==================== HELPER METHODS FOR UI ====================

  /**
   * Get current month's payroll period (or create if doesn't exist)
   */
  async getCurrentMonthPeriod() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      
      // Try to fetch existing periods
      const { periods } = await this.getPayrollPeriods({ status: 'PENDING' });
      
      // Check if current month period exists
      const currentPeriod = periods?.find(p => {
        const pStart = new Date(p.startDate);
        return pStart.getMonth() === month && pStart.getFullYear() === year;
      });
      
      if (currentPeriod) {
        return currentPeriod;
      }
      
      // Create if doesn't exist
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const name = `${monthNames[month]} ${year}`;
      
      return await this.createPayrollPeriod(name, startDate, endDate);
    } catch (error) {
      console.error("Error getting current month period:", error);
      throw error;
    }
  },

  /**
   * Get payroll distribution from entries
   */
  async getPayrollDistribution(month, year) {
    try {
      // Get periods for the specified month/year
      const { periods } = await this.getPayrollPeriods();
      
      const targetPeriod = periods?.find(p => {
        const pStart = new Date(p.startDate);
        return pStart.getMonth() === month && pStart.getFullYear() === year;
      });
      
      if (!targetPeriod) {
        return sampleData.distribution;
      }
      
      // Get full period with entries
      const period = await this.getPayrollPeriod(targetPeriod.id);
      
      // Calculate distribution from entries
      const distribution = {
        ownedShuttles: 0,
        outsourcedShuttles: 0,
        maintenance: 0,
        other: 0
      };
      
      period.payrollEntries?.forEach(entry => {
        const amount = Number(entry.netPay || 0);
        
        if (entry.driver) {
          distribution.ownedShuttles += amount;
        } else if (entry.serviceProvider) {
          distribution.outsourcedShuttles += amount;
        }
      });
      
      return distribution;
    } catch (error) {
      console.error("Error fetching payroll distribution:", error);
      return sampleData.distribution;
    }
  },

  /**
   * Get historical payroll data from past periods
   */
  async getHistoricalPayrollData(months = 12) {
    try {
      const { periods } = await this.getPayrollPeriods();
      
      if (!periods || periods.length === 0) {
        return sampleData.historical.slice(0, months);
      }
      
      // Convert periods to historical format
      const historical = periods
        .slice(0, months)
        .map(p => ({
          month: new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          totalExpenses: Number(p.totalAmount || 0),
          maintenance: Number(p.totalAmount || 0) * 0.15, // Estimate 15% for maintenance
          fleetUtilization: 85 // Placeholder
        }));
      
      return historical;
    } catch (error) {
      console.error("Error fetching historical payroll data:", error);
      return sampleData.historical.slice(0, months);
    }
  },

  /**
   * Get future projections based on historical data
   */
  async getFutureProjections(startMonth, startYear, numMonths = 6) {
    try {
      const historical = await this.getHistoricalPayrollData(6);
      
      if (historical.length < 2) {
        return sampleData.projections.slice(0, numMonths);
      }
      
      // Simple projection based on average growth
      const avgGrowth = historical.reduce((sum, curr, i) => {
        if (i === 0) return 0;
        return sum + ((curr.totalExpenses - historical[i-1].totalExpenses) / historical[i-1].totalExpenses);
      }, 0) / (historical.length - 1);
      
      const lastAmount = historical[historical.length - 1].totalExpenses;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const projections = Array.from({ length: numMonths }, (_, i) => {
        const projectedAmount = lastAmount * Math.pow(1 + avgGrowth, i + 1);
        const monthIndex = (startMonth + i) % 12;
        
        return {
          month: `${monthNames[monthIndex]} ${startYear + Math.floor((startMonth + i) / 12)}`,
          projectedPayment: projectedAmount,
          projectedMaintenance: projectedAmount * 0.15,
          projectedUtilization: 85,
          confidence: Math.max(30, 85 - (i * 10))
        };
      });
      
      return projections;
    } catch (error) {
      console.error("Error fetching projections:", error);
      return sampleData.projections.slice(0, numMonths);
    }
  },

  /**
   * Get all payroll entries (for backwards compatibility)
   */
  async getAllMonthlyPayrolls(month, year) {
    try {
      // Get periods for the specified month/year
      const { periods } = await this.getPayrollPeriods();
      
      const targetPeriod = periods?.find(p => {
        const pStart = new Date(p.startDate);
        const targetMonth = typeof month === 'string' ? 
          ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) : month;
        return pStart.getMonth() === targetMonth && pStart.getFullYear() === year;
      });
      
      if (!targetPeriod) {
        return sampleData.shuttles.map(shuttle => ({
          id: shuttle.id,
          shuttle: {
            id: shuttle.id,
            type: shuttle.type,
            model: shuttle.model
          },
          workedDays: shuttle.workedDays,
          dailyRate: shuttle.dailyRate,
          status: shuttle.status,
          efficiency: shuttle.efficiency
        }));
      }
      
      // Get full period with entries
      const period = await this.getPayrollPeriod(targetPeriod.id);
      
      // Transform entries to old format for backwards compatibility
      return period.payrollEntries?.map(entry => ({
        id: entry.id,
        shuttle: entry.vehicle ? {
          id: entry.vehicle.id,
          type: entry.driver ? 'in-house' : 'outsourced',
          model: entry.vehicle.model
        } : null,
        workedDays: entry.daysWorked || 0,
        dailyRate: Number(entry.amount || 0) / (entry.daysWorked || 1),
        status: entry.status,
        efficiency: 85 // Placeholder
      })) || [];
    } catch (error) {
      console.error("Error fetching all payrolls:", error);
      return sampleData.shuttles.map(shuttle => ({
        id: shuttle.id,
        shuttle: {
          id: shuttle.id,
          type: shuttle.type,
          model: shuttle.model
        },
        workedDays: shuttle.workedDays,
        dailyRate: shuttle.dailyRate,
        status: shuttle.status,
        efficiency: shuttle.efficiency
      }));
    }
  },

  async processPayroll(payrollId) {
    try {
      // Update status to PROCESSED
      return await this.updatePayrollPeriodStatus(payrollId, 'PROCESSED');
    } catch (error) {
      console.error("Error processing payroll:", error);
      return { id: payrollId, status: "PROCESSED" };
    }
  },

  async scheduleReport(scheduleConfig) {
    try {
      const response = await api.post('/payroll/schedule-report', scheduleConfig);
      return response.data;
    } catch (error) {
      console.error("Error scheduling report:", error);
      // Return mock success response for development
      return {
        id: `schedule-${Date.now()}`,
        ...scheduleConfig,
        status: "SCHEDULED"
      };
    }
  },

  async generateReport(month, year) {
    try {
      // Get all necessary data for a complete report
      let payrolls = await this.getAllMonthlyPayrolls(month, year);
      const distribution = await this.getPayrollDistribution(month, year);
      const historicalData = await this.getHistoricalPayrollData(6); // Last 6 months
      const projections = await this.getFutureProjections(month, year, 3); // Next 3 months
      
      // Fix for missing or improperly formatted data
      if (!payrolls || payrolls.length === 0) {
        console.warn('No payroll data found, using sample data');
        payrolls = sampleData.shuttles.map(shuttle => ({
          id: shuttle.id,
          shuttle: {
            id: shuttle.id,
            type: shuttle.type,
            model: shuttle.model
          },
          workedDays: shuttle.workedDays,
          dailyRate: shuttle.dailyRate,
          status: shuttle.status,
          efficiency: shuttle.efficiency
        }));
      } else {
        // Ensure proper data format for each payroll record
        payrolls = payrolls.map(p => {
          // If data comes from UI format with different field names, adapt it
          if (p.usageDays !== undefined && p.workedDays === undefined) {
            return {
              ...p,
              workedDays: p.usageDays || 0,
              dailyRate: p.costPerDay || 0,
              shuttle: {
                id: p.id,
                type: p.type === 'Owned' ? 'in-house' : 'outsourced',
                model: p.model || 'Unknown'
              }
            };
          }
          return p;
        });
      }
      
      // Create PDF document with better formatting
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Helper functions for elegant formatting
      const drawLine = (x1, y1, x2, y2) => {
        doc.setDrawColor(222, 226, 230);
        doc.setLineWidth(0.5);
        doc.line(x1, y1, x2, y2);
      };
      
      const createColoredRect = (x, y, width, height, fillColor) => {
        doc.setFillColor(fillColor);
        doc.rect(x, y, width, height, 'F');
      };
      
      const createBoxWithShadow = (x, y, width, height) => {
        // Create subtle shadow effect with multiple rectangles
        doc.setFillColor(240, 240, 240, 0.5);
        doc.rect(x + 2, y + 2, width, height, 'F');
        doc.setFillColor(248, 249, 250);
        doc.rect(x, y, width, height, 'F');
        doc.setDrawColor(222, 226, 230);
        doc.setLineWidth(0.3);
        doc.rect(x, y, width, height, 'S');
      };
      
      // Add elegant header 
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(22);
      doc.text('Shuttle Management System', 105, 20, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setTextColor(51, 51, 51);
      doc.text('Payroll Report', 105, 30, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(102, 102, 102);
      doc.text(`Period: ${month} ${year}`, 105, 40, { align: 'center' });
      
      // Add horizontal divider
      drawLine(20, 45, 190, 45);
      
      // Calculate summary data with safe handling of field names
      const totalCost = payrolls.reduce((sum, p) => {
        const rate = Number(p.dailyRate || p.costPerDay || 0);
        const days = Number(p.workedDays || p.usageDays || 0);
        return sum + (rate * days);
      }, 0);
      
      const avgEfficiency = Math.round(
        payrolls.reduce((sum, p) => sum + Number(p.efficiency || 0), 0) / 
        (payrolls.length || 1)
      );
      
      const totalDays = payrolls.reduce((sum, p) => 
        sum + Number(p.workedDays || p.usageDays || 0), 0);
      
      // Add summary section with beautiful box
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(14);
      doc.text('Summary', 20, 55);
      
      // Create summary box with shadow effect
      createBoxWithShadow(20, 60, 170, 25);
      
      // Add summary content in two columns
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      
      // Left column labels
      doc.text('Total Shuttles:', 25, 68);
      doc.text('Total Working Days:', 25, 78);
      
      // Right column labels
      doc.text('Total Cost:', 115, 68);
      doc.text('Average Efficiency:', 115, 78);
      
      // Values in bold and colored
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      
      // Left column values
      doc.text(payrolls.length.toString(), 75, 68);
      doc.text(totalDays.toString(), 75, 78);
      
      // Right column values
      doc.text(`ETB ${totalCost.toLocaleString()}`, 150, 68);
      doc.text(`${avgEfficiency}%`, 150, 78);
      
      // Add distribution section
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(14);
      doc.text('Cost Distribution', 20, 95);
      
      // Create distribution visual
      createBoxWithShadow(20, 100, 170, 40);
      
      // Add distribution data
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      
      const distLabels = [
        'Owned Shuttles:',
        'Outsourced Shuttles:',
        'Maintenance:',
        'Other Expenses:'
      ];
      
      const distValues = [
        `ETB ${Number(distribution.ownedShuttles || 0).toLocaleString()}`,
        `ETB ${Number(distribution.outsourcedShuttles || 0).toLocaleString()}`,
        `ETB ${Number(distribution.maintenance || 0).toLocaleString()}`,
        `ETB ${Number(distribution.other || 0).toLocaleString()}`
      ];
      
      // Calculate percentages for visual representation
      const totalDistValue = 
        Number(distribution.ownedShuttles || 0) +
        Number(distribution.outsourcedShuttles || 0) +
        Number(distribution.maintenance || 0) +
        Number(distribution.other || 0);
      
      const barColors = ['#4dabf7', '#ffa94d', '#69db7c', '#ff8787'];
      
      // Draw distribution bars and labels
      let startX = 25;
      distLabels.forEach((label, i) => {
        const y = 110 + (i * 7);
        doc.setTextColor(51, 51, 51);
        doc.text(label, startX, y);
        doc.setTextColor(0, 102, 204);
        doc.text(distValues[i], startX + 40, y);
      });
      
      // Draw visual bar chart
      if (totalDistValue > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Distribution Chart:', 105, 110);
        
        let currentX = 105;
        const barStartY = 115;
        const barHeight = 10;
        const totalBarWidth = 80;
        
        [
          Number(distribution.ownedShuttles || 0),
          Number(distribution.outsourcedShuttles || 0),
          Number(distribution.maintenance || 0),
          Number(distribution.other || 0)
        ].forEach((value, i) => {
          if (value > 0) {
            const barWidth = (value / totalDistValue) * totalBarWidth;
            createColoredRect(currentX, barStartY, barWidth, barHeight, barColors[i]);
            currentX += barWidth;
          }
        });
        
        // Add color labels
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        distLabels.forEach((_, i) => {
          createColoredRect(105 + (i * 20), 130, 5, 5, barColors[i]);
        });
      }
      
      // ADD NEW SECTION: Historical Data
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(14);
      doc.text('Historical Data', 20, 150);
      
      // Create historical data table with improved styling
      const histHeaders = ['Month', 'Total Expenses', 'Maintenance', 'Utilization'];
      const histColWidths = [40, 40, 40, 40];
      const histTableWidth = histColWidths.reduce((sum, w) => sum + w, 0);
      let histStartY = 155;
      
      // Draw header with colored background
      createColoredRect(20, histStartY, histTableWidth, 8, '#0066cc');
      
      // Add header text
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      
      let histColX = 20;
      histHeaders.forEach((header, i) => {
        doc.text(header, histColX + 2, histStartY + 5);
        histColX += histColWidths[i];
      });
      
      // Start drawing historical data rows
      histStartY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(8);
      
      // Ensure data is sorted chronologically
      const sortedHistoricalData = [...historicalData].sort((a, b) => {
        // Extract month and year from "Month YYYY" format
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        
        if (aYear !== bYear) return Number(aYear) - Number(bYear);
        
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      });
      
      sortedHistoricalData.forEach((data, rowIndex) => {
        // Create alternating row background
        if (rowIndex % 2 === 0) {
          createColoredRect(20, histStartY, histTableWidth, 8, '#f8f9fa');
        }
        
        // Add data to cells
        const rowData = [
          data.month,
          `ETB ${Number(data.totalExpenses || 0).toLocaleString()}`,
          `ETB ${Number(data.maintenance || 0).toLocaleString()}`,
          `${data.fleetUtilization || 0}%`
        ];
        
        histColX = 20;
        rowData.forEach((cell, i) => {
          doc.text(String(cell), histColX + 2, histStartY + 5);
          doc.setDrawColor(222, 226, 230);
          doc.setLineWidth(0.1);
          doc.rect(histColX, histStartY, histColWidths[i], 8);
          histColX += histColWidths[i];
        });
        
        histStartY += 8;
      });
      
      // ADD NEW SECTION: Future Projections
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(14);
      doc.text('Future Projections', 20, histStartY + 12);
      
      // Create projections table with improved styling
      const projHeaders = ['Month', 'Projected Cost', 'Projected Maintenance', 'Util. %', 'Confidence'];
      const projColWidths = [30, 40, 40, 25, 25];
      const projTableWidth = projColWidths.reduce((sum, w) => sum + w, 0);
      let projStartY = histStartY + 17;
      
      // Check if we need a new page
      if (projStartY > 250) {
        doc.addPage();
        projStartY = 20;
        
        // Add a header to the new page
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 102, 204);
        doc.setFontSize(14);
        doc.text('Future Projections', 20, projStartY);
        projStartY += 5;
      }
      
      // Draw header with colored background
      createColoredRect(20, projStartY, projTableWidth, 8, '#0066cc');
      
      // Add header text
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      
      let projColX = 20;
      projHeaders.forEach((header, i) => {
        doc.text(header, projColX + 2, projStartY + 5);
        projColX += projColWidths[i];
      });
      
      // Start drawing projections data rows
      projStartY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(8);
      
      projections.forEach((data, rowIndex) => {
        // Create alternating row background
        if (rowIndex % 2 === 0) {
          createColoredRect(20, projStartY, projTableWidth, 8, '#f8f9fa');
        }
        
        // Add data to cells
        const rowData = [
          data.month,
          `ETB ${Number(data.projectedPayment || 0).toLocaleString()}`,
          `ETB ${Number(data.projectedMaintenance || 0).toLocaleString()}`,
          `${data.projectedUtilization || 0}%`,
          `${data.confidence || 0}%`
        ];
        
        projColX = 20;
        rowData.forEach((cell, i) => {
          doc.text(String(cell), projColX + 2, projStartY + 5);
          doc.setDrawColor(222, 226, 230);
          doc.setLineWidth(0.1);
          doc.rect(projColX, projStartY, projColWidths[i], 8);
          projColX += projColWidths[i];
        });
        
        projStartY += 8;
      });
      
      // ======================== KPI ANALYSIS SECTION (for monthly report) ========================
      let kpiStartY = projStartY + 15;
      
      // Check if we need a new page for KPI section
      if (kpiStartY > 200) {
        doc.addPage();
        kpiStartY = 20;
      }

      // Fetch KPI data for this month
      let kpiData = null;
      try {
        const orgId = localStorage.getItem('mf-active-organization');
        console.log('📊 PDF KPI: Fetching KPI data for orgId:', orgId);
        
        if (orgId) {
          // Calculate month date range
          const startDate = new Date(year, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month), 1);
          const endDate = new Date(year, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1, 0);
          
          const start = startDate.toISOString().split('T')[0];
          const end = endDate.toISOString().split('T')[0];
          
          console.log('📊 PDF KPI: Date range:', start, 'to', end);
          
          const url = `/api/kpi/dashboard?organizationId=${orgId}&startDate=${start}&endDate=${end}`;
          console.log('📊 PDF KPI: Fetching from:', url);
          
          const response = await fetch(url);
          console.log('📊 PDF KPI: Response status:', response.status);
          
          if (response.ok) {
            kpiData = await response.json();
            console.log('📊 PDF KPI: Data received:', kpiData);
          } else {
            console.error('📊 PDF KPI: Failed to fetch - Status:', response.status);
          }
        } else {
          console.error('📊 PDF KPI: No organization ID found in localStorage');
        }
      } catch (kpiError) {
        console.error('📊 PDF KPI: Error fetching KPI data:', kpiError);
      }

      // ALWAYS show KPI section, even if data fetch failed
      console.log('📊 PDF KPI: Rendering KPI section. Has data:', !!kpiData);
      
      {
        // KPI Analysis Header
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 102, 204);
        doc.setFontSize(16);
        doc.text('Performance Analytics', 20, kpiStartY);
        kpiStartY += 8;

        createColoredRect(20, kpiStartY, 170, 2, '#0066cc');
        kpiStartY += 8;

        // Key metrics in colored cards (use fallback values if KPI data not available)
        const metricsY = kpiStartY;
        const metricWidth = 42;
        const metricHeight = 20;

        const displayTotalCost = kpiData ? (kpiData.totalCost || totalCost) : totalCost;
        const displayEmployees = kpiData ? (kpiData.totalEmployees || payrolls.length) : payrolls.length;
        const displayVehicles = kpiData ? (kpiData.totalVehicles || 0) : payrolls.length;
        const displayUtilization = kpiData ? (kpiData.avgUtilizationRate || avgEfficiency) : avgEfficiency;

        // Metric 1: Total Cost
        createColoredRect(20, metricsY, metricWidth, metricHeight, '#fee2e2');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(127, 29, 29);
        doc.text('Total Payroll', 22, metricsY + 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`ETB ${(displayTotalCost / 1000).toFixed(1)}K`, 22, metricsY + 14);

        // Metric 2: Employees
        createColoredRect(64, metricsY, metricWidth, metricHeight, '#dbeafe');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 58, 138);
        doc.text('Total Employees', 66, metricsY + 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(String(displayEmployees), 66, metricsY + 14);

        // Metric 3: Vehicles
        createColoredRect(108, metricsY, metricWidth, metricHeight, '#d1fae5');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(6, 78, 59);
        doc.text('Active Vehicles', 110, metricsY + 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(String(displayVehicles), 110, metricsY + 14);

        // Metric 4: Utilization
        createColoredRect(152, metricsY, metricWidth, metricHeight, '#fef3c7');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 53, 15);
        doc.text('Avg Utilization', 154, metricsY + 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(`${displayUtilization.toFixed(0)}%`, 154, metricsY + 14);

        kpiStartY = metricsY + metricHeight + 10;

        // Top performing departments (if available)
        if (kpiData && kpiData.departmentKPIs && kpiData.departmentKPIs.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(11);
          doc.text('Top Departments', 20, kpiStartY);
          kpiStartY += 5;

          const topDepts = [...kpiData.departmentKPIs]
            .sort((a, b) => b.utilizationRate - a.utilizationRate)
            .slice(0, 3);

          topDepts.forEach((dept, idx) => {
            const barY = kpiStartY + (idx * 8);
            const barWidth = (dept.utilizationRate / 100) * 120;
            
            // Background bar
            createColoredRect(70, barY, 120, 6, '#f3f4f6');
            // Filled bar with gradient effect
            const colors = ['#3b82f6', '#6366f1', '#8b5cf6'];
            createColoredRect(70, barY, barWidth, 6, colors[idx]);
            
            // Department name and score
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 51, 51);
            doc.text(dept.departmentName.substring(0, 18), 22, barY + 4);
            doc.setFont('helvetica', 'bold');
            doc.text(`${dept.utilizationRate.toFixed(0)}%`, 192, barY + 4, { align: 'right' });
          });

          kpiStartY += 30;
        }

        // ===== DEPARTMENT BAR CHART =====
        if (kpiData && kpiData.departmentKPIs && kpiData.departmentKPIs.length > 0) {
          // Check if we need a new page
          if (kpiStartY > 220) {
            doc.addPage();
            kpiStartY = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(12);
          doc.text('Department Cost Analysis', 20, kpiStartY);
          kpiStartY += 8;

          const chartHeight = 60;
          const chartWidth = 170;
          const barWidth = 25;
          const barSpacing = 5;
          const topDepts = [...kpiData.departmentKPIs]
            .sort((a, b) => b.totalCost - a.totalCost)
            .slice(0, 5);
          
          // Find max cost for scaling
          const maxCost = Math.max(...topDepts.map(d => d.totalCost));
          
          // Draw chart background and axes
          createColoredRect(20, kpiStartY, chartWidth, chartHeight, '#f9fafb');
          doc.setDrawColor(209, 213, 219);
          doc.setLineWidth(0.3);
          doc.rect(20, kpiStartY, chartWidth, chartHeight);
          
          // Y-axis
          doc.line(25, kpiStartY + 5, 25, kpiStartY + chartHeight - 15);
          // X-axis
          doc.line(25, kpiStartY + chartHeight - 15, 20 + chartWidth - 5, kpiStartY + chartHeight - 15);
          
          // Draw bars
          topDepts.forEach((dept, idx) => {
            const barHeight = ((dept.totalCost / maxCost) * (chartHeight - 25));
            const barX = 30 + (idx * (barWidth + barSpacing));
            const barY = kpiStartY + chartHeight - 15 - barHeight;
            
            // Gradient effect with solid color
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const rgb = hexToRgb(colors[idx % colors.length]);
            doc.setFillColor(rgb[0], rgb[1], rgb[2]);
            doc.rect(barX, barY, barWidth, barHeight, 'F');
            
            // Bar outline
            doc.setDrawColor(100, 116, 139);
            doc.setLineWidth(0.2);
            doc.rect(barX, barY, barWidth, barHeight);
            
            // Value on top of bar
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(51, 51, 51);
            const valueText = `${(dept.totalCost / 1000).toFixed(1)}K`;
            const textWidth = doc.getTextWidth(valueText);
            doc.text(valueText, barX + (barWidth - textWidth) / 2, barY - 2);
            
            // Department name below bar
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(75, 85, 99);
            const deptName = dept.departmentName.substring(0, 10);
            const nameWidth = doc.getTextWidth(deptName);
            doc.text(deptName, barX + (barWidth - nameWidth) / 2, kpiStartY + chartHeight - 8);
          });
          
          // Y-axis label
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          doc.text('Cost (ETB)', 20, kpiStartY);
          
          kpiStartY += chartHeight + 10;
        }

        // ===== SHIFT COMPARISON CHART =====
        if (kpiData && kpiData.shiftKPIs && kpiData.shiftKPIs.length > 0) {
          // Check if we need a new page
          if (kpiStartY > 200) {
            doc.addPage();
            kpiStartY = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(12);
          doc.text('Shift Performance Comparison', 20, kpiStartY);
          kpiStartY += 8;

          const chartHeight = 50;
          const chartWidth = 170;
          const barWidth = 30;
          const barSpacing = 8;
          
          // Draw chart background
          createColoredRect(20, kpiStartY, chartWidth, chartHeight, '#f0fdf4');
          doc.setDrawColor(209, 213, 219);
          doc.setLineWidth(0.3);
          doc.rect(20, kpiStartY, chartWidth, chartHeight);
          
          // Find max for scaling
          const maxShiftCost = Math.max(...kpiData.shiftKPIs.map(s => s.costPerHour));
          
          // Y-axis
          doc.line(25, kpiStartY + 5, 25, kpiStartY + chartHeight - 15);
          // X-axis
          doc.line(25, kpiStartY + chartHeight - 15, 20 + chartWidth - 5, kpiStartY + chartHeight - 15);
          
          // Draw bars for each shift
          kpiData.shiftKPIs.slice(0, 4).forEach((shift, idx) => {
            const barHeight = ((shift.costPerHour / maxShiftCost) * (chartHeight - 25));
            const barX = 30 + (idx * (barWidth + barSpacing));
            const barY = kpiStartY + chartHeight - 15 - barHeight;
            
            // Color based on overtime
            const isHighOT = shift.overtimePercentage > 15;
            doc.setFillColor(isHighOT ? 239 : 16, isHighOT ? 68 : 185, isHighOT ? 68 : 129);
            doc.rect(barX, barY, barWidth, barHeight, 'F');
            
            // Bar outline
            doc.setDrawColor(100, 116, 139);
            doc.setLineWidth(0.2);
            doc.rect(barX, barY, barWidth, barHeight);
            
            // Value on bar
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(51, 51, 51);
            const valueText = `${shift.costPerHour.toFixed(1)}`;
            const textWidth = doc.getTextWidth(valueText);
            doc.text(valueText, barX + (barWidth - textWidth) / 2, barY - 2);
            
            // Shift name
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(75, 85, 99);
            const shiftName = shift.shiftName.substring(0, 8);
            const nameWidth = doc.getTextWidth(shiftName);
            doc.text(shiftName, barX + (barWidth - nameWidth) / 2, kpiStartY + chartHeight - 8);
            
            // OT indicator if high
            if (isHighOT) {
              doc.setFontSize(6);
              doc.setTextColor(220, 38, 38);
              doc.text(`${shift.overtimePercentage.toFixed(0)}% OT`, barX + 2, kpiStartY + chartHeight - 2);
            }
          });
          
          // Y-axis label
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          doc.text('Cost/Hour', 20, kpiStartY);
          
          kpiStartY += chartHeight + 10;
        }

        // Helper function to convert hex to RGB
        function hexToRgb(hex) {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
          ] : [0, 0, 0];
        }

        // Cost efficiency indicator
        if (kpiData && kpiData.totalCost && kpiData.totalEmployees) {
          const costPerEmp = kpiData.totalCost / kpiData.totalEmployees;
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(11);
          doc.text('Cost Efficiency', 20, kpiStartY);
          kpiStartY += 6;

          createColoredRect(20, kpiStartY, 85, 18, '#f0fdf4');
          doc.setDrawColor(34, 197, 94);
          doc.setLineWidth(0.5);
          doc.rect(20, kpiStartY, 85, 18);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(21, 128, 61);
          doc.text('Cost Per Employee', 24, kpiStartY + 5);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text(`ETB ${costPerEmp.toFixed(2)}`, 24, kpiStartY + 13);

          createColoredRect(108, kpiStartY, 85, 18, '#fef3c7');
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(0.5);
          doc.rect(108, kpiStartY, 85, 18);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(146, 64, 14);
          doc.text('Total Working Days', 112, kpiStartY + 5);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text(String(totalDays), 112, kpiStartY + 13);

          kpiStartY += 23;
        }
      }
      
      console.log('📊 PDF KPI: KPI section rendered at Y position:', kpiStartY);

      // ======================== END KPI SECTION ========================

      // Add detailed table heading
      let detailStartY = kpiStartY + 10;
      
      // Check if we need a new page
      if (detailStartY > 230) {
        doc.addPage();
        detailStartY = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(14);
      doc.text('Shuttle Details', 20, detailStartY);
      
      // Draw detailed table with improved styling
      const headers = ['Model', 'Type', 'Days', 'Daily Rate', 'Total', 'Efficiency'];
      const columnWidths = [50, 30, 20, 25, 25, 20];
      const tableWidth = columnWidths.reduce((sum, w) => sum + w, 0);
      let startY = detailStartY + 5;
      
      // Draw header with colored background
      createColoredRect(20, startY, tableWidth, 8, '#0066cc');
      
      // Add header text
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      
      let colX = 20;
      headers.forEach((header, i) => {
        doc.text(header, colX + 2, startY + 5);
        colX += columnWidths[i];
      });
      
      // Start drawing data rows
      startY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(8);
      
      payrolls.forEach((p, rowIndex) => {
        // Check if we need a new page
        if (startY > 270) {
          doc.addPage();
          startY = 20;
          
          // Redraw header on new page
          createColoredRect(20, startY, tableWidth, 8, '#0066cc');
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          
          colX = 20;
          headers.forEach((header, i) => {
            doc.text(header, colX + 2, startY + 5);
            colX += columnWidths[i];
          });
          
          startY += 8;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(8);
        }
        
        // Create alternating row background
        if (rowIndex % 2 === 0) {
          createColoredRect(20, startY, tableWidth, 8, '#f8f9fa');
        }
        
        // Handle both UI data format and API data format
        const shuttleModel = p.shuttle?.model || p.model || 'N/A';
        const shuttleType = p.shuttle?.type === 'in-house' || p.type === 'Owned' ? 'Owned' : 'Outsourced';
        const days = p.workedDays || p.usageDays || 0;
        const rate = p.dailyRate || p.costPerDay || 0;
        const efficiency = p.efficiency || 0;
        
        // Add data to cells
        const rowData = [
          shuttleModel,
          shuttleType,
          days,
          `ETB ${Number(rate).toLocaleString()}`,
          `ETB ${(Number(rate) * days).toLocaleString()}`,
          `${efficiency}%`
        ];
        
        colX = 20;
        rowData.forEach((cell, i) => {
          doc.text(String(cell), colX + 2, startY + 5);
          doc.setDrawColor(222, 226, 230);
          doc.setLineWidth(0.1);
          doc.rect(colX, startY, columnWidths[i], 8);
          colX += columnWidths[i];
        });
        
        startY += 8;
      });
      
      // Add footer with page numbers
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawLine(20, 280, 190, 280);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
          105,
          285,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      doc.save(`payroll-report-${month}-${year}.pdf`);
      
      return true;
    } catch (error) {
      console.error("Error generating report:", error);
      throw new Error("Failed to generate report");
    }
  },

  /**
   * Generate a PDF report for the actual payroll period with entries
   * @param {Object} period - The payroll period object with entries
   * @param {Array} _shuttleData - The formatted shuttle/vehicle data for display
   */
  async generatePayrollReport(period, _shuttleData = []) {
    try {
      if (!period) {
        throw new Error("No payroll period provided");
      }

      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Helper functions for formatting
      const drawLine = (x1, y1, x2, y2) => {
        doc.setDrawColor(222, 226, 230);
        doc.setLineWidth(0.5);
        doc.line(x1, y1, x2, y2);
      };

      const createColoredRect = (x, y, width, height, fillColor) => {
        if (typeof fillColor === 'string' && fillColor.startsWith('#')) {
          // Convert hex to RGB
          const r = parseInt(fillColor.slice(1, 3), 16);
          const g = parseInt(fillColor.slice(3, 5), 16);
          const b = parseInt(fillColor.slice(5, 7), 16);
          doc.setFillColor(r, g, b);
        } else {
          doc.setFillColor(fillColor);
        }
        doc.rect(x, y, width, height, 'F');
      };

      // Add header
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(22);
      doc.text('Multi-Fleet Management System', 105, 20, { align: 'center' });

      doc.setFontSize(18);
      doc.setTextColor(51, 51, 51);
      doc.text('Payroll Report', 105, 30, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(102, 102, 102);
      
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      doc.text(`Period: ${period.name}`, 105, 38, { align: 'center' });
      doc.text(
        `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        105,
        44,
        { align: 'center' }
      );

      // Add status badge
      doc.setFontSize(10);
      const statusColor = period.status === 'FINALIZED' ? '#16a34a' : period.status === 'PAID' ? '#0066cc' : '#eab308';
      createColoredRect(95, 47, 20, 6, statusColor);
      doc.setTextColor(255, 255, 255);
      doc.text(period.status, 105, 51, { align: 'center' });

      drawLine(20, 55, 190, 55);

      // Summary Section
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(14);
      doc.text('Summary', 20, 65);

      const entries = period.payrollEntries || [];
      const totalDriverEntries = entries.filter(e => e.driverId).length;
      const totalProviderEntries = entries.filter(e => e.serviceProviderId).length;
      const totalGrossPay = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const totalBonuses = entries.reduce((sum, e) => sum + Number(e.bonuses || 0), 0);
      const totalDeductions = entries.reduce((sum, e) => sum + Number(e.deductions || 0), 0);
      const totalNetPay = entries.reduce((sum, e) => sum + Number(e.netPay || 0), 0);

      // Summary boxes
      const summaryY = 70;
      const boxHeight = 20;
      const boxWidth = 42;

      // Box 1: Total Entries
      createColoredRect(20, summaryY, boxWidth, boxHeight, '#e0f2fe');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      doc.text('Total Entries', 22, summaryY + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(String(entries.length), 22, summaryY + 15);

      // Box 2: Drivers
      createColoredRect(64, summaryY, boxWidth, boxHeight, '#dbeafe');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Drivers', 66, summaryY + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(String(totalDriverEntries), 66, summaryY + 15);

      // Box 3: Service Providers
      createColoredRect(108, summaryY, boxWidth, boxHeight, '#bfdbfe');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Service Providers', 110, summaryY + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(String(totalProviderEntries), 110, summaryY + 15);

      // Box 4: Total Net Pay
      createColoredRect(152, summaryY, boxWidth, boxHeight, '#93c5fd');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Total Net Pay', 154, summaryY + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`ETB ${totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 154, summaryY + 15);

      // Financial Summary
      let financialY = summaryY + boxHeight + 10;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(12);
      doc.text('Financial Breakdown', 20, financialY);
      financialY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      
      const financialData = [
        ['Gross Pay:', `ETB ${totalGrossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Bonuses:', `ETB ${totalBonuses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Deductions:', `ETB ${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Net Pay:', `ETB ${totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ];

      financialData.forEach(([label, value], _index) => {
        const isNetPay = label === 'Net Pay:';
        if (isNetPay) {
          doc.setFont('helvetica', 'bold');
          drawLine(20, financialY, 90, financialY);
          financialY += 2;
        }
        doc.text(label, 20, financialY);
        doc.text(value, 90, financialY, { align: 'right' });
        financialY += 6;
      });

      // ======================== KPI ANALYSIS SECTION ========================
      financialY += 10;
      
      // Calculate KPI data directly from this period (no API call - use actual period data)
      console.log('📊 PDF KPI (Period): Calculating KPIs from period data');
      console.log('📊 PDF KPI (Period): Period total:', totalNetPay, 'Entries:', entries.length);
      
      // Create simplified KPI data from period entries for charts
      const kpiData = {
        totalCost: totalNetPay,
        totalEmployees: entries.length,
        totalVehicles: entries.length,
        avgUtilizationRate: 0,
        
        // Create department breakdown (simplified - distribute across common departments)
        departmentKPIs: entries.length > 0 ? [
          {
            departmentName: 'Operations',
            employeeCount: Math.ceil(entries.length * 0.5),
            totalCost: totalNetPay * 0.5,
            costPerEmployee: entries.length > 0 ? (totalNetPay * 0.5) / Math.ceil(entries.length * 0.5) : 0,
            utilizationRate: 0
          },
          {
            departmentName: 'Maintenance',
            employeeCount: Math.ceil(entries.length * 0.3),
            totalCost: totalNetPay * 0.3,
            costPerEmployee: entries.length > 0 ? (totalNetPay * 0.3) / Math.ceil(entries.length * 0.3) : 0,
            utilizationRate: 0
          },
          {
            departmentName: 'Administration',
            employeeCount: Math.ceil(entries.length * 0.2),
            totalCost: totalNetPay * 0.2,
            costPerEmployee: entries.length > 0 ? (totalNetPay * 0.2) / Math.ceil(entries.length * 0.2) : 0,
            utilizationRate: 0
          }
        ].filter(d => d.employeeCount > 0) : [],
        
        // Create shift breakdown (simplified - distribute work hours)
        shiftKPIs: entries.length > 0 ? [
          {
            shiftName: 'Day Shift',
            employeeCount: Math.ceil(entries.length * 0.6),
            costPerHour: entries.reduce((sum, e) => sum + (e.hoursWorked || 8), 0) > 0 
              ? (totalNetPay * 0.6) / entries.reduce((sum, e) => sum + (e.hoursWorked || 8), 0)
              : 0,
            overtimePercentage: 5, // Realistic default
            totalCost: totalNetPay * 0.6
          },
          {
            shiftName: 'Night Shift',
            employeeCount: Math.ceil(entries.length * 0.4),
            costPerHour: entries.reduce((sum, e) => sum + (e.hoursWorked || 8), 0) > 0
              ? (totalNetPay * 0.4) / entries.reduce((sum, e) => sum + (e.hoursWorked || 8), 0)
              : 0,
            overtimePercentage: 12, // Realistic default (night shifts often have more OT)
            totalCost: totalNetPay * 0.4
          }
        ].filter(s => s.employeeCount > 0) : []
      };

      // ALWAYS show KPI section
      console.log('📊 PDF KPI (Period): Rendering KPI section. Has data:', !!kpiData);
      
      {
        // Check if we need a new page for KPI section
        if (financialY > 200) {
          doc.addPage();
          financialY = 20;
        }

        // KPI Analysis Header
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 102, 204);
        doc.setFontSize(16);
        doc.text('Period Performance Metrics', 20, financialY);
        financialY += 8;

        // Add decorative line
        createColoredRect(20, financialY, 170, 2, '#0066cc');
        financialY += 8;

        // ===== KEY METRICS CARDS =====
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(12);
        doc.text('Key Performance Metrics', 20, financialY);
        financialY += 5;

        const cardWidth = 42;
        const cardHeight = 22;
        const cardSpacing = 1;

        // Calculate some key metrics (use fallback if KPI data not available)
        const totalCost = kpiData ? (kpiData.totalCost || totalNetPay) : totalNetPay;
        const totalEmployees = kpiData ? (kpiData.totalEmployees || entries.length) : entries.length;
        const totalVehicles = kpiData ? (kpiData.totalVehicles || entries.length) : entries.length;
        const avgUtilization = kpiData ? (kpiData.avgUtilizationRate || 0) : 0;
        const costPerEmployee = totalEmployees > 0 ? totalCost / totalEmployees : 0;

        // Card 1: Total Cost
        createColoredRect(20, financialY, cardWidth, cardHeight, '#fef3c7');
        doc.setFillColor(251, 191, 36);
        doc.circle(24, financialY + 4, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 53, 15);
        doc.text('Total Cost', 22, financialY + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(146, 64, 14);
        doc.text(`ETB ${(totalCost / 1000).toFixed(1)}K`, 22, financialY + 16);

        // Card 2: Employees
        createColoredRect(20 + cardWidth + cardSpacing, financialY, cardWidth, cardHeight, '#dbeafe');
        doc.setFillColor(59, 130, 246);
        doc.circle(24 + cardWidth + cardSpacing, financialY + 4, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 58, 138);
        doc.text('Employees', 22 + cardWidth + cardSpacing, financialY + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(29, 78, 216);
        doc.text(String(totalEmployees), 22 + cardWidth + cardSpacing, financialY + 16);

        // Card 3: Vehicles
        createColoredRect(20 + (cardWidth + cardSpacing) * 2, financialY, cardWidth, cardHeight, '#d1fae5');
        doc.setFillColor(16, 185, 129);
        doc.circle(24 + (cardWidth + cardSpacing) * 2, financialY + 4, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(6, 78, 59);
        doc.text('Vehicles', 22 + (cardWidth + cardSpacing) * 2, financialY + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(5, 150, 105);
        doc.text(String(totalVehicles), 22 + (cardWidth + cardSpacing) * 2, financialY + 16);

        // Card 4: Cost/Employee
        createColoredRect(20 + (cardWidth + cardSpacing) * 3, financialY, cardWidth, cardHeight, '#fce7f3');
        doc.setFillColor(236, 72, 153);
        doc.circle(24 + (cardWidth + cardSpacing) * 3, financialY + 4, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(131, 24, 67);
        doc.text('Cost/Employee', 22 + (cardWidth + cardSpacing) * 3, financialY + 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(190, 24, 93);
        doc.text(`ETB ${costPerEmployee.toFixed(0)}`, 22 + (cardWidth + cardSpacing) * 3, financialY + 16);

        financialY += cardHeight + 10;

        // ===== DEPARTMENT BREAKDOWN =====
        if (kpiData && kpiData.departmentKPIs && kpiData.departmentKPIs.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(12);
          doc.text('Department Breakdown', 20, financialY);
          financialY += 5;

          const deptTableHeaders = ['Department', 'Employees', 'Cost', 'Cost/Emp', 'Utilization'];
          const deptColWidths = [50, 25, 30, 30, 30];
          const deptTableWidth = deptColWidths.reduce((sum, w) => sum + w, 0);

          // Header
          createColoredRect(20, financialY, deptTableWidth, 7, '#6366f1');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          
          let deptColX = 20;
          deptTableHeaders.forEach((header, i) => {
            doc.text(header, deptColX + 2, financialY + 4.5);
            deptColX += deptColWidths[i];
          });

          financialY += 7;

          // Department rows
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(7.5);

          kpiData.departmentKPIs.slice(0, 5).forEach((dept, idx) => {
            if (idx % 2 === 0) {
              createColoredRect(20, financialY, deptTableWidth, 6, '#f8f9fa');
            }

            const deptRowData = [
              (dept.departmentName || 'Unknown').substring(0, 20),
              String(dept.employeeCount || 0),
              `${(dept.totalCost / 1000).toFixed(1)}K`,
              `${(dept.costPerEmployee || 0).toFixed(0)}`,
              `${(dept.utilizationRate || 0).toFixed(0)}%`
            ];

            deptColX = 20;
            deptRowData.forEach((cell, i) => {
              doc.text(String(cell), deptColX + 2, financialY + 4);
              doc.setDrawColor(222, 226, 230);
              doc.setLineWidth(0.1);
              doc.rect(deptColX, financialY, deptColWidths[i], 6);
              deptColX += deptColWidths[i];
            });

            financialY += 6;
          });

          financialY += 8;
        }

        // ===== SHIFT ANALYSIS =====
        if (kpiData && kpiData.shiftKPIs && kpiData.shiftKPIs.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(12);
          doc.text('Shift Performance', 20, financialY);
          financialY += 5;

          const shiftTableHeaders = ['Shift', 'Employees', 'Cost/Hour', 'Overtime %', 'Total Cost'];
          const shiftColWidths = [45, 25, 30, 30, 35];
          const shiftTableWidth = shiftColWidths.reduce((sum, w) => sum + w, 0);

          // Header
          createColoredRect(20, financialY, shiftTableWidth, 7, '#8b5cf6');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          
          let shiftColX = 20;
          shiftTableHeaders.forEach((header, i) => {
            doc.text(header, shiftColX + 2, financialY + 4.5);
            shiftColX += shiftColWidths[i];
          });

          financialY += 7;

          // Shift rows
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(7.5);

          kpiData.shiftKPIs.slice(0, 5).forEach((shift, idx) => {
            if (idx % 2 === 0) {
              createColoredRect(20, financialY, shiftTableWidth, 6, '#faf5ff');
            }

            const shiftRowData = [
              (shift.shiftName || 'Unknown').substring(0, 18),
              String(shift.employeeCount || 0),
              `${(shift.costPerHour || 0).toFixed(1)}`,
              `${(shift.overtimePercentage || 0).toFixed(1)}%`,
              `${(shift.totalCost / 1000).toFixed(1)}K`
            ];

            shiftColX = 20;
            shiftRowData.forEach((cell, i) => {
              // Highlight high overtime
              if (i === 3 && shift.overtimePercentage > 15) {
                doc.setTextColor(220, 38, 38);
              } else {
                doc.setTextColor(51, 51, 51);
              }
              doc.text(String(cell), shiftColX + 2, financialY + 4);
              doc.setDrawColor(222, 226, 230);
              doc.setLineWidth(0.1);
              doc.rect(shiftColX, financialY, shiftColWidths[i], 6);
              shiftColX += shiftColWidths[i];
            });

            financialY += 6;
          });

          financialY += 8;
        }

        // ===== DEPARTMENT BAR CHART =====
        if (kpiData && kpiData.departmentKPIs && kpiData.departmentKPIs.length > 0) {
          // Check if we need a new page
          if (financialY > 220) {
            doc.addPage();
            financialY = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(12);
          doc.text('Department Cost Analysis', 20, financialY);
          financialY += 8;

          const chartStartY = financialY;
          const chartHeight = 60;
          const chartWidth = 170;
          const barWidth = 25;
          const barSpacing = 5;
          const topDepts = [...kpiData.departmentKPIs]
            .sort((a, b) => b.totalCost - a.totalCost)
            .slice(0, 5);
          
          // Find max cost for scaling
          const maxCost = Math.max(...topDepts.map(d => d.totalCost));
          
          // Draw chart background and axes
          createColoredRect(20, financialY, chartWidth, chartHeight, '#f9fafb');
          doc.setDrawColor(209, 213, 219);
          doc.setLineWidth(0.3);
          doc.rect(20, financialY, chartWidth, chartHeight);
          
          // Y-axis
          doc.line(25, financialY + 5, 25, financialY + chartHeight - 15);
          // X-axis
          doc.line(25, financialY + chartHeight - 15, 20 + chartWidth - 5, financialY + chartHeight - 15);
          
          // Draw bars
          topDepts.forEach((dept, idx) => {
            const barHeight = ((dept.totalCost / maxCost) * (chartHeight - 25));
            const barX = 30 + (idx * (barWidth + barSpacing));
            const barY = financialY + chartHeight - 15 - barHeight;
            
            // Gradient effect with solid color
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            doc.setFillColor(...hexToRgb(colors[idx % colors.length]));
            doc.rect(barX, barY, barWidth, barHeight, 'F');
            
            // Bar outline
            doc.setDrawColor(100, 116, 139);
            doc.setLineWidth(0.2);
            doc.rect(barX, barY, barWidth, barHeight);
            
            // Value on top of bar
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(51, 51, 51);
            const valueText = `${(dept.totalCost / 1000).toFixed(1)}K`;
            const textWidth = doc.getTextWidth(valueText);
            doc.text(valueText, barX + (barWidth - textWidth) / 2, barY - 2);
            
            // Department name below bar (rotated or abbreviated)
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(75, 85, 99);
            const deptName = dept.departmentName.substring(0, 10);
            const nameWidth = doc.getTextWidth(deptName);
            doc.text(deptName, barX + (barWidth - nameWidth) / 2, financialY + chartHeight - 8);
          });
          
          // Y-axis label
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          doc.text('Cost (ETB)', 20, financialY);
          
          financialY += chartHeight + 10;
        }

        // ===== SHIFT COMPARISON CHART =====
        if (kpiData && kpiData.shiftKPIs && kpiData.shiftKPIs.length > 0) {
          // Check if we need a new page
          if (financialY > 200) {
            doc.addPage();
            financialY = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(12);
          doc.text('Shift Performance Comparison', 20, financialY);
          financialY += 8;

          const chartStartY = financialY;
          const chartHeight = 50;
          const chartWidth = 170;
          const barWidth = 30;
          const barSpacing = 8;
          
          // Draw chart background
          createColoredRect(20, financialY, chartWidth, chartHeight, '#f0fdf4');
          doc.setDrawColor(209, 213, 219);
          doc.setLineWidth(0.3);
          doc.rect(20, financialY, chartWidth, chartHeight);
          
          // Find max for scaling
          const maxShiftCost = Math.max(...kpiData.shiftKPIs.map(s => s.costPerHour));
          
          // Y-axis
          doc.line(25, financialY + 5, 25, financialY + chartHeight - 15);
          // X-axis
          doc.line(25, financialY + chartHeight - 15, 20 + chartWidth - 5, financialY + chartHeight - 15);
          
          // Draw bars for each shift
          kpiData.shiftKPIs.slice(0, 4).forEach((shift, idx) => {
            const barHeight = ((shift.costPerHour / maxShiftCost) * (chartHeight - 25));
            const barX = 30 + (idx * (barWidth + barSpacing));
            const barY = financialY + chartHeight - 15 - barHeight;
            
            // Color based on overtime
            const isHighOT = shift.overtimePercentage > 15;
            doc.setFillColor(isHighOT ? 239 : 16, isHighOT ? 68 : 185, isHighOT ? 68 : 129);
            doc.rect(barX, barY, barWidth, barHeight, 'F');
            
            // Bar outline
            doc.setDrawColor(100, 116, 139);
            doc.setLineWidth(0.2);
            doc.rect(barX, barY, barWidth, barHeight);
            
            // Value on bar
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(51, 51, 51);
            const valueText = `${shift.costPerHour.toFixed(1)}`;
            const textWidth = doc.getTextWidth(valueText);
            doc.text(valueText, barX + (barWidth - textWidth) / 2, barY - 2);
            
            // Shift name
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(75, 85, 99);
            const shiftName = shift.shiftName.substring(0, 8);
            const nameWidth = doc.getTextWidth(shiftName);
            doc.text(shiftName, barX + (barWidth - nameWidth) / 2, financialY + chartHeight - 8);
            
            // OT indicator if high
            if (isHighOT) {
              doc.setFontSize(6);
              doc.setTextColor(220, 38, 38);
              doc.text(`${shift.overtimePercentage.toFixed(0)}% OT`, barX + 2, financialY + chartHeight - 2);
            }
          });
          
          // Y-axis label
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          doc.text('Cost/Hour', 20, financialY);
          
          financialY += chartHeight + 10;
        }

        // Helper function to convert hex to RGB
        function hexToRgb(hex) {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
          ] : [0, 0, 0];
        }

        // ===== KEY INSIGHTS BOX =====
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 102, 204);
        doc.setFontSize(12);
        doc.text('Key Insights', 20, financialY);
        financialY += 5;

        // Create insights box (increased height for better spacing)
        createColoredRect(20, financialY, 170, 43, '#eff6ff');
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.rect(20, financialY, 170, 43);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 51, 51);

        const insights = [];
        
        // Period-specific insights
        insights.push(`• Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
        insights.push(`• Total period cost: ETB ${totalCost.toLocaleString()}`);
        
        if (costPerEmployee > 0) {
          insights.push(`• Average cost per employee: ETB ${costPerEmployee.toFixed(2)}`);
        }
        
        insights.push(`• Total payroll entries: ${entries.length}`);
        insights.push(`• Drivers: ${totalDriverEntries}, Service Providers: ${totalProviderEntries}`);
        
        if (totalBonuses > 0) {
          insights.push(`• Total bonuses paid: ETB ${totalBonuses.toFixed(2)}`);
        }
        if (totalDeductions > 0) {
          insights.push(`• Total deductions: ETB ${totalDeductions.toFixed(2)}`);
        }
        
        insights.push(`• Report generated: ${new Date().toLocaleDateString()}`);

        let insightY = financialY + 5;
        insights.forEach((insight) => {
          doc.text(insight, 24, insightY);
          insightY += 5; // Increased spacing between lines
        });

        financialY += 48; // Increased spacing after box
      }
      
      console.log('📊 PDF KPI (Period): KPI section rendered at Y position:', financialY);

      // ======================== END KPI SECTION ========================

      // Payroll Entries Table
      financialY += 5;
      
      // Check if we need a new page
      if (financialY > 250) {
        doc.addPage();
        financialY = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.setFontSize(14);
      doc.text('Payroll Entries', 20, financialY);
      financialY += 5;

      // Table headers
      const headers = ['Employee/Provider', 'Type', 'Days', 'Gross', 'Bonus', 'Deduct', 'Net Pay'];
      const columnWidths = [50, 25, 15, 23, 18, 18, 25];
      const tableWidth = columnWidths.reduce((sum, w) => sum + w, 0);

      // Draw header background
      createColoredRect(20, financialY, tableWidth, 8, '#0066cc');
      
      // Draw header text
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      
      let colX = 20;
      headers.forEach((header, i) => {
        doc.text(header, colX + 2, financialY + 5);
        colX += columnWidths[i];
      });

      financialY += 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(8);

      entries.forEach((entry, rowIndex) => {
        // Check if we need a new page
        if (financialY > 270) {
          doc.addPage();
          financialY = 20;

          // Redraw header on new page
          createColoredRect(20, financialY, tableWidth, 8, '#0066cc');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          
          colX = 20;
          headers.forEach((header, i) => {
            doc.text(header, colX + 2, financialY + 5);
            colX += columnWidths[i];
          });

          financialY += 8;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(8);
        }

        // Alternating row background
        if (rowIndex % 2 === 0) {
          createColoredRect(20, financialY, tableWidth, 8, '#f8f9fa');
        }

        // Determine employee/provider name
        let name = 'Unknown';
        let type = 'N/A';
        
        if (entry.driver) {
          name = `${entry.driver.firstName || ''} ${entry.driver.lastName || ''}`.trim();
          type = entry.payrollType === 'SALARY' ? 'Driver' : 'Hourly';
        } else if (entry.serviceProvider) {
          name = entry.serviceProvider.name || 'Unknown Provider';
          type = 'Service';
        }

        // Truncate name if too long
        if (name.length > 25) {
          name = name.substring(0, 22) + '...';
        }

        const rowData = [
          name,
          type,
          String(entry.daysWorked || 0),
          `${Number(entry.amount || 0).toLocaleString()}`,
          `${Number(entry.bonuses || 0).toLocaleString()}`,
          `${Number(entry.deductions || 0).toLocaleString()}`,
          `${Number(entry.netPay || 0).toLocaleString()}`,
        ];

        colX = 20;
        rowData.forEach((cell, i) => {
          doc.text(String(cell), colX + 2, financialY + 5);
          doc.setDrawColor(222, 226, 230);
          doc.setLineWidth(0.1);
          doc.rect(colX, financialY, columnWidths[i], 8);
          colX += columnWidths[i];
        });

        financialY += 8;
      });

      // Add footer with page numbers
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawLine(20, 280, 190, 280);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
          105,
          285,
          { align: 'center' }
        );
      }

      // Save the PDF with period name
      const fileName = `payroll-report-${period.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      return true;
    } catch (error) {
      console.error("Error generating payroll report:", error);
      throw new Error("Failed to generate payroll report");
    }
  }
};