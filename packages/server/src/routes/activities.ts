import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../db';

const router = express.Router();

/**
 * @route   GET /
 * @desc    Get recent activities
 * @access  Private
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const { limit = 10, type } = req.query;
        const limitNum = parseInt(limit as string);

        // Get recent activities from various entities
        const activities = await getRecentActivities(limitNum);

        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * Get recent activities from the database
 */
async function getRecentActivities(limit: number) {
    const activities: any[] = [];

    try {
        // Get recent employees (created/updated)
        const recentEmployees = await prisma.employee.findMany({
            take: Math.ceil(limit / 4),
            orderBy: { updatedAt: 'desc' },
            include: {
                user: { select: { name: true } },
                department: { select: { name: true } }
            },
            where: { deleted: false }
        });

        recentEmployees.forEach(employee => {
            activities.push({
                id: `employee-${employee.id}`,
                user: { name: employee.user?.name || 'Unknown User', role: 'User' },
                action: employee.createdAt.getTime() === employee.updatedAt.getTime()
                    ? 'created new employee'
                    : 'updated employee records',
                timestamp: employee.updatedAt,
                entityType: 'employee',
                entityId: employee.id,
                details: `${employee.name} in ${employee.department?.name || 'Unknown Department'}`
            });
        });

        // Get recent drivers (created/updated)
        const recentDrivers = await prisma.driver.findMany({
            take: Math.ceil(limit / 4),
            orderBy: { updatedAt: 'desc' },
            where: { deleted: false }
        });

        recentDrivers.forEach(driver => {
            activities.push({
                id: `driver-${driver.id}`,
                user: { name: 'System', role: 'Admin' },
                action: driver.createdAt.getTime() === driver.updatedAt.getTime()
                    ? 'added new driver'
                    : 'updated driver information',
                timestamp: driver.updatedAt,
                entityType: 'driver',
                entityId: driver.id,
                details: `${driver.name} (${driver.status})`
            });
        });

        // Get recent vehicles (created/updated)
        const recentVehicles = await prisma.vehicle.findMany({
            take: Math.ceil(limit / 4),
            orderBy: { updatedAt: 'desc' },
            include: {
                category: { select: { name: true } }
            }
        });

        recentVehicles.forEach(vehicle => {
            activities.push({
                id: `vehicle-${vehicle.id}`,
                user: { name: 'System', role: 'Admin' },
                action: vehicle.createdAt.getTime() === vehicle.updatedAt.getTime()
                    ? 'added new vehicle'
                    : 'updated vehicle details',
                timestamp: vehicle.updatedAt,
                entityType: 'vehicle',
                entityId: vehicle.id,
                details: `${vehicle.make} ${vehicle.model} (${vehicle.category?.name || 'Unknown Category'})`
            });
        });

        // Get recent notifications
        const recentNotifications = await prisma.notification.findMany({
            take: Math.ceil(limit / 4),
            orderBy: { createdAt: 'desc' },
            include: {
                organization: { select: { name: true } }
            }
        });

        // Get user names for notifications
        const notificationUserIds = recentNotifications
            .map(n => n.userId)
            .filter(id => id !== null) as string[];

        const notificationUsers = await prisma.user.findMany({
            where: { id: { in: notificationUserIds } },
            select: { id: true, name: true }
        });

        const userMap = new Map(notificationUsers.map(u => [u.id, u.name]));

        recentNotifications.forEach(notification => {
            const userName = notification.userId ? userMap.get(notification.userId) || 'Unknown User' : 'System';
            activities.push({
                id: `notification-${notification.id}`,
                user: { name: userName, role: 'Admin' },
                action: 'created notification',
                timestamp: notification.createdAt,
                entityType: 'notification',
                entityId: notification.id,
                details: notification.title
            });
        });

        // Sort all activities by timestamp (most recent first) and limit
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return activities.slice(0, limit);

    } catch (error) {
        console.error('Error fetching recent activities:', error);
        // Return empty array if database query fails
        return [];
    }
}

export default router;