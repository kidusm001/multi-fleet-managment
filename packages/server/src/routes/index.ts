import express, { RequestHandler } from 'express';
import vehicleRoutes from './vehicles';
import vehicleCategoryRoutes from './vehicle-categories';
import departmentRoutes from './departments';
import shiftRoutes from './shifts';
import employeeRoutes from './employees';
import driverRoutes from './drivers';
import stopRoutes from './stops';
import routeRoutes from './routes';
import vehicleAvailabilityRoutes from './vehicle-availability';
import payrollReportRoutes from './payroll-reports';
import notificationRoutes from './notifications';
import vehicleRequestRoutes from './vehicle-requests';
import shuttleRequestRoutes from './shuttle-requests';
import userRoutes from './users';
import locationRoutes from './locations';
import organizationRoutes from './organization';
import activitiesRoutes from './activities';
import serviceProviderRoutes from './service-providers';
import attendanceRoutes from './attendance';
import payrollPeriodRoutes from './payroll-periods';
import cacheRoutes from './cache';
import invitationRoutes from './invitation';
// import shiftRoutes from './shiftRoutes';
// import employeeRoutes from './employeeRoutes';
// import routeRoutes from './routeRoutes';
// // Vehicle-backed legacy shuttles route
// import shuttlesRoutes from './shuttles';
// import departmentRoutes from './departmentRoutes';
// import driverRoutes from './driverRoutes';
// import shuttleCategoryRoutes from './shuttleCategoryRoutes';
// import clusterRoutes from './clusterRoutes';
// import notificationRoutes from './notificationRoutes';
// import vehicleRequestRoutes from './vehicleRequestRoutes';
// import searchRoutes from './searchRoutes';

const router = express.Router();

// Debug middleware to log requests only in development and only for non-GET requests
router.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production' && req.method !== 'GET') {
        // console.log(`API Request: ${req.method} ${req.baseUrl}${req.path}`);
    }
    next();
});

router.use('/shuttles', vehicleRoutes);
router.use('/shuttle-categories', vehicleCategoryRoutes);
router.use('/departments', departmentRoutes);
router.use('/shifts', shiftRoutes);
router.use('/employees', employeeRoutes);
router.use('/drivers', driverRoutes);
router.use('/stops', stopRoutes);
router.use('/routes', routeRoutes);
router.use('/shuttle-availability', vehicleAvailabilityRoutes);
router.use('/payroll-reports', payrollReportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/vehicle-requests', vehicleRequestRoutes);
router.use('/shuttle-requests-employee', shuttleRequestRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);
router.use('/organization', organizationRoutes);
router.use('/activities', activitiesRoutes);
router.use('/service-providers', serviceProviderRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payroll-periods', payrollPeriodRoutes);
router.use('/cache', cacheRoutes);
router.use('/accept-invitation', invitationRoutes);

// Register routes
// router.use('/shifts', shiftRoutes);
// router.use('/employees', employeeRoutes);
// router.use('/routes', routeRoutes);
// router.use('/shuttles', shuttlesRoutes);
// router.use('/departments', departmentRoutes);
// router.use('/drivers', driverRoutes);
// router.use('/shuttle-categories', shuttleCategoryRoutes);
// router.use('/clusters', clusterRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/vehicle-requests', vehicleRequestRoutes);
// router.use('/search', searchRoutes);

// Debug route to check if router is working
const debugRoute: RequestHandler = (req, res) => {
    res.json({
        message: 'API router is working - REFACTOR IN PROGRESS',
        note: 'All route files have been backed up and are not currently mounted. New routes will be created with Better Auth integration.',
        registeredRoutes: [
            'GET /vehicles - List all vehicles (superadmin only)',
            'POST /vehicles - Create new vehicle (superadmin only)',
            'PUT /vehicles/:id - Update vehicle (superadmin only)',
            'DELETE /vehicles/:id - Delete vehicle (superadmin only)',
            'GET /vehicle-categories - List all vehicle categories (superadmin only)',
            'POST /vehicle-categories - Create new vehicle category (superadmin only)',
            'PUT /vehicle-categories/:id - Update vehicle category (superadmin only)',
            'DELETE /vehicle-categories/:id - Delete vehicle category (superadmin only)',
            'GET /departments - List all departments (superadmin only)',
            'POST /departments - Create new department (superadmin only)',
            'PUT /departments/:id - Update department (superadmin only)',
            'DELETE /departments/:id - Delete department (superadmin only)',
            'GET /shifts - List all shifts (superadmin only)',
            'POST /shifts - Create new shift (superadmin only)',
            'PUT /shifts/:id - Update shift (superadmin only)',
            'DELETE /shifts/:id - Delete shift (superadmin only)',
            'GET /employees - List all employees (superadmin only)',
            'POST /employees - Create new employee (superadmin only)',
            'PUT /employees/:id - Update employee (superadmin only)',
            'DELETE /employees/:id - Delete employee (superadmin only)',
            'GET /drivers - List all drivers (superadmin only)',
            'POST /drivers - Create new driver (superadmin only)',
            'PUT /drivers/:id - Update driver (superadmin only)',
            'DELETE /drivers/:id - Delete driver (superadmin only)',
            'GET /stops - List all stops (superadmin only)',
            'POST /stops - Create new stop (superadmin only)',
            'PUT /stops/:id - Update stop (superadmin only)',
            'DELETE /stops/:id - Delete stop (superadmin only)',
            'GET /routes - List all routes (superadmin only)',
            'POST /routes - Create new route (superadmin only)',
            'PUT /routes/:id - Update route (superadmin only)',
            'DELETE /routes/:id - Delete route (superadmin only)',
            'GET /vehicle-availability - List all vehicle availability (superadmin only)',
            'POST /vehicle-availability - Create new vehicle availability (superadmin only)',
            'PUT /vehicle-availability/:id - Update vehicle availability (superadmin only)',
            'DELETE /vehicle-availability/:id - Delete vehicle availability (superadmin only)',
            'GET /payroll-reports - List all payroll reports (superadmin only)',
            'POST /payroll-reports - Create new payroll report (superadmin only)',
            'PUT /payroll-reports/:id - Update payroll report (superadmin only)',
            'DELETE /payroll-reports/:id - Delete payroll report (superadmin only)',
            'GET /notifications - List all notifications (superadmin only)',
            'POST /notifications - Create new notification (superadmin only)',
            'PUT /notifications/:id - Update notification (superadmin only)',
            'DELETE /notifications/:id - Delete notification (superadmin only)',
            'GET /vehicle-requests - List all vehicle requests (organization users)',
            'POST /vehicle-requests - Create new vehicle request (organization users)',
            'PUT /vehicle-requests/:id - Update vehicle request (organization users)',
            'DELETE /vehicle-requests/:id - Delete vehicle request (organization users)',
            'GET /vehicle-requests/pending - Get pending vehicle requests (organization users)',
            'POST /vehicle-requests/:id/approve - Approve vehicle request (organization users)',
            'POST /vehicle-requests/:id/reject - Reject vehicle request (organization users)'
        ],
        backupLocation: 'routes.backup/'
    });
};

router.get('/debug', debugRoute);

export default router;
