import { Request, Response } from 'express';
// Minimal local stub to avoid missing module resolution; real implementation can be swapped in later
class PayrollService {
  async generateMonthlyPayroll(vehicleId: string, month: string, year: number) {
    return { vehicleId, month, year, status: 'generated' };
  }
  async getMonthlyPayrollByVehicle(vehicleId: string, month: string, year: number) {
    return { vehicleId, month, year, records: [] };
  }
  async getAllMonthlyPayrolls(month: string, year: number) {
    return { month, year, records: [] };
  }
  async getPayrollDistribution(month: string, year: number) {
    return { month, year, distribution: [] };
  }
  async getHistoricalPayrollData(months: number) {
    return { months, data: [] };
  }
  async getPayrollProjections(startMonth: string, startYear: number, numMonths: number) {
    return { startMonth, startYear, numMonths, projections: [] };
  }
  async processPayroll(payrollId: string) {
    return { payrollId, status: 'processed' };
  }
}
import prisma from '../db';
import PDFDocument from 'pdfkit';
import { Decimal } from '@prisma/client/runtime/library';

// Define types for the payroll records
interface PayrollRecord {
  vehicleId: string | null;
  dailyRate: Decimal | null;
  workedDays: number | null;
  efficiency: number;
  vehicle?: {
    model: string | null;
    type: string;
  } | null;
}

const payrollService = new PayrollService();

export class PayrollController {
  async generateMonthlyPayroll(req: Request, res: Response) {
    try {
  const { vehicleId, month, year } = req.body;
  const payroll = await payrollService.generateMonthlyPayroll(vehicleId, month, year);
      res.json(payroll);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMonthlyPayrollByShuttle(req: Request, res: Response) {
    try {
      const { vehicleId, month, year } = req.params as any;
      const payroll = await payrollService.getMonthlyPayrollByVehicle(
        vehicleId as string,
        month,
        parseInt(year)
      );
      res.json(payroll);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllMonthlyPayrolls(req: Request, res: Response) {
    try {
      const { month, year } = req.params;
      const payrolls = await payrollService.getAllMonthlyPayrolls(month, parseInt(year));
      res.json(payrolls);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPayrollDistribution(req: Request, res: Response) {
    try {
      const { month, year } = req.params;
      const distribution = await payrollService.getPayrollDistribution(month, parseInt(year));
      res.json(distribution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getHistoricalPayrollData(req: Request, res: Response) {
    try {
      const months = req.query.months ? parseInt(req.query.months as string) : 12;
      const data = await payrollService.getHistoricalPayrollData(months);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getFutureProjections(req: Request, res: Response) {
    try {
      const { startMonth, startYear, numMonths } = req.query;
      const projections = await payrollService.getPayrollProjections(
        startMonth as string,
        parseInt(startYear as string),
        numMonths ? parseInt(numMonths as string) : 6
      );
      res.json(projections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async processPayroll(req: Request, res: Response) {
    try {
      const { payrollId } = req.params;
      const result = await payrollService.processPayroll(payrollId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateReport(req: Request, res: Response) {
    try {
      const { month, year } = req.body;

    // Get all payroll data for the month
    const payrollData = await prisma.payrollReport.findMany({
        where: {
          month: month,
          year: parseInt(year)
        },
        include: {
      vehicle: true
        }
      });

      // Create a new PDF document with better formatting
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'A4'
      });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=payroll-${month}-${year}.pdf`);

      // Pipe the PDF to the response
      doc.pipe(res);

      // Add company logo (optional)
      // doc.image('path/to/logo.png', 50, 45, { width: 50 });

      // Add elegant header with company name and report title
      doc.fontSize(22).fillColor('#0066cc')
         .text('Shuttle Management System', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(18).fillColor('#333333')
         .text('Payroll Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#666666')
         .text(`Period: ${month} ${year}`, { align: 'center' });
      
      // Add horizontal line
      doc.moveDown();
      this.drawLine(doc, 50, doc.y, doc.page.width - 50, doc.y);
      doc.moveDown(1.5);

      // Calculate summary statistics
      const totalShuttles = payrollData.length;
      const totalCost = payrollData.reduce((sum, record: any) => 
        sum + (Number(record.dailyRate ?? 0) * Number(record.workedDays ?? 0)), 0);
      const avgEfficiency = totalShuttles > 0 ? 
        Math.round(payrollData.reduce((sum: number, record: any) => sum + Number(record.efficiency ?? 0), 0) / totalShuttles) : 0;
      const totalDays = payrollData.reduce((sum: number, record: any) => sum + Number(record.workedDays ?? 0), 0);
      
      // Add summary section
      doc.fontSize(14).fillColor('#0066cc').text('Summary', { underline: true });
      doc.moveDown(0.5);
      
      const summaryInfo = [
        { label: 'Total Shuttles', value: totalShuttles.toString() },
        { label: 'Total Working Days', value: totalDays.toString() },
        { label: 'Total Cost', value: this.formatCurrency(totalCost) },
        { label: 'Average Efficiency', value: `${avgEfficiency}%` }
      ];
      
      // Create a beautiful summary box
      const summaryBoxY = doc.y;
      doc.roundedRect(50, summaryBoxY, doc.page.width - 100, 80, 5)
         .fillAndStroke('#f8f9fa', '#dee2e6');
      
      // Add summary data in two columns
      doc.fillColor('#333333');
      doc.fontSize(10);
      
      // Left column
      doc.text(summaryInfo[0].label + ':', 70, summaryBoxY + 15);
      doc.text(summaryInfo[1].label + ':', 70, summaryBoxY + 35);
      
      // Right column
      doc.text(summaryInfo[2].label + ':', 300, summaryBoxY + 15);
      doc.text(summaryInfo[3].label + ':', 300, summaryBoxY + 35);
      
      // Values - left column
      doc.fontSize(12).fillColor('#0066cc');
      doc.text(summaryInfo[0].value, 180, summaryBoxY + 15);
      doc.text(summaryInfo[1].value, 180, summaryBoxY + 35);
      
      // Values - right column
      doc.text(summaryInfo[2].value, 380, summaryBoxY + 15);
      doc.text(summaryInfo[3].value, 380, summaryBoxY + 35);
      
      // Move position below summary box
      doc.moveDown(4.5);

      // Add shuttle type distribution
  const ownedShuttles = payrollData.filter((record: any) => record.vehicle?.type === 'in-house').length;
      const outsourcedShuttles = totalShuttles - ownedShuttles;
      
      doc.fontSize(14).fillColor('#0066cc').text('Shuttle Distribution', { underline: true });
      doc.moveDown(0.5);
      
      // Draw distribution chart
      const chartY = doc.y;
      const chartWidth = 200;
      const chartHeight = 20;
      const ownedWidth = (ownedShuttles / totalShuttles) * chartWidth;
      const outsourcedWidth = chartWidth - ownedWidth;
      
      // Draw chart bars
      if (totalShuttles > 0) {
        doc.rect(70, chartY, ownedWidth, chartHeight).fillAndStroke('#4dabf7', '#339af0');
        doc.rect(70 + ownedWidth, chartY, outsourcedWidth, chartHeight).fillAndStroke('#ffa94d', '#fd7e14');
      }
      
      // Add legend
      doc.fillColor('#333333').fontSize(10);
      doc.rect(70, chartY + 30, 10, 10).fillAndStroke('#4dabf7', '#339af0');
      doc.text(`Owned (${ownedShuttles})`, 90, chartY + 30);
      
      doc.rect(200, chartY + 30, 10, 10).fillAndStroke('#ffa94d', '#fd7e14');
      doc.text(`Outsourced (${outsourcedShuttles})`, 220, chartY + 30);
      
      // Move position below chart
      doc.moveDown(3);

      // Add detailed table with improved styling
  doc.fontSize(14).fillColor('#0066cc').text('Vehicle Details', { underline: true });
      doc.moveDown(0.5);

      // Create a refined table without showing IDs
      const detailsTable = {
        headers: ['Model', 'Type', 'Working Days', 'Daily Rate', 'Total Cost', 'Efficiency'],
        rows: payrollData.map((record: any) => [
          record.vehicle?.model || 'N/A',
          record.vehicle?.type === 'in-house' ? 'Owned' : 'Outsourced',
          String(record.workedDays ?? 0),
          this.formatCurrency(Number(record.dailyRate ?? 0)),
          this.formatCurrency(Number(record.dailyRate ?? 0) * Number(record.workedDays ?? 0)),
          `${Number(record.efficiency ?? 0)}%`
        ])
      };

      this.drawEnhancedTable(doc, detailsTable);

      // Add footer with page number
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Draw footer line
        this.drawLine(doc, 50, doc.page.height - 50, doc.page.width - 50, doc.page.height - 50);
        
        // Add footer text
        doc.fillColor('#666666').fontSize(8);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i + 1} of ${pageCount}`,
          50, 
          doc.page.height - 40,
          { align: 'center' }
        );
      }

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }

  private drawEnhancedTable(doc: any, table: { headers: string[], rows: string[][] }) {
    const tableTop = doc.y;
    const tableLeft = 50;
    const tableWidth = doc.page.width - 100;
    const columnCount = table.headers.length;
    const columnWidth = tableWidth / columnCount;
    const rowHeight = 30;
    const textPadding = 5;
    
    // Draw header with background
    doc.fillColor('#0066cc').rect(tableLeft, tableTop, tableWidth, rowHeight).fill();
    doc.fillColor('white');
    
    table.headers.forEach((header, i) => {
      doc.fontSize(10).text(
        header,
        tableLeft + (i * columnWidth) + textPadding,
        tableTop + textPadding,
        { width: columnWidth - (textPadding * 2) }
      );
    });
    
    // Draw alternating row backgrounds and data
    let rowY = tableTop + rowHeight;
    
    table.rows.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (rowY + rowHeight > doc.page.height - 70) {
        doc.addPage();
        rowY = 50; // Reset Y position on new page
        
        // Redraw header on new page
        doc.fillColor('#0066cc').rect(tableLeft, rowY, tableWidth, rowHeight).fill();
        doc.fillColor('white');
        
        table.headers.forEach((header, i) => {
          doc.fontSize(10).text(
            header,
            tableLeft + (i * columnWidth) + textPadding,
            rowY + textPadding,
            { width: columnWidth - (textPadding * 2) }
          );
        });
        
        rowY += rowHeight;
      }
      
      // Draw row background (alternating colors)
      if (rowIndex % 2 === 0) {
        doc.fillColor('#f8f9fa').rect(tableLeft, rowY, tableWidth, rowHeight).fill();
      }
      
      // Draw cell borders and text
      doc.fillColor('#333333');
      
      row.forEach((cell, i) => {
        // Add subtle cell border
        doc.lineWidth(0.5).strokeColor('#dee2e6')
          .rect(tableLeft + (i * columnWidth), rowY, columnWidth, rowHeight).stroke();
        
        doc.fontSize(9).text(
          cell,
          tableLeft + (i * columnWidth) + textPadding,
          rowY + textPadding,
          { width: columnWidth - (textPadding * 2) }
        );
      });
      
      rowY += rowHeight;
    });
    
    // Update document position
    doc.y = rowY + 20;
  }

  private drawLine(doc: any, fromX: number, fromY: number, toX: number, toY: number) {
    doc.strokeColor('#dee2e6').lineWidth(1)
      .moveTo(fromX, fromY)
      .lineTo(toX, toY)
      .stroke();
  }

  private formatCurrency(amount: number): string {
    return `ETB ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
}