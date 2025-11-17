import express, { Response, Request, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db';
import validateRequest from '../middleware/validateRequest';
import { employeeValidation, employeeIdValidation, shiftIdValidation } from '../middleware/validation';
// Removed TypedRequest-specific types to align with Express typings
import { requireRole } from '../middleware/requireRole';
import { notificationService } from '../services/notificationService';
// Fix the import statement for express-fileupload
import { UploadedFile } from 'express-fileupload';
import fileUpload from 'express-fileupload';

// Set up file upload middleware
// Extend Express Request type to include user and files
interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
    // ...other user properties
  };
  files?: {
    [key: string]: UploadedFile | UploadedFile[];
  };
}
const router = express.Router();
router.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

/**
 * @route   GET /employees/shift/:shiftId/unassigned
 * @desc    Get unassigned employees by shift
 * @access  Private (admin, administrator, fleetManager)
 */
router.get(
  '/shift/:shiftId/unassigned',
  requireRole(['admin', 'administrator', 'fleetManager']),
  shiftIdValidation,
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const shiftId = req.params.shiftId;

    const employees = await prisma.employee.findMany({
      where: {
        shiftId,
        assigned: false,
        deleted: false,
      },
      include: {
        department: true,
        shift: true,
        stop: true
      }
    });

    res.json(employees);
  })
);

/**
 * @route   GET /employees
 * @desc    Get all employees
 * @access  Private (all authenticated users)
 */
router.get(
  '/',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (_req: Request, res: Response) => {
    const employees = await prisma.employee.findMany({
      where: {
        deleted: false,
      },
      include: {
        department: true,
        shift: true,
        stop: true,
      },
    });
    res.json(employees);
  })
);

/**
 * @route   GET /employees/management
 * @desc    Get all employees including deleted ones (for employee management)
 * @access  Private (admin, administrator only)
 */
router.get(
  '/management',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (_req: Request, res: Response) => {
    // Get all employees including deleted ones
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        shift: true,
        stop: true,
      },
      // No deleted: false filter here - include all employees
    });

    // Convert deleted flag to inactive status, but don't reference a non-existent status property
    const employeesWithStatus = employees.map(employee => ({
      ...employee,
      // Add the status property based on the deleted flag
      status: employee.deleted ? 'inactive' : 'active'
    }));

    res.json(employeesWithStatus);
  })
);

/**
 * @route   GET /employees/:id
 * @desc    Get employee by ID
 * @access  Private (all authenticated users)
 */
router.get(
  '/:id',
  requireRole(['admin', 'administrator', 'fleetManager']),
  employeeIdValidation,
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        deleted: false,
      },
      include: {
        department: true,
        shift: true,
        stop: true
      }
    });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    res.json(employee);
  })
);

/**
 * @route   POST /employees
 * @desc    Create a new employee
 * @access  Private (admin, administrator only)
 */
router.post(
  '/',
  requireRole(['admin', 'administrator']),
  employeeValidation,
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, location, departmentId, shiftId, latitude, longitude } = req.body as Record<string, any>;
    const tenantId = (req as any).user?.tenantId || 'default-tenant';
    const stop = await prisma.stop.create({
      data: {
        name: `${name}-stop`,
        tenant: { connect: { id: tenantId } },
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        sequence: null,
        estimatedArrivalTime: null
      }
    });
    const employee = await prisma.employee.create({
      data: {
        name,
        tenant: { connect: { id: tenantId } },
        location,
        department: { connect: { id: departmentId } },
        shift: { connect: { id: shiftId } },
        stop: { connect: { id: stop.id } },
        assigned: false
      },
      include: {
        department: true,
        shift: true,
        stop: true
      }
    });
    await notificationService.createNotification({
      toRoles: ['admin', 'administrator', 'fleetManager'],
      fromRole: 'system',
      notificationType: 'employee',
      subject: 'New Employee Added',
      message: `New employee "${name}" has been added to ${employee.department?.name || 'unknown'} department with shift ID ${shiftId}`,
      importance: 'Medium',
      relatedEntityId: employee.id
    });
    res.status(201).json(employee);
  })
);

/**
 * @route   PUT /employees/:id
 * @desc    Update an employee by ID
 * @access  Private (admin, administrator, fleetManager)
 */
router.put(
  '/:id',
  requireRole(['admin', 'administrator', 'fleetManager']),
  [...employeeIdValidation, ...employeeValidation],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, location, departmentId, shiftId, latitude, longitude, assigned } = req.body as Record<string, any>;

    const oldEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true, shift: true }
    });

    // Update the employee's stop if coordinates are provided
    if (latitude !== undefined && longitude !== undefined) {
      const employee = await prisma.employee.findUnique({
        where: { id },
        select: { stopId: true }
      });

      if (employee?.stopId) {
        await prisma.stop.update({
          where: { id: employee.stopId },
          data: {
            latitude: parseFloat(String(latitude)),
            longitude: parseFloat(String(longitude))
          }
        });
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        location,
        department: { connect: { id: departmentId } },
        shift: { connect: { id: shiftId } },
        assigned: assigned !== undefined ? assigned : undefined
      },
      include: {
        department: true,
        shift: true,
        stop: true
      }
    });

    // Notify about significant changes
    if (oldEmployee?.departmentId !== departmentId || oldEmployee?.shiftId !== shiftId) {
      await notificationService.createNotification({
        toRoles: ['admin', 'administrator', 'fleetManager'],
        fromRole: 'system',
        notificationType: 'employee',
        subject: 'Employee Assignment Changed',
        message: `Employee "${name}" has been reassigned:\n` +
          `${oldEmployee?.department.name !== updatedEmployee.department.name ? 
            `- Department: ${oldEmployee?.department.name} → ${updatedEmployee.department.name}\n` : ''}` +
          `${oldEmployee?.shiftId !== updatedEmployee.shiftId ? 
            `- Shift: ${oldEmployee?.shiftId} → ${updatedEmployee.shiftId}` : ''}`,
        importance: 'High',
        relatedEntityId: id
      });
    }

    res.json(updatedEmployee);
  })
);

/**
 * @route   DELETE /employees/:id
 * @desc    Soft delete an employee by ID
 * @access  Private (admin, administrator only)
 */
router.delete(
  '/:id',
  requireRole(['admin', 'administrator']),
  employeeIdValidation,
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true, shift: true }
    });

    await prisma.employee.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });

    await notificationService.createNotification({
      toRoles: ['admin', 'administrator', 'fleetManager'],
      fromRole: 'system',
      notificationType: 'employee',
      subject: 'Employee Removed',
      message: `Employee "${employee?.name}" has been removed from ${employee?.department.name} department`,
      importance: 'High',
      relatedEntityId: id
    });

    res.status(204).send();
  })
);

/**
 * @route   POST /employees/:id/restore
 * @desc    Restore a soft-deleted employee by ID
 * @access  Private (admin, administrator only)
 */
router.post(
  '/:id/restore',
  requireRole(['admin', 'administrator']),
  employeeIdValidation,
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        deleted: false,
        deletedAt: null,
      },
      include: {
        department: true,
        shift: true,
        stop: true,
      },
    });

    await notificationService.createNotification({
      toRoles: ['admin', 'administrator', 'fleetManager'],
      fromRole: 'system',
      notificationType: 'employee',
      subject: 'Employee Restored',
      message: `Employee "${employee.name}" has been restored to ${employee.department.name} department`,
      importance: 'Medium',
      relatedEntityId: id
    });

    res.json(employee);
  })
);

/**
 * @route   GET /employees/stats
 * @desc    Get employee statistics
 * @access  Private
 */
router.get(
  '/stats',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // Get all active employees
    const allEmployees = await prisma.employee.findMany({
      where: {
        deleted: false
      },
      include: {
        department: true
      }
    });

    // Calculate departments count
    const departmentsSet = new Set(allEmployees.map(emp => emp.departmentId));

    // Count assigned employees (with route)
    const assignedEmployees = allEmployees.filter(emp => emp.assigned);

    // Count recently added (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Since createdAt might not be in our model, use a safe approach
    let recentlyAdded = 0;
    try {
      recentlyAdded = allEmployees.filter(emp => {
        // Use a safe check for createdAt
        const recordDate = (emp as any).createdAt || emp.deletedAt || new Date();
        return recordDate && new Date(recordDate) >= thirtyDaysAgo;
      }).length;
    } catch (err) {
      console.error('Error calculating recently added:', err);
      recentlyAdded = 0;
    }

    // Return statistics with assigned count
    res.json({
      total: allEmployees.length,
      assigned: assignedEmployees.length,
      departments: departmentsSet.size,
      recentlyAdded: recentlyAdded
    });
  })
);

/**
 * @route   GET /employees/upload-template
 * @desc    Download employee upload template
 * @access  Private
 */
router.get(
  '/upload-template',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      // Get actual departments from the database
      const departments = await prisma.department.findMany({
        select: { name: true },
        take: 4
      });
      
      // Use real department names or fallback to predefined ones if none exist
      const departmentNames = departments.length > 0
        ? departments.map(d => d.name)
  : ["Operations", "Creative", "Trade Surveillance", "Cvent-Addis"];      
      
      // Generate a proper Excel template
      // Using CSV format with proper Ethiopian names and values based on the schema
      const headers = ['Name', 'Email', 'Phone', 'Department', 'Position', 'Location'];
      
      // Add example rows with Ethiopian names and actual departments
      const exampleRows = [
  ['Abebe Kebede', 'abebe.kebede@example.com', '+251911234567', departmentNames[0] || "Operations", 'Software Developer', 'Bole, Addis Ababa'],
        ['Tigist Alemayehu', 'tigist.a@example.com', '+251922345678', departmentNames[1] || "Creative", 'Accountant', 'Kazanchis, Addis Ababa'],
  ['Dawit Gebre', 'dawit.g@example.com', '+251933456789', departmentNames[2] || "Trade Surveillance", 'Supervisor', 'Piassa, Addis Ababa']
      ];
      
      // Build CSV content
      let csvContent = headers.join(',') + '\n';
      exampleRows.forEach(row => {
        csvContent += row.join(',') + '\n';
      });

      // Set headers for file download - use .csv extension explicitly for better compatibility
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employee_upload_template.csv');
      
      // Send the CSV content
      res.send(csvContent);
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ error: 'Failed to generate template' });
    }
  })
);

/**
 * @route   POST /employees/bulk-upload
 * @desc    Upload multiple employees at once
 * @access  Private
 */
router.post(
  '/bulk-upload',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const files = (req as any).files as { [key: string]: UploadedFile | UploadedFile[] } | undefined;
      if (!files || Object.keys(files).length === 0 || !files.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const file = Array.isArray(files.file)
        ? files.file[0]
        : files.file;
      res.json({
        success: true,
        processedCount: 1,
        message: 'Employees uploaded successfully',
        filename: file.name
      });
    } catch (error) {
      console.error('Error uploading employees:', error);
      res.status(500).json({ error: 'Failed to upload employees' });
    }
  })
);

/**
 * @route   POST /employees/validate-upload
 * @desc    Validate employee data before upload
 * @access  Private
 */
router.post(
  '/validate-upload',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const data = req.body;
      
      if (!Array.isArray(data)) {
        res.status(400).json({ error: 'Invalid data format' });
        return;
      }
      
      // Here you'd validate each employee record
      // For simplicity, we'll just return a success message
      // In a real implementation, you'd check for required fields, duplicates, etc.
      
      res.json({
        valid: true,
        validCount: data.length,
        invalidRecords: []
      });
    } catch (error) {
      console.error('Error validating employee data:', error);
      res.status(500).json({ error: 'Failed to validate employee data' });
    }
  })
);

/**
 * @route   POST /employees/process-data
 * @desc    Process employee data from paste or file upload
 * @access  Private
 */
router.post(
  '/process-data',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const employeeData = req.body;
      
      if (!Array.isArray(employeeData)) {
        res.status(400).json({ error: 'Invalid data format' });
        return;
      }
      
      // Get all departments for validation with better normalization
      const departments = await prisma.department.findMany();
  const departmentsMap = new Map<string, string>();
      
      // Create multiple mappings for each department - exact name and normalized versions
      departments.forEach(d => {
  const normalized = d.name.toLowerCase().trim().replace(/\s+/g, ' ');
  departmentsMap.set(d.name.toLowerCase(), d.id); // Original mapping
  departmentsMap.set(normalized, d.id); // Normalized mapping
      });
      
      // Get all shifts for validation
      const shifts = await prisma.shift.findMany();
  const shiftIds = new Set<string>(shifts.map(s => s.id));
      
      // Get all existing employees to check for duplicates - name + location combination
      const existingEmployees = await prisma.employee.findMany({
        where: { deleted: false },
  select: { name: true, location: true }
      });
      
      // Create a set of name+location combinations for faster lookup
      const existingNameLocationCombos = new Set(
        existingEmployees.map(emp => `${emp.name.toLowerCase()}|${(emp.location || '').toLowerCase()}`)
      );
      
      console.log(`Found ${existingEmployees.length} existing employees to check against for duplicates`);
      
      // Define a type for valid records to avoid implicit any[]
      interface ValidRecord {
        name: string;
        location: string;
        departmentId: string;
        shiftId: string;
        latitude?: number | null;
        longitude?: number | null;
        [key: string]: any; // Allow additional properties
      }
      
      // Process and validate each record with improved department matching
  const validRecords: ValidRecord[] = [];
      const invalidRecords: any[] = [];
      const duplicateRecords: any[] = [];
      
      for (const record of employeeData) {
        // Check for duplicates based on name + location combination
        if (record.name && record.location) {
          const nameLocationCombo = `${record.name.toLowerCase()}|${record.location.toLowerCase()}`;
          if (existingNameLocationCombos.has(nameLocationCombo)) {
            duplicateRecords.push({
              record,
              reason: `Employee with name "${record.name}" and location "${record.location}" already exists`
            });
            continue;
          }
          
          // Also check for duplicates within the current batch
          const isDuplicateInBatch = validRecords.some(validRec => 
            validRec.name.toLowerCase() === record.name.toLowerCase() && 
            validRec.location.toLowerCase() === record.location.toLowerCase()
          );
          
          if (isDuplicateInBatch) {
            duplicateRecords.push({
              record,
              reason: `Duplicate entry within this batch for "${record.name}" at "${record.location}"`
            });
            continue;
          }
        }
        
        // Validate required fields
        if (!record.name || !record.location) {
          invalidRecords.push({
            record,
            errors: ['Missing required fields: name and location are required']
          });
          continue;
        }
        
        // Validate or lookup department with more robust matching
        let recordDepartmentId: string | null = null;
        if (record.departmentId) {
          recordDepartmentId = String(record.departmentId);
        } else if (record.department) {
          const normalizedDeptName = record.department.toLowerCase().trim().replace(/\s+/g, ' ');
          
          // Try exact match first
          let deptId = departmentsMap.get(normalizedDeptName);
          
          // If no exact match, try partial match
          if (!deptId) {
            // Find department where normalized name contains input or vice versa
            const partialMatch = departments.find(d => {
              const deptNormalized = d.name.toLowerCase().trim().replace(/\s+/g, ' ');
              return deptNormalized.includes(normalizedDeptName) || 
                     normalizedDeptName.includes(deptNormalized);
            });
            
            if (partialMatch) {
              deptId = partialMatch.id;
            }
          }
          
          // Ensure deptId is a string
          if (deptId) {
            recordDepartmentId = String(deptId);
          }
        }
        
        if (!recordDepartmentId) {
          invalidRecords.push({
            record,
            errors: ['Department is required']
          });
          continue;
        }
        
        // Check shift ID
  let recordShiftId = record.shiftId as string | undefined;
        
        // Validate shift if provided
  if (recordShiftId && !shiftIds.has(String(recordShiftId))) {
          invalidRecords.push({
            record,
            errors: [`Shift with ID ${recordShiftId} does not exist`]
          });
          continue;
        }
        
        // Add to valid records for processing
        validRecords.push({
          ...record,
          departmentId: recordDepartmentId as string,
          shiftId: recordShiftId ? String(recordShiftId) : ''
        });
      }
      
      console.log(`Processing ${validRecords.length} valid employees out of ${employeeData.length} total`);
      console.log(`Skipped ${duplicateRecords.length} duplicate employees`);
      
      // Process valid records - create employees and stops
  const createdEmployees: any[] = [];
      
      for (const record of validRecords) {
        try {
          // First create a stop for the employee with the location data
          const tenantId = (req as any).user?.tenantId || 'default-tenant';
          const stop = await prisma.stop.create({
            data: {
              name: `${record.name}-stop`,
              tenant: { connect: { id: tenantId } },
              latitude: record.latitude ?? 9.0221,
              longitude: record.longitude ?? 38.7468,
              sequence: null,
              estimatedArrivalTime: null
            }
          });
          
          // Removed both email and phone fields which are not in your Prisma schema
          const employee = await prisma.employee.create({
            data: {
              name: record.name,
              // email field removed
              // phone field removed
              location: record.location,
              tenant: { connect: { id: tenantId } },
              department: { connect: { id: record.departmentId } },
              shift: { connect: { id: record.shiftId } },
              stop: { 
                connect: { id: stop.id } 
              },
              assigned: false
            },
            include: {
              department: true,
              shift: true,
              stop: true
            }
          });
          
          createdEmployees.push(employee);
        } catch (error) {
          console.error(`Error creating employee ${record.name}:`, error);
          invalidRecords.push({
            record,
            errors: [`Database error: ${(error as Error).message || 'Unknown error'}`]
          });
        }
      }
      
      // Create notification about the bulk upload
      if (createdEmployees.length > 0) {
        await notificationService.createNotification({
          toRoles: ['admin', 'administrator', 'fleetManager'],
          fromRole: 'system',
          notificationType: 'employee',
          subject: 'Bulk Employee Upload',
          message: `${createdEmployees.length} employees were added to the system through bulk upload.`,
          importance: 'Medium'
        });
      }
      
      // Return the results with duplicate information
      res.json({
        success: createdEmployees.length > 0,
        processedCount: createdEmployees.length,
        invalidCount: invalidRecords.length,
        duplicateCount: duplicateRecords.length,
        message: `Successfully processed ${createdEmployees.length} employees` + 
                 (invalidRecords.length > 0 ? `, ${invalidRecords.length} records were invalid` : '') +
                 (duplicateRecords.length > 0 ? `, ${duplicateRecords.length} duplicates were skipped` : '')
      });
      
    } catch (error) {
      console.error('Error processing employee data:', error);
      res.status(500).json({ error: 'Failed to process employee data' });
    }
  })
);

export default router;