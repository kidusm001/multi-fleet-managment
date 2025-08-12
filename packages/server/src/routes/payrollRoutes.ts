import { Router } from 'express';
import { PayrollController } from '../controllers/payrollController';

const router = Router();
const payrollController = new PayrollController();

// Generate monthly payroll for a shuttle
router.post('/generate', payrollController.generateMonthlyPayroll);

// Get monthly payroll for a specific shuttle
router.get('/shuttle/:shuttleId/:month/:year', payrollController.getMonthlyPayrollByShuttle);

// Get all monthly payrolls
router.get('/monthly/:month/:year', payrollController.getAllMonthlyPayrolls);

// Get payroll distribution
router.get('/distribution/:month/:year', payrollController.getPayrollDistribution);

// Get historical payroll data
router.get('/historical', payrollController.getHistoricalPayrollData);

// Get future projections
router.get('/projections', payrollController.getFutureProjections);

// Process payroll
router.post('/process/:payrollId', payrollController.processPayroll);

// Generate PDF/Excel report
router.post('/generate-report', payrollController.generateReport);

export default router;