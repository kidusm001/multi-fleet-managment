import express, { RequestHandler } from 'express';
import prisma from '../db';
import asyncHandler from 'express-async-handler';
import { idValidation, shuttleCategoryValidation } from '../middleware/validation';
import validateRequest from '../middleware/validateRequest';
import { requireRole } from '../middleware/requireRole';
import { notificationService } from '../services/notificationService';

const router = express.Router();

// Interface for Shuttle Category Body
interface ShuttleCategoryBody {
  name: string;
  capacity: number;
}

// Initial categories data
const INITIAL_CATEGORIES = [
  { name: 'Toyota Hiace', capacity: 14 },
  { name: 'Toyota Coaster', capacity: 22 },
  { name: 'Toyota Land Cruiser', capacity: 7 },
  { name: 'Toyota Probox', capacity: 4 },
  { name: 'Hyundai H1', capacity: 8 },
  { name: 'Hyundai County', capacity: 25 },
  { name: 'Suzuki Dzire', capacity: 4 },
  { name: 'Toyota Vitz', capacity: 4 },
];

// Initialize categories if they don't exist
const initializeCategories = async () => {
  for (const category of INITIAL_CATEGORIES) {
    const existing = await prisma.vehicleCategory.findFirst({
      where: { name: category.name }
    });
    if (!existing) {
      await prisma.vehicleCategory.create({
        data: { ...category, tenant: { connect: { id: 'default-tenant' } } }
      });
    }
  }
};

// Call initialization on startup
initializeCategories().catch(console.error);

/**
 * @route   GET /shuttle-categories
 * @desc    Get all shuttle categories
 * @access  Public
 */
router.get('/', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(async (_req, res) => {
  const categories = await prisma.vehicleCategory.findMany({ include: { vehicles: true } });
  res.send(categories);
}));

/**
 * @route   GET /shuttle-categories/:id
 * @desc    Get shuttle category by ID
 * @access  Public
 */
router.get('/:id', idValidation, validateRequest, requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(async (req, res) => {
  const id = req.params.id;
  const category = await prisma.vehicleCategory.findUnique({ where: { id }, include: { vehicles: true } });
  if (!category) {
    res.status(404).send({ error: 'Shuttle category not found' });
    return;
  }
  res.send(category);
}));

/**
 * @route   POST /shuttle-categories
 * @desc    Create a new shuttle category
 * @access  Public
 */
router.post('/', shuttleCategoryValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(async (req, res) => {
  const { name, capacity } = req.body as ShuttleCategoryBody;
  const tenantId = (req as any).user?.tenantId || 'default-tenant';
  const category = await prisma.vehicleCategory.create({ data: { name, capacity, tenant: { connect: { id: tenantId } } }, include: { vehicles: true } });
  await notificationService.createNotification({
    toRoles: ['admin', 'administrator', 'fleetManager'],
    fromRole: 'system',
    notificationType: 'vehicle',
    subject: 'New Shuttle Category Added',
    message: `A new vehicle category "${name}" with capacity ${capacity} has been created`,
    importance: 'Medium',
    relatedEntityId: category.id.toString()
  });
  res.status(201).send(category);
}));

/**
 * @route   PUT /shuttle-categories/:id
 * @desc    Update shuttle category by ID
 * @access  Public
 */
router.put('/:id', [...idValidation, ...shuttleCategoryValidation], validateRequest, requireRole(['admin', 'administrator']), asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { name, capacity } = req.body as ShuttleCategoryBody;
  const oldCategory = await prisma.vehicleCategory.findUnique({ where: { id }, include: { vehicles: true } });
  if (!oldCategory) {
    res.status(404).send({ error: 'Category not found' });
    return;
  }
  const category = await prisma.vehicleCategory.update({ where: { id }, data: { name, capacity }, include: { vehicles: true } });
  await notificationService.createNotification({
    toRoles: ['admin', 'administrator', 'fleetManager'],
    fromRole: 'system',
    notificationType: 'vehicle',
    subject: 'Shuttle Category Updated',
    message: `Vehicle category "${oldCategory.name}" has been updated to "${name}" with capacity ${capacity}`,
    importance: oldCategory.vehicles.length > 0 ? 'High' : 'Medium',
    relatedEntityId: id.toString()
  });
  res.send(category);
}));

/**
 * @route   DELETE /shuttle-categories/:id
 * @desc    Delete shuttle category by ID
 * @access  Public
 */
router.delete('/:id', idValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(async (req, res) => {
  const id = req.params.id;
  const category = await prisma.vehicleCategory.findUnique({ where: { id }, include: { vehicles: true } });
  if (!category) {
    res.status(404).send({ error: 'Shuttle category not found' });
    return;
  }
  if (category.vehicles.length > 0) {
    res.status(400).send({ error: 'Cannot delete category with assigned vehicles', vehicleCount: category.vehicles.length });
    return;
  }
  await prisma.vehicleCategory.delete({ where: { id } });
  await notificationService.createNotification({
    toRoles: ['admin', 'administrator', 'fleetManager'],
    fromRole: 'system',
    notificationType: 'vehicle',
    subject: 'Shuttle Category Deleted',
    message: `Vehicle category "${category.name}" has been deleted`,
    importance: 'High',
    relatedEntityId: id.toString()
  });
  res.status(204).send();
}));

export default router;