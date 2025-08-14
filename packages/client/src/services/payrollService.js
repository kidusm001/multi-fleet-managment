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
  async generateMonthlyPayroll(shuttleId, month, year) {
    try {
      // Call the backend to generate payroll data for this shuttle
      // Backend will now calculate based on actual routes, work days, and efficiency
      const response = await api.post('/payroll/generate', { 
        shuttleId, 
        month, 
        year,
        useActualRoutes: true // Signal to use real route data
      });
      return response.data;
    } catch (error) {
      console.error("Error generating payroll:", error);
      // Return mock success response only if API fails
      return { id: `mock-${shuttleId}`, month, year, status: "PROCESSED" };
    }
  },

  async getMonthlyPayrollByShuttle(shuttleId, month, year) {
    try {
      // Get specifically calculated data for this shuttle
      const response = await api.get(`/payroll/shuttle/${shuttleId}/${month}/${year}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching shuttle payroll:", error);
      return sampleData.shuttles.find(s => s.id === shuttleId.toString()) || null;
    }
  },

  async getAllMonthlyPayrolls(month, year) {
    try {
      // The backend will now auto-generate any missing payrolls based on actual routes
      const response = await api.get(`/payroll/monthly/${month}/${year}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching all payrolls:", error);
      // Only return sample data if API fails
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

  async getPayrollDistribution(month, year) {
    try {
      // Backend now automatically generates missing data from actual routes
      const response = await api.get(`/payroll/distribution/${month}/${year}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching payroll distribution:", error);
      return sampleData.distribution;
    }
  },

  async getHistoricalPayrollData(months = 12) {
    try {
      // Get historical data based on actual past payrolls
      const response = await api.get('/payroll/historical', { params: { months } });
      return response.data;
    } catch (error) {
      console.error("Error fetching historical payroll data:", error);
      return sampleData.historical.slice(0, months);
    }
  },

  async getFutureProjections(startMonth, startYear, numMonths = 6) {
    try {
      // Get projections based on historical trends from actual data
      const response = await api.get('/payroll/projections', {
        params: { 
          startMonth, 
          startYear, 
          numMonths,
          useRealData: true // Signal to use real historical data for projections
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching projections:", error);
      return sampleData.projections.slice(0, numMonths);
    }
  },

  async processPayroll(payrollId) {
    try {
      const response = await api.post(`/payroll/process/${payrollId}`);
      return response.data;
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
      
      // Add detailed table heading
      let detailStartY = projStartY + 15;
      
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
  }
};