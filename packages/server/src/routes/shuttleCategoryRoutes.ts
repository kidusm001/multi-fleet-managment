import express, { RequestHandler, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { idValidation, shuttleCategoryValidation } from '../middleware/validation';
import validateRequest from '../middleware/validateRequest';
import { requireRole } from '../middleware/requireRole';
import { notificationService } from '../services/notificationService';

const router = express.Router();
const prisma = new PrismaClient();

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
    const existing = await prisma.shuttleCategory.findFirst({
      where: { name: category.name }
    });
    if (!existing) {
      await prisma.shuttleCategory.create({
        data: category
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
const getAllCategories: RequestHandler = async (_req, res) => {
  const categories = await prisma.shuttleCategory.findMany({
    include: {
      shuttles: true,
    },
  });
  res.send(categories);
};
router.get('/', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getAllCategories));

/**
 * @route   GET /shuttle-categories/:id
 * @desc    Get shuttle category by ID
 * @access  Public
 */
const getCategoryById: RequestHandler<{ id: string }> = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const category = await prisma.shuttleCategory.findUnique({
    where: { id },
    include: {
      shuttles: true,
    },
  });

  if (!category) {
    res.status(404).send({ error: 'Shuttle category not found' });
    return;
  }

  res.send(category);
};
router.get('/:id', idValidation, validateRequest, requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getCategoryById));

/**
 * @route   POST /shuttle-categories
 * @desc    Create a new shuttle category
 * @access  Public
 */
const createCategory: RequestHandler<{}, {}, ShuttleCategoryBody> = async (req, res) => {
  const { name, capacity } = req.body;
  const category = await prisma.shuttleCategory.create({
    data: {
      name,
      capacity,
    },
    include: {
      shuttles: true,
    },
  });

  // Add notification after successful creation
  await notificationService.createNotification({
    toRoles: ['admin', 'administrator', 'fleetManager'],
    fromRole: 'system',
    notificationType: 'shuttle',
    subject: 'New Shuttle Category Added',
    message: `A new shuttle category "${name}" with capacity ${capacity} has been created`,
    importance: 'Medium',
    relatedEntityId: category.id.toString()
  });

  res.status(201).send(category);
};
router.post('/', shuttleCategoryValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(createCategory));

/**
 * @route   PUT /shuttle-categories/:id
 * @desc    Update shuttle category by ID
 * @access  Public
 */
const updateCategory: RequestHandler<{ id: string }, {}, ShuttleCategoryBody> = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, capacity } = req.body;

  const oldCategory = await prisma.shuttleCategory.findUnique({
    where: { id },
    include: { shuttles: true }
  });

  if (!oldCategory) {
    res.status(404).send({ error: 'Category not found' });
    return;
  }

  const category = await prisma.shuttleCategory.update({
    where: { id },
    data: {
      name,
      capacity,
    },
    include: {
      shuttles: true,
    },
  });

  // Add notification after successful update
  await notificationService.createNotification({
    toRoles: ['admin', 'administrator', 'fleetManager'],
    fromRole: 'system',
    notificationType: 'shuttle',
    subject: 'Shuttle Category Updated',
    message: `Shuttle category "${oldCategory.name}" has been updated to "${name}" with capacity ${capacity}`,
    importance: oldCategory.shuttles.length > 0 ? 'High' : 'Medium', // Higher importance if shuttles are affected
    relatedEntityId: id.toString()
  });

  res.send(category);
};
router.put('/:id', [...idValidation, ...shuttleCategoryValidation], validateRequest, requireRole(['admin', 'administrator']), asyncHandler(updateCategory));

/**
 * @route   DELETE /shuttle-categories/:id
 * @desc    Delete shuttle category by ID
 * @access  Public
 */
const deleteCategory: RequestHandler<{ id: string }> = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  
  const category = await prisma.shuttleCategory.findUnique({
    where: { id },
    include: { shuttles: true }
  });

  if (!category) {
    res.status(404).send({ error: 'Shuttle category not found' });
    return;
  }

  // Check if category has shuttles before deletion
  if (category.shuttles.length > 0) {
    res.status(400).send({ 
      error: 'Cannot delete category with assigned shuttles',
      shuttleCount: category.shuttles.length 
    });
    return;
  }

  await prisma.shuttleCategory.delete({
    where: { id },
  });

  // Add notification after successful deletion
  await notificationService.createNotification({
    toRoles: ['admin', 'administrator', 'fleetManager'],
    fromRole: 'system',
    notificationType: 'shuttle',
    subject: 'Shuttle Category Deleted',
    message: `Shuttle category "${category.name}" has been deleted`,
    importance: 'High',
    relatedEntityId: id.toString()
  });

  res.status(204).send();
};
router.delete('/:id', idValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(deleteCategory));

export default router;