import express, { RequestHandler } from 'express';
import shiftRoutes from './shiftRoutes';
import employeeRoutes from './employeeRoutes';
import routeRoutes from './routeRoutes';
// Vehicle-backed legacy shuttles route
import shuttlesRoutes from './shuttles';
import departmentRoutes from './departmentRoutes';
import driverRoutes from './driverRoutes';
import shuttleCategoryRoutes from './shuttleCategoryRoutes';
import clusterRoutes from './clusterRoutes';
import notificationRoutes from './notificationRoutes';
import vehicleRequestRoutes from './vehicleRequestRoutes';
import searchRoutes from './searchRoutes';
import userRoutes from './userRoutes';

const router = express.Router();

// Debug middleware to log requests only in development and only for non-GET requests
router.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && req.method !== 'GET') {
  // console.log(`API Request: ${req.method} ${req.baseUrl}${req.path}`);
  }
  next();
});

// Register routes
router.use('/shifts', shiftRoutes);
router.use('/employees', employeeRoutes);
router.use('/routes', routeRoutes);
router.use('/shuttles', shuttlesRoutes);
router.use('/departments', departmentRoutes);
router.use('/drivers', driverRoutes);
router.use('/shuttle-categories', shuttleCategoryRoutes);
router.use('/clusters', clusterRoutes);
router.use('/notifications', notificationRoutes);
router.use('/vehicle-requests', vehicleRequestRoutes);
router.use('/search', searchRoutes);
router.use('/users', userRoutes);

// Debug route to check if router is working
const debugRoute: RequestHandler = (req, res) => {
  res.json({
    message: 'API router is working',
    registeredRoutes: [
      '/shifts',
      '/employees',
      '/routes',
  '/shuttles',
      '/departments',
      '/drivers',
      '/shuttle-categories',
      '/clusters',
      '/notifications',
  '/vehicle-requests',
      '/search'
  ,'/users'
    ]
  });
};

router.get('/debug', debugRoute);

export default router;